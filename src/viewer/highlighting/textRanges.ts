import type {
  AnnotationDocument,
  TextRange
} from "@datenflix007/ts-text-marker-core";
import {
  findTextOccurrences,
  getAnnotationLabel,
  resolveAnnotationRange
} from "@datenflix007/ts-text-marker-core";

export interface HighlightRange extends TextRange {
  color: string;
  label?: string;
  annotationId?: string;
}

export interface FindTextRangeOptions {
  caseSensitive?: boolean;
}

const SEARCH_COLOR = "#ffeb3b";

function findCoreTextRanges(
  text: string,
  query: string,
  options: FindTextRangeOptions = {}
): TextRange[] {
  const needle = query.trim();
  if (needle.length === 0) return [];

  return findTextOccurrences(text, needle, {
    caseSensitive: options.caseSensitive ?? false
  }).map(({ start, end }) => ({ start, end }));
}

export function searchHighlightRanges(text: string, query: string): HighlightRange[] {
  return findCoreTextRanges(text, query).map((range) => ({
    ...range,
    color: SEARCH_COLOR
  }));
}

export function annotationHighlightRanges(
  text: string,
  document: AnnotationDocument | null,
  page?: number,
  visibleLabelIds?: ReadonlySet<string>
): HighlightRange[] {
  if (!document) return [];

  const ranges: HighlightRange[] = [];

  for (const annotation of document.annotations) {
    if (page !== undefined && annotation.page !== undefined && annotation.page !== page) continue;
    if (visibleLabelIds && !visibleLabelIds.has(annotation.labelId)) continue;

    const label = getAnnotationLabel(document, annotation);
    if (!label) continue;

    const range = resolveAnnotationRange(text, annotation);
    if (!range) continue;

    ranges.push({
      ...range,
      color: label.color,
      label: label.name,
      annotationId: annotation.id
    });
  }

  return ranges.sort((a, b) => a.start - b.start || b.end - a.end);
}

export function nonOverlappingRanges<T extends TextRange>(ranges: readonly T[]): T[] {
  const ordered = [...ranges].sort((a, b) => a.start - b.start || b.end - a.end);
  const result: T[] = [];
  let lastEnd = -1;

  for (const range of ordered) {
    if (range.start >= lastEnd) {
      result.push(range);
      lastEnd = range.end;
    }
  }

  return result;
}
