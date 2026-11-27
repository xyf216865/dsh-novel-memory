import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('.', import.meta.url))

// Plugin reload re-imports this entry, but Node caches relative ESM imports by
// URL; without a query the host would keep running the old lib/*.js code.
const bust = `?v=${Date.now()}`
const { createStore } = await import(`./lib/store.js${bust}`)
const { toolDefinitions, provideIngest } = await import(`./lib/tools.js${bust}`)
const { createService } = await import(`./lib/service.js${bust}`)
const { buildDigest } = await import(`./lib/digest.js${bust}`)
const { mountPrompt } = await import(`./lib/prompt.js${bust}`)
const { mountRemote } = await import(`./lib/remote.js${bust}`)
const ingest = await import(`./lib/ingest.js${bust}`)
provideIngest(ingest)

export const name = 'novel-memory'
export const inject = ['tools']

const WAKE_DESCRIPTION = [
  '小说记忆按需开启：默认收起，不占上下文。用户提到具体小说、要求读书/续写/查书/管理书架时 action=on 唤出五个 novel_* 工具；不聊书别开，用完 action=off。',
  '冷启动只要记住三件：①open 用绝对路径（正文≥800 字）或 text= 正文，open 之后还要 attach 才算挂上，本工具 book=<书名> 可一步挂；②章号一律用 [chN]，不是标题里的「第 X 章」；③on 会直接返回全部参数速查，别猜着写。',
].join(String.fromCharCode(10))

