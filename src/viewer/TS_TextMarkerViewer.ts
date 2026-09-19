import type { AnnotationDocument, DocumentMetadata, DocumentType } from "../core";
import { assertAnnotationDocument, cloneAnnotationDocument } from "../core";
import {
  annotationHighlightRanges,
  searchHighlightRanges,
  type HighlightRange
} from "./highlighting/textRanges";
import { renderPdfDocument, type PdfRenderStats } from "./pdf/PdfRenderer";
import { renderTextDocument, type TextRenderStats } from "./text/TextRenderer";

export type ViewerMode = "search" | "annotations";

interface RenderSummary {
  pageCount: number;
  searchMatches: number;
  renderedRanges: number;
  pagesWithoutTextLayer: number[];
}

const css = `
  :host {
    --ts-marker-background: #e8edf2;
    --ts-marker-toolbar-background: #ffffff;
    --ts-marker-page-background: #ffffff;
    --ts-marker-border-color: #cfd7df;
    --ts-marker-search-color: #ffeb3b;
    --ts-marker-font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    --ts-marker-text-color: #1d232b;
    --ts-marker-muted-color: #5b6572;
    --ts-marker-accent-color: #2563eb;

    display: block;
    min-height: 520px;
    color: var(--ts-marker-text-color);
    font-family: var(--ts-marker-font-family);
  }

  * {
    box-sizing: border-box;
  }

  .shell {
    display: grid;
    grid-template-rows: auto auto 1fr;
    min-height: 520px;
    border: 1px solid var(--ts-marker-border-color);
    border-radius: 8px;
    overflow: hidden;
    background: var(--ts-marker-background);
  }

  .titlebar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-height: 46px;
    padding: 10px 14px;
    background: #f8fafc;
    border-bottom: 1px solid var(--ts-marker-border-color);
  }

  .title {
    margin: 0;
    font-size: 0.98rem;
    font-weight: 720;
  }

  .document-title {
    color: var(--ts-marker-muted-color);
    font-size: 0.84rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .toolbar {
    display: grid;
    gap: 8px;
    padding: 10px 12px;
    background: var(--ts-marker-toolbar-background);
    border-bottom: 1px solid var(--ts-marker-border-color);
  }

  .toolbar-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .spacer {
    flex: 1 1 auto;
  }

  button,
  select,
  input[type="search"],
  input[type="number"] {
    height: 32px;
    border: 1px solid #bfc8d2;
    border-radius: 6px;
    background: #fff;
    color: var(--ts-marker-text-color);
    font: inherit;
    font-size: 0.88rem;
  }

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 32px;
    padding: 0 10px;
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    background: #f1f5f9;
  }

  button:disabled,
  select:disabled,
  input:disabled {
    cursor: not-allowed;
    opacity: 0.58;
  }

  select {
    padding: 0 30px 0 10px;
  }

  input[type="search"] {
    width: min(340px, 100%);
    padding: 0 10px;
  }

  input[type="number"] {
    width: 56px;
    padding: 0 6px;
    text-align: center;
  }

  .file-input {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    overflow: hidden;
    white-space: nowrap;
  }

  .label {
    color: var(--ts-marker-muted-color);
    font-size: 0.82rem;
  }

  .metric {
    min-width: 74px;
    color: var(--ts-marker-muted-color);
    font-size: 0.82rem;
  }

  .page-status,
  .zoom-status {
    min-width: 76px;
    color: var(--ts-marker-muted-color);
    font-size: 0.84rem;
    text-align: center;
  }

  .document-area {
    min-height: 420px;
    max-height: 78vh;
    overflow: auto;
    padding: 24px;
    background:
      linear-gradient(45deg, rgb(255 255 255 / 18%) 25%, transparent 25%),
      var(--ts-marker-background);
    background-size: 18px 18px;
  }

  .document-stack {
    display: grid;
    justify-items: center;
    gap: 22px;
    min-width: min-content;
  }

  .empty {
    display: grid;
    place-items: center;
    min-height: 360px;
    color: var(--ts-marker-muted-color);
    text-align: center;
  }

  .pdf-page,
  .txt-page {
    position: relative;
    background: var(--ts-marker-page-background);
    box-shadow: 0 8px 28px rgb(15 23 42 / 16%);
  }

  .pdf-page canvas {
    display: block;
  }

  .txt-page {
    width: min(calc(760px * var(--ts-viewer-zoom)), 100%);
    min-height: calc(940px * var(--ts-viewer-zoom));
    padding: calc(58px * var(--ts-viewer-zoom)) calc(66px * var(--ts-viewer-zoom));
  }

  .txt-document {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    color: #1f2933;
    font-family: Georgia, "Times New Roman", serif;
    font-size: calc(17px * var(--ts-viewer-zoom));
    line-height: 1.68;
  }

  .txt-mark {
    border-radius: 3px;
    padding: 0 2px;
    color: inherit;
  }

  .txt-mark-annotation[data-label]::after {
    content: attr(data-label);
    display: inline-block;
    margin-left: 0.32rem;
    padding: 0 0.34rem;
    border-radius: 4px;
    background: var(--label-color);
    color: #fff;
    font-family: var(--ts-marker-font-family);
    font-size: 0.66em;
    font-weight: 720;
    line-height: 1.45;
    vertical-align: text-top;
  }

  .txt-mark-search[data-search-index].active-search {
    outline: 2px solid #111827;
    outline-offset: 1px;
  }

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
    opacity: 0.38;
  }

  .search-highlight.active-search {
    opacity: 0.62;
    outline: 2px solid #111827;
    outline-offset: 1px;
  }

  .highlight-label {
    position: absolute;
    transform: translateY(-100%);
    max-width: 220px;
    padding: 2px 5px;
    border-radius: 4px;
    color: #fff;
    font-size: 11px;
    font-weight: 720;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    z-index: 3;
    box-shadow: 0 1px 3px rgb(15 23 42 / 22%);
  }

  .page-notice {
    position: absolute;
    left: 14px;
    bottom: 14px;
    max-width: calc(100% - 28px);
    padding: 7px 9px;
    border: 1px solid #facc15;
    border-radius: 6px;
    background: #fef9c3;
    color: #713f12;
    font-size: 0.78rem;
  }

  @media (max-width: 720px) {
    .titlebar {
      align-items: flex-start;
      flex-direction: column;
      gap: 4px;
    }

    .toolbar-row {
      align-items: stretch;
    }

    input[type="search"] {
      flex: 1 1 220px;
    }

    .document-area {
      padding: 14px;
    }

    .txt-page {
      width: 100%;
      padding: calc(34px * var(--ts-viewer-zoom));
    }
  }
`;

