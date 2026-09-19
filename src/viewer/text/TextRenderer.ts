import type { HighlightRange } from "../highlighting/textRanges";
import { nonOverlappingRanges } from "../highlighting/textRanges";

export interface TextRenderRequest {
  container: HTMLElement;
  text: string;
  ranges: HighlightRange[];
  zoom: number;
  searchMode: boolean;
}

export interface TextRenderStats {
  pageCount: number;
  renderedRanges: number;
}

export function renderTextDocument(request: TextRenderRequest): TextRenderStats {
  const page = document.createElement("article");
  page.className = "txt-page document-page";
  page.dataset.pageNumber = "1";
  page.style.setProperty("--ts-viewer-zoom", request.zoom.toString());

  const pre = document.createElement("pre");
  pre.className = "txt-document";

  appendHighlightedText(pre, request.text, request.ranges, request.searchMode);
  page.appendChild(pre);
  request.container.appendChild(page);

  return {
    pageCount: 1,
    renderedRanges: nonOverlappingRanges(request.ranges).length
  };
}

function appendHighlightedText(
  container: HTMLElement,
  text: string,
  ranges: HighlightRange[],
  searchMode: boolean
): void {
  const visibleRanges = nonOverlappingRanges(ranges);
  let cursor = 0;

  visibleRanges.forEach((range, index) => {
    if (range.start > cursor) {
      container.append(document.createTextNode(text.slice(cursor, range.start)));
    }

    const mark = document.createElement("mark");
    mark.className = searchMode ? "txt-mark txt-mark-search" : "txt-mark txt-mark-annotation";
    mark.textContent = text.slice(range.start, range.end);
    mark.style.background = `${range.color}70`;
    mark.style.setProperty("--label-color", range.color);
    mark.dataset.rangeStart = String(range.start);
    mark.dataset.rangeEnd = String(range.end);

    if (searchMode) {
      mark.dataset.searchIndex = String(index + 1);
    }

    if (range.label) {
      mark.dataset.label = range.label;
      mark.dataset.annotationId = range.annotationId ?? "";
    }

    container.append(mark);
    cursor = range.end;
  });

  if (cursor < text.length) {
    container.append(document.createTextNode(text.slice(cursor)));
  }
}
