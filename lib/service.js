/** Host-side methods behind the settings page. The page edits exactly the files the tools write. */

const MARK_KINDS = ['turn', 'foreshadow', 'payoff', 'motif', 'enter', 'exit', 'relation', 'lore']

function normalizeMarks(marks) {
  return (Array.isArray(marks) ? marks : []).map(mark => {
    if (!mark) return null
    let kind = String(mark.k || '')
    let inlineId = null
    const hash = kind.indexOf('#')
    if (hash > 0) { inlineId = kind.slice(hash + 1); kind = kind.slice(0, hash) }
    if (!MARK_KINDS.includes(kind)) throw new Error(`事件标记 k 只能是 ${MARK_KINDS.join('/')}（也可写 k="foreshadow#f12"）`)
    return { k: kind, id: mark.id || inlineId || null, note: mark.note || '' }
  }).filter(Boolean)
}

function snapshot(store, id) {
  const { book, chapters } = store.load(id)
  const l1 = store.get('l1.json', id, {})
  const world = store.get('world.json', id, { index: {} })
  const rows = []
  for (const chapter of chapters) {
    const entry = l1[String(chapter.n)]
    if (!entry) continue
    rows.push({ n: chapter.n, title: chapter.title, one: entry.one || '', marks: entry.marks || [], at: entry.at || null })
  }
  const worldRows = Object.entries(world.index)
    .map(([tag, entry]) => ({
      tag,
      level: entry.level || 'B',
      one: entry.one || '',
      aliases: entry.aliases || [],
      chapters: entry.chapters || [],
      body: store.worldBody(id, tag) || '',
    }))
    .sort((a, b) => (a.level === 'A' ? 0 : 1) - (b.level === 'A' ? 0 : 1) || a.tag.localeCompare(b.tag))
  const style = store.styleOf(id)
  const recent = store.recentChapters(id)
  const preview = recent.chapters.map(n => {
    try {
      const [part] = store.slice(id, n, n)
      return { chapter: n, title: part ? part.title : '', text: part ? String(part.text).slice(0, 240) : '' }
    } catch {
      return { chapter: n, title: '', text: '' }
    }
  })
  return {
    book,
    coverage: store.coverage(id),
    l1: rows,
    arcs: store.get('l2.json', id, []),
    l3: { reader: store.l3(id, 'reader'), author: store.l3(id, 'author') },
    impressions: store.impressions(id),
    world: worldRows,
    facts: store.get('facts.json', id, { characters: [], relations: [], foreshadow: [], archive: [] }),
    style: {
      recent: { ...recent, preview },
      passages: style.passages,
      samples: style.samples,
      cap: style.cap,
    },
    reading: store.reading(id),
    notes: store.notesOf(id),
    decisions: store.decisions(id).slice(-30),
  }
}

