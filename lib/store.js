/**
 * On-disk layout for one book. Every file is plain UTF-8 and human-editable:
 * the plugin page writes the same files the agent tools write.
 *
 *   <home>/books/<id>/book.json       meta
 *   <home>/books/<id>/source.txt      L0, normalized UTF-8 full text
 *   <home>/books/<id>/chapters.json   [{n,title,start,end}]
 *   <home>/books/<id>/l1.json         {"12":{one,marks:[{k,id,note}],at}}
 *   <home>/books/<id>/l2.json         [{id,from,to,title,summary,at}]
 *   <home>/books/<id>/l3.reader.md    reader reaction (总印象)
 *   <home>/books/<id>/l3.author.md    author analysis (总印象)
 *   <home>/books/<id>/impressions.jsonl append-only 阅读途中的感想条目
 *   <home>/books/<id>/reading.json    {lastRead,at} 已读到的章号
 *   <home>/books/<id>/facts.json      {characters,relations,foreshadow,archive}
 *   <home>/books/<id>/world.json      {index:{tag:{aliases,level,one,file,chapters}}}
 *   <home>/books/<id>/world/<file>.md body of one tag
 *   <home>/books/<id>/style.json      {recent:{locked,chapters},passages:[{chapter,text,note,at}]}
 *   <home>/books/<id>/decisions.jsonl append-only log
 *   <home>/attached.json              {sessionId:{book,at}}
 */
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'

