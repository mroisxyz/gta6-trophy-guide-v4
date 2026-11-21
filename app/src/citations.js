// Citation chips: a source id is rendered as a small numbered marker beside the claim it supports.

/** Build an inline [n] chip for one source id. */
export function citationChip(id) {
  return `<span class="cite" title="Source ${id} — see Sources tab">[${id}]</span>`;
}

/** Build the run of chips for a list of source ids. */
export function citationChips(ids) {
  return (ids ?? []).map(citationChip).join('');
}

/** Link a source record as an anchor; the browser only follows it when a reader clicks. */
export function sourceAnchor(source) {
  const name = escapeHtml(source.name);
  const url = escapeHtml(source.url);
  return `<a href="${url}" target="_blank" rel="noopener noreferrer">${name}</a>`;
}

/** Escape text placed into the ledger's HTML templates. */
export function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}
