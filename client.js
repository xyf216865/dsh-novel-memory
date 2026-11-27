window.__ModuleLoader__.load({
  id: 'dsh-novel-memory',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useRef, useCallback } = React

    const NS = 'novelMemory'

    // Mirror of lib/remote.js: the client only needs the wire shape, the host owns the behaviour.
    const codec = name => ({ mode: 'strict', typeSymbol: `dsh-novel-memory#${name}`, create: () => ({ parse: value => value }) })
    const method = (name, wire) => ({
      id: `dsh-novel-memory#novelMemory/${name}`,
      service: 'novelMemory',
      namespace: 'novelMemory',
      method: name,
      invocation: { kind: 'direct' },
      result: codec('Value'),
      parameters: wire ? [{ name: wire, wire, source: 'json', codec: codec('Payload') }] : [],
    })
    const DESCRIPTORS = [method('books'), method('book', 'request'), method('open', 'request'), method('save', 'request'), method('forget', 'request')]

    const STRINGS = {
      zh: {
        tab: '小说记忆',
        open: '打开 txt',
        opening: '处理中…',
        openHint: 'txt 文件或文件夹路径，比如 D:\\ai\\book',
        pick: '选择文件…',
        pickAria: '选择 txt 文件',
        readingFile: '正在读取文件…',
        path: 'txt 路径',
        books: '书',
        noBooks: '还没有读过书。点「选择文件…」挑一个 txt，或填路径点「打开 txt」；也可以让 agent 用 novel_index action=open 建一本。',
        booksError: '书架读取失败',
        retry: '重试',
        close: '关闭',
        refresh: '刷新',
        removeBook: '删除这本',
        removeBookConfirm: '删除后这本书的全部记忆（原文章节、L1–L4、事实表、文风）都会从磁盘上消失，不可恢复。确定删除？',
        refreshing: '刷新中…',
        loading: '读取中…',
        loadingBook: '正在读取',
        full: '全读模式',
        pipeline: '压缩管线',
        chapters: '章',
        l1Tab: 'L1 章摘要',
        l2Tab: 'L2 弧',
        l3Tab: 'L3 印象',
        worldTab: 'L4 世界观',
        factsTab: 'F 事实',
        styleTab: 'V 文风',
        noteTab: '自定义笔记',
        noteHint: '主人布置的任务可以记在这里：按任务分小节，agent 只追加条目，你在这里整页改。默认不会被 agent 主动读取，也不进上下文。',
        noteEmpty: '这一页还是空的。开始读书后，agent 会按任务往里追加条目；你也可以直接写。',
        noteCount: '当前字数',
        noteCapLabel: '限制字数',
        noteCapOff: '不限（默认）',
        noteCapHint: '默认不限；勾上后按上限截断，页面与 agent 写入都受限',
        edit: '编辑',
        collapse: '收起',
        save: '保存',
        saving: '保存中…',
        saved: '已保存',
        cancel: '取消',
        remove: '删掉',
        confirmRemove: '确认删掉？',
        add: '新增',
        oneLine: '一行摘要（写清这一章发生了什么；最多 150 字）',
        marksLabel: '事件标记',
        addMark: '加一条标记',
        markKind: '类型',
        markId: '伏笔 id',
        markNote: '备注',
        emptyL1: '还没有章摘要。读完一批章节后用 novel_memo 写，或在下面补。',
        missingChapters: '没写摘要的章',
        addChapter: '补一章',
        chapter: '章号',
        arcRange: '章范围',
        arcTitle: '弧名',
        arcSummary: '弧摘要（≤1200 字）',
        addArc: '划一条弧',
        arcOverlap: '允许重叠',
        emptyL2: '还没有弧。弧是压缩单位（10~30 章），通读后在这里划，或让 agent 用 novel_memo 建。',
        arcGap: '章没归弧',
        reader: '读者感想',
        author: '作者分析',
        l3Hint: '读者感想和作者分析分开存：混在一起会互相污染。前者写「我哭了 / 我早猜到了」，后者写结构、手法、主题。',
        decisions: 'decisions 日志',
        decisionsHint: 'append-only：讨论期先写这里，过一阵再合并进 L3。',
        worldLevel: '级别',
        levelA: 'A 级（常驻）',
        levelB: 'B 级（一行）',
        aliases: '别名（用「、」隔开）',
        chaptersField: '出现章节（逗号隔开）',
        body: '正文（按需加载的那部分）',
        worldOne: '一行摘要',
        addWorld: '新增世界观卡',
        tag: '标签名',
        emptyWorld: '世界观索引还是空的。只给「会再出现」或「影响剧情」的设定建卡。',
        factsHint: '事实永不压缩：只记可核对的事（谁死了、第几章、和谁什么关系），不写感想。',
        characters: '人物（生死 / 别名 / 身份）',
        relations: '关系',
        foreshadow: '伏笔',
        motif: '母题',
        addRow: '加一行',
        advancedJson: '高级：直接改 JSON',
        applyJson: '用 JSON 覆盖',
        emptyRows: '还没有记录',
        name: '名字',
        role: '身份',
        status: '状态',
        alive: '活着',
        dead: '已死',
        deathChapter: '死亡章',
        note: '备注',
        aliasCsv: '别名（逗号）',
        a: '一方',
        b: '另一方',
        type: '关系',
        since: '起于章',
        event: '事件',
        foreshadowId: '伏笔 id',
        setupChapter: '埋设章',
        desc: '内容',
        payoffChapter: '回收章',
        styleHint: '文风样本存原句，不存形容词。续写时只认这里的调子。',
        styleText: '原句（带标点，别改写）',
        styleNote: '备注（可选）',
        styleChapter: '章号',
        addStyle: '加一条样本',
        emptyStyle: '还没有文风样本',
        pageHint: '记忆文件都是明文；改歪了用 novel_check 体检。',
        bookId: '书 ID',
        dirtyConfirm: '有没保存的修改，切走会丢掉。继续？',
        deleteConfirm: '删掉这条？删了要重新贴一遍。',
        impressions: '途中的感想',
        impressionsHint: '读到有感觉的地方留一句：reader 写被击中的反应，author 写手法/结构。单章单通道最多 3 条，宁缺毋滥，写具体，别复述剧情。',
        impressionPart: '通道',
        impressionText: '感想（至少 6 个字，别复述剧情）',
        addImpression: '加一条感想',
        noImpressions: '还没有途中感想。',
        impressionCap: '本章这个通道已满 3 条',
        tier: '重要度',
        tierA: 'A 核心',
        tierB: 'B 常驻',
        tierC: 'C 龙套',
        tierHint: 'A 常驻（主角/主线）、B 一行（会再出现）、C 龙套（无伏笔的 NPC）；C 级死亡 20 章后可归档，只留墓碑。',
        archive: '归档',
        archiveConfirm: '归档后从事实表移出，只留墓碑，剧情仍可查。继续？',
        archived: '墓碑（已归档）',
        noArchived: '没有墓碑',
        restore: '还原',
        styleRecent: '文风参考窗口',
        styleRecentHint: '默认取已读的最后两章全文。续写前让 agent 用 novel_world kind=style action=get 读原文；锁上以后 AI 不得改动。',
        styleManual: '手动章号（留空=自动）',
        styleLock: '锁定：AI 不得改动',
        styleAutoMode: '自动（已读最后两章）',
        styleManualMode: '手动指定',
        stylePassages: '有感觉的整段',
        stylePassagesHint: '每条 3–7 句完整句子；整段摘抄，超出上限时从最旧的裁掉。',
        styleCap: '整段总字数上限',
        styleCapHint: '500–20000，默认 2000，随时可调',
        stylePassageChapter: '章号',
        stylePassageNote: '备注',
        stylePassageText: '整段原文（带标点，别改写）',
        addPassage: '加一段摘录',
        emptyPassage: '还没有整段摘录',
        styleLegacy: '旧的单句样本',
      },
      en: {
        tab: 'Novel Memory',
        open: 'Open txt',
        opening: 'Working…',
        openHint: 'Path to a txt file or folder, e.g. D:\\ai\\book',
        pick: 'Choose file…',
        pickAria: 'Choose a txt file',
        readingFile: 'Reading the file…',
        path: 'txt path',
        books: 'Books',
        noBooks: 'No book yet. Use Choose file… to pick a txt, paste a path above, or let the agent run novel_index action=open.',
        booksError: 'Could not read the shelf',
        retry: 'Retry',
        close: 'Close',
        refresh: 'Refresh',
        removeBook: 'Delete this book',
        removeBookConfirm: 'This permanently erases all memory of the book (source chapters, L1–L4, facts, style) from disk. Delete?',
        refreshing: 'Refreshing…',
        loading: 'Loading…',
        loadingBook: 'Reading',
        full: 'Full read',
        pipeline: 'Compressed pipeline',
        chapters: 'chapters',
        l1Tab: 'L1 chapters',
        l2Tab: 'L2 arcs',
        l3Tab: 'L3 impression',
        worldTab: 'L4 worldbook',
        factsTab: 'F facts',
        styleTab: 'V style',
        noteTab: 'Custom notes',
        noteHint: 'Tasks the owner assigns can live here: one section per task, the agent only appends entries, you edit the whole page. The agent will not read this unless asked, and it never enters the prompt.',
        noteEmpty: 'This page is empty. While reading, the agent appends entries by task; you can also write here directly.',
        noteCount: 'Characters',
        noteCapLabel: 'Limit length',
        noteCapOff: 'No limit (default)',
        noteCapHint: 'Unlimited by default; when on, both you and the agent are capped',
        edit: 'Edit',
        collapse: 'Collapse',
        save: 'Save',
        saving: 'Saving…',
        saved: 'Saved',
        cancel: 'Cancel',
        remove: 'Delete',
        confirmRemove: 'Delete?',
        add: 'Add',
        oneLine: 'Chapter summary (what happened in this chapter; 150 chars max)',
        marksLabel: 'Event marks',
        addMark: 'Add mark',
        markKind: 'Kind',
        markId: 'Setup id',
        markNote: 'Note',
        emptyL1: 'No chapter memo yet. Write them with novel_memo as you read, or add one below.',
        missingChapters: 'Chapters without a memo',
        addChapter: 'Add chapter',
        chapter: 'Chapter',
        arcRange: 'Range',
        arcTitle: 'Arc title',
        arcSummary: 'Arc summary (≤1200 chars)',
        addArc: 'Add arc',
        arcOverlap: 'Allow overlap',
        emptyL2: 'No arc yet. An arc is the compression unit (10–30 chapters).',
        arcGap: 'chapters unmapped',
        reader: 'Reader reaction',
        author: 'Author analysis',
        l3Hint: 'Keep reader reaction and author analysis apart; mixing them poisons both.',
        decisions: 'decisions log',
        decisionsHint: 'Append-only: write judgements here first, consolidate into L3 later.',
        worldLevel: 'Level',
        levelA: 'A (always on)',
        levelB: 'B (one line)',
        aliases: 'Aliases (、 separated)',
        chaptersField: 'Chapters (comma separated)',
        body: 'Body (loaded on demand)',
        worldOne: 'One-line summary',
        addWorld: 'Add worldbook card',
        tag: 'Tag',
        emptyWorld: 'Worldbook index is empty. Create cards only for settings that recur or matter.',
        factsHint: 'Facts never compress: only verifiable things.',
        characters: 'Characters (life / aliases / role)',
        relations: 'Relations',
        foreshadow: 'Foreshadowing',
        motif: 'Motif',
        addRow: 'Add row',
        advancedJson: 'Advanced: edit JSON',
        applyJson: 'Apply JSON',
        emptyRows: 'Nothing recorded',
        name: 'Name',
        role: 'Role',
        status: 'Status',
        alive: 'Alive',
        dead: 'Dead',
        deathChapter: 'Death chapter',
        note: 'Note',
        aliasCsv: 'Aliases (comma)',
        a: 'From',
        b: 'To',
        type: 'Type',
        since: 'Since chapter',
        event: 'Event',
        foreshadowId: 'Setup id',
        setupChapter: 'Setup chapter',
        desc: 'Description',
        payoffChapter: 'Payoff chapter',
        styleHint: 'Store original sentences, not adjectives.',
        styleText: 'Sentence (verbatim)',
        styleNote: 'Note (optional)',
        styleChapter: 'Chapter',
        addStyle: 'Add sample',
        emptyStyle: 'No style sample yet',
        pageHint: 'Memory files are plain text; run novel_check if something looks off.',
        bookId: 'Book ID',
        dirtyConfirm: 'Unsaved edits will be lost. Continue?',
        deleteConfirm: 'Delete this? You will have to re-paste it.',
        impressions: 'Impressions along the way',
        impressionsHint: 'Leave one when a scene lands: reader = your reaction, author = craft/structure. Max 3 per chapter per channel; be specific, do not retell the plot.',
        impressionPart: 'Channel',
        impressionText: 'Impression (≥6 chars, not a plot recap)',
        addImpression: 'Add impression',
        noImpressions: 'No impressions yet.',
        impressionCap: 'This channel already has 3 for this chapter',
        tier: 'Tier',
        tierA: 'A core',
        tierB: 'B recurring',
        tierC: 'C extra',
        tierHint: 'A always on, B one line, C extra (no payoff). A dead C card can be archived as a tombstone 20 chapters later.',
        archive: 'Archive',
        archiveConfirm: 'Archiving removes it from the fact table and keeps a tombstone. Continue?',
        archived: 'Tombstones',
        noArchived: 'No tombstones',
        restore: 'Restore',
        styleRecent: 'Style window',
        styleRecentHint: 'Defaults to the last two read chapters in full. Use novel_world kind=style action=get before continuing; a lock forbids AI changes.',
        styleManual: 'Manual chapters (empty = auto)',
        styleLock: 'Locked: AI may not change it',
        styleAutoMode: 'Auto (last two read)',
        styleManualMode: 'Manual',
        stylePassages: 'Passages worth keeping',
        stylePassagesHint: 'Each 3–7 full sentences; whole passages, oldest drop first when over the cap.',
        styleCap: 'Total char cap for passages',
        styleCapHint: '500–20000, default 2000, adjustable anytime',
        stylePassageChapter: 'Chapter',
        stylePassageNote: 'Note',
        stylePassageText: 'Passage (verbatim)',
        addPassage: 'Add passage',
        emptyPassage: 'No passages yet',
        styleLegacy: 'Legacy single-line samples',
      },
    }

    const CSS = `
.nm-page{display:flex;flex-direction:column;gap:12px;min-width:0;color:var(--dsw-alias-label-primary);font:inherit}
.nm-page .nm-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;min-width:0}
.nm-page .nm-title{margin:0;font-size:15px;font-weight:600;line-height:22px}
.nm-page .nm-chips{display:flex;gap:6px;flex-wrap:wrap}
.nm-page .nm-chip{display:inline-flex;align-items:center;gap:4px;padding:1px 8px;border:.5px solid var(--dsw-alias-border-l2);border-radius:999px;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:18px}
.nm-page .nm-chip-warn{border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-label-primary)}
.nm-page .nm-input,.nm-page .nm-select,.nm-page .nm-textarea{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:1.5}
.nm-page .nm-input,.nm-page .nm-select{height:34px;padding:0 10px}
.nm-page .nm-textarea{width:100%;min-height:96px;padding:8px 10px;resize:vertical;line-height:1.6}
.nm-page .nm-input:focus-visible,.nm-page .nm-select:focus-visible,.nm-page .nm-textarea:focus-visible,.nm-page .nm-btn:focus-visible,.nm-page .nm-btn-primary:focus-visible,.nm-page .nm-tab:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:1px}
.nm-page .nm-input:disabled,.nm-page .nm-select:disabled{opacity:.5}
.nm-page .nm-btn{appearance:none;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:18px;min-height:28px;padding:2px 10px;cursor:pointer}
.nm-page .nm-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.nm-page .nm-btn:disabled{opacity:.4;cursor:default}
.nm-page .nm-btn-danger:hover:not(:disabled){border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}
.nm-page .nm-btn-primary{appearance:none;border:1px solid transparent;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3);font:inherit;font-size:13px;line-height:1.5;padding:5px 14px;cursor:pointer}
.nm-page .nm-btn-primary:hover:not(:disabled){opacity:.88}
.nm-page .nm-btn-primary:disabled{opacity:.4;cursor:default}
.nm-page .nm-tabs{display:flex;gap:2px;flex-wrap:wrap;border-bottom:.5px solid var(--dsw-alias-border-l2)}
.nm-page .nm-tab{appearance:none;border:0;background:none;padding:8px 12px;font:inherit;font-size:13px;color:var(--dsw-alias-label-secondary);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;border-radius:var(--dsw-radius-sm) var(--dsw-radius-sm) 0 0}
.nm-page .nm-tab:hover{background:var(--dsw-alias-interactive-bg-hover)}
.nm-page .nm-tab[aria-selected=true]{color:var(--dsw-alias-label-primary);border-bottom-color:var(--dsw-alias-label-primary);font-weight:600}
.nm-page .nm-list{display:flex;flex-direction:column;gap:8px;min-width:0}
.nm-page .nm-card{border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-lg);padding:14px;display:flex;flex-direction:column;gap:8px;min-width:0}
.nm-page .nm-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-width:0}
.nm-page .nm-muted{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.6}
.nm-page .nm-secondary{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.6}
.nm-page .nm-body{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;line-height:1.7;padding:10px;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-interactive-bg-hover)}
.nm-page .nm-code{font-family:var(--ds-font-family-code,ui-monospace,Menlo,Consolas,monospace);font-size:12px}
.nm-page .nm-marks{display:flex;gap:6px;flex-wrap:wrap}
.nm-page .nm-mark{padding:1px 6px;border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary);font-size:11px;line-height:18px}
.nm-page .nm-empty{padding:24px;text-align:center;color:var(--dsw-alias-label-tertiary);font-size:13px;border:.5px dashed var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-lg)}
.nm-page .nm-error{color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:1.6}
.nm-page .nm-saved{color:var(--dsw-alias-state-business-primary);font-size:12px;line-height:1.6}
.nm-page .nm-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.nm-page .nm-grow{flex:1 1 auto;min-width:160px}
.nm-page .nm-book-picker{max-width:300px}
.nm-page .nm-grid2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}
.nm-page .nm-field{display:flex;flex-direction:column;gap:4px;min-width:140px}
.nm-page .nm-field-label{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}
.nm-page .nm-missing{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.nm-page .nm-missing .nm-btn{font-size:11px;min-height:24px;padding:0 8px}
@media(max-width:720px){.nm-page .nm-grid2{grid-template-columns:minmax(0,1fr)}}
`

    const MARK_KINDS = ['turn', 'foreshadow', 'payoff', 'motif', 'enter', 'exit', 'relation', 'lore']

    // Unsaved draft keys ("l1:12", "l3:reader", …). Switching books must not silently drop them.
    const dirtyKeys = new Set()
    const markDirty = key => { dirtyKeys.add(key) }
    const clearDirty = key => { dirtyKeys.delete(key) }
    const hasDirty = () => dirtyKeys.size > 0
    const clearDirtyAll = () => { dirtyKeys.clear() }

    function unwrap(value) {
      // Remote methods resolve `{ ok: false, error }` instead of throwing; surface that
      // as a real error so a failed call cannot masquerade as an empty shelf.
      if (value && typeof value === 'object' && value.ok === false) {
        const failure = value.error
        const message = failure && failure.message ? failure.message : '调用失败'
        throw new Error(failure && failure.code ? `${failure.code}: ${message}` : message)
      }
      if (value && typeof value === 'object' && !Array.isArray(value) && 'value' in value && value.value !== undefined) return value.value
      return value
    }

    function messageOf(error) {
      return error instanceof Error ? error.message : String(error)
    }

    function fmtChars(chars) {
      if (!chars) return '0'
      return chars < 1000 ? `${chars}` : `${(chars / 1000).toFixed(1)}k`
    }

    function parseCsv(value) {
      return String(value || '').split(/[、,，\s]+/).map(s => s.trim()).filter(Boolean)
    }

    function parseChapterList(value) {
      return parseCsv(value).map(Number).filter(n => Number.isInteger(n) && n > 0)
    }

    function useFlash() {
      const [flash, setFlash] = useState(false)
      const timer = useRef(null)
      const fire = useCallback(() => {
        setFlash(true)
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => setFlash(false), 1800)
      }, [])
      useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
      return [flash, fire]
    }

    function Chip({ warn, children }) {
      return h('span', { className: warn ? 'nm-chip nm-chip-warn' : 'nm-chip' }, children)
    }

    function Empty({ children }) { return h('div', { className: 'nm-empty' }, children) }

    function Notice({ tone, children, onDismiss, closeLabel }) {
      if (!children) return null
      return h('div', {
        className: tone === 'error' ? 'nm-error' : 'nm-saved',
        role: tone === 'error' ? 'alert' : 'status',
        style: { display: 'flex', alignItems: 'center', gap: 8 },
      }, h('span', { className: 'nm-grow' }, children), onDismiss ? h('button', { type: 'button', className: 'nm-btn', onClick: onDismiss, 'aria-label': closeLabel }, '×') : null)
    }

    function Field({ label, children }) {
      return h('label', { className: 'nm-field' },
        h('span', { className: 'nm-field-label' }, label),
        children,
      )
    }

    function SaveBar({ t, busy, flash, onSave, onCancel, disabled }) {
      return h('div', { className: 'nm-actions' },
        h('button', { type: 'button', className: 'nm-btn-primary', disabled: busy || disabled, onClick: onSave, 'aria-busy': busy }, busy ? t('saving') : t('save')),
        onCancel ? h('button', { type: 'button', className: 'nm-btn', onClick: onCancel }, t('collapse')) : null,
        flash ? h('span', { className: 'nm-saved', role: 'status' }, t('saved')) : null,
      )
    }

    function MarkEditor({ t, marks, onChange }) {
      const rows = marks || []
      const update = (index, patch) => onChange(rows.map((row, i) => i === index ? { ...row, ...patch } : row))
      return h('div', { className: 'nm-list' },
        h('span', { className: 'nm-field-label' }, `${t('marksLabel')}：${rows.length}`),
        rows.map((mark, index) => h('div', { className: 'nm-row', key: index },
          h('select', {
            className: 'nm-select', value: mark.k || 'turn', 'aria-label': t('markKind'),
            onChange: event => update(index, { k: event.target.value }),
          }, MARK_KINDS.map(kind => h('option', { key: kind, value: kind }, kind))),
          h('input', {
            className: 'nm-input nm-code', style: { width: 96 }, value: mark.id || '', placeholder: t('markId'), 'aria-label': t('markId'),
            onChange: event => update(index, { id: event.target.value }),
          }),
          h('input', {
            className: 'nm-input nm-grow', value: mark.note || '', placeholder: t('markNote'), 'aria-label': t('markNote'),
            onChange: event => update(index, { note: event.target.value }),
          }),
          h('button', { type: 'button', className: 'nm-btn nm-btn-danger', onClick: () => onChange(rows.filter((_, i) => i !== index)), 'aria-label': t('remove') }, '×'),
        )),
        h('div', null, h('button', { type: 'button', className: 'nm-btn', onClick: () => onChange([...rows, { k: 'turn', id: '', note: '' }]) }, `+ ${t('addMark')}`)),
      )
    }

    function L1Row({ t, row, onSave }) {
      const [open, setOpen] = useState(false)
      const [one, setOne] = useState(row.one)
      const [marks, setMarks] = useState(row.marks || [])
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState('')
      const [flash, fire] = useFlash()
      const editRef = useRef(null)

      useEffect(() => {
        if (open) return
        setOne(row.one)
        setMarks(row.marks || [])
      }, [open, row.one, row.marks])

      async function commit() {
        const cleaned = marks.map(m => ({ k: m.k, ...(m.id ? { id: m.id } : {}), ...(m.note ? { note: m.note } : {}) }))
        if (!one.trim() && !cleaned.length && !window.confirm(t('deleteConfirm'))) return
        setBusy(true)
        setError('')
        try {
          await onSave(`l1:${row.n}`, { one, marks: cleaned })
          clearDirty(`l1:${row.n}`)
          fire()
          setOpen(false)
          if (editRef.current) editRef.current.focus()
        } catch (cause) { setError(messageOf(cause)) }
        finally { setBusy(false) }
      }

      return h('div', { className: 'nm-card' },
        h('div', { className: 'nm-row' },
          h('span', { className: 'nm-secondary' }, `[ch${row.n}]`),
          h('span', { className: 'nm-muted nm-grow' }, row.title),
          h('span', { className: 'nm-grow', style: { fontSize: 13 } }, row.one || '—'),
          h('button', {
            ref: editRef, type: 'button', className: 'nm-btn',
            onClick: () => { if (!open) clearDirty(`l1:${row.n}`); setOpen(!open) },
            'aria-expanded': open, 'aria-controls': `nm-l1-${row.n}`,
          }, open ? t('collapse') : t('edit')),
        ),
        !open && (row.marks || []).length
          ? h('div', { className: 'nm-marks' }, row.marks.map((mark, i) => h('span', { className: 'nm-mark', key: i }, `${mark.k}${mark.id ? ` ${mark.id}` : ''}${mark.note ? `：${mark.note}` : ''}`)))
          : null,
        open ? h('div', { className: 'nm-list', id: `nm-l1-${row.n}` },
          h(Field, { label: `${t('oneLine')}（${one.length}/150）` },
            h('textarea', {
              className: 'nm-textarea', value: one, maxLength: 200, rows: 2,
              onChange: event => { setOne(event.target.value); markDirty(`l1:${row.n}`) },
            }),
          ),
          h(MarkEditor, {
            t,
            marks,
            onChange: next => { setMarks(next); markDirty(`l1:${row.n}`) },
          }),
          h(Notice, { tone: 'error', children: error, onDismiss: () => setError(''), closeLabel: t('close') }),
          h(SaveBar, { t, busy, flash, onSave: commit, onCancel: () => setOpen(false) }),
        ) : null,
      )
    }

    function L1Add({ t, missing, onSave }) {
      const [chapter, setChapter] = useState('')
      const [one, setOne] = useState('')
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState('')
      const [flash, fire] = useFlash()

      useEffect(() => {
        if (chapter && !missing.includes(Number(chapter))) setChapter('')
      }, [missing, chapter])

      if (!missing.length) return null

      async function commit() {
        const n = Number(chapter)
        if (!Number.isInteger(n) || n < 1) { setError('先选一章'); return }
        if (!one.trim()) { setError('至少写一行摘要'); return }
        setBusy(true)
        setError('')
        try {
          await onSave(`l1:${n}`, { one, marks: [] })
          clearDirty('l1:new')
          fire()
          setOne('')
          setChapter('')
        } catch (cause) { setError(messageOf(cause)) } finally { setBusy(false) }
      }

      return h('div', { className: 'nm-card' },
        h('strong', { className: 'nm-secondary' }, `${t('addChapter')}（未写 ${missing.length} 章）`),
        h('div', { className: 'nm-actions' },
          h('select', { className: 'nm-select', value: chapter, onChange: event => { setChapter(event.target.value); markDirty('l1:new') }, 'aria-label': t('chapter') },
            h('option', { value: '' }, t('chapter')),
            missing.slice(0, 200).map(n => h('option', { key: n, value: String(n) }, `ch${n}`)),
          ),
          h('input', {
            className: 'nm-input nm-grow', value: one, maxLength: 150, placeholder: t('oneLine'), 'aria-label': t('oneLine'),
            onChange: event => { setOne(event.target.value); markDirty('l1:new') },
          }),
          h('button', { type: 'button', className: 'nm-btn-primary', disabled: busy, onClick: commit }, busy ? t('saving') : t('save')),
          flash ? h('span', { className: 'nm-saved' }, t('saved')) : null,
        ),
        h(Notice, { tone: 'error', children: error, onDismiss: () => setError(''), closeLabel: t('close') }),
      )
    }

    function ArcRow({ t, arc, onSave }) {
      const [open, setOpen] = useState(false)
      const [title, setTitle] = useState(arc.title || '')
      const [summary, setSummary] = useState(arc.summary || '')
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState('')
      const [flash, fire] = useFlash()

      useEffect(() => {
        if (open) return
        setTitle(arc.title || '')
        setSummary(arc.summary || '')
      }, [open, arc.title, arc.summary])

      async function commit() {
        setBusy(true)
        setError('')
        try { await onSave(`l2:${arc.id}`, { title, summary }); clearDirty(`l2:${arc.id}`); fire(); setOpen(false) }
        catch (cause) { setError(messageOf(cause)) } finally { setBusy(false) }
      }

      return h('div', { className: 'nm-card' },
        h('div', { className: 'nm-row' },
          h(Chip, null, `第 ${arc.from}-${arc.to} 章`),
          h('strong', { className: 'nm-secondary' }, arc.title || '（未命名弧）'),
          h('span', { className: 'nm-grow' }),
          h('button', {
            type: 'button', className: 'nm-btn',
            onClick: () => { if (!open) clearDirty(`l2:${arc.id}`); setOpen(!open) },
            'aria-expanded': open, 'aria-controls': `nm-arc-${arc.id}`,
          }, open ? t('collapse') : t('edit')),
        ),
        open
          ? h('div', { className: 'nm-list', id: `nm-arc-${arc.id}` },
            h(Field, { label: t('arcTitle') }, h('input', {
              className: 'nm-input', value: title, maxLength: 80,
              onChange: event => { setTitle(event.target.value); markDirty(`l2:${arc.id}`) },
            })),
            h(Field, { label: `${t('arcSummary')}（${summary.length}/1200）` },
              h('textarea', {
                className: 'nm-textarea', rows: 8, value: summary, maxLength: 1200,
                onChange: event => { setSummary(event.target.value); markDirty(`l2:${arc.id}`) },
              }),
            ),
            h(Notice, { tone: 'error', children: error, onDismiss: () => setError(''), closeLabel: t('close') }),
            h(SaveBar, { t, busy, flash, onSave: commit, onCancel: () => setOpen(false) }),
          )
          : h('div', { className: 'nm-secondary' }, arc.summary || '—'),
      )
    }

    function ArcAdd({ t, chaptersCount, onSave }) {
      const [open, setOpen] = useState(false)
      const [form, setForm] = useState({ from: '', to: '', title: '', summary: '', force: false })
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState('')

      if (!open) return h('div', null, h('button', { type: 'button', className: 'nm-btn', onClick: () => setOpen(true) }, `+ ${t('addArc')}`))

      const edit = patch => { setForm({ ...form, ...patch }); markDirty('l2:new') }

      async function commit() {
        setBusy(true)
        setError('')
        try {
          await onSave('l2:new', { from: Number(form.from), to: Number(form.to), title: form.title, summary: form.summary, force: form.force })
          clearDirty('l2:new')
          setOpen(false)
          setForm({ from: '', to: '', title: '', summary: '', force: false })
        } catch (cause) { setError(messageOf(cause)) } finally { setBusy(false) }
      }

      return h('div', { className: 'nm-card' },
        h('strong', { className: 'nm-secondary' }, t('addArc')),
        h('div', { className: 'nm-actions' },
          h(Field, { label: t('chapter') }, h('input', { className: 'nm-input', style: { width: 90 }, value: form.from, placeholder: `1-${chaptersCount}`, onChange: event => edit({ from: event.target.value }) })),
          h(Field, { label: '→' }, h('input', { className: 'nm-input', style: { width: 90 }, value: form.to, placeholder: `1-${chaptersCount}`, onChange: event => edit({ to: event.target.value }) })),
          h(Field, { label: t('arcTitle') }, h('input', { className: 'nm-input', value: form.title, onChange: event => edit({ title: event.target.value }) })),
          h('label', { className: 'nm-row nm-muted' }, h('input', { type: 'checkbox', checked: form.force, onChange: event => edit({ force: event.target.checked }) }), t('arcOverlap')),
        ),
        h('textarea', { className: 'nm-textarea', rows: 3, placeholder: t('arcSummary'), value: form.summary, maxLength: 1200, onChange: event => edit({ summary: event.target.value }) }),
        h(Notice, { tone: 'error', children: error, onDismiss: () => setError(''), closeLabel: t('close') }),
        h('div', { className: 'nm-actions' },
          h('button', { type: 'button', className: 'nm-btn-primary', disabled: busy, onClick: commit }, busy ? t('saving') : t('save')),
          h('button', { type: 'button', className: 'nm-btn', onClick: () => { clearDirty('l2:new'); setOpen(false); setError('') } }, t('cancel')),
        ),
      )
    }

    function L3Pane({ t, snap, onSave }) {
      const [reader, setReader] = useState(snap.l3.reader)
      const [author, setAuthor] = useState(snap.l3.author)
      const [dirty, setDirty] = useState({ reader: false, author: false })
      const [saving, setSaving] = useState('')
      const [error, setError] = useState('')
      const [flash, fire] = useFlash()
      const impressions = snap.impressions || []
      const [impForm, setImpForm] = useState({ chapter: '', part: 'reader', text: '' })
      const [impBusy, setImpBusy] = useState(false)
      const [impError, setImpError] = useState('')
      const [impFlash, fireImp] = useFlash()
      const [dropping, setDropping] = useState('')

      useEffect(() => {
        if (!dirty.reader) setReader(snap.l3.reader)
        if (!dirty.author) setAuthor(snap.l3.author)
      }, [snap.l3.reader, snap.l3.author, dirty.reader, dirty.author])

      async function commit(part) {
        setSaving(part)
        setError('')
        try {
          await onSave(`l3:${part}`, part === 'reader' ? reader : author)
          setDirty({ ...dirty, [part]: false })
          clearDirty(`l3:${part}`)
          fire()
        } catch (cause) { setError(messageOf(cause)) } finally { setSaving('') }
      }

      function pane(part, label, value, setValue) {
        return h('div', { className: 'nm-card' },
          h('strong', { className: 'nm-secondary' }, label),
          h('textarea', {
            className: 'nm-textarea', rows: 12, value,
            onChange: event => { setValue(event.target.value); setDirty({ ...dirty, [part]: true }); markDirty(`l3:${part}`) },
          }),
          h(SaveBar, { t, busy: saving === part, flash, onSave: () => commit(part), disabled: !dirty[part] }),
        )
      }

      const filled = impressions.filter(row => row.chapter === Number(impForm.chapter) && row.part === impForm.part).length

      function editImp(patch) { setImpForm({ ...impForm, ...patch }); markDirty('impression') }

      async function addImpression() {
        const chapter = Number(impForm.chapter)
        if (!Number.isInteger(chapter) || chapter < 1) { setImpError(t('chapter')); return }
        if (impForm.text.trim().length < 6) { setImpError(t('impressionText')); return }
        if (filled >= 3) { setImpError(t('impressionCap')); return }
        setImpBusy(true)
        setImpError('')
        try {
          await onSave('impression:add', { chapter, part: impForm.part, text: impForm.text.trim() })
          clearDirty('impression')
          setImpForm({ ...impForm, text: '' })
          fireImp()
        } catch (cause) { setImpError(messageOf(cause)) } finally { setImpBusy(false) }
      }

      async function dropImpression(id) {
        setImpBusy(true)
        setImpError('')
        try { await onSave('impression:remove', { id }); setDropping('') }
        catch (cause) { setImpError(messageOf(cause)) } finally { setImpBusy(false) }
      }

      return h('div', { className: 'nm-list' },
        h('div', { className: 'nm-muted' }, t('l3Hint')),
        h('div', { className: 'nm-grid2' },
          pane('reader', t('reader'), reader, setReader),
          pane('author', t('author'), author, setAuthor),
        ),
        h('div', { className: 'nm-card' },
          h('div', { className: 'nm-row' },
            h('strong', { className: 'nm-secondary' }, `${t('impressions')}（${impressions.length}）`),
            h('span', { className: 'nm-grow' }),
            impFlash ? h('span', { className: 'nm-saved', role: 'status' }, t('saved')) : null,
          ),
          h('div', { className: 'nm-muted' }, t('impressionsHint')),
          impressions.length === 0 ? h(Empty, null, t('noImpressions')) : null,
          h('div', { className: 'nm-list' }, impressions.map(row => h('div', { className: 'nm-card', key: row.id },
            h('div', { className: 'nm-row' },
              h(Chip, null, `[ch${row.chapter}]`),
              h(Chip, null, t(row.part === 'author' ? 'author' : 'reader')),
              h('span', { className: 'nm-grow', style: { fontSize: 13 } }, row.text),
              dropping === row.id
                ? h('button', { type: 'button', className: 'nm-btn nm-btn-danger', disabled: impBusy, onClick: () => dropImpression(row.id) }, t('confirmRemove'))
                : h('button', { type: 'button', className: 'nm-btn', onClick: () => setDropping(row.id) }, t('remove')),
            ),
          ))),
          h('div', { className: 'nm-actions' },
            h(Field, { label: t('chapter') }, h('input', { className: 'nm-input', style: { width: 90 }, inputMode: 'numeric', value: impForm.chapter, onChange: event => editImp({ chapter: event.target.value }) })),
            h(Field, { label: t('impressionPart') }, h('select', { className: 'nm-select', value: impForm.part, onChange: event => editImp({ part: event.target.value }) },
              h('option', { value: 'reader' }, t('reader')),
              h('option', { value: 'author' }, t('author')))),
            h('span', { className: 'nm-muted' }, filled >= 3 ? t('impressionCap') : `${filled}/3`),
          ),
          h(Field, { label: t('impressionText') }, h('textarea', { className: 'nm-textarea', rows: 3, maxLength: 300, value: impForm.text, onChange: event => editImp({ text: event.target.value }) })),
          h(Notice, { tone: 'error', children: impError, onDismiss: () => setImpError(''), closeLabel: t('close') }),
          h('div', { className: 'nm-actions' },
            h('button', { type: 'button', className: 'nm-btn-primary', disabled: impBusy || filled >= 3, onClick: addImpression }, impBusy ? t('saving') : t('addImpression')),
          ),
        ),
        h(Notice, { tone: 'error', children: error, onDismiss: () => setError(''), closeLabel: t('close') }),
        snap.decisions.length
          ? h('div', { className: 'nm-card' },
            h('strong', { className: 'nm-secondary' }, t('decisions')),
            h('div', { className: 'nm-muted' }, t('decisionsHint')),
            h('div', { className: 'nm-list' }, snap.decisions.slice().reverse().map((entry, i) => h('div', { className: 'nm-muted', key: i }, `${String(entry.at || '').slice(0, 16)}　[${entry.kind || 'note'}] ${entry.text}`))),
          )
          : null,
      )
    }

    function WorldRow({ t, entry, onSave }) {
      const [open, setOpen] = useState(false)
      const [level, setLevel] = useState(entry.level || 'B')
      const [one, setOne] = useState(entry.one || '')
      const [aliases, setAliases] = useState((entry.aliases || []).join('、'))
      const [chapters, setChapters] = useState((entry.chapters || []).join(','))
      const [body, setBody] = useState(entry.body || '')
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState('')
      const [flash, fire] = useFlash()

      useEffect(() => {
        if (open) return
        setLevel(entry.level || 'B')
        setOne(entry.one || '')
        setAliases((entry.aliases || []).join('、'))
        setChapters((entry.chapters || []).join(','))
        setBody(entry.body || '')
      }, [open, entry])

      const touch = () => markDirty(`world:${entry.tag}`)

      async function commit() {
        setBusy(true)
        setError('')
        try {
          await onSave(`world:${entry.tag}`, { level, one, aliases: parseCsv(aliases), chapters: parseChapterList(chapters), body })
          clearDirty(`world:${entry.tag}`)
          fire()
          setOpen(false)
        } catch (cause) { setError(messageOf(cause)) } finally { setBusy(false) }
      }

      return h('div', { className: 'nm-card' },
        h('div', { className: 'nm-row' },
          h(Chip, null, entry.level === 'A' ? t('levelA') : t('levelB')),
          h('strong', { className: 'nm-secondary' }, entry.tag),
          h('span', { className: 'nm-grow', style: { fontSize: 13 } }, entry.one || '—'),
          h('button', {
            type: 'button', className: 'nm-btn',
            onClick: () => { if (!open) clearDirty(`world:${entry.tag}`); setOpen(!open) },
            'aria-expanded': open, 'aria-controls': `nm-world-${entry.tag}`,
          }, open ? t('collapse') : t('edit')),
        ),
        !open && (entry.aliases || []).length ? h('div', { className: 'nm-muted' }, `${t('aliases')}：${entry.aliases.join('、')}`) : null,
        !open && (entry.chapters || []).length ? h('div', { className: 'nm-muted' }, `[ch${entry.chapters.join(', ch')}]`) : null,
        open ? h('div', { className: 'nm-list', id: `nm-world-${entry.tag}` },
          h(Field, { label: t('worldLevel') }, h('select', { className: 'nm-select', value: level, onChange: event => { setLevel(event.target.value); touch() } },
            h('option', { value: 'A' }, t('levelA')), h('option', { value: 'B' }, t('levelB')))),
          h(Field, { label: `${t('worldOne')}（${one.length}/200）` }, h('input', { className: 'nm-input', value: one, maxLength: 200, onChange: event => { setOne(event.target.value); touch() } })),
          h(Field, { label: t('aliases') }, h('input', { className: 'nm-input', value: aliases, onChange: event => { setAliases(event.target.value); touch() } })),
          h(Field, { label: t('chaptersField') }, h('input', { className: 'nm-input', value: chapters, onChange: event => { setChapters(event.target.value); touch() } })),
          h(Field, { label: t('body') }, h('textarea', { className: 'nm-textarea', rows: 10, value: body, onChange: event => { setBody(event.target.value); touch() } })),
          h(Notice, { tone: 'error', children: error, onDismiss: () => setError(''), closeLabel: t('close') }),
          h(SaveBar, { t, busy, flash, onSave: commit, onCancel: () => setOpen(false) }),
        ) : null,
      )
    }

    function WorldAdd({ t, onSave }) {
      const [open, setOpen] = useState(false)
      const [form, setForm] = useState({ tag: '', one: '', level: 'B', aliases: '', chapters: '', body: '' })
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState('')

      if (!open) return h('div', null, h('button', { type: 'button', className: 'nm-btn', onClick: () => setOpen(true) }, `+ ${t('addWorld')}`))

      const edit = patch => { setForm({ ...form, ...patch }); markDirty('world:new') }

      async function commit() {
        if (!form.tag.trim()) { setError(t('tag')); return }
        setBusy(true)
        setError('')
        try {
          await onSave(`world:${form.tag.trim()}`, { level: form.level, one: form.one, aliases: parseCsv(form.aliases), chapters: parseChapterList(form.chapters), body: form.body })
          clearDirty('world:new')
          setOpen(false)
          setForm({ tag: '', one: '', level: 'B', aliases: '', chapters: '', body: '' })
        } catch (cause) { setError(messageOf(cause)) } finally { setBusy(false) }
      }

      return h('div', { className: 'nm-card' },
        h('strong', { className: 'nm-secondary' }, t('addWorld')),
        h('div', { className: 'nm-actions' },
          h(Field, { label: t('tag') }, h('input', { className: 'nm-input', value: form.tag, onChange: event => edit({ tag: event.target.value }) })),
          h(Field, { label: t('worldLevel') }, h('select', { className: 'nm-select', value: form.level, onChange: event => edit({ level: event.target.value }) },
            h('option', { value: 'A' }, t('levelA')), h('option', { value: 'B' }, t('levelB')))),
        ),
        h(Field, { label: t('worldOne') }, h('input', { className: 'nm-input', value: form.one, maxLength: 200, onChange: event => edit({ one: event.target.value }) })),
        h(Field, { label: t('aliases') }, h('input', { className: 'nm-input', value: form.aliases, onChange: event => edit({ aliases: event.target.value }) })),
        h(Field, { label: t('chaptersField') }, h('input', { className: 'nm-input', value: form.chapters, onChange: event => edit({ chapters: event.target.value }) })),
        h(Field, { label: t('body') }, h('textarea', { className: 'nm-textarea', rows: 6, value: form.body, onChange: event => edit({ body: event.target.value }) })),
        h(Notice, { tone: 'error', children: error, onDismiss: () => setError(''), closeLabel: t('close') }),
        h('div', { className: 'nm-actions' },
          h('button', { type: 'button', className: 'nm-btn-primary', disabled: busy, onClick: commit }, busy ? t('saving') : t('save')),
          h('button', { type: 'button', className: 'nm-btn', onClick: () => { clearDirty('world:new'); setOpen(false); setError('') } }, t('cancel')),
        ),
      )
    }

    const TIER_OPTIONS = [['A', 'tierA'], ['B', 'tierB'], ['C', 'tierC']]

    const FACT_SECTIONS = [
      { key: 'characters', label: 'characters', fields: [
        { key: 'name', label: 'name', kind: 'text' },
        { key: 'aliases', label: 'aliasCsv', kind: 'list' },
        { key: 'role', label: 'role', kind: 'text' },
        { key: 'tier', label: 'tier', kind: 'select', options: TIER_OPTIONS, fallback: 'B' },
        { key: 'status', label: 'status', kind: 'select', options: [['alive', 'alive'], ['dead', 'dead']] },
        { key: 'deathChapter', label: 'deathChapter', kind: 'number' },
        { key: 'note', label: 'note', kind: 'text' },
      ] },
      { key: 'relations', label: 'relations', fields: [
        { key: 'a', label: 'a', kind: 'text' },
        { key: 'b', label: 'b', kind: 'text' },
        { key: 'type', label: 'type', kind: 'text' },
        { key: 'since', label: 'since', kind: 'number' },
        { key: 'note', label: 'note', kind: 'text' },
      ] },
      { key: 'foreshadow', label: 'foreshadow', fields: [
        { key: 'id', label: 'foreshadowId', kind: 'text' },
        { key: 'setupChapter', label: 'setupChapter', kind: 'number' },
        { key: 'desc', label: 'desc', kind: 'text' },
        { key: 'payoffChapter', label: 'payoffChapter', kind: 'number' },
      ] },
    ]

    function FactRow({ t, section, row, onChange, onRemove, onArchive, archiveDisabled }) {
      const canArchive = section.key === 'characters' && row.status === 'dead' && Boolean(row.name) && Boolean(onArchive)
      return h('div', { className: 'nm-card' },
        h('div', { className: 'nm-row' },
          section.fields.map(field => h(Field, { label: t(field.label), key: field.key },
            field.kind === 'select'
              ? h('select', {
                className: 'nm-select',
                value: row[field.key] || field.fallback || field.options[0][0],
                onChange: event => onChange({ ...row, [field.key]: event.target.value }),
              }, field.options.map(([value, label]) => h('option', { key: value, value }, t(label))))
              : h('input', {
                className: 'nm-input',
                style: { width: field.kind === 'number' ? 90 : 150 },
                inputMode: field.kind === 'number' ? 'numeric' : undefined,
                value: field.kind === 'list' ? (row[field.key] || []).join('、') : (row[field.key] ?? ''),
                onChange: event => onChange({ ...row, [field.key]: field.kind === 'number' ? (event.target.value === '' ? undefined : Number(event.target.value)) : field.kind === 'list' ? parseCsv(event.target.value) : event.target.value }),
              }),
          )),
          canArchive
            ? h('button', {
              type: 'button', className: 'nm-btn', disabled: archiveDisabled,
              onClick: () => { if (window.confirm(t('archiveConfirm'))) onArchive(row.name) },
            }, t('archive'))
            : null,
          h('button', { type: 'button', className: 'nm-btn nm-btn-danger', onClick: onRemove }, t('remove')),
        ),
      )
    }

    function FactSection({ t, section, rows, onSave, onArchive }) {
      const [draft, setDraft] = useState(rows)
      const [dirty, setDirty] = useState(false)
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState('')
      const [flash, fire] = useFlash()
      const [jsonOpen, setJsonOpen] = useState(false)
      const [jsonText, setJsonText] = useState('')

      useEffect(() => {
        if (!dirty) setDraft(rows)
      }, [rows, dirty])

      function change(next) { setDraft(next); setDirty(true); markDirty(`facts:${section.key}`) }

      async function commit() {
        setBusy(true)
        setError('')
        try {
          const cleaned = draft.map(row => Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined && value !== '')))
          await onSave(`facts:${section.key}`, cleaned)
          setDirty(false)
          clearDirty(`facts:${section.key}`)
          fire()
        } catch (cause) { setError(messageOf(cause)) } finally { setBusy(false) }
      }

      return h('div', { className: 'nm-card' },
        h('div', { className: 'nm-row' },
          h('strong', { className: 'nm-secondary' }, t(section.label)),
          h('span', { className: 'nm-muted' }, `${draft.length}`),
          h('span', { className: 'nm-grow' }),
          h('button', { type: 'button', className: 'nm-btn', onClick: () => change([...draft, {}]) }, `+ ${t('addRow')}`),
          h('button', { type: 'button', className: 'nm-btn-primary', disabled: busy || !dirty, onClick: commit }, busy ? t('saving') : t('save')),
          flash ? h('span', { className: 'nm-saved' }, t('saved')) : null,
        ),
        draft.length === 0 ? h('div', { className: 'nm-muted' }, t('emptyRows')) : null,
        h('div', { className: 'nm-list' }, draft.map((row, index) => h(FactRow, {
          key: index, t, section, row,
          onChange: next => change(draft.map((item, i) => i === index ? next : item)),
          onRemove: () => change(draft.filter((_, i) => i !== index)),
          onArchive,
          archiveDisabled: dirty || busy,
        }))),
        h('details', {
          style: { fontSize: 12 },
          onToggle: event => {
            if (event.target.open) setJsonText(JSON.stringify(draft, null, 2))
            setJsonOpen(event.target.open)
          },
        },
          h('summary', { className: 'nm-muted', style: { cursor: 'pointer' } }, t('advancedJson')),
          jsonOpen ? h('div', { className: 'nm-list', style: { marginTop: 8 } },
            h('textarea', { className: 'nm-textarea nm-code', rows: 8, value: jsonText, onChange: event => setJsonText(event.target.value) }),
            h('button', {
              type: 'button', className: 'nm-btn',
              onClick: () => {
                try {
                  const parsed = JSON.parse(jsonText)
                  if (!Array.isArray(parsed)) throw new Error('要是一个数组')
                  change(parsed)
                  setError('')
                } catch (cause) { setError(messageOf(cause)) }
              },
            }, t('applyJson')),
          ) : null,
        ),
        h(Notice, { tone: 'error', children: error, onDismiss: () => setError(''), closeLabel: t('close') }),
      )
    }

    function FactsPane({ t, snap, onSave }) {
      const archived = (snap.facts && snap.facts.archive) || []
      const [busy, setBusy] = useState('')
      const [error, setError] = useState('')

      async function restore(name) {
        setBusy(name)
        setError('')
        try { await onSave('facts:restore', { name }) }
        catch (cause) { setError(messageOf(cause)) } finally { setBusy('') }
      }

      async function archive(name) {
        setError('')
        try { await onSave('facts:archive', { name }) }
        catch (cause) { setError(messageOf(cause)) }
      }

      return h('div', { className: 'nm-list' },
        h('div', { className: 'nm-muted' }, t('factsHint')),
        h('div', { className: 'nm-muted' }, t('tierHint')),
        FACT_SECTIONS.map(section => h(FactSection, {
          key: section.key,
          t,
          section,
          rows: snap.facts[section.key] || [],
          onSave,
          onArchive: section.key === 'characters' ? archive : null,
        })),
        h('div', { className: 'nm-card' },
          h('strong', { className: 'nm-secondary' }, `${t('archived')}（${archived.length}）`),
          archived.length === 0 ? h('div', { className: 'nm-muted' }, t('noArchived')) : null,
          h('div', { className: 'nm-list' }, archived.map(entry => h('div', { className: 'nm-row', key: entry.name },
            h('span', { className: 'nm-grow', style: { fontSize: 13 } }, `${entry.name}${entry.tier ? ` · ${entry.tier}` : ''}${entry.deathChapter ? ` · 第${entry.deathChapter}章死` : ''}${entry.role ? ` · ${entry.role}` : ''}`),
            h('button', { type: 'button', className: 'nm-btn', disabled: busy === entry.name, onClick: () => restore(entry.name) }, t('restore')),
          ))),
          h(Notice, { tone: 'error', children: error, onDismiss: () => setError(''), closeLabel: t('close') }),
        ),
      )
    }

    function StylePane({ t, snap, onSave }) {
      const style = snap.style || {}
      const recent = style.recent || { chapters: [], locked: false, manual: false, preview: [] }
      const preview = recent.preview || []
      const passages = style.passages || []
      const samples = style.samples || []
      const cap = Number(style.cap) || 2000
      const [capDraft, setCapDraft] = useState(String(cap))
      const [capBusy, setCapBusy] = useState(false)
      const [capError, setCapError] = useState('')
      const [manual, setManual] = useState((recent.manual ? recent.chapters : []).join(','))
      const [locked, setLocked] = useState(Boolean(recent.locked))
      const [winBusy, setWinBusy] = useState(false)
      const [winError, setWinError] = useState('')
      const [winFlash, fireWin] = useFlash()
      const [form, setForm] = useState({ chapter: '', text: '', note: '' })
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState('')
      const [flash, fire] = useFlash()
      const [confirming, setConfirming] = useState(-1)

      useEffect(() => {
        setManual((recent.manual ? recent.chapters : []).join(','))
        setLocked(Boolean(recent.locked))
      }, [recent.chapters.join(','), recent.manual, recent.locked])

      useEffect(() => {
        setCapDraft(String(Number(style.cap) || 2000))
      }, [style.cap])

      const passageChars = passages.reduce((sum, row) => sum + String(row.text || '').length, 0)

      function editWin(patch) {
        if (patch.manual !== undefined) setManual(patch.manual)
        if (patch.locked !== undefined) setLocked(patch.locked)
        markDirty('style:window')
      }

      async function saveWindow() {
        setWinBusy(true)
        setWinError('')
        try {
          await onSave('style:recent', { chapters: parseChapterList(manual), locked })
          clearDirty('style:window')
          fireWin()
        } catch (cause) { setWinError(messageOf(cause)) } finally { setWinBusy(false) }
      }

      async function addPassage() {
        if (!form.text.trim()) { setError(t('stylePassageText')); return }
        setBusy(true)
        setError('')
        try {
          await onSave('style:passage-add', { chapter: Number(form.chapter) || null, text: form.text.trim(), note: form.note.trim() })
          clearDirty('style')
          setForm({ chapter: '', text: '', note: '' })
          fire()
        } catch (cause) { setError(messageOf(cause)) } finally { setBusy(false) }
      }

      async function removePassage(index) {
        setBusy(true)
        setError('')
        try { await onSave('style:passage-remove', { index }); setConfirming(-1) }
        catch (cause) { setError(messageOf(cause)) } finally { setBusy(false) }
      }

      async function removeSample(index) {
        setBusy(true)
        setError('')
        try { await onSave('style:remove', index); setConfirming(-1) }
        catch (cause) { setError(messageOf(cause)) } finally { setBusy(false) }
      }

      async function saveCap() {
        const next = Math.round(Number(capDraft))
        if (!Number.isFinite(next) || next < 500 || next > 20000) { setCapError(t('styleCapHint')); return }
        setCapBusy(true)
        setCapError('')
        try { await onSave('style:cap', next); clearDirty('style:cap') }
        catch (cause) { setCapError(messageOf(cause)) } finally { setCapBusy(false) }
      }

      return h('div', { className: 'nm-list' },
        h('div', { className: 'nm-card' },
          h('div', { className: 'nm-row' },
            h('strong', { className: 'nm-secondary' }, t('styleRecent')),
            h(Chip, { warn: recent.locked }, recent.manual ? t('styleManualMode') : t('styleAutoMode')),
            h('span', { className: 'nm-grow' }),
            winFlash ? h('span', { className: 'nm-saved', role: 'status' }, t('saved')) : null,
          ),
          h('div', { className: 'nm-muted' }, t('styleRecentHint')),
          h('div', { className: 'nm-row' },
            h(Field, { label: t('styleManual') }, h('input', {
              className: 'nm-input', style: { width: 150 }, value: manual,
              placeholder: recent.chapters.join(','), onChange: event => editWin({ manual: event.target.value }),
            })),
            h('label', { className: 'nm-row nm-muted' },
              h('input', { type: 'checkbox', checked: locked, onChange: event => editWin({ locked: event.target.checked }) }),
              t('styleLock'),
            ),
            h('button', { type: 'button', className: 'nm-btn-primary', disabled: winBusy, onClick: saveWindow }, winBusy ? t('saving') : t('save')),
          ),
          h('div', { className: 'nm-list' }, preview.map(row => h('details', { className: 'nm-card', key: row.chapter },
            h('summary', { className: 'nm-row', style: { cursor: 'pointer' } },
              h(Chip, null, `[ch${row.chapter}]`),
              h('span', { className: 'nm-muted' }, row.title || ''),
            ),
            h('div', { className: 'nm-body', style: { whiteSpace: 'pre-wrap' } }, row.text || ''),
          ))),
          h(Notice, { tone: 'error', children: winError, onDismiss: () => setWinError(''), closeLabel: t('close') }),
        ),
        h('div', { className: 'nm-card' },
          h('div', { className: 'nm-row' },
            h('strong', { className: 'nm-secondary' }, `${t('stylePassages')}（${passages.length} · ${passageChars}/${cap}）`),
            h('span', { className: 'nm-grow' }),
            flash ? h('span', { className: 'nm-saved', role: 'status' }, t('saved')) : null,
          ),
          h('div', { className: 'nm-muted' }, t('stylePassagesHint')),
          h('div', { className: 'nm-row' },
            h(Field, { label: t('styleCap') }, h('input', {
              className: 'nm-input', style: { width: 110 }, inputMode: 'numeric', value: capDraft,
              onChange: event => { setCapDraft(event.target.value); markDirty('style:cap') },
            })),
            h('button', { type: 'button', className: 'nm-btn', disabled: capBusy, onClick: saveCap }, capBusy ? t('saving') : t('save')),
            h('span', { className: 'nm-muted' }, t('styleCapHint')),
          ),
          h(Notice, { tone: 'error', children: capError, onDismiss: () => setCapError(''), closeLabel: t('close') }),
          passages.length === 0 ? h(Empty, null, t('emptyPassage')) : null,
          h('div', { className: 'nm-list' }, passages.map((row, index) => h('div', { className: 'nm-card', key: index },
            h('div', { className: 'nm-row' },
              row.chapter ? h(Chip, null, `[ch${row.chapter}]`) : null,
              row.note ? h('span', { className: 'nm-muted' }, row.note) : null,
              h('span', { className: 'nm-grow' }),
              confirming === index
                ? h('button', { type: 'button', className: 'nm-btn nm-btn-danger', disabled: busy, onClick: () => removePassage(index) }, t('confirmRemove'))
                : h('button', { type: 'button', className: 'nm-btn', onClick: () => setConfirming(index) }, t('remove')),
            ),
            h('div', { className: 'nm-body', style: { whiteSpace: 'pre-wrap' } }, row.text),
          ))),
          h('div', { className: 'nm-actions' },
            h(Field, { label: t('stylePassageChapter') }, h('input', { className: 'nm-input', style: { width: 90 }, inputMode: 'numeric', value: form.chapter, onChange: event => { setForm({ ...form, chapter: event.target.value }); markDirty('style') } })),
            h(Field, { label: t('stylePassageNote') }, h('input', { className: 'nm-input nm-grow', value: form.note, onChange: event => { setForm({ ...form, note: event.target.value }); markDirty('style') } })),
          ),
          h(Field, { label: t('stylePassageText') }, h('textarea', { className: 'nm-textarea', rows: 4, value: form.text, onChange: event => { setForm({ ...form, text: event.target.value }); markDirty('style') } })),
          h(Notice, { tone: 'error', children: error, onDismiss: () => setError(''), closeLabel: t('close') }),
          h('div', { className: 'nm-actions' },
            h('button', { type: 'button', className: 'nm-btn-primary', disabled: busy || !form.text.trim(), onClick: addPassage }, busy ? t('saving') : t('addPassage')),
          ),
        ),
        samples.length ? h('details', { className: 'nm-card' },
          h('summary', { className: 'nm-muted', style: { cursor: 'pointer' } }, `${t('styleLegacy')}（${samples.length}）`),
          h('div', { className: 'nm-list', style: { marginTop: 8 } }, samples.map((sample, index) => h('div', { className: 'nm-card', key: index },
            h('div', { className: 'nm-row' },
              sample.chapter ? h(Chip, null, `[ch${sample.chapter}]`) : null,
              sample.note ? h('span', { className: 'nm-muted' }, sample.note) : null,
              h('span', { className: 'nm-grow' }),
              h('button', { type: 'button', className: 'nm-btn', onClick: () => removeSample(index) }, t('remove')),
            ),
            h('div', { className: 'nm-body' }, sample.text),
          ))),
        ) : null,
      )
    }

    function NotePane({ t, snap, onSave }) {
      const notes = snap.notes || { text: '', chars: 0, tasks: [], cap: 0 }
      const [draft, setDraft] = useState(notes.text || '')
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState('')
      const [flash, fire] = useFlash()
      const [capOn, setCapOn] = useState(Number(notes.cap) > 0)
      const [capDraft, setCapDraft] = useState(String(Number(notes.cap) || 20000))
      const [capBusy, setCapBusy] = useState(false)
      const [capError, setCapError] = useState('')

      useEffect(() => {
        setDraft(notes.text || '')
        clearDirty('note')
        setCapOn(Number(notes.cap) > 0)
        setCapDraft(String(Number(notes.cap) || 20000))
      }, [notes.text, notes.cap])

      async function commit() {
        setBusy(true)
        setError('')
        try {
          await onSave('note', draft)
          clearDirty('note')
          fire()
        } catch (cause) {
          setError(messageOf(cause))
        } finally {
          setBusy(false)
        }
      }

      async function commitCap(next) {
        setCapBusy(true)
        setCapError('')
        try {
          await onSave('note:cap', { cap: next })
        } catch (cause) {
          setCapError(messageOf(cause))
        } finally {
          setCapBusy(false)
        }
      }

      return h('div', { className: 'nm-list' },
        h('div', { className: 'nm-muted' }, t('noteHint')),
        h('div', { className: 'nm-card' },
          h('div', { className: 'nm-row' },
            h('strong', { className: 'nm-secondary' }, notes.tasks.length ? notes.tasks.join(' · ') : t('noteTab')),
            h('span', { className: 'nm-grow' }),
            h('span', { className: 'nm-muted' }, `${t('noteCount')} ${draft.length}${Number(notes.cap) > 0 ? ` / ${notes.cap}` : ''}`),
          ),
          h('div', { className: 'nm-row' },
            h('label', { className: 'nm-check' },
              h('input', {
                type: 'checkbox',
                checked: capOn,
                disabled: capBusy,
                onChange: event => {
                  const on = event.target.checked
                  setCapOn(on)
                  commitCap(on ? Math.round(Number(capDraft) || 20000) : 0)
                },
              }),
              h('span', null, t('noteCapLabel')),
            ),
            capOn
              ? h('input', {
                className: 'nm-input nm-code',
                type: 'number',
                min: 100,
                step: 1000,
                value: capDraft,
                disabled: capBusy,
                style: { width: '110px' },
                onChange: event => setCapDraft(event.target.value),
              })
              : null,
            capOn
              ? h('button', {
                type: 'button',
                className: 'nm-btn',
                disabled: capBusy,
                onClick: () => commitCap(Math.max(100, Math.round(Number(capDraft) || 0))),
              }, t('save'))
              : h('span', { className: 'nm-muted' }, t('noteCapOff')),
            h('span', { className: 'nm-grow' }),
            h('span', { className: 'nm-muted' }, t('noteCapHint')),
          ),
          h(Notice, { tone: 'error', children: capError, onDismiss: () => setCapError(''), closeLabel: t('close') }),
          h('textarea', {
            className: 'nm-textarea nm-code',
            rows: 20,
            maxLength: Number(notes.cap) > 0 ? Number(notes.cap) : undefined,
            value: draft,
            placeholder: t('noteEmpty'),
            onChange: event => { setDraft(event.target.value); markDirty('note') },
          }),
          h(Notice, { tone: 'error', children: error, onDismiss: () => setError(''), closeLabel: t('close') }),
          h(SaveBar, { t, busy, flash, onSave: commit, disabled: busy }),
        ),
      )
    }

    const TABS = ['l1', 'l2', 'l3', 'world', 'facts', 'style', 'note']

    function BookPage({ t, book, snapshot, onSave, onRefresh, refreshing, error }) {
      const [tab, setTab] = useState('l1')
      const tabRefs = useRef({})
      const coverage = snapshot.coverage
      const missing = coverage.l1Missing || []
      const labels = { l1: 'l1Tab', l2: 'l2Tab', l3: 'l3Tab', world: 'worldTab', facts: 'factsTab', style: 'styleTab', note: 'noteTab' }

      function onTabKey(event) {
        const index = TABS.indexOf(tab)
        let next = -1
        if (event.key === 'ArrowRight') next = (index + 1) % TABS.length
        else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length
        else if (event.key === 'Home') next = 0
        else if (event.key === 'End') next = TABS.length - 1
        if (next < 0) return
        event.preventDefault()
        const id = TABS[next]
        setTab(id)
        const node = tabRefs.current[id]
        if (node) node.focus()
      }

      const panels = {
        l1: h('div', { className: 'nm-list' },
          missing.length ? h('div', { className: 'nm-card' },
            h('div', { className: 'nm-row' }, h('strong', { className: 'nm-secondary' }, `${t('missingChapters')} ${missing.length}`)),
            h('div', { className: 'nm-missing' }, missing.slice(0, 60).map(n => h('span', { className: 'nm-mark', key: n }, `ch${n}`)), missing.length > 60 ? h('span', { className: 'nm-muted' }, `…+${missing.length - 60}`) : null),
          ) : null,
          h(L1Add, { t, missing, onSave }),
          snapshot.l1.length ? snapshot.l1.map(row => h(L1Row, { key: row.n, t, row, onSave })) : h(Empty, null, t('emptyL1')),
        ),
        l2: h('div', { className: 'nm-list' },
          coverage.arcGapCount ? h('div', { className: 'nm-muted' }, `${coverage.arcGapCount} ${t('arcGap')}`) : null,
          h(ArcAdd, { t, chaptersCount: book.chapterCount, onSave }),
          snapshot.arcs.length ? snapshot.arcs.map(arc => h(ArcRow, { key: arc.id, t, arc, onSave })) : h(Empty, null, t('emptyL2')),
        ),
        l3: h(L3Pane, { t, snap: snapshot, onSave }),
        world: h('div', { className: 'nm-list' },
          h(WorldAdd, { t, onSave }),
          snapshot.world.length ? snapshot.world.map(entry => h(WorldRow, { key: entry.tag, t, entry, onSave })) : h(Empty, null, t('emptyWorld')),
        ),
        facts: h(FactsPane, { t, snap: snapshot, onSave }),
        style: h(StylePane, { t, snap: snapshot, onSave }),
        note: h(NotePane, { t, snap: snapshot, onSave }),
      }

      return h('div', { className: 'nm-page' },
        h('div', { className: 'nm-head' },
          h('h2', { className: 'nm-title' }, book.title),
          h('div', { className: 'nm-chips' },
            h(Chip, null, `${book.chapterCount} ${t('chapters')} / ${fmtChars(book.chars)}`),
            h(Chip, null, book.mode === 'full' ? t('full') : t('pipeline')),
            h(Chip, { warn: missing.length > 0 }, `L1 ${coverage.l1Written}/${coverage.chapterCount}`),
            h(Chip, { warn: coverage.arcGapCount > 0 }, `${t('l2Tab')} ${coverage.arcs}${coverage.arcGapCount ? ` · ${coverage.arcGapCount} ${t('arcGap')}` : ''}`),
            h(Chip, null, `L3 ${coverage.l3Reader} / ${coverage.l3Author}`),
            h(Chip, null, `L4 ${coverage.worldTags}`),
            h(Chip, null, `F ${coverage.characters}${coverage.deadCharacters ? ` (${coverage.deadCharacters})` : ''}`),
            h(Chip, { warn: coverage.foreshadowOpen > 0 }, `伏笔 ${coverage.foreshadowOpen}`),
            h(Chip, null, `V ${coverage.styleSamples}`),
          ),
          h('span', { className: 'nm-grow' }),
          h('button', { type: 'button', className: 'nm-btn', disabled: refreshing, onClick: onRefresh }, refreshing ? t('refreshing') : t('refresh')),
        ),
        h(Notice, { tone: 'error', children: error, closeLabel: t('close') }),
        h('div', { className: 'nm-tabs', role: 'tablist', 'aria-label': book.title, onKeyDown: onTabKey },
          TABS.map(id => h('button', {
            type: 'button',
            key: id,
            ref: node => { tabRefs.current[id] = node },
            id: `nm-tab-${id}`,
            className: 'nm-tab',
            role: 'tab',
            'aria-selected': tab === id,
            'aria-controls': `nm-panel-${id}`,
            tabIndex: tab === id ? 0 : -1,
            onClick: () => setTab(id),
          }, t(labels[id]))),
        ),
        TABS.map(id => h('div', {
          key: id,
          id: `nm-panel-${id}`,
          role: 'tabpanel',
          'aria-labelledby': `nm-tab-${id}`,
          hidden: tab !== id,
          style: { paddingTop: 12 },
        }, panels[id])),
      )
    }

    async function decodeFile(file) {
      const buffer = await file.arrayBuffer()
      const strip = text => text.replace(/^\uFEFF/, '')
      try { return strip(new TextDecoder('utf-8', { fatal: true }).decode(buffer)) } catch {}
      try { return strip(new TextDecoder('gb18030').decode(buffer)) } catch {}
      return strip(new TextDecoder('gbk').decode(buffer))
    }

    function Shell({ t, api, reason }) {
      const [books, setBooks] = useState([])
      const [bookId, setBookId] = useState('')
      const [snapshot, setSnapshot] = useState(null)
      const [booksError, setBooksError] = useState('')
      const [actionError, setActionError] = useState('')
      const [loadingShelf, setLoadingShelf] = useState(true)
      const [loadingBook, setLoadingBook] = useState(false)
      const [refreshing, setRefreshing] = useState(false)
      const [opening, setOpening] = useState(false)
      const [readingFile, setReadingFile] = useState(false)
      const [path, setPath] = useState('')
      const token = useRef(0)
      const fileRef = useRef(null)

      const refreshBooks = useCallback(async () => {
        if (!api) return []
        const rows = unwrap(await api.books())
        const list = Array.isArray(rows) ? rows : []
        setBooks(list)
        setBooksError('')
        setBookId(current => (list.some(row => row.id === current) ? current : (list[0] ? list[0].id : '')))
        return list
      }, [api])

      useEffect(() => {
        let alive = true
        ;(async () => {
          try { await refreshBooks() }
          catch (cause) { if (alive) setBooksError(messageOf(cause)) }
          finally { if (alive) setLoadingShelf(false) }
        })()
        return () => { alive = false }
      }, [refreshBooks])

      const load = useCallback(async id => {
        if (!api || !id) { setSnapshot(null); return }
        const ticket = ++token.current
        setLoadingBook(true)
        setSnapshot(null)
        try {
          const next = unwrap(await api.book({ bookId: id }))
          if (ticket === token.current) { clearDirtyAll(); setSnapshot(next) }
        } catch (cause) {
          if (ticket === token.current) setActionError(messageOf(cause))
        } finally {
          if (ticket === token.current) setLoadingBook(false)
        }
      }, [api])

      useEffect(() => {
        if (!bookId) { setSnapshot(null); return }
        load(bookId)
      }, [bookId, load])

      const save = useCallback(async (target, value) => {
        const currentId = snapshot && snapshot.book ? snapshot.book.id : ''
        if (!currentId) throw new Error('还没打开书')
        const ticket = token.current
        const next = unwrap(await api.save({ bookId: currentId, target, value }))
        if (ticket === token.current && next) setSnapshot(next)
        refreshBooks().catch(() => {})
      }, [api, snapshot, refreshBooks])

      const refresh = useCallback(async () => {
        if (!snapshot) return
        setRefreshing(true)
        setActionError('')
        const ticket = token.current
        try {
          const next = unwrap(await api.book({ bookId: snapshot.book.id }))
          if (ticket === token.current) setSnapshot(next)
        } catch (cause) { setActionError(messageOf(cause)) } finally { setRefreshing(false) }
      }, [api, snapshot])

      const removeBook = useCallback(async () => {
        if (!api || !bookId) return
        if (typeof window.confirm === 'function' && !window.confirm(t('removeBookConfirm'))) return
        setActionError('')
        try {
          unwrap(await api.forget({ bookId }))
          clearDirtyAll()
          setSnapshot(null)
          const list = await refreshBooks()
          setBookId(current => (list.some(row => row.id === current) ? current : (list[0] ? list[0].id : '')))
        } catch (cause) { setActionError(messageOf(cause)) }
      }, [api, bookId, refreshBooks, t])

      const openBook = useCallback(async () => {
        const target = path.trim()
        if (!target || !api) { setActionError(t('path')); return }
        setOpening(true)
        setActionError('')
        try {
          const next = unwrap(await api.open({ path: target }))
          if (next && next.book) {
            clearDirtyAll()
            setSnapshot(next)
            setBookId(next.book.id)
            setPath('')
            refreshBooks().catch(() => {})
          }
        } catch (cause) { setActionError(messageOf(cause)) } finally { setOpening(false) }
      }, [api, path, refreshBooks, t])

      const openFile = useCallback(async event => {
        const file = event && event.target && event.target.files ? event.target.files[0] : null
        if (event && event.target) event.target.value = ''
        if (!file || !api) return
        setReadingFile(true)
        setActionError('')
        try {
          const text = await decodeFile(file)
          const next = unwrap(await api.open({ text, title: file.name.replace(/\.[^.]+$/, '') }))
          if (next && next.book) {
            clearDirtyAll()
            setSnapshot(next)
            setBookId(next.book.id)
            setPath('')
            refreshBooks().catch(() => {})
          }
        } catch (cause) { setActionError(messageOf(cause)) } finally { setReadingFile(false) }
      }, [api, refreshBooks])

      const pickBook = useCallback(nextId => {
        if (nextId === bookId) return
        if (hasDirty() && typeof window.confirm === 'function' && !window.confirm(t('dirtyConfirm'))) return
        clearDirtyAll()
        setBookId(nextId)
      }, [bookId, t])

      if (!api) {
        return h('div', { className: 'nm-page' },
          h(Notice, { tone: 'error' }, reason ? `${t('booksError')}：${reason}` : t('booksError')),
          h(Empty, null, t('noBooks')),
        )
      }

      return h('div', { className: 'nm-page' },
        h('div', { className: 'nm-head' },
          h('select', {
            className: 'nm-select nm-book-picker',
            value: bookId,
            'aria-label': t('books'),
            disabled: opening || loadingBook,
            onChange: event => pickBook(event.target.value),
          },
            books.length === 0 ? h('option', { value: '' }, t('books')) : null,
            books.map(row => h('option', { key: row.id, value: row.id }, `${row.title}（L1 ${row.l1Written ?? 0}/${row.chapterCount ?? 0}）`)),
          ),
          h('button', { type: 'button', className: 'nm-btn', disabled: loadingShelf, onClick: () => { setLoadingShelf(true); refreshBooks().catch(cause => setBooksError(messageOf(cause))).finally(() => setLoadingShelf(false)) } }, t('refresh')),
          h('button', {
            type: 'button',
            className: 'nm-btn',
            disabled: !bookId || opening || loadingBook,
            onClick: removeBook,
            style: { color: 'var(--dsw-alias-state-error-primary)' },
          }, t('removeBook')),
          h('span', { className: 'nm-grow' }),
          h('input', {
            ref: fileRef,
            type: 'file',
            accept: '.txt,text/plain',
            style: { display: 'none' },
            'aria-hidden': 'true',
            tabIndex: -1,
            onChange: openFile,
          }),
          h('button', {
            type: 'button',
            className: 'nm-btn',
            disabled: opening || readingFile,
            'aria-label': t('pickAria'),
            onClick: () => { if (fileRef.current) fileRef.current.click() },
          }, readingFile ? t('readingFile') : t('pick')),
          h('input', {
            className: 'nm-input',
            style: { maxWidth: 360 },
            value: path,
            placeholder: t('openHint'),
            'aria-label': t('path'),
            disabled: opening,
            onChange: event => setPath(event.target.value),
            onKeyDown: event => { if (event.key === 'Enter' && !event.isComposing && !opening) openBook() },
          }),
          h('button', { type: 'button', className: 'nm-btn-primary', disabled: opening || !path.trim(), onClick: openBook }, opening ? t('opening') : t('open')),
        ),
        booksError && books.length === 0
          ? h(Notice, { tone: 'error', children: `${t('booksError')}：${booksError}`, onDismiss: () => setBooksError(''), closeLabel: t('close') })
          : null,
        loadingShelf && books.length === 0 ? h('div', { className: 'nm-muted' }, t('loading')) : null,
        !loadingShelf && !booksError && books.length === 0 ? h(Empty, null, t('noBooks')) : null,
        h(Notice, { tone: 'error', children: actionError, onDismiss: () => setActionError(''), closeLabel: t('close') }),
        loadingBook ? h('div', { className: 'nm-muted' }, `${t('loadingBook')}…`) : null,
        snapshot && !loadingBook
          ? h(BookPage, {
            key: snapshot.book.id,
            t,
            book: snapshot.book,
            snapshot,
            refreshing,
            error: '',
            onSave: save,
            onRefresh: () => { refresh().catch(cause => setActionError(messageOf(cause))) },
          })
          : null,
        snapshot && !loadingBook ? h('div', { className: 'nm-muted' }, `${t('bookId')}：${snapshot.book.id} · ${t('pageHint')}`) : null,
      )
    }

    return {
      inject: ['slots', 'locale', 'remote'],
      async apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, STRINGS), 'novel-memory: page dictionaries')

        ctx.effect(() => {
          const style = document.createElement('style')
          style.dataset.dshNovelMemory = 'true'
          style.textContent = CSS
          document.head.append(style)
          return () => style.remove()
        }, 'novel-memory: page styles')

        const remote = ctx.get('remote')
        let reason = ''
        try {
          await remote.$mount({ package: 'dsh-novel-memory', descriptors: DESCRIPTORS })
        } catch (error) {
          reason = messageOf(error)
        }
        let api
        try {
          api = ctx.get('remote.novelMemory')
        } catch (error) {
          api = undefined
          if (!reason) reason = messageOf(error)
        }

        ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register({
          name: 'settings.plugins.tab',
          id: 'novel-memory',
          order: 70,
          locale: NS,
          label: () => '小说记忆',
        }, props => h(Shell, { api, reason, t: props.t || (key => STRINGS.zh[key] || key) })))
      },
    }
  },
})
