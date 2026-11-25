/** Encoding detection + chapter splitting for Chinese web-novel txt. */

const UTF8 = new TextDecoder('utf-8', { fatal: true })
const GB18030 = new TextDecoder('gb18030')

export function decodeBytes(buffer) {
  const bytes = buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf ? buffer.subarray(3) : buffer
  try {
    return { text: UTF8.decode(bytes), encoding: 'utf-8' }
  } catch {
    return { text: GB18030.decode(bytes), encoding: 'gb18030' }
  }
}

// Zero-width / bidi / tag characters: invisible text used to hide instructions
// from a human reader while still reaching the model. Stripped on ingest.
const INVISIBLE = new RegExp(
  '[' +
  String.fromCharCode(0x200b) + '-' + String.fromCharCode(0x200f) +
  String.fromCharCode(0x202a) + '-' + String.fromCharCode(0x202e) +
  String.fromCharCode(0x2060) + '-' + String.fromCharCode(0x2064) +
  String.fromCharCode(0xfeff) +
  String.fromCodePoint(0xe0000) + '-' + String.fromCodePoint(0xe007f) +
  ']',
  'gu',
)

export function stripInvisible(text) {
  return String(text ?? '').replace(INVISIBLE, '')
}

export function normalizeText(text) {
  return stripInvisible(
    String(text ?? '')
      .replace(/\r\n?/g, '\n')
      .replace(/\u00a0/g, ' '),
  )
    .replace(/[ \t]+\n/g, '\n')
}

const NUM = '0-9０-９零〇一二三四五六七八九十百千万两壹贰叁肆伍陆柒捌玖拾'
const HEADING = new RegExp(
  `^[ \\t\\u3000]*(?:第[${NUM}]+[章回节集部篇卷]|楔子|序章|序言|序幕|尾声|终章|后记|番外(?:篇)?)(?:[ \\t\\u3000:：.、·—\\-][^\\n]{0,40}|[^\\n]{0,12})?$`,
  'gm',
)

function headingTitle(line) {
  return line.replace(/^[ \t\u3000]+/, '').trim().slice(0, 40)
}

function chunked(text) {
  const chapters = []
  const size = 5000
  let start = 0
  let n = 1
  while (start < text.length) {
    let end = Math.min(text.length, start + size)
    if (end < text.length) {
      const cut = text.lastIndexOf('\n', end)
      if (cut > start + size * 0.6) end = cut + 1
    }
    chapters.push({ n, title: `第${n}节`, start, end })
    start = end
    n += 1
  }
  return chapters
}

export function splitChapters(rawText) {
  const text = normalizeText(rawText)
  const marks = []
  HEADING.lastIndex = 0
  let match
  while ((match = HEADING.exec(text))) {
    const index = match.index
    const lineEnd = text.indexOf('\n', index)
    const line = text.slice(index, lineEnd === -1 ? text.length : lineEnd)
    if (line.length > 64) continue
    // A real heading is followed by story text, not chained headings.
    marks.push({ index, title: headingTitle(line) })
  }

  if (marks.length < 2) {
    const chapters = chunked(text)
    return { text, chapters, mode: 'chunked', headings: 0 }
  }

  // Front matter before the first heading is absorbed so [chN] keeps the file's own numbering.
  const chapters = marks.map((mark, i) => ({
    n: i + 1,
    title: mark.title,
    start: i === 0 ? 0 : mark.index,
    end: i + 1 < marks.length ? marks[i + 1].index : text.length,
  }))
  return { text, chapters, mode: 'headings', headings: marks.length }
}
