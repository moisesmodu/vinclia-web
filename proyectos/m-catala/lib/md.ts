/** Markdown mínim i segur per a les pàgines SEO (negreta, cursiva, enllaços interns, llistes, paràgrafs). */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function md(src: string): string {
  const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\[([^\]]+)\]\((\/[^)\s]+|https?:[^)\s]+)\)/g, (_m, t, u) => `<a href="${u}"${u.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${t}</a>`);
  const blocs = src.replace(/\r/g, '').split(/\n\s*\n/).filter((b) => b.trim());
  return blocs.map((b) => {
    const linies = b.split('\n');
    if (linies.every((l) => /^\s*[-*•] /.test(l))) return `<ul>${linies.map((l) => `<li>${inline(l.replace(/^\s*[-*•] /, ''))}</li>`).join('')}</ul>`;
    if (linies.every((l) => /^\s*\d+[.)] /.test(l))) return `<ol>${linies.map((l) => `<li>${inline(l.replace(/^\s*\d+[.)] /, ''))}</li>`).join('')}</ol>`;
    if (/^###? /.test(b)) return `<h3>${inline(b.replace(/^###? /, ''))}</h3>`;
    if (linies.length > 1 && linies.every((l) => l.includes('|'))) { const files = linies.filter((l) => !/^\s*\|?\s*-+/.test(l)).map((l) => l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => inline(c.trim()))); return `<table class="w-full text-sm"><thead><tr>${files[0].map((c) => `<th class="text-left py-1 pr-2">${c}</th>`).join('')}</tr></thead><tbody>${files.slice(1).map((f) => `<tr>${f.map((c) => `<td class="py-1 pr-2 align-top">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`; }
    return `<p>${inline(b).replace(/\n/g, '<br/>')}</p>`;
  }).join('');
}
