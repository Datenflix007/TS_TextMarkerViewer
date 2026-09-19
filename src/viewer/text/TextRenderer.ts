import type { HighlightRange } from "../highlighting/textRanges";
import { nonOverlappingRanges } from "../highlighting/textRanges";
import type { AnnotationDisplayStyle } from "../annotationDisplay";

export interface TextRenderRequest {
  container: HTMLElement;
  text: string;
  ranges: HighlightRange[];
  zoom: number;
  searchMode: boolean;
  annotationDisplayStyle: AnnotationDisplayStyle;
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

  appendHighlightedText(
    pre,
    request.text,
    request.ranges,
    request.searchMode,
    request.annotationDisplayStyle
  );
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
  searchMode: boolean,
  annotationDisplayStyle: AnnotationDisplayStyle
): void {
  const visibleRanges = nonOverlappingRanges(ranges);
  let cursor = 0;

  visibleRanges.forEach((range, index) => {
    if (range.start > cursor) {
      container.append(document.createTextNode(text.slice(cursor, range.start)));
    }

    const mark = document.createElement("mark");
    mark.className = searchMode
      ? "txt-mark txt-mark-search"
      : `txt-mark txt-mark-annotation txt-mark-annotation-${annotationDisplayStyle}`;
    mark.textContent = text.slice(range.start, range.end);
    mark.style.background = searchMode || annotationDisplayStyle === "inline"
      ? `${range.color}70`
      : `${range.color}1f`;
    mark.style.setProperty("--label-color", range.color);
    mark.style.setProperty("--annotation-color", range.color);
    mark.dataset.rangeStart = String(range.start);
    mark.dataset.rangeEnd = String(range.end);
    mark.dataset.annotationDisplayStyle = searchMode ? "search" : annotationDisplayStyle;

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
