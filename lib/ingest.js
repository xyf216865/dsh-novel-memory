/** Create a book from a txt path or pasted text. Shared by the tool and the settings page. */
import fs from 'node:fs'
import { decodeBytes, splitChapters } from './chapters.js'

const TEXT_EXTENSIONS = ['.txt', '.text', '.md', '.markdown']
const BLOCKED_DIRS = ['.ssh', '.gnupg', '.dsh', '.aws', '.kube']
const BLOCKED_PREFIXES = ['.env', '.credentials', '.ssh', 'id_rsa', 'id_ed25519', 'id_ecdsa', 'credentials', 'secrets']
const MAX_BYTES = 64 * 1024 * 1024

function pathParts(file) {
  const parts = []
  let rest = String(file || '')
  const slash = String.fromCharCode(92)
  while (rest) {
    const cut = Math.max(rest.lastIndexOf('/'), rest.lastIndexOf(slash))
    if (cut < 0) {
      parts.unshift(rest)
      break
    }
    parts.unshift(rest.slice(cut + 1))
    rest = rest.slice(0, cut)
  }
  return parts.filter(Boolean)
}

function isTextName(name) {
  const lower = String(name).toLowerCase()
  return TEXT_EXTENSIONS.some(ext => lower.endsWith(ext))
}

/**
 * Reading a local file is the one place this plugin leaves the workspace
 * sandbox, so it is deliberately narrow: text extensions only (unless
 * `allowAnyPath: true` in the plugin config), a size cap, and a refusal for
 * credential-looking paths. A book's prose must not be able to steer the agent
 * into reading `~/.ssh` next.
 */
function assertReadable(file, allowAnyPath) {
  let stat
  try {
    stat = fs.statSync(file)
  } catch {
    throw new Error(`读不了这个文件：${file}`)
  }
  if (!stat.isFile()) throw new Error(`不是文件：${file}`)
  if (stat.size > MAX_BYTES) throw new Error(`文件太大（${Math.round(stat.size / 1048576)} MB），上限 64 MB：${file}`)
  const parts = pathParts(file)
  const lower = parts.map(part => part.toLowerCase())
  const name = lower[lower.length - 1] || ''
  const blockedDir = lower.slice(0, -1).find(part => BLOCKED_DIRS.includes(part))
  if (blockedDir) throw new Error(`拒绝读取：路径在受保护目录里（${blockedDir}），这是安全限制：${file}`)
  const blockedName = BLOCKED_PREFIXES.find(prefix => name === prefix || name.startsWith(`${prefix}.`) || name.startsWith(`${prefix}_`))
  if (blockedName) throw new Error(`拒绝读取：文件名像凭据/私钥（${name}），这是安全限制：${file}`)
  if (!allowAnyPath && !isTextName(name)) {
    throw new Error(`只接受 .txt / .text / .md 文件（当前是 ${name}）。确实要读别的格式，在插件配置里设 allowAnyPath: true`)
  }
  return stat
}

function findTxt(dir) {
  let names = []
  try {
    names = fs.readdirSync(dir, { withFileTypes: true })
      .filter(entry => entry.isFile() && isTextName(entry.name))
      .map(entry => entry.name)
      .sort((a, b) => a.localeCompare(b, 'zh'))
  } catch (cause) {
    throw new Error(`读不了这个目录：${dir}（${cause && cause.message ? cause.message : cause}）`)
  }
  if (names.length === 0) throw new Error(`这个目录里没有 txt：${dir}`)
  if (names.length > 1) throw new Error(`这个目录里有 ${names.length} 个 txt，请把路径写到具体文件：${names.slice(0, 8).join('、')}${names.length > 8 ? '…' : ''}`)
  return `${dir.replace(/[\\/]+$/, '')}${dir.includes('\\') ? '\\' : '/'}${names[0]}`
}

export function openBook(store, args = {}) {
  const allowAnyPath = !!(store && store.config && store.config.allowAnyPath)
  let raw = null
  let encoding = 'text'
  let sourcePath = null
  if (typeof args.text === 'string' && args.text.trim()) {
    raw = args.text
  } else if (typeof args.path === 'string' && args.path.trim()) {
    const given = args.path.trim()
    const resolved = fs.existsSync(given) ? given : path.resolve(process.cwd(), given)
    if (!fs.existsSync(resolved)) throw new Error(`路径不存在：${given}（按当前目录解析成 ${resolved}）。相对路径是相对 DSH 进程目录，不是会话工作目录；请写绝对路径。`)
    if (fs.statSync(resolved).isDirectory()) {
      const found = findTxt(resolved)
      assertReadable(found, allowAnyPath)
      const decoded = decodeBytes(fs.readFileSync(found))
      raw = decoded.text
      encoding = decoded.encoding
      sourcePath = found
    } else {
      assertReadable(resolved, allowAnyPath)
      const decoded = decodeBytes(fs.readFileSync(resolved))
      raw = decoded.text
      encoding = decoded.encoding
      sourcePath = resolved
    }
  } else {
    throw new Error('需要 text 或 path（正文全文）')
  }

  const { text, chapters, mode } = splitChapters(raw)
  if (text.length < 800) throw new Error(`正文只有 ${text.length} 字，太短了（门槛 800 字）。试试完整文件，或用 novel_index action=open text=… 直接贴正文`)
  const title = String(args.title || '').trim() || (sourcePath ? sourcePath.split(/[\\/]/).pop().replace(/\.[^.]+$/, '') : '未命名')
  const created = store.createBook({ text, title, id: args.id, sourcePath, encoding, mode: text.length < 150000 ? 'full' : 'pipeline' })
  store.writeChapters(created.id, chapters)
  const book = {
    id: created.id,
    title: created.title,
    chars: text.length,
    chapterCount: chapters.length,
    mode: created.mode,
    split: mode,
    encoding,
    sourcePath,
    createdAt: new Date().toISOString(),
  }
  store.writeBook(created.id, book)
  return { book, chapters }
}

export function openSummary(book, chapters) {
  const head = chapters.slice(0, 12).map(c => `  [ch${c.n}] ${c.title}（${c.end - c.start} 字）`)
  const tail = chapters.slice(-3).map(c => `  [ch${c.n}] ${c.title}`)
  return [
    `已建好书「${book.title}」[${book.id}]：${book.chars} 字，切出 ${book.chapterCount} 章（${book.split === 'headings' ? '按章节标题切分' : '没找到章节标题，按 5000 字分块'}）。`,
    `阅读模式：${book.mode === 'full' ? '全读（总字数 < 15 万，不必压缩，整本读完再写 L3）' : '压缩管线（弧 > 章，L1 通读时写，L2 细读时写）'}`,
    '',
    '前几章：',
    ...head,
    chapters.length > 15 ? '  ……' : '',
    ...(chapters.length > 12 ? tail : []),
    '',
    `下一步：novel_index action=attach 把这本书挂到当前会话，之后 novel_index action=read from=1 to=${Math.min(10, chapters.length)} 开始读；每读完一批章节用 novel_memo layer=l1 写章摘要。`,
  ].filter(line => line !== '').join('\n')
}
