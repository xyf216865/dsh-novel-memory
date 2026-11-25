/** Per-agent, session-scoped digest. Only the session that attached a book pays the tokens. */

const sections = new WeakMap()

export function mountPrompt(ctx, store, buildDigest) {
  function ensure(agent) {
    if (!agent || sections.has(agent)) return
    let prompt
    try { prompt = agent.ctx.get('systemPrompt') } catch { prompt = undefined }
    if (!prompt || typeof prompt.section !== 'function') return
    const stop = prompt.section({
      name: 'novel-memory:digest',
      order: 40,
      interpolate: false,
      text: context => {
        if (context && context.scope && context.scope !== agent) return ''
        const entry = store.attached()[agent.id]
        return entry ? buildDigest(store, entry.book) : ''
      },
    })
    sections.set(agent, stop)
    agent.ctx.effect(() => () => {
      sections.delete(agent)
      stop()
    }, 'novel-memory: digest section')
  }

  ctx.on('agent/created', ({ agent }) => { ensure(agent) })
  return { ensure }
}
