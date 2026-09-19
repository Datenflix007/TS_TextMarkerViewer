import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { MarkerMode, TextAnnotation } from "./types";
import { JOSEPHUS_DEMO_ANNOTATIONS, JOSEPHUS_DEMO_TEXT } from "./demoData";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type TextItemLike = {
  str: string;
  width: number;
  height: number;
  transform: number[];
  hasEOL?: boolean;
};

type PositionedTextItem = {
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
  start: number;
  end: number;
};

type TextRange = {
  start: number;
  end: number;
  color: string;
  label?: string;
};

const css = `
  :host {
    display: block;
    min-height: 420px;
    color: #202124;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  * { box-sizing: border-box; }

  .shell {
    display: grid;
    grid-template-rows: auto 1fr;
    min-height: 420px;
    border: 1px solid #d7dbe0;
    border-radius: 10px;
    overflow: hidden;
    background: #eef1f4;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding: 10px;
    background: #fff;
    border-bottom: 1px solid #d7dbe0;
  }

  .toolbar input[type="file"] { max-width: 250px; }
  .toolbar input[type="search"], .toolbar select, .toolbar button {
    min-height: 34px;
    border: 1px solid #c8cdd3;
    border-radius: 6px;
    background: #fff;
    padding: 6px 9px;
    font: inherit;
  }
  .toolbar input[type="search"] { min-width: 190px; }
  .toolbar button { cursor: pointer; }
  .toolbar button:hover { background: #f5f6f7; }

  .status {
    margin-left: auto;
    color: #62676d;
    font-size: 0.85rem;
  }

  .viewer {
    min-height: 360px;
    max-height: 78vh;
    overflow: auto;
    padding: 22px;
  }

  .empty {
    display: grid;
    place-items: center;
    min-height: 320px;
    color: #687078;
  }

  .pdf-page, .txt-page {
    position: relative;
    margin: 0 auto 20px;
    background: white;
    box-shadow: 0 2px 12px rgb(0 0 0 / 13%);
  }

  .pdf-page canvas { display: block; }

  .highlight-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: visible;
  }

  .highlight {
    position: absolute;
    border-radius: 2px;
    mix-blend-mode: multiply;
  }

  .highlight-label {
    position: absolute;
    transform: translateY(-100%);
    max-width: 220px;
    padding: 2px 5px;
    border-radius: 4px 4px 4px 0;
    color: #fff;
    font-size: 11px;
    font-weight: 650;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    z-index: 3;
  }

  .txt-page {
    width: min(900px, 100%);
    min-height: 1050px;
    padding: 64px 72px;
  }

  .txt-document {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 17px;
    line-height: 1.65;
  }

  .txt-mark {
    position: relative;
    border-radius: 2px;
    padding: 0 1px;
  }

  .txt-mark[data-label]::before {
    content: attr(data-label);
    position: absolute;
    left: 0;
    bottom: 100%;
    z-index: 5;
    padding: 1px 4px;
    border-radius: 3px;
    color: #fff;
    background: var(--label-color);
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
    font-size: 10px;
    line-height: 1.4;
    white-space: nowrap;
  }
`;

export class TSTextMarkerViewer extends HTMLElement {
  private root: ShadowRoot;
  private viewer!: HTMLDivElement;
  private status!: HTMLSpanElement;
  private searchInput!: HTMLInputElement;
  private modeSelect!: HTMLSelectElement;

