import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { AnnotationDocument } from "@datenflix007/ts-text-marker-core";
import type { AnnotationDisplayStyle } from "../annotationDisplay";
import {
  annotationHighlightRanges,
  searchHighlightRanges,
  type HighlightRange
} from "../highlighting/textRanges";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface TextItemLike {
  str: string;
  width: number;
  height: number;
  transform: number[];
  hasEOL?: boolean;
}

interface PositionedTextItem {
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
  start: number;
  end: number;
}

export interface PdfRenderRequest {
  container: HTMLElement;
  data: ArrayBuffer;
  zoom: number;
  mode: "search" | "annotations";
  searchTerm: string;
  annotationDocument: AnnotationDocument | null;
  annotationDisplayStyle: AnnotationDisplayStyle;
  visibleLabelIds?: ReadonlySet<string>;
}

export interface PdfRenderStats {
  pageCount: number;
  searchMatches: number;
  renderedRanges: number;
  pagesWithoutTextLayer: number[];
}

const BASE_PDF_SCALE = 1.35;

export async function renderPdfDocument(request: PdfRenderRequest): Promise<PdfRenderStats> {
  const loadingTask = pdfjsLib.getDocument({ data: request.data });
  const pdf = await loadingTask.promise;
  const stats: PdfRenderStats = {
    pageCount: pdf.numPages,
    searchMatches: 0,
    renderedRanges: 0,
    pagesWithoutTextLayer: []
  };

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: BASE_PDF_SCALE * request.zoom });
    const outputScale = window.devicePixelRatio || 1;

    const wrapper = document.createElement("section");
    wrapper.className = "pdf-page document-page";
    wrapper.dataset.pageNumber = String(pageNumber);
    wrapper.style.width = `${viewport.width}px`;
    wrapper.style.height = `${viewport.height}px`;

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    wrapper.appendChild(canvas);

    const highlightLayer = document.createElement("div");
    highlightLayer.className = "highlight-layer";
    wrapper.appendChild(highlightLayer);
    request.container.appendChild(wrapper);

    await page.render({
      canvas,
      viewport,
      transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined
    }).promise;

    const textContent = await page.getTextContent();
    const items = textContent.items
      .flatMap((item): TextItemLike[] => {
        if (!("str" in item) || typeof item.str !== "string") return [];
        return [{
          str: item.str,
          width: item.width,
          height: item.height,
          transform: [...item.transform],
          hasEOL: item.hasEOL
        }];
      })
      .filter((item) => item.str.length > 0);

    if (items.length === 0) {
      stats.pagesWithoutTextLayer.push(pageNumber);
      appendTextLayerNotice(wrapper);
      continue;
    }

    const positioned = positionPdfTextItems(items, viewport);
    const pageText = pageTextFromItems(positioned);
    const ranges = request.mode === "search"
      ? searchHighlightRanges(pageText, request.searchTerm)
      : annotationHighlightRanges(
          pageText,
          request.annotationDocument,
          pageNumber,
          request.visibleLabelIds
        );

    if (request.mode === "search") {
      stats.searchMatches += ranges.length;
    }

    stats.renderedRanges += ranges.length;
    drawPdfRanges(
      highlightLayer,
      positioned,
      ranges,
      request.mode === "search",
      request.annotationDisplayStyle
    );
  }

  return stats;
}

function positionPdfTextItems(
  items: TextItemLike[],
  viewport: { transform: number[]; scale: number }
): PositionedTextItem[] {
  const result: PositionedTextItem[] = [];
  let cursor = 0;

  for (const item of items) {
    const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
    const fontHeight = Math.max(Math.hypot(tx[2], tx[3]), item.height * viewport.scale, 1);
    const width = Math.max(item.width * viewport.scale, 1);
    const text = item.str;

    result.push({
      text,
      left: tx[4],
      top: tx[5] - fontHeight,
      width,
      height: fontHeight,
      start: cursor,
      end: cursor + text.length
    });

    cursor += text.length + 1;
  }

  return result;
}

function pageTextFromItems(items: PositionedTextItem[]): string {
  return items.map((item) => item.text).join(" ");
}

function drawPdfRanges(
  layer: HTMLElement,
  items: PositionedTextItem[],
  ranges: HighlightRange[],
  searchMode: boolean,
  annotationDisplayStyle: AnnotationDisplayStyle
): void {
  ranges.forEach((range, rangeIndex) => {
    let labelPlaced = false;

    for (const item of items) {
      const overlapStart = Math.max(range.start, item.start);
      const overlapEnd = Math.min(range.end, item.end);
      if (overlapStart >= overlapEnd || item.text.length === 0) continue;

      const startRatio = (overlapStart - item.start) / item.text.length;
      const endRatio = (overlapEnd - item.start) / item.text.length;
      const left = item.left + item.width * startRatio;
      const width = Math.max(item.width * (endRatio - startRatio), 2);

      const mark = document.createElement("div");
      const usesBracketStyle = !searchMode && annotationDisplayStyle === "bracket";
      mark.className = searchMode
        ? "highlight search-highlight"
        : `highlight annotation-highlight annotation-highlight-${annotationDisplayStyle}`;
      mark.style.left = `${left}px`;
      mark.style.top = `${item.top}px`;
      mark.style.width = `${width}px`;
      mark.style.height = `${Math.max(item.height, 8)}px`;
      mark.style.background = range.color;
      mark.style.opacity = usesBracketStyle ? "0.18" : "";
      mark.dataset.rangeStart = String(range.start);
      mark.dataset.rangeEnd = String(range.end);

      if (searchMode) {
        mark.dataset.searchIndex = String(rangeIndex + 1);
      }

      layer.appendChild(mark);

      if (usesBracketStyle) {
        const bracket = document.createElement("div");
        bracket.className = "pdf-bracket-line";
        bracket.style.left = `${left}px`;
        bracket.style.top = `${Math.max(item.top - 5, 16)}px`;
        bracket.style.width = `${width}px`;
        bracket.style.borderColor = range.color;
        layer.appendChild(bracket);
      }

      if (range.label && !labelPlaced && usesBracketStyle) {
        const badge = document.createElement("div");
        badge.className = "pdf-bracket-label";
        badge.textContent = range.label;
        badge.style.left = `${left + width / 2}px`;
        badge.style.top = `${Math.max(item.top - 18, 8)}px`;
        badge.style.borderColor = range.color;
        badge.style.color = range.color;
        badge.dataset.annotationId = range.annotationId ?? "";
        layer.appendChild(badge);
        labelPlaced = true;
      } else if (range.label && !labelPlaced) {
        const badge = document.createElement("div");
        badge.className = "highlight-label";
        badge.textContent = range.label;
        badge.style.left = `${left}px`;
        badge.style.top = `${Math.max(item.top - 4, 12)}px`;
        badge.style.background = range.color;
        badge.dataset.annotationId = range.annotationId ?? "";
        layer.appendChild(badge);
        labelPlaced = true;
      }
    }
  });
}

function appendTextLayerNotice(wrapper: HTMLElement): void {
  const notice = document.createElement("div");
  notice.className = "page-notice";
  notice.textContent = "Fuer diese PDF-Seite wurde keine Textschicht gefunden.";
  wrapper.appendChild(notice);
}
