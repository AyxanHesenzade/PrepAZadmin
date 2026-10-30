import katex from 'katex'
import 'katex/dist/katex.min.css'

// Text with formulas between $...$ (the same format the mobile app shows).
function renderPart(part, key) {
  if (key % 2 === 0) return <span key={key}>{part}</span>
  const html = katex.renderToString(part, { throwOnError: false, strict: 'ignore' })
  return <span key={key} dangerouslySetInnerHTML={{ __html: html }} />
}

export default function MathText({ text }) {
  if (!text) return null
  // odd pieces of the split are the formulas
  return <span style={{ whiteSpace: 'pre-wrap' }}>{text.split('$').map(renderPart)}</span>
}