  private mode: MarkerMode = "search";
  private searchTerm = "";
  private annotations: TextAnnotation[] = [];
  private sourceType: "pdf" | "txt" | null = null;
  private currentText = "";
  private currentPdfData: ArrayBuffer | null = null;
  private fileName = "";
  private pdfScale = 1.45;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    this.root.innerHTML = `
      <style>${css}</style>
      <div class="shell">
        <div class="toolbar">
          <input class="file" type="file" accept="application/pdf,.pdf,text/plain,.txt" aria-label="PDF oder TXT öffnen" />
          <select class="mode" aria-label="Markierungsmodus">
            <option value="search">Suche</option>
            <option value="annotations">Annotationen</option>
          </select>
          <input class="search" type="search" placeholder="Wort / Phrase suchen …" aria-label="Suchtext" />
          <button class="demo" type="button">Josephus-Demo</button>
          <span class="status">Kein Dokument</span>
        </div>
        <div class="viewer">
          <div class="empty">PDF/TXT wählen oder Josephus-Demo öffnen.</div>
        </div>
      </div>
    `;
  }

  connectedCallback(): void {
    this.viewer = this.root.querySelector(".viewer")!;
    this.status = this.root.querySelector(".status")!;
    this.searchInput = this.root.querySelector(".search")!;
    this.modeSelect = this.root.querySelector(".mode")!;

    const fileInput = this.root.querySelector<HTMLInputElement>(".file")!;
    const demoButton = this.root.querySelector<HTMLButtonElement>(".demo")!;

    fileInput.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      if (file) await this.loadFile(file);
    });

    this.modeSelect.addEventListener("change", async () => {
      await this.setMode(this.modeSelect.value as MarkerMode);
    });

    this.searchInput.addEventListener("input", async () => {
      await this.setSearchTerm(this.searchInput.value);
    });

    demoButton.addEventListener("click", async () => {
      this.setAnnotations(JOSEPHUS_DEMO_ANNOTATIONS);
      await this.loadText(JOSEPHUS_DEMO_TEXT, "Flavius-Josephus-Demo.txt");
      await this.setMode("annotations");
    });
  }

  /** Lädt PDF oder TXT aus einem Browser-File-Objekt. */
  async loadFile(file: File): Promise<void> {
    this.fileName = file.name;
    const lower = file.name.toLowerCase();

    if (file.type === "application/pdf" || lower.endsWith(".pdf")) {
      this.sourceType = "pdf";
      this.currentPdfData = await file.arrayBuffer();
      this.currentText = "";
      await this.render();
      return;
    }

    if (file.type === "text/plain" || lower.endsWith(".txt")) {
      await this.loadText(await file.text(), file.name);
      return;
    }

    throw new Error("Unterstützt werden aktuell nur PDF und TXT.");
  }

  /** Lädt reinen Text direkt, ohne Datei-Dialog. */
  async loadText(text: string, fileName = "document.txt"): Promise<void> {
    this.sourceType = "txt";
    this.currentText = text;
    this.currentPdfData = null;
    this.fileName = fileName;
    await this.render();
  }

  /** Wechselt zwischen globaler Suche und definierten Annotationen. */
  async setMode(mode: MarkerMode): Promise<void> {
    this.mode = mode;
    if (this.modeSelect) this.modeSelect.value = mode;
    if (this.searchInput) this.searchInput.disabled = mode !== "search";
    await this.render();
  }

  /** Markiert im Suchmodus alle Vorkommen. */
  async setSearchTerm(term: string): Promise<void> {
    this.searchTerm = term;
    if (this.searchInput && this.searchInput.value !== term) this.searchInput.value = term;
    if (this.mode === "search") await this.render();
  }

  /** Setzt die farbigen, gelabelten Textstellen. */
  setAnnotations(annotations: TextAnnotation[]): void {
    this.annotations = annotations.map((entry) => ({ ...entry }));
    if (this.mode === "annotations") void this.render();
  }

  getAnnotations(): TextAnnotation[] {
    return this.annotations.map((entry) => ({ ...entry }));
  }

  private async render(): Promise<void> {
    if (!this.viewer) return;

    if (!this.sourceType) {
      this.viewer.innerHTML = `<div class="empty">PDF/TXT wählen oder Josephus-Demo öffnen.</div>`;
      this.status.textContent = "Kein Dokument";
      return;
    }

    this.status.textContent = `Lade ${this.fileName || "Dokument"} …`;
    this.viewer.replaceChildren();

    try {
      if (this.sourceType === "txt") {
        this.renderTextDocument();
      } else if (this.currentPdfData) {
        await this.renderPdf(this.currentPdfData.slice(0));
      }

      this.status.textContent = `${this.fileName} · ${this.mode === "search" ? "Suche" : "Annotationen"}`;
      this.dispatchEvent(new CustomEvent("viewer-rendered", { bubbles: true, composed: true }));
    } catch (error) {
      console.error(error);
      this.viewer.innerHTML = `<div class="empty">Dokument konnte nicht dargestellt werden.</div>`;
      this.status.textContent = "Fehler";
      this.dispatchEvent(new CustomEvent("viewer-error", {
        detail: error,
        bubbles: true,
        composed: true
      }));
    }
  }

  private renderTextDocument(): void {
    const page = document.createElement("article");
    page.className = "txt-page";

    const pre = document.createElement("pre");
    pre.className = "txt-document";

    const ranges = this.mode === "search"
      ? this.findRanges(this.currentText, this.searchTerm).map((range) => ({
          ...range,
          color: "#ffeb3b"
        }))
      : this.annotationRangesForText(this.currentText);

    this.appendHighlightedText(pre, this.currentText, ranges);
    page.appendChild(pre);
    this.viewer.appendChild(page);
  }

  private async renderPdf(data: ArrayBuffer): Promise<void> {
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: this.pdfScale });
      const outputScale = window.devicePixelRatio || 1;

      const wrapper = document.createElement("section");
      wrapper.className = "pdf-page";
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
      this.viewer.appendChild(wrapper);

      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas-Kontext nicht verfügbar.");

      await page.render({
        canvasContext: context,
        viewport,
        transform: outputScale !== 1
          ? [outputScale, 0, 0, outputScale, 0, 0]
          : undefined
      }).promise;

      const textContent = await page.getTextContent();
      const items = textContent.items
        .filter((item): item is TextItemLike => "str" in item && typeof item.str === "string")
        .map((item) => item as TextItemLike);

      const positioned = this.positionPdfTextItems(items, viewport);
      const pageText = this.pageTextFromItems(positioned);

      if (this.mode === "search") {
        const ranges = this.findRanges(pageText, this.searchTerm);
        for (const range of ranges) {
          this.drawPdfRange(highlightLayer, positioned, range.start, range.end, "#ffeb3b");
        }
      } else {
        for (const annotation of this.annotations) {
          if (annotation.page && annotation.page !== pageNumber) continue;
          const matches = this.findRanges(pageText, annotation.quote);
          const chosen = annotation.occurrence
            ? matches.filter((_, index) => index + 1 === annotation.occurrence)
            : matches;

          for (const match of chosen) {
            this.drawPdfRange(
              highlightLayer,
              positioned,
              match.start,
              match.end,
              annotation.color,
              annotation.label
            );
          }
        }
      }
    }
  }

  private positionPdfTextItems(items: TextItemLike[], viewport: { transform: number[]; scale: number }): PositionedTextItem[] {
    const result: PositionedTextItem[] = [];
    let cursor = 0;

    for (const item of items) {
      const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
      const fontHeight = Math.max(Math.hypot(tx[2], tx[3]), 1);
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

  private pageTextFromItems(items: PositionedTextItem[]): string {
    return items.map((item) => item.text).join(" ");
  }

  private drawPdfRange(
    layer: HTMLElement,
    items: PositionedTextItem[],
    start: number,
    end: number,
    color: string,
    label?: string
  ): void {
    let labelPlaced = false;

    for (const item of items) {
      const overlapStart = Math.max(start, item.start);
      const overlapEnd = Math.min(end, item.end);
      if (overlapStart >= overlapEnd || item.text.length === 0) continue;

      const startRatio = (overlapStart - item.start) / item.text.length;
      const endRatio = (overlapEnd - item.start) / item.text.length;

      const left = item.left + item.width * startRatio;
      const width = Math.max(item.width * (endRatio - startRatio), 2);

      const mark = document.createElement("div");
      mark.className = "highlight";
      mark.style.left = `${left}px`;
      mark.style.top = `${item.top}px`;
      mark.style.width = `${width}px`;
      mark.style.height = `${Math.max(item.height, 8)}px`;
      mark.style.background = color;
      mark.style.opacity = "0.34";
      layer.appendChild(mark);

      if (label && !labelPlaced) {
        const badge = document.createElement("div");
        badge.className = "highlight-label";
        badge.textContent = label;
        badge.style.left = `${left}px`;
        badge.style.top = `${Math.max(item.top, 14)}px`;
        badge.style.background = color;
        layer.appendChild(badge);
        labelPlaced = true;
      }
    }
  }

  private annotationRangesForText(text: string): TextRange[] {
    const ranges: TextRange[] = [];

    for (const annotation of this.annotations) {
      const matches = this.findRanges(text, annotation.quote);
      const chosen = annotation.occurrence
        ? matches.filter((_, index) => index + 1 === annotation.occurrence)
        : matches;

      for (const match of chosen) {
        ranges.push({
          ...match,
          color: annotation.color,
          label: annotation.label
        });
      }
    }

    return ranges.sort((a, b) => a.start - b.start || a.end - b.end);
  }

  private appendHighlightedText(container: HTMLElement, text: string, ranges: TextRange[]): void {
    const nonOverlapping: TextRange[] = [];
    let lastEnd = -1;

    for (const range of ranges) {
      if (range.start >= lastEnd) {
        nonOverlapping.push(range);
        lastEnd = range.end;
      }
    }

    let cursor = 0;
    for (const range of nonOverlapping) {
      if (range.start > cursor) {
        container.append(document.createTextNode(text.slice(cursor, range.start)));
      }

      const mark = document.createElement("mark");
      mark.className = "txt-mark";
      mark.textContent = text.slice(range.start, range.end);
      mark.style.background = `${range.color}66`;
      mark.style.setProperty("--label-color", range.color);
      if (range.label) mark.dataset.label = range.label;
      container.append(mark);
      cursor = range.end;
    }

    if (cursor < text.length) {
      container.append(document.createTextNode(text.slice(cursor)));
    }
  }

  private findRanges(text: string, query: string): Array<{ start: number; end: number }> {
    const needle = query.trim();
    if (!needle) return [];

    const haystackLower = text.toLocaleLowerCase();
    const needleLower = needle.toLocaleLowerCase();
    const ranges: Array<{ start: number; end: number }> = [];
    let cursor = 0;

    while (cursor < haystackLower.length) {
      const index = haystackLower.indexOf(needleLower, cursor);
      if (index === -1) break;
      ranges.push({ start: index, end: index + needle.length });
      cursor = index + Math.max(needle.length, 1);
    }

    return ranges;
  }
}