export function apply(ctx, config = {}) {
  const store = createStore(config)
  const prompt = mountPrompt(ctx, store, buildDigest)
  const tools = toolDefinitions(store, prompt)

  // Process-wide pointers survive a plugin reload. Without them the host keeps
  // the first batch of tools it ever registered: a reload would import new
  // code but the old execute closures would still answer.
  globalThis.__dshNovelLatest = new Map(tools.map(tool => [tool.name, tool]))
  const mounted = globalThis.__dshNovelMounted || (globalThis.__dshNovelMounted = new Map())

  function agentTools(agent) {
    return agent && agent.ctx && agent.ctx.tools ? agent.ctx.tools : ctx.tools
  }

  function activate(agent) {
    if (!agent) return false
    const key = agent.id || String(agent)
    // Drop the previous batch first: agent-scoped registrations are not cleaned
    // up by the host when the plugin reloads, and a duplicate name is refused.
    const previous = mounted.get(key)
    if (previous) {
      for (const dispose of previous.disposers || []) {
        try { dispose() } catch { /* already gone */ }
      }
      mounted.delete(key)
    }
    const scope = agent.ctx && typeof agent.ctx.effect === 'function' ? agent.ctx : ctx
    const target = agentTools(agent)
    const disposers = []
    for (const tool of tools) {
      const stable = { ...tool, execute: (args, exec) => (globalThis.__dshNovelLatest.get(tool.name) || tool).execute(args, exec) }
      try {
        const dispose = scope.effect(() => target.register(stable), `novel-memory: ${tool.name}`)
        if (typeof dispose === 'function') disposers.push(dispose)
      } catch {
        // registration refused (old instance holds the name): the newest code
        // still reaches it through __dshNovelLatest
      }
    }
    mounted.set(key, { agent, disposers })
    return true
  }

  function deactivate(agent) {
    const key = agent && (agent.id || String(agent))
    const entry = key ? mounted.get(key) : null
    if (!entry) return false
    for (const dispose of entry.disposers || []) {
      try { dispose() } catch { /* already gone */ }
    }
    mounted.delete(key)
    return true
  }

  const WAKE_GUIDE = [
    '参数速查（照这个写，别猜）：',
    '- open：novel_index action=open path=<绝对路径> | text=<正文>，正文 ≥800 字；再 action=attach 才算挂上。',
    '- 读：action=read from=1 to=8；引用一律用 [chN]。',
    '- L1：novel_memo layer=l1 chapter=3 one="≤400 字，按远近 2–8 句" marks=[{k:"foreshadow#f12",note:"…"}]；k 只有 turn / foreshadow / payoff / motif / enter / exit / relation / lore，拿不准算不算伏笔就 motif。',
    '- L2：layer=l2 from=1 to=12 title="…" summary="…"（15–25 章一弧）。',
    '- L3：layer=l3 part=reader|author text="…"；part 只有这两个，想记决定用 layer=decisions。',
    '- 事实：kind=facts action=set fact=character entry={name,status,tier,deathChapter,note}；fact=relation entry={a,b,type,since}（两端可以是组织/地点/种族）；fact=foreshadow entry={id,setupChapter,desc}。',
    '- 世界观：kind=world action=set tag="…" one="一行" body="…"；文风：kind=style action=append passage={chapter:N,text:"3–7 句"}。',
    '- 体检：novel_check types=[coverage,unrecovered,dead,cadence,conflict,l1,prune]。',
  ].join(String.fromCharCode(10))

  function wake(args, exec) {
    const agent = exec && exec.agent
    const action = String((args && args.action) || 'on')
    if (action === 'off') {
      const had = deactivate(agent)
      return { text: had ? '小说记忆工具已收起，本会话不再占用上下文。' : '小说记忆工具本来就没开着。' }
    }
    activate(agent)
    let text = '已开启小说记忆工具：novel_index / novel_find / novel_memo / novel_world / novel_check。用完记得 action=off。\n\n' + WAKE_GUIDE
    if (args && args.book) {
      try {
        const id = store.resolve(args.book)
        if (agent && agent.id) {
          store.setAttached(agent.id, id)
          if (typeof prompt.ensure === 'function') {
            try { prompt.ensure(agent) } catch { /* best effort */ }
          }
        }
        const { book } = store.load(id)
        text += `\n已把《${book.title}》[${id}] 挂到本会话。`
      } catch (error) {
        text += `\n（挂书失败：${error.message}）`
      }
    }
    return { text }
  }

  // A reload replaces these pointers; the already-registered wake tool reads
  // them on every call, so it starts dispatching the new implementation too.
  globalThis.__dshNovelWake = { wake, activate, deactivate }

  ctx.effect(() => ctx.tools.register({
    name: 'novel_wake',
    description: WAKE_DESCRIPTION,
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['on', 'off'], description: 'on 开启小说记忆工具；off 收起' },
        book: { type: 'string', description: '可选：开启后顺带把这本书挂到本会话（用标题或 id 的唯一片段）' },
      },
      required: ['action'],
      additionalProperties: false,
    },
    output: { schema: {}, render: (_args, value) => [{ type: 'text', text: value.text }] },
    execute(args, exec) {
      const api = globalThis.__dshNovelWake
      return (api && typeof api.wake === 'function' ? api.wake : wake)(args, exec)
    },
  }), 'novel-memory: wake')

  // Sessions that already have a book attached keep their toolset: attach implies reading.
  ctx.on('agent/created', ({ agent }) => {
    try {
      if (agent && store.attached()[agent.id]) activate(agent)
    } catch { /* attach map unreadable: start dark */ }
  })

  mountRemote(ctx, store, serviceStore => createService(serviceStore, ingest))

  if (typeof ctx.inject === 'function') {
    ctx.inject(['skills'], scoped => {
      let content = ''
      try {
        content = fs.readFileSync(`${ROOT}skills/novel-reading/SKILL.md`, 'utf8').replace(/^---[\s\S]*?---\s*/, '')
      } catch {
        return
      }
      const dispose = scoped.skills.register({
        name: 'novel-reading',
        description: '读中文长篇小说建立七层可回溯记忆：分批读原文、写章摘要/弧摘要/全局印象/事实表/世界观/文风样本，读完后丢原文也能讨论、续写、查细节。',
        source: 'bundled',
        content,
      })
      scoped.effect(() => dispose, 'novel-memory: skill')
    })
  }
}
