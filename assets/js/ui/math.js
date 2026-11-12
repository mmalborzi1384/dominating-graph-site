/** Tokenize text/math without interpreting HTML, URLs, or escaped dollar signs. */
export function splitMathText(value) {
  const text = String(value), segments = [];
  const escaped = index => { let count = 0; for (let i = index - 1; i >= 0 && text[i] === '\\'; i--) count++; return count % 2 === 1; };
  let plainStart = 0, i = 0;
  while (i < text.length) {
    if (text[i] !== '$' || escaped(i)) { i++; continue; }
    const delimiter = text[i + 1] === '$' ? '$$' : '$';
    const start = i, contentStart = i + delimiter.length;
    let end = contentStart;
    while (end < text.length) {
      if (delimiter === '$' && text[end] === '\n') break;
      if (text.startsWith(delimiter, end) && !escaped(end)
          && (delimiter === '$$' || text[end + 1] !== '$')) break;
      end++;
    }
    if (end >= text.length || !text.startsWith(delimiter, end) || end === contentStart) {
      if (start > plainStart) segments.push({ type: 'text', text: text.slice(plainStart, start) });
      const stop = end === contentStart ? Math.min(text.length, end + delimiter.length) : end;
      segments.push({ type: 'invalid-math', text: text.slice(start, stop) });
      i = stop; plainStart = stop; continue;
    }
    if (start > plainStart) segments.push({ type: 'text', text: text.slice(plainStart, start) });
    segments.push({ type: 'math', text: text.slice(contentStart, end), display: delimiter === '$$' });
    i = end + delimiter.length; plainStart = i;
  }
  if (plainStart < text.length) segments.push({ type: 'text', text: text.slice(plainStart) });
  return segments;
}

export function renderFormula(host, source, { display = false } = {}) {
  host.replaceChildren();
  const span = document.createElement('span'); span.className = display ? 'math math-display' : 'math'; span.dir = 'ltr';
  const expression = String(source); span.textContent = expression;
  let error = null;
  try {
    if (!globalThis.window?.katex || expression.length > 10000) throw new Error('Math renderer unavailable or expression too long');
    window.katex.render(expression, span, { trust: false, throwOnError: true, strict: 'error',
      displayMode: display, output: 'htmlAndMathml', maxExpand: 1000, maxSize: 20 });
  } catch {
    span.textContent = expression;
    error = 'فرمول به‌صورت متنی نمایش داده شد';
  }
  host.append(span);
  if (error) {
    const note = document.createElement('span'); note.className = 'math-fallback-note';
    note.textContent = ` (${error})`; host.append(note);
  }
  return { ok: error === null, error };
}

/** Replaces content, returns diagnostics; all surrounding copy is inserted as text nodes. */
export function renderTextMath(host, value) {
  host.replaceChildren();
  const errors = [];
  for (const segment of splitMathText(value)) {
    if (segment.type === 'text') {
      for (const part of segment.text.split(/([A-Za-z][A-Za-z0-9_]*(?:[=()]+[A-Za-z0-9_]+)*)/g)) {
        if (/^[A-Za-z]/.test(part)) { const span=document.createElement('span');span.className='latin';span.dir='ltr';span.textContent=part;host.append(span); }
        else if (part) host.append(document.createTextNode(part));
      }
    }
    else if (segment.type === 'invalid-math') {
      const span = document.createElement('span'); span.className = 'math'; span.dir = 'ltr'; span.textContent = segment.text;
      const note = document.createElement('span'); note.className = 'math-fallback-note';
      note.textContent = ' (نشانهٔ آغاز یا پایان فرمول کامل نیست؛ متن اصلی نمایش داده شد)';
      host.append(span, note); errors.push('نشانهٔ فرمول کامل نیست');
    } else {
      const fragment = document.createElement('span');
      const result = renderFormula(fragment, segment.text, { display: segment.display });
      if (!result.ok) errors.push(result.error);
      host.append(...fragment.childNodes);
    }
  }
  return { ok: errors.length === 0, errors };
}
