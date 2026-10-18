import type { VocabItem } from './types';

export interface TextSegment {
  text: string;
  vocab?: VocabItem;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Regex source matching a vocab entry plus common inflections (coincide → coincided, sprawl → sprawls). */
function patternFor(word: string): string | null {
  let w = word.trim().replace(/^(be|to)\s+/i, '');   // "be associated with" → "associated with"
  if (!w || /\.\.\.|…|\/|\(/.test(w) || w.length < 3) return null;
  w = w.replace(/\s+/g, ' ');
  const parts = w.split(' ');
  const last = parts.pop()!;
  const head = parts.map(escapeRegExp).join('\\s+');
  let tail = escapeRegExp(last);
  if (/e$/i.test(last)) tail = `${escapeRegExp(last.slice(0, -1))}(?:e|es|ed|ing|er|ers)`;
  else if (/[^aeiou]y$/i.test(last)) tail = `${escapeRegExp(last.slice(0, -1))}(?:y|ies|ied|ying)`;
  else if (/[^aeiou][aeiou][bdgmnprt]$/i.test(last)) tail = `${tail}(?:s|${escapeRegExp(last.slice(-1))}?(?:ed|ing|er|ers))?`; // span → spanning
  else tail = `${tail}(?:s|es|ed|ing|er|ers|ly)?`;
  return head ? `${head}\\s+${tail}` : tail;
}

/**
 * Split `body` into plain and vocab-highlighted segments. Longer entries win
 * over shorter ones they overlap with ("cement concrete" before "concrete").
 */
export function segmentByVocab(body: string, vocab: VocabItem[]): TextSegment[] {
  const ranges: { start: number; end: number; vocab: VocabItem }[] = [];
  const sorted = [...vocab].sort((a, b) => b.word.length - a.word.length);

  for (const item of sorted) {
    const src = patternFor(item.word);
    if (!src) continue;
    const re = new RegExp(`(?<![A-Za-z-])${src}(?![A-Za-z])`, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(body)) !== null) {
      const start = m.index, end = m.index + m[0].length;
      if (!ranges.some(r => start < r.end && end > r.start)) {
        ranges.push({ start, end, vocab: item });
      }
    }
  }

  ranges.sort((a, b) => a.start - b.start);
  const segments: TextSegment[] = [];
  let pos = 0;
  for (const r of ranges) {
    if (r.start > pos) segments.push({ text: body.slice(pos, r.start) });
    segments.push({ text: body.slice(r.start, r.end), vocab: r.vocab });
    pos = r.end;
  }
  if (pos < body.length) segments.push({ text: body.slice(pos) });
  return segments;
}