export function createService(store, ingest = {}) {
  const openBook = ingest.openBook || (() => { throw new Error('ingest 未注入') })
  return {
    books() {
      return store.listBooks().map(row => {
        try {
          const coverage = store.coverage(row.id)
          return { ...row, l1Written: coverage.l1Written, arcs: coverage.arcs, worldTags: coverage.worldTags, foreshadowOpen: coverage.foreshadowOpen, chars: row.chars }
        } catch {
          return row
        }
      })
    },

    book(request) {
      const id = store.resolve(request && (request.bookId || request.book || request.id))
      return snapshot(store, id)
    },

    open(request) {
      const { book } = openBook(store, request || {})
      return snapshot(store, book.id)
    },

    forget(request) {
      const id = store.resolve(request && (request.bookId || request.book || request.id))
      const removed = store.removeBook(id)
      return { removed, books: store.listBooks() }
    },

    save(request) {
      const id = store.resolve(request && request.bookId)
      const target = String(request && request.target || '')
      const value = request ? request.value : undefined
      const [kind, key] = target.split(':')

      if (kind === 'l1') {
        const chapter = Number(key)
        const l1 = store.get('l1.json', id, {})
        const entry = l1[String(chapter)] || { one: '', marks: [], at: null }
        entry.one = String(value && value.one || '').slice(0, 150)
        if (Array.isArray(value && value.marks)) entry.marks = normalizeMarks(value.marks)
        if (!entry.one && !entry.marks.length) delete l1[String(chapter)]
        else { entry.at = new Date().toISOString(); l1[String(chapter)] = entry }
        store.put('l1.json', id, l1)
        store.setReading(id, chapter)
        return snapshot(store, id)
      }

      if (kind === 'l2') {
        const arcs = store.get('l2.json', id, [])
        if (key === 'new') {
          const from = Number(value && value.from)
          const to = Number(value && value.to)
          if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from) throw new Error('新弧要有合法的起止章')
          const clash = arcs.find(a => from <= a.to && to >= a.from)
          if (clash && !(value && value.force)) throw new Error(`和已有弧「${clash.title || clash.id}」[${clash.from}-${clash.to}] 重叠；确认要拆开就勾选允许重叠`)
          arcs.push({
            id: `arc${arcs.length + 1}`,
            from,
            to,
            title: String(value && value.title || '').slice(0, 80),
            summary: String(value && value.summary || '').slice(0, 1200),
            at: new Date().toISOString(),
          })
          store.put('l2.json', id, arcs)
          return snapshot(store, id)
        }
        const arc = arcs.find(a => a.id === key)
        if (!arc) throw new Error(`没有弧 ${key}`)
        if (value && typeof value.title === 'string') arc.title = value.title.slice(0, 80)
        if (value && typeof value.summary === 'string') arc.summary = value.summary.slice(0, 1200)
        if (value && Number.isInteger(value.from)) arc.from = value.from
        if (value && Number.isInteger(value.to)) arc.to = value.to
        arc.at = new Date().toISOString()
        store.put('l2.json', id, arcs)
        return snapshot(store, id)
      }

      if (kind === 'l3') {
        if (key !== 'reader' && key !== 'author') throw new Error('L3 只分 reader / author')
        store.setL3(id, key, String(value || ''))
        return snapshot(store, id)
      }

      if (kind === 'world') {
        const world = store.get('world.json', id, { index: {} })
        if (!key || !key.trim()) throw new Error('世界观卡要有标签名')
        const fresh = !world.index[key]
        if (fresh) world.index[key] = { level: 'B', one: '', aliases: [], chapters: [] }
        const entry = world.index[key]
        if (value && typeof value.one === 'string') entry.one = value.one.slice(0, 200)
        if (value && (value.level === 'A' || value.level === 'B')) entry.level = value.level
        if (value && Array.isArray(value.aliases)) entry.aliases = value.aliases.map(a => String(a).trim()).filter(Boolean)
        if (value && Array.isArray(value.chapters)) entry.chapters = value.chapters.map(Number).filter(Number.isFinite)
        store.put('world.json', id, world)
        if (value && typeof value.body === 'string') store.setWorldBody(id, key, value.body)
        return snapshot(store, id)
      }

      if (kind === 'impression') {
        if (key === 'add') {
          const chapter = Number(value && value.chapter)
          if (!Number.isInteger(chapter) || chapter < 1) throw new Error('印象条目要有章号')
          const part = value && value.part === 'author' ? 'author' : 'reader'
          const body = String(value && value.text || '').trim()
          if (body.length < 6) throw new Error('感想太短，写具体一点（至少 6 个字）')
          const same = store.impressions(id).filter(row => row.chapter === chapter && row.part === part)
          if (same.length >= 3) throw new Error(`[ch${chapter}] 这个通道已经有 3 条了；珍惜地方，删一条或并进总印象`)
          store.appendImpression(id, { chapter, part, text: body })
          return snapshot(store, id)
        }
        if (key === 'remove') {
          store.removeImpression(id, String(value && value.id || value || ''))
          return snapshot(store, id)
        }
        throw new Error('impression 只支持 add / remove')
      }

      if (kind === 'facts') {
        if (key === 'archive' || key === 'restore') {
          const facts = store.get('facts.json', id, {})
          const name = String(value && value.name || '').trim()
          if (!name) throw new Error('要有 name')
          if (key === 'archive') {
            const list = facts.characters || []
            const index = list.findIndex(c => c.name === name)
            if (index < 0) throw new Error(`事实表没有「${name}」`)
            const [row] = list.splice(index, 1)
            const relations = (facts.relations || []).filter(r => r.a === name || r.b === name)
            facts.relations = (facts.relations || []).filter(r => !(r.a === name || r.b === name))
            facts.archive = facts.archive || []
            facts.archive.push({ ...row, relations, archivedAt: new Date().toISOString() })
            facts.characters = list
            store.put('facts.json', id, facts)
            return snapshot(store, id)
          }
          const entry = (facts.archive || []).find(r => r.name === name)
          if (!entry) throw new Error(`墓碑里没有「${name}」`)
          facts.archive = (facts.archive || []).filter(r => r.name !== name)
          facts.characters = [...(facts.characters || []), { ...entry, relations: undefined, archivedAt: undefined }]
          const back = (entry.relations || []).filter(r => !(facts.relations || []).some(x => x.a === r.a && x.b === r.b))
          facts.relations = [...(facts.relations || []), ...back]
          store.put('facts.json', id, facts)
          return snapshot(store, id)
        }
      }

      if (kind === 'facts') {
        const allowed = { characters: 'characters', relations: 'relations', foreshadow: 'foreshadow' }
        if (!allowed[key]) throw new Error('facts 只分 characters / relations / foreshadow')
        if (!Array.isArray(value)) throw new Error('事实表要存成数组')
        const facts = store.get('facts.json', id, {})
        facts[key] = value
        store.put('facts.json', id, facts)
        return snapshot(store, id)
      }

      if (kind === 'style') {
        const style = store.styleOf(id)
        if (key === 'passage-add') {
          const body = String(value && value.text || '').trim()
          if (!body) throw new Error('摘录不能空')
          const sentences = store.sentenceCount(body)
          if (sentences < 3 || sentences > 7) throw new Error(`整段摘录要 3–7 句完整句子，现在 ${sentences} 句。挑最有味道的几段，别整页贴，也别只摘一句。`)
          const passages = [...style.passages, { chapter: Number(value && value.chapter) || null, text: body, note: String(value && value.note || '').trim(), at: new Date().toISOString() }]
          let total = passages.reduce((sum, p) => sum + String(p.text || '').length, 0)
          while (passages.length > 1 && total > style.cap) {
            const [oldest] = passages.splice(0, 1)
            total -= String(oldest.text || '').length
          }
          store.saveStyle(id, { recentChapters: style.recentChapters, locked: style.locked, passages })
          return snapshot(store, id)
        }
        if (key === 'cap') {
          const cap = Number(value)
          if (!Number.isFinite(cap)) throw new Error('上限要是数字')
          store.saveStyle(id, { recentChapters: style.recentChapters, locked: style.locked, passages: style.passages, cap })
          return snapshot(store, id)
        }
        if (key === 'passage-remove') {
          const index = Number(value && value.index != null ? value.index : value)
          if (!(index >= 0 && index < style.passages.length)) throw new Error('摘录序号越界')
          const passages = style.passages.slice()
          passages.splice(index, 1)
          store.saveStyle(id, { recentChapters: style.recentChapters, locked: style.locked, passages })
          return snapshot(store, id)
        }
        if (key === 'recent') {
          const chapters = value && Array.isArray(value.chapters)
            ? value.chapters.map(Number).filter(n => Number.isFinite(n) && n >= 1).slice(-2)
            : null
          const locked = value && typeof value.locked === 'boolean' ? value.locked : style.locked
          store.saveStyle(id, { recentChapters: chapters && chapters.length ? chapters : null, locked, passages: style.passages })
          return snapshot(store, id)
        }
        // 旧版单句样本，保留兼容
        const samples = style.samples.slice()
        if (key === 'add') {
          if (!value || !String(value.text || '').trim()) throw new Error('样本文本不能空')
          samples.push({ chapter: Number(value.chapter) || null, text: String(value.text).trim(), note: String(value.note || '').trim() })
        } else if (key === 'update') {
          const index = Number(value && value.index)
          if (!(index >= 0 && index < samples.length)) throw new Error('样本序号越界')
          if (!String(value.text || '').trim()) throw new Error('样本文本不能空')
          samples[index] = { chapter: Number(value.chapter) || null, text: String(value.text).trim(), note: String(value.note || '').trim() }
        } else if (key === 'remove') {
          const index = Number(value)
          if (!(index >= 0 && index < samples.length)) throw new Error('样本序号越界')
          samples.splice(index, 1)
        } else {
          throw new Error('style 支持 passage-add / passage-remove / recent，或旧版 add / update / remove')
        }
        const file = store.get('style.json', id, {})
        file.samples = samples
        store.put('style.json', id, file)
        return snapshot(store, id)
      }

      if (kind === 'note') {
        if (key === 'cap') {
          store.setNotesCap(id, value && typeof value === 'object' ? value.cap : value)
          return snapshot(store, id)
        }
        if (key === 'append') {
          store.appendNote(id, value || {})
          return snapshot(store, id)
        }
        store.writeNotes(id, typeof value === 'string' ? value : (value && value.text) || '')
        return snapshot(store, id)
      }

      throw new Error(`不认识的保存目标：${target}`)
    },
  }
}
