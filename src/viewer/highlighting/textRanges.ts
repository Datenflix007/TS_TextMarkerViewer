import type { Annotation, AnnotationDocument } from "../../core";
import { createLabelLookup } from "../../core";

export interface TextRange {
  start: number;
  end: number;
}

export interface HighlightRange extends TextRange {
  color: string;
  label?: string;
  annotationId?: string;
}

export interface FindTextRangeOptions {
  caseSensitive?: boolean;
}

const SEARCH_COLOR = "#ffeb3b";

export function findTextRanges(
  text: string,
  query: string,
  options: FindTextRangeOptions = {}
): TextRange[] {
  const needle = query.trim();
  if (needle.length === 0) return [];

  const haystack = options.caseSensitive ? text : text.toLocaleLowerCase();
  const searchNeedle = options.caseSensitive ? needle : needle.toLocaleLowerCase();
  const ranges: TextRange[] = [];
  let cursor = 0;

  while (cursor < haystack.length) {
    const index = haystack.indexOf(searchNeedle, cursor);
    if (index === -1) break;

    ranges.push({ start: index, end: index + needle.length });
    cursor = index + Math.max(searchNeedle.length, 1);
  }

  return ranges;
}

export function searchHighlightRanges(text: string, query: string): HighlightRange[] {
  return findTextRanges(text, query).map((range) => ({
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

  const labels = createLabelLookup(document.labels);
  const ranges: HighlightRange[] = [];

  for (const annotation of document.annotations) {
    if (page !== undefined && annotation.page !== undefined && annotation.page !== page) continue;
    if (visibleLabelIds && !visibleLabelIds.has(annotation.labelId)) continue;

    const label = labels.get(annotation.labelId);
    if (!label) continue;

    for (const range of locateAnnotation(text, annotation)) {
      ranges.push({
        ...range,
        color: label.color,
        label: label.name,
        annotationId: annotation.id
      });
    }
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

function locateAnnotation(text: string, annotation: Annotation): TextRange[] {
  if (hasExplicitTextRange(annotation, text.length)) {
    return [{ start: annotation.start, end: annotation.end }];
  }

  const matches = findTextRanges(text, annotation.quote);
  if (annotation.occurrence !== undefined) {
    const match = matches[annotation.occurrence - 1];
    return match ? [match] : [];
  }

  return matches;
}

function hasExplicitTextRange(
  annotation: Annotation,
  textLength: number
): annotation is Annotation & { start: number; end: number } {
  const { start, end } = annotation;

  return (
    Number.isInteger(start) &&
    Number.isInteger(end) &&
    start !== undefined &&
    end !== undefined &&
    start >= 0 &&
    end > start &&
    end <= textLength
  );
}
