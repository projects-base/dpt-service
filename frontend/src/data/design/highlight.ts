/**
 * A very small Java highlighter, for hand-authored answers only.
 *
 * The generated bank came out of the legacy HTML with Pygments spans already
 * baked in, and `.prose` styles those class names. Hand-authoring that markup
 * would make the source unreadable — nobody can review a violation/fix pair
 * written as `<span class="kd">public</span><span class="w"> </span>…`.
 *
 * So authored code is written as plain Java and tokenised here into the same
 * class names. Two rules keep this honest:
 *
 *   1. It emits ONLY classes `.prose` already styles (kd, kt, nc, s, c1, mi).
 *      A new class here would render unstyled, so there are none.
 *   2. It escapes first and wraps second. Every token is escaped exactly once,
 *      which is why the tokeniser returns text and the wrapper adds the tags.
 *
 * It is not a parser and does not need to be: it colours comments, strings,
 * keywords, types, class names and numbers, and leaves everything else alone.
 * Being wrong about an identifier costs a colour, never correctness.
 */

const KEYWORDS = new Set([
  'abstract', 'assert', 'break', 'case', 'catch', 'class', 'const', 'continue',
  'default', 'do', 'else', 'enum', 'extends', 'final', 'finally', 'for', 'goto',
  'if', 'implements', 'import', 'instanceof', 'interface', 'native', 'new',
  'package', 'private', 'protected', 'public', 'record', 'return', 'sealed',
  'static', 'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw',
  'throws', 'transient', 'try', 'var', 'volatile', 'while', 'yield',
])

const TYPES = new Set([
  'boolean', 'byte', 'char', 'double', 'float', 'int', 'long', 'short', 'void',
  'true', 'false', 'null',
])

/** Order matters: comments and strings must win before anything inside them. */
const TOKEN = new RegExp(
  [
    '(/\\*[\\s\\S]*?\\*/|//[^\\n]*)', // 1 comment
    '("(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\')', // 2 string or char
    '(@[A-Za-z_][A-Za-z0-9_]*)', // 3 annotation
    '\\b(\\d[\\d_]*\\.?[\\d_]*[fFdDlL]?)\\b', // 4 number
    '\\b([A-Za-z_$][A-Za-z0-9_$]*)\\b', // 5 word
  ].join('|'),
  'g',
)

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const span = (cls: string, text: string) => `<span class="${cls}">${escapeHtml(text)}</span>`

/** Java source → the span markup `.prose` already knows how to colour. */
export function highlightJava(source: string): string {
  const code = source.replace(/^\n/, '').replace(/\s+$/, '')
  let out = ''
  let last = 0

  for (const m of code.matchAll(TOKEN)) {
    const at = m.index as number
    out += escapeHtml(code.slice(last, at))
    last = at + m[0].length

    const [, comment, str, annotation, num, word] = m
    if (comment) out += span('c1', comment)
    else if (str) out += span('s', str)
    else if (annotation) out += span('nc', annotation)
    else if (num) out += span('mi', num)
    else if (word) {
      if (KEYWORDS.has(word)) out += span('kd', word)
      else if (TYPES.has(word)) out += span('kt', word)
      // A leading capital is a type often enough to be worth colouring.
      else if (/^[A-Z]/.test(word)) out += span('nc', word)
      else out += escapeHtml(word)
    }
  }
  out += escapeHtml(code.slice(last))
  return out
}

/* ── the answer vocabulary ────────────────────────────────────────────────
   The generated bank settled on a shape: a one-line summary, then the body,
   then an optional "say this too". These helpers produce exactly that markup
   so authored answers are indistinguishable from extracted ones.            */

/** The bold one-liner every answer opens with. */
export const tldr = (html: string) =>
  `<p class="tldr"><strong>In one line</strong> — ${html}</p>`

/** A fenced Java block, highlighted. */
export const java = (source: string) =>
  `<div class="hl"><pre><code>${highlightJava(source)}</code></pre></div>`

/** A labelled block — "❌ Violation", "✅ Fix", "Where it already is".
    Plain <strong> rather than a new class, per rule 1 above. */
export const block = (label: string, html: string) =>
  `<p><strong>${label}</strong></p>${html}`

/** Bullets. */
export const ul = (items: string[]) =>
  `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`

/** The extra-credit line that turns a correct answer into a strong one. */
export const bonus = (html: string) =>
  `<p class="bonus"><strong>Say this too</strong> — ${html}</p>`
