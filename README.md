# TS_TextMarkerViewer

![TS_TextMarkerViewer Demo UI](docs/images/viewer-demo-annotations.png)

Framework-unabhaengige TypeScript-Web-Component zum Anzeigen von PDF- und TXT-Dokumenten mit Suche und read-only Annotationen.

Der Viewer enthaelt keine Editorlogik: Er erstellt, veraendert, loescht und speichert keine Annotationen. Annotationen werden als `AnnotationDocument` aus dem Core-Modell uebergeben und nur dargestellt.

## Installation

```bash
npm install
```

Spaeter vorgesehen:

```bash
npm install @datenflix/ts-text-marker-viewer
```

## Grundverwendung

```html
<ts-text-marker-viewer id="viewer"></ts-text-marker-viewer>
```

```ts
import "@datenflix/ts-text-marker-viewer";
import type { TSTextMarkerViewer } from "@datenflix/ts-text-marker-viewer";

const viewer = document.querySelector<TSTextMarkerViewer>(
  "ts-text-marker-viewer"
);

await viewer?.loadText("bellum et pax", {
  id: "demo",
  title: "Demo",
  type: "txt"
});
```

## Oeffentliche API

```ts
loadFile(file: File): Promise<void>;
loadText(text: string, metadata?: DocumentMetadata): Promise<void>;
setMode(mode: "search" | "annotations"): void;
setSearchTerm(term: string): void;
setAnnotationDocument(document: AnnotationDocument): void;
setAnnotationDisplayStyle(style: "inline" | "bracket"): void;
setAnnotationLabelVisibility(labelId: string, visible: boolean): void;
clearSearch(): void;
goToPage(page: number): void;
setZoom(zoom: number): void;
getCurrentPage(): number;
getPageCount(): number;
getZoom(): number;
getAnnotationDisplayStyle(): "inline" | "bracket";
getHiddenAnnotationLabelIds(): string[];
```

Die Web Component wird automatisch registriert:

```ts
if (!customElements.get("ts-text-marker-viewer")) {
  customElements.define("ts-text-marker-viewer", TSTextMarkerViewer);
}
```

## Verwendung Mit Core

Das zentrale JSON-Modell liegt in `src/core` und ist so vorbereitet, dass es spaeter als `@datenflix/ts-text-marker-core` ausgelagert werden kann.

```ts
import type {
  AnnotationDocument
} from "@datenflix/ts-text-marker-core";

const annotations: AnnotationDocument = {
  version: "1.0",
  document: {
    id: "josephus-demo",
    title: "Flavius Josephus - Bellum Judaicum",
    type: "txt"
  },
  labels: [
    { id: "person", name: "Person", color: "#7e57c2" },
    { id: "place", name: "Ort", color: "#ef5350" },
    { id: "conflict", name: "Konflikt", color: "#ff9800" }
  ],
  annotations: [
    {
      id: "ann-001",
      labelId: "person",
      quote: "Vespasianus"
    }
  ]
};

viewer?.setAnnotationDocument(annotations);
```

Labels liefern Anzeigename und Farbe. Annotationen referenzieren Labels ueber `labelId`; dadurch werden Farbe und Anzeigename nicht redundant in jeder Annotation gespeichert.

## PDF Laden

```ts
await viewer?.loadFile(pdfFile);
```

PDFs werden mit `pdfjs-dist` als Canvas-Seiten gerendert. Das originale Layout bleibt sichtbar; Suche und Annotationen werden aus der vorhandenen Textschicht als Layer darueber gelegt. Reine Bildscans werden angezeigt, aber ohne OCR-Textschicht nicht durchsucht.

## TXT Laden

```ts
await viewer?.loadFile(txtFile);
```

oder direkt:

```ts
await viewer?.loadText("Vespasianus bellum narrat.", {
  id: "txt-demo",
  title: "TXT Demo",
  type: "txt"
});
```

TXT wird als Dokumentseite mit weissem Seitenhintergrund, Schatten, angenehmer Satzbreite und erhaltenen Absatzumbruechen dargestellt. Der Text bleibt selektierbar.

## Suche

```ts
viewer?.setMode("search");
viewer?.setSearchTerm("bellum");
```

Die Suche ist standardmaessig case-insensitive und markiert alle Treffer neutral gelb. Annotationfarben werden dadurch nicht veraendert.

## Annotationen

```ts
viewer?.setMode("annotations");
viewer?.setAnnotationDocument(annotationDocument);
viewer?.setAnnotationDisplayStyle("bracket");
viewer?.setAnnotationLabelVisibility("conflict", false);
```

Links neben dem Dokument zeigt der Viewer die Labels des `AnnotationDocument`. Ein Klick auf ein Label blendet alle Markierungen dieses Labels aus; das Label wird grau. Ein weiterer Klick blendet es wieder ein.

Annotationen koennen ueber `quote`, `page`, `occurrence` sowie bei TXT ueber `start` und `end` lokalisiert werden. Das Datenmodell enthaelt zudem eine optionale `boundingBox`, damit spaeter exaktere PDF- und OCR-Integrationen moeglich sind.

## Demo

Die Demo unter `demo/` ist wie eine Consumer-Anwendung aufgebaut. `demo/main.ts` importiert nur oeffentliche APIs:

```ts
import "@datenflix/ts-text-marker-viewer";
import type { AnnotationDocument } from "@datenflix/ts-text-marker-core";
import type { TSTextMarkerViewer } from "@datenflix/ts-text-marker-viewer";
```

### Suchmodus

![Suchmodus](docs/images/viewer-demo-search.png)

### Annotationen

![Annotationsmodus](docs/images/viewer-demo-annotations.png)

### Annotationen Variante 2

![Annotationsmodus Variante 2](docs/images/viewer-demo-annotations-bracket.png)

### Dokumentansicht

![Dokumentenansicht](docs/images/viewer-demo-document.png)

Die Screenshots werden aus der echten Demo erzeugt:

```bash
npm run screenshots
```

## Architektur

```text
                    +-----------------------+
                    | TS_TextMarker_Core    |
                    | JSON / Types / Schema |
                    +-----------+-----------+
                                |
                    +-----------v-----------+
                    | TS_TextMarker_Viewer  |
                    | PDF / TXT / Highlights|
                    +-----------+-----------+
                                |
                    +-----------v-----------+
                    | TS_TextMarker_Editor  |
                    | Bearbeitung           |
                    +-----------------------+
```

- Core enthaelt Datenmodell, Validierung, Serialisierung und dokumentunabhaengige Hilfsfunktionen.
- Viewer ist read-only und importiert Core-Typen ueber `src/core`.
- Editor wird spaeter auf Viewer und Core aufgebaut und bleibt getrennt vom Viewer.

Weitere Details stehen in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Entwicklung

```bash
npm run dev
npm run lint
npm run build
npm test
npm run test:e2e
```

Mit `just`:

```bash
just install
just dev
just check
just screenshots
```