const UNSAFE = /[\\/:*?"<>|\u0000-\u001f]/g

export function toSlug(text) {
  const cleaned = String(text ?? '').trim().replace(UNSAFE, '_').replace(/\s+/g, ' ').replace(/^\.+|\.+$/g, '')
  return cleaned.slice(0, 60) || 'book'
}

function readJsonFile(file, fallback) {
  try {
    const raw = fs.readFileSync(file, 'utf8')
    return raw.trim() ? JSON.parse(raw) : fallback
  } catch (error) {
    if (error.code === 'ENOENT') return fallback
    if (error instanceof SyntaxError) return fallback
    throw error
  }
}

function writeFileAtomic(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`
  fs.writeFileSync(tmp, content, 'utf8')
  fs.renameSync(tmp, file)
}

/** 数一句话里的句子数：按 。！？!?… 切，连续的省略号算一句。 */
export function sentenceCount(text) {
  return String(text || '').split(/[。！？!?…]+/).map(s => s.trim()).filter(Boolean).length
}

export function createStore(config = {}) {
  const home = path.resolve(process.env.DSH_NOVEL_HOME || config.home || path.join(os.homedir(), '.dsh-novel'))
  const booksDir = path.join(home, 'books')
  const cache = new Map()

  const dirOf = id => path.join(booksDir, id)
  const fileOf = (id, name) => path.join(dirOf(id), name)

  function ensure() {
    fs.mkdirSync(booksDir, { recursive: true })
  }

  function exists(id) {
    return fs.existsSync(fileOf(id, 'book.json'))
  }

  function load(id) {
    ensure()
    const book = readJsonFile(fileOf(id, 'book.json'), undefined)
    if (!book) throw new Error(`没有这本书：${id}`)
    const chapters = readJsonFile(fileOf(id, 'chapters.json'), [])
    return { book, chapters }
  }

  function listBooks() {
    ensure()
    let names = []
    try { names = fs.readdirSync(booksDir) } catch { names = [] }
    const rows = []
    for (const name of names) {
      try {
        const { book } = load(name)
        rows.push({
          id: name,
          title: book.title,
          chars: book.chars,
          chapterCount: book.chapterCount,
          mode: book.mode,
          createdAt: book.createdAt,
          updatedAt: latestStamp(name),
        })
      } catch { /* not a book directory */ }
    }
    return rows.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
  }

  function latestStamp(id) {
    let newest = 0
    try {
      for (const entry of fs.readdirSync(dirOf(id), { withFileTypes: true })) {
        if (entry.isFile()) newest = Math.max(newest, fs.statSync(fileOf(id, entry.name)).mtimeMs)
      }
    } catch { /* ignore */ }
    return newest ? new Date(newest).toISOString() : undefined
  }

  /** Accept an exact id, an exact title, or a unique substring of either. */
  function resolve(ref) {
    const books = listBooks()
    const wanted = String(ref ?? '').trim()
    if (!wanted) {
      if (books.length === 1) return books[0].id
      throw new Error(books.length ? `要给 book（${books.map(b => `${b.id}「${b.title}」`).join('、')}）` : '还没有任何书，先用 novel_index action=open 建一本')
    }
    const exact = books.find(b => b.id === wanted || b.title === wanted)
    if (exact) return exact.id
    const hits = books.filter(b => b.id.includes(wanted) || b.title.includes(wanted))
    if (hits.length === 1) return hits[0].id
    if (hits.length > 1) throw new Error(`book 匹配到多本：${hits.map(b => `${b.id}「${b.title}」`).join('、')}，换更精确的写法`)
    throw new Error(`找不到书「${wanted}」。现有：${books.map(b => `${b.id}「${b.title}」`).join('、') || '（空）'}`)
  }

  function source(id) {
    const cached = cache.get(`${id}:source`)
    if (cached) return cached
    const text = fs.readFileSync(fileOf(id, 'source.txt'), 'utf8')
    cache.set(`${id}:source`, text)
    return text
  }

  function createBook({ text, title, id, sourcePath, encoding, mode }) {
    ensure()
    const finalTitle = String(title || (sourcePath ? path.basename(sourcePath, path.extname(sourcePath)) : '未命名')).trim() || '未命名'
    let finalId = toSlug(id || finalTitle)
    let n = 2
    while (exists(finalId)) {
      finalId = `${toSlug(id || finalTitle)}-${n++}`
      if (n > 200) throw new Error('书名太普通了，给个 id 吧')
    }
    const dir = path.join(booksDir, finalId)
    fs.mkdirSync(path.join(dir, 'world'), { recursive: true })
    writeFileAtomic(fileOf(finalId, 'source.txt'), text)
    cache.set(`${finalId}:source`, text)
    const readingMode = mode === 'full' || mode === 'pipeline' ? mode : (text.length < 150000 ? 'full' : 'pipeline')
    return { id: finalId, title: finalTitle, sourcePath, encoding: encoding || 'utf-8', mode: readingMode }
  }

  function writeBook(id, book) {
    writeFileAtomic(fileOf(id, 'book.json'), JSON.stringify(book, null, 2) + '\n')
  }

  function writeChapters(id, chapters) {
    writeFileAtomic(fileOf(id, 'chapters.json'), JSON.stringify(chapters, null, 2) + '\n')
  }

  /** Delete one book's whole directory (source, memos, everything) and detach it from sessions. */
  function removeBook(ref) {
    const id = resolve(ref)
    if (!fs.existsSync(fileOf(id, 'book.json'))) throw new Error(`没有这本书：${id}`)
    fs.rmSync(dirOf(id), { recursive: true, force: true })
    for (const key of [...cache.keys()]) if (key.startsWith(`${id}:`)) cache.delete(key)
    const map = attached()
    let changed = false
    for (const [sessionId, entry] of Object.entries(map)) {
      if (entry && entry.book === id) { delete map[sessionId]; changed = true }
    }
    if (changed) writeFileAtomic(path.join(home, 'attached.json'), JSON.stringify(map, null, 2) + '\n')
    return id
  }

  function get(name, id, fallback) {
    return readJsonFile(fileOf(id, name), fallback)
  }

  function put(name, id, value) {
    writeFileAtomic(fileOf(id, name), JSON.stringify(value, null, 2) + '\n')
  }

  function chapterBytes(id, from, to) {
    const { book, chapters } = load(id)
    const list = chapters.filter(c => c.n >= from && c.n <= to)
    if (!list.length) throw new Error(`第 ${from}-${to} 章不存在；这本书共 ${chapters.length} 章`)
    return { book, chapters: list }
  }

  function slice(id, from, to) {
    const text = source(id)
    const { chapters } = chapterBytes(id, from, to)
    return chapters.map(c => ({ ...c, text: text.slice(c.start, c.end) }))
  }

  function readText(id, from, to) {
    const parts = slice(id, from, to)
    return parts.map(c => `【${c.title}】[ch${c.n}]\n${c.text.trim()}\n`).join('\n')
  }

  function l3(id, part) {
    try { return fs.readFileSync(fileOf(id, `l3.${part}.md`), 'utf8') } catch { return '' }
  }

  function setL3(id, part, text) {
    writeFileAtomic(fileOf(id, `l3.${part}.md`), String(text ?? ''))
  }

  function worldBody(id, tag) {
    const world = get('world.json', id, { index: {} })
    const entry = world.index[tag]
    if (!entry) return undefined
    try { return fs.readFileSync(fileOf(id, `world/${entry.file}`), 'utf8') } catch { return '' }
  }

  function setWorldBody(id, tag, body) {
    const world = get('world.json', id, { index: {} })
    const entry = world.index[tag]
    if (!entry) throw new Error(`世界观没有标签「${tag}」`)
    entry.file = entry.file || `${toSlug(tag)}.md`
    writeFileAtomic(fileOf(id, `world/${entry.file}`), String(body ?? ''))
    put('world.json', id, world)
  }

  function decisions(id) {
    try {
      return fs.readFileSync(fileOf(id, 'decisions.jsonl'), 'utf8')
        .split('\n').filter(Boolean).map(line => { try { return JSON.parse(line) } catch { return undefined } }).filter(Boolean)
    } catch { return [] }
  }

  function appendDecision(id, entry) {
    ensure()
    fs.appendFileSync(fileOf(id, 'decisions.jsonl'), JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n', 'utf8')
  }

  /** 阅读途中的感想：append-only，可删单条，可按章/通道过滤。 */
  function impressions(id) {
    try {
      return fs.readFileSync(fileOf(id, 'impressions.jsonl'), 'utf8')
        .split('\n').filter(Boolean).map(line => { try { return JSON.parse(line) } catch { return undefined } }).filter(Boolean)
    } catch { return [] }
  }

  function appendImpression(id, entry) {
    ensure()
    const row = {
      id: `i${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`,
      at: new Date().toISOString(),
      chapter: Number(entry.chapter) || null,
      part: entry.part === 'author' ? 'author' : 'reader',
      text: String(entry.text || '').trim().slice(0, 300),
    }
    fs.appendFileSync(fileOf(id, 'impressions.jsonl'), JSON.stringify(row) + '\n', 'utf8')
    return row
  }

  function removeImpression(id, entryId) {
    const rows = impressions(id).filter(row => row.id !== entryId)
    writeFileAtomic(fileOf(id, 'impressions.jsonl'), rows.map(row => JSON.stringify(row)).join('\n') + (rows.length ? '\n' : ''))
    return rows
  }

  /** 读到哪了：novel_index read / 写 L1 都会推进；文风的“最近两章”靠它。 */
  function reading(id) {
    return readJsonFile(fileOf(id, 'reading.json'), { lastRead: 0 })
  }

  function setReading(id, chapter) {
    const n = Number(chapter)
    if (!Number.isFinite(n) || n < 1) return
    const current = reading(id)
    if (n > (Number(current.lastRead) || 0)) put('reading.json', id, { lastRead: n, at: new Date().toISOString() })
  }

  function lastReadChapter(id) {
    const explicit = Number(reading(id).lastRead) || 0
    if (explicit) return explicit
    const l1 = get('l1.json', id, {})
    return Object.keys(l1).map(Number).filter(Number.isFinite).sort((a, b) => b - a)[0] || 0
  }

  /**
   * 文风的“最近已读两章”：默认跟阅读游标，用户手动指定则用指定的，锁定后 AI 不得改。
   * 返回 {chapters:[n1,n2], locked, manual}，章节号已裁到书内。
   */
  function recentChapters(id) {
    const { chapters } = load(id)
    if (!chapters.length) return { chapters: [], locked: false, manual: false }
    const style = styleOf(id)
    const first = chapters[0].n
    const last = chapters[chapters.length - 1].n
    const clamp = n => Math.min(last, Math.max(first, Number(n) || first))
    let list
    if (style.recentChapters && style.recentChapters.length) {
      list = style.recentChapters.map(clamp)
    } else {
      const end = clamp(lastReadChapter(id) || last)
      list = [end - 1, end].filter(n => n >= first)
    }
    return { chapters: [...new Set(list)].sort((a, b) => a - b), locked: style.locked, manual: Boolean(style.recentChapters && style.recentChapters.length) }
  }

  /** style.json 的规范化视图；旧的 samples 原样留着，不再参与注入。 */
  function styleOf(id) {
    const style = get('style.json', id, {}) || {}
    const recent = style.recent && typeof style.recent === 'object' ? style.recent : {}
    return {
      recentChapters: Array.isArray(recent.chapters) ? recent.chapters.map(Number).filter(Number.isFinite) : null,
      locked: Boolean(recent.locked),
      passages: Array.isArray(style.passages) ? style.passages : [],
      samples: Array.isArray(style.samples) ? style.samples : [],
      cap: normalizeCap(style.cap),
    }
  }

  /** 整段摘录的总字数上限，用户可调；默认 2000。 */
  function normalizeCap(value) {
    const n = Math.round(Number(value))
    if (!Number.isFinite(n)) return 2000
    return Math.min(20000, Math.max(500, n))
  }

  function saveStyle(id, next) {
    const style = get('style.json', id, {}) || {}
    style.recent = { chapters: next.recentChapters || null, locked: Boolean(next.locked) }
    style.passages = next.passages || []
    if (next.cap != null) style.cap = normalizeCap(next.cap)
    put('style.json', id, style)
  }

  /** 自定义笔记：整页 markdown，按任务分节（## 任务名）；agent 只追加，用户整页改。 */
  function notesConfig(id) {
    const cfg = readJsonFile(fileOf(id, 'notes.json'), { cap: 0 })
    const cap = Number(cfg.cap)
    return { cap: Number.isFinite(cap) && cap > 0 ? Math.round(cap) : 0 }
  }

  function setNotesCap(id, cap) {
    ensure()
    const n = Math.round(Number(cap))
    put('notes.json', id, { cap: Number.isFinite(n) && n > 0 ? Math.max(100, n) : 0 })
    return notesOf(id)
  }

  function notesOf(id) {
    let text = ''
    try { text = fs.readFileSync(fileOf(id, 'notes.md'), 'utf8') } catch { text = '' }
    const tasks = []
    for (const m of text.matchAll(/^##[ \t]+(.+)$/gm)) tasks.push(m[1].trim())
    return { text, chars: text.length, tasks, cap: notesConfig(id).cap }
  }

  function writeNotes(id, body) {
    ensure()
    const { cap } = notesConfig(id)
    const next = String(body ?? '')
    if (cap && next.length > cap) throw new Error(`笔记超过上限 ${cap} 字：先在页面上调高上限或关掉限制`)
    writeFileAtomic(fileOf(id, 'notes.md'), next)
    return notesOf(id)
  }

  /** 往某个任务节末尾追加一条；任务节不存在就新建。 */
  function appendNote(id, entry) {
    ensure()
    const task = String(entry.task || '').trim()
    if (!task) throw new Error('写笔记需要 task（任务名）')
    const body = String(entry.text || '').trim()
    if (!body) throw new Error('笔记正文不能为空')
    const chapter = Number(entry.chapter)
    const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
    const line = `- ${Number.isFinite(chapter) && chapter > 0 ? `[ch${chapter}] ` : ''}${body}${entry.note ? `（${entry.note}）` : ''} <${stamp}>`
    const current = notesOf(id).text
    const lines = current.trim() ? current.split('\n') : ['# 自定义笔记', '']
    const heading = `## ${task}`
    const at = lines.indexOf(heading)
    if (at >= 0) {
      let end = lines.length
      for (let i = at + 1; i < lines.length; i++) if (/^##\s/.test(lines[i])) { end = i; break }
      let insertAt = end
      while (insertAt > at + 1 && !lines[insertAt - 1].trim()) insertAt--
      lines.splice(insertAt, 0, line)
    } else {
      if (lines.length && lines[lines.length - 1].trim()) lines.push('')
      lines.push(heading, line)
    }
    return writeNotes(id, lines.join('\n'))
  }

  function attached() {
    return readJsonFile(path.join(home, 'attached.json'), {})
  }

  function setAttached(sessionId, book) {
    const map = attached()
    if (book) map[sessionId] = { book, at: new Date().toISOString() }
    else delete map[sessionId]
    writeFileAtomic(path.join(home, 'attached.json'), JSON.stringify(map, null, 2) + '\n')
  }

  function coverage(id) {
    const { book, chapters } = load(id)
    const l1 = get('l1.json', id, {})
    const arcs = get('l2.json', id, [])
    const facts = get('facts.json', id, {})
    const world = get('world.json', id, { index: {} })
    const style = get('style.json', id, { samples: [] })
    const missing = chapters.filter(c => !l1[String(c.n)]).map(c => c.n)
    const covered = new Set()
    for (const arc of arcs) for (let n = arc.from; n <= arc.to; n++) covered.add(n)
    const shortBook = chapters.length < 15
    const arcGaps = shortBook ? [] : chapters.map(c => c.n).filter(n => !covered.has(n))
    const archived = new Set((facts.archive || []).map(row => row.name))
    const characters = (facts.characters || []).filter(c => !archived.has(c.name))
    const dead = characters.filter(c => c.status === 'dead').length
    const foreshadowOpen = (facts.foreshadow || []).filter(f => f.payoffChapter == null).length
    const marksOpen = []
    for (const [chapter, entry] of Object.entries(l1)) {
      for (const mark of entry.marks || []) if (mark.k === 'foreshadow' && mark.id) marksOpen.push({ id: mark.id, chapter: Number(chapter), note: mark.note || '' })
    }
    const paid = new Set()
    for (const entry of Object.values(l1)) for (const mark of entry.marks || []) if (mark.k === 'payoff' && mark.id) paid.add(mark.id)
    for (const f of facts.foreshadow || []) if (f.payoffChapter != null) paid.add(f.id)
    return {
      mode: book.mode,
      chars: book.chars,
      chapterCount: chapters.length,
      l1Written: Object.keys(l1).length,
      l1Missing: missing.slice(0, 50),
      l1MissingCount: missing.length,
      arcs: arcs.length,
      arcGaps: arcGaps.slice(0, 50),
      arcGapCount: arcGaps.length,
      l3Reader: l3(id, 'reader').length,
      l3Author: l3(id, 'author').length,
      worldTags: Object.keys(world.index || {}).length,
      characters: characters.length,
      deadCharacters: dead,
      archived: (facts.archive || []).length,
      foreshadowOpen: foreshadowOpen + marksOpen.filter(m => !paid.has(m.id)).length,
      impressions: impressions(id).length,
      stylePassages: styleOf(id).passages.length,
      styleSamples: styleOf(id).passages.length,
      lastRead: lastReadChapter(id),
      decisions: decisions(id).length,
    }
  }

  return {
    home, booksDir, config,
    ensure, exists, load, listBooks, resolve, source, createBook, writeBook, writeChapters, removeBook,
    get, put, slice, readText, chapterBytes,
    l3, setL3, worldBody, setWorldBody,
    decisions, appendDecision, attached, setAttached, coverage,
    impressions, appendImpression, removeImpression,
    reading, setReading, lastReadChapter, recentChapters, styleOf, saveStyle,
    notesOf, writeNotes, appendNote, setNotesCap, sentenceCount,
    fileOf,
  }
}
