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
  '小说记忆按需开启：默认收起，不占上下文。用户提到具体小说、要求读书/续写/查书/管理书架时 action=on 唤出 novel_* 工具；不聊书别开，用完 action=off。',
  '用法与参数不在描述里：第一次用、或参数/报错拿不准，先调 novel_help 读说明书。两件必错的事先说：open 要绝对路径，open 完还要 attach；章号一律用 [chN]。',
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

  const WAKE_GUIDE = '第一次用强烈建议先调 novel_help 读一遍说明书。要点：open 用绝对路径并 attach；章号用 [chN]；参数不确定就 novel_help。'

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
    name: 'novel_help',
    description: '读 novel-memory 的完整使用说明：七层是什么、每个工具的参数形状、长度限制、常见报错含义、数据放在哪。第一次用、参数拿不准、或看不懂报错时调它；无参数，返回全文。',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    output: { schema: {}, render: (_args, value) => [{ type: 'text', text: value.text }] },
    async execute() {
      try {
        const file = new URL('./docs/MANUAL.md', import.meta.url)
        return { text: fs.readFileSync(file, 'utf8') }
      } catch (error) {
        return { text: '说明书读不到：' + error.message + '（插件包内缺 docs/MANUAL.md；参数看 README 或源码 schema）' }
      }
    },
  }), 'novel-memory: help')
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