export class TSTextMarkerViewer extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["demo-button-label"];
  }

  private readonly root: ShadowRoot;
  private initialized = false;
  private documentArea!: HTMLDivElement;
  private titleElement!: HTMLSpanElement;
  private fileInput!: HTMLInputElement;
  private modeSelect!: HTMLSelectElement;
  private searchInput!: HTMLInputElement;
  private matchMetric!: HTMLSpanElement;
  private pageStatus!: HTMLSpanElement;
  private pageInput!: HTMLInputElement;
  private zoomStatus!: HTMLSpanElement;
  private demoButton!: HTMLButtonElement;
  private previousMatchButton!: HTMLButtonElement;
  private nextMatchButton!: HTMLButtonElement;
  private previousPageButton!: HTMLButtonElement;
  private nextPageButton!: HTMLButtonElement;
  private zoomOutButton!: HTMLButtonElement;
  private zoomInButton!: HTMLButtonElement;

  private mode: ViewerMode = "search";
  private searchTerm = "";
  private annotationDocument: AnnotationDocument | null = null;
  private sourceType: DocumentType | null = null;
  private currentText = "";
  private currentPdfData: ArrayBuffer | null = null;
  private metadata: DocumentMetadata | null = null;
  private currentPage = 1;
  private pageCount = 0;
  private zoom = 1;
  private searchMatchCount = 0;
  private activeSearchIndex = 0;
  private renderToken = 0;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    this.root.innerHTML = `
      <style>${css}</style>
      <div class="shell">
        <div class="titlebar">
          <h2 class="title">TS TextMarker Viewer</h2>
          <span class="document-title">Kein Dokument</span>
        </div>
        <div class="toolbar" part="toolbar">
          <div class="toolbar-row">
            <input class="file-input" type="file" accept="application/pdf,.pdf,text/plain,.txt" />
            <button class="open-file" type="button">Datei öffnen</button>
            <button class="demo" type="button">Demo laden</button>
            <span class="label">Modus</span>
            <select class="mode" aria-label="Modus">
              <option value="search">Suche</option>
              <option value="annotations">Annotationen</option>
            </select>
            <span class="spacer"></span>
            <span class="page-status">Seite 0 / 0</span>
          </div>
          <div class="toolbar-row">
            <span class="label">Suche</span>
            <input class="search" type="search" placeholder="bellum" aria-label="Suchbegriff" />
            <button class="previous-match" type="button" aria-label="Vorheriger Treffer">←</button>
            <button class="next-match" type="button" aria-label="Nächster Treffer">→</button>
            <span class="metric match-metric">0 Treffer</span>
            <span class="spacer"></span>
            <button class="previous-page" type="button" aria-label="Vorherige Seite">‹</button>
            <input class="page-input" type="number" min="1" value="1" aria-label="Seite" />
            <button class="next-page" type="button" aria-label="Nächste Seite">›</button>
            <button class="zoom-out" type="button" aria-label="Verkleinern">−</button>
            <span class="zoom-status">100 %</span>
            <button class="zoom-in" type="button" aria-label="Vergroessern">+</button>
          </div>
        </div>
        <div class="document-area" part="document">
          <div class="empty">PDF/TXT wählen oder Demo laden.</div>
        </div>
      </div>
    `;
  }

  connectedCallback(): void {
    if (!this.initialized) {
      this.collectElements();
      this.bindEvents();
      this.initialized = true;
    }

    this.updateDemoButtonLabel();
    this.updateToolbarState();
    void this.render();
  }

  attributeChangedCallback(name: string): void {
    if (name === "demo-button-label" && this.initialized) {
      this.updateDemoButtonLabel();
    }
  }

  /** Loads a browser File. Supported formats are PDF and TXT. */
  async loadFile(file: File): Promise<void> {
    const lowerName = file.name.toLocaleLowerCase();

    if (file.type === "application/pdf" || lowerName.endsWith(".pdf")) {
      this.sourceType = "pdf";
      this.currentPdfData = await readFileAsArrayBuffer(file);
      this.currentText = "";
      this.metadata = metadataFromFile(file, "pdf");
      this.currentPage = 1;
      await this.render();
      return;
    }

    if (file.type === "text/plain" || lowerName.endsWith(".txt")) {
      await this.loadText(await readFileAsText(file), metadataFromFile(file, "txt"));
      return;
    }

    throw new Error("Supported file formats are .pdf and .txt.");
  }

  /** Loads plain text and renders it as a document page. */
  async loadText(text: string, metadata?: DocumentMetadata): Promise<void> {
    this.sourceType = "txt";
    this.currentText = text;
    this.currentPdfData = null;
    this.metadata = {
      id: metadata?.id ?? "text-document",
      title: metadata?.title ?? "Textdokument",
      source: metadata?.source,
      type: "txt"
    };
    this.currentPage = 1;
    await this.render();
  }

  /** Switches between neutral search highlights and label-based annotations. */
  setMode(mode: ViewerMode): void {
    if (mode !== "search" && mode !== "annotations") {
      throw new Error(`Unsupported viewer mode: ${mode}`);
    }

    this.mode = mode;
    this.activeSearchIndex = 0;
    this.updateToolbarState();
    void this.render();
  }

  /** Sets the case-insensitive search term. */
  setSearchTerm(term: string): void {
    this.searchTerm = term;
    this.activeSearchIndex = term.trim().length > 0 ? 1 : 0;

    if (this.initialized && this.searchInput.value !== term) {
      this.searchInput.value = term;
    }

    if (this.mode === "search") {
      void this.render();
    } else {
      this.updateToolbarState();
    }
  }

  /** Replaces the read-only annotation document used by annotation mode. */
  setAnnotationDocument(document: AnnotationDocument): void {
    assertAnnotationDocument(document);
    this.annotationDocument = cloneAnnotationDocument(document);

    if (this.mode === "annotations") {
      void this.render();
    } else {
      this.updateToolbarState();
    }
  }

  /** Clears the active search term and removes search highlights. */
  clearSearch(): void {
    this.setSearchTerm("");
  }

  /** Scrolls to a one-based page number when the current document has pages. */
  goToPage(page: number): void {
    if (this.pageCount < 1) return;

    this.currentPage = clamp(Math.round(page), 1, this.pageCount);
    this.updateToolbarState();

    const target = this.documentArea.querySelector<HTMLElement>(
      `[data-page-number="${this.currentPage}"]`
    );
    target?.scrollIntoView({ block: "start", inline: "nearest", behavior: "smooth" });
  }

  /** Sets viewer zoom. Values are clamped between 50% and 300%. */
  setZoom(zoom: number): void {
    this.zoom = clamp(Number.isFinite(zoom) ? zoom : 1, 0.5, 3);
    this.updateToolbarState();
    void this.render();
  }

  getCurrentPage(): number {
    return this.currentPage;
  }

  getPageCount(): number {
    return this.pageCount;
  }

  getZoom(): number {
    return this.zoom;
  }

  private collectElements(): void {
    this.documentArea = this.root.querySelector(".document-area")!;
    this.titleElement = this.root.querySelector(".document-title")!;
    this.fileInput = this.root.querySelector(".file-input")!;
    this.modeSelect = this.root.querySelector(".mode")!;
    this.searchInput = this.root.querySelector(".search")!;
    this.matchMetric = this.root.querySelector(".match-metric")!;
    this.pageStatus = this.root.querySelector(".page-status")!;
    this.pageInput = this.root.querySelector(".page-input")!;
    this.zoomStatus = this.root.querySelector(".zoom-status")!;
    this.demoButton = this.root.querySelector(".demo")!;
    this.previousMatchButton = this.root.querySelector(".previous-match")!;
    this.nextMatchButton = this.root.querySelector(".next-match")!;
    this.previousPageButton = this.root.querySelector(".previous-page")!;
    this.nextPageButton = this.root.querySelector(".next-page")!;
    this.zoomOutButton = this.root.querySelector(".zoom-out")!;
    this.zoomInButton = this.root.querySelector(".zoom-in")!;
  }

  private bindEvents(): void {
    const openButton = this.root.querySelector<HTMLButtonElement>(".open-file")!;

    openButton.addEventListener("click", () => this.fileInput.click());

    this.fileInput.addEventListener("change", () => {
      const file = this.fileInput.files?.[0];
      if (file) void this.loadFile(file);
    });

    this.demoButton.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("ts-demo-requested", { bubbles: true, composed: true }));
    });

    this.modeSelect.addEventListener("change", () => {
      this.setMode(this.modeSelect.value as ViewerMode);
    });

    this.searchInput.addEventListener("input", () => {
      this.setSearchTerm(this.searchInput.value);
    });

    this.previousMatchButton.addEventListener("click", () => this.moveSearchMatch(-1));
    this.nextMatchButton.addEventListener("click", () => this.moveSearchMatch(1));

    this.previousPageButton.addEventListener("click", () => this.goToPage(this.currentPage - 1));
    this.nextPageButton.addEventListener("click", () => this.goToPage(this.currentPage + 1));
    this.pageInput.addEventListener("change", () => this.goToPage(this.pageInput.valueAsNumber));

    this.zoomOutButton.addEventListener("click", () => this.setZoom(this.zoom - 0.1));
    this.zoomInButton.addEventListener("click", () => this.setZoom(this.zoom + 0.1));
  }

  private async render(): Promise<void> {
    if (!this.initialized) return;

    const token = ++this.renderToken;
    this.searchMatchCount = 0;
    this.documentArea.replaceChildren();

    if (!this.sourceType) {
      this.pageCount = 0;
      this.currentPage = 0;
      this.documentArea.innerHTML = `<div class="empty">PDF/TXT wählen oder Demo laden.</div>`;
      this.updateToolbarState();
      this.dispatchRendered();
      return;
    }

    this.documentArea.innerHTML = `<div class="empty">Dokument wird geladen ...</div>`;

    try {
      const stack = document.createElement("div");
      stack.className = "document-stack";
      const summary = await this.renderCurrentDocument(stack);

      if (token !== this.renderToken) return;

      this.pageCount = summary.pageCount;
      this.currentPage = clamp(this.currentPage || 1, 1, Math.max(summary.pageCount, 1));
      this.searchMatchCount = summary.searchMatches;
      this.documentArea.replaceChildren(stack);
      this.updateToolbarState(summary);
      this.activateSearchMatch(false);
      this.dispatchRendered(summary);
    } catch (error) {
      if (token !== this.renderToken) return;

      this.documentArea.innerHTML = `<div class="empty">Dokument konnte nicht dargestellt werden.</div>`;
      this.titleElement.textContent = "Fehler";
      this.dispatchEvent(new CustomEvent("ts-viewer-error", {
        detail: error,
        bubbles: true,
        composed: true
      }));
    }
  }

  private async renderCurrentDocument(container: HTMLElement): Promise<RenderSummary> {
    if (this.sourceType === "txt") {
      const ranges = this.textHighlightRanges();
      const stats = renderTextDocument({
        container,
        text: this.currentText,
        ranges,
        zoom: this.zoom,
        searchMode: this.mode === "search"
      });

      return this.summaryFromTextStats(stats, ranges);
    }

    if (this.sourceType === "pdf" && this.currentPdfData) {
      const stats = await renderPdfDocument({
        container,
        data: this.currentPdfData.slice(0),
        zoom: this.zoom,
        mode: this.mode,
        searchTerm: this.searchTerm,
        annotationDocument: this.annotationDocument
      });

      return this.summaryFromPdfStats(stats);
    }

    return {
      pageCount: 0,
      searchMatches: 0,
      renderedRanges: 0,
      pagesWithoutTextLayer: []
    };
  }

  private textHighlightRanges(): HighlightRange[] {
    if (this.mode === "search") {
      return searchHighlightRanges(this.currentText, this.searchTerm);
    }

    return annotationHighlightRanges(this.currentText, this.annotationDocument);
  }

  private summaryFromTextStats(stats: TextRenderStats, ranges: HighlightRange[]): RenderSummary {
    return {
      pageCount: stats.pageCount,
      searchMatches: this.mode === "search" ? ranges.length : 0,
      renderedRanges: stats.renderedRanges,
      pagesWithoutTextLayer: []
    };
  }

  private summaryFromPdfStats(stats: PdfRenderStats): RenderSummary {
    return {
      pageCount: stats.pageCount,
      searchMatches: stats.searchMatches,
      renderedRanges: stats.renderedRanges,
      pagesWithoutTextLayer: stats.pagesWithoutTextLayer
    };
  }

  private updateToolbarState(summary?: RenderSummary): void {
    if (!this.initialized) return;

    const hasDocument = this.sourceType !== null;
    const annotationsCount = this.annotationDocument?.annotations.length ?? 0;
    const missingTextLayer = summary?.pagesWithoutTextLayer.length ?? 0;

    this.titleElement.textContent = this.metadata?.title ?? this.metadata?.source ?? "Kein Dokument";
    this.modeSelect.value = this.mode;
    this.searchInput.value = this.searchTerm;
    this.searchInput.disabled = this.mode !== "search" || !hasDocument;
    this.previousMatchButton.disabled = this.mode !== "search" || this.searchMatchCount < 1;
    this.nextMatchButton.disabled = this.mode !== "search" || this.searchMatchCount < 1;
    this.matchMetric.textContent = this.mode === "search"
      ? this.searchMetricText()
      : `${annotationsCount} Annotationen`;

    if (missingTextLayer > 0 && this.mode === "search") {
      this.matchMetric.textContent += ` · ${missingTextLayer} ohne Text`;
    }

    this.pageStatus.textContent = `Seite ${this.currentPage || 0} / ${this.pageCount || 0}`;
    this.pageInput.disabled = !hasDocument || this.pageCount < 1;
    this.pageInput.value = String(this.currentPage || 1);
    this.pageInput.max = String(Math.max(this.pageCount, 1));
    this.previousPageButton.disabled = !hasDocument || this.currentPage <= 1;
    this.nextPageButton.disabled = !hasDocument || this.currentPage >= this.pageCount;

    this.zoomStatus.textContent = `${Math.round(this.zoom * 100)} %`;
    this.zoomOutButton.disabled = !hasDocument || this.zoom <= 0.5;
    this.zoomInButton.disabled = !hasDocument || this.zoom >= 3;
  }

  private searchMetricText(): string {
    if (this.searchTerm.trim().length === 0) return "0 Treffer";
    if (this.searchMatchCount === 0) return "0 Treffer";

    const current = clamp(this.activeSearchIndex || 1, 1, this.searchMatchCount);
    return `${current} / ${this.searchMatchCount}`;
  }

  private moveSearchMatch(direction: -1 | 1): void {
    if (this.searchMatchCount < 1) return;

    const next = this.activeSearchIndex + direction;
    this.activeSearchIndex = next < 1
      ? this.searchMatchCount
      : next > this.searchMatchCount
        ? 1
        : next;

    this.activateSearchMatch(true);
    this.updateToolbarState();
  }

  private activateSearchMatch(scroll: boolean): void {
    const marks = [...this.root.querySelectorAll<HTMLElement>("[data-search-index]")];
    marks.forEach((mark) => mark.classList.remove("active-search"));

    if (this.mode !== "search" || this.searchMatchCount < 1) return;

    this.activeSearchIndex = clamp(this.activeSearchIndex || 1, 1, this.searchMatchCount);
    const activeMarks = marks.filter((mark) => mark.dataset.searchIndex === String(this.activeSearchIndex));
    activeMarks.forEach((mark) => mark.classList.add("active-search"));

    if (scroll) {
      activeMarks[0]?.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
    }
  }

  private updateDemoButtonLabel(): void {
    this.demoButton.textContent = this.getAttribute("demo-button-label") ?? "Demo laden";
  }

  private dispatchRendered(summary?: RenderSummary): void {
    this.dispatchEvent(new CustomEvent("ts-viewer-rendered", {
      detail: {
        mode: this.mode,
        pageCount: this.pageCount,
        currentPage: this.currentPage,
        zoom: this.zoom,
        searchMatches: this.searchMatchCount,
        renderedRanges: summary?.renderedRanges ?? 0,
        pagesWithoutTextLayer: summary?.pagesWithoutTextLayer ?? []
      },
      bubbles: true,
      composed: true
    }));
  }
}

function metadataFromFile(file: File, type: DocumentType): DocumentMetadata {
  return {
    id: file.name.replace(/\.[^.]+$/, "") || "document",
    title: file.name,
    source: file.name,
    type
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

async function readFileAsText(file: File): Promise<string> {
  const maybeModernFile = file as File & {
    text?: () => Promise<string>;
    arrayBuffer?: () => Promise<ArrayBuffer>;
  };

  if (typeof maybeModernFile.text === "function") {
    return maybeModernFile.text();
  }

  const buffer = await readFileAsArrayBuffer(file);
  return new TextDecoder().decode(buffer);
}

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  const maybeModernFile = file as File & {
    arrayBuffer?: () => Promise<ArrayBuffer>;
  };

  if (typeof maybeModernFile.arrayBuffer === "function") {
    return maybeModernFile.arrayBuffer();
  }

  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        resolve(new TextEncoder().encode(String(reader.result ?? "")).buffer);
      }
    });
    reader.addEventListener("error", () => reject(reader.error ?? new Error("File could not be read.")));
    reader.readAsArrayBuffer(file);
  });
}
