# TS_TextMarkerViewer

Kleine framework-unabhängige TypeScript-Web-Component zum Anzeigen und Markieren von PDF- und TXT-Dokumenten.

## Funktionen

- PDF-Darstellung über PDF.js als gerenderte Originalseiten.
- TXT-Darstellung als dokumentartige Seite mit erhaltener Zeilen-/Absatzstruktur.
- Suchmodus: alle Vorkommen eines Worts/einer Phrase markieren.
- Annotationsmodus: unterschiedliche Textstellen mit Farbe und Label markieren.
- Browser-Dateiauswahl für `.pdf` und `.txt`.
- Programmierschnittstelle für die Einbettung in andere TypeScript-UIs.
- Josephus-Demo ohne externe Datei.

## Start

```bash
npm install
npm run dev
```

oder mit `just`:

```bash
just install
just dev
```

## Einbindung

```ts
import "@datenflix/ts-text-marker-viewer";
import type { TSTextMarkerViewer } from "@datenflix/ts-text-marker-viewer";

const viewer = document.querySelector<TSTextMarkerViewer>("#viewer")!;

await viewer.setMode("search");
await viewer.setSearchTerm("bellum");
```

```html
<ts-text-marker-viewer id="viewer"></ts-text-marker-viewer>
```

### Annotationen

```ts
viewer.setAnnotations([
  {
    id: "person-1",
    quote: "Romani",
    label: "Akteur: Römer",
    color: "#7e57c2"
  },
  {
    id: "place-1",
    quote: "Hierosolyma",
    label: "Ort: Jerusalem",
    color: "#ef5350"
  }
]);

await viewer.setMode("annotations");
```

Optional können PDF-Seite und Vorkommen eingeschränkt werden:

```ts
{
  id: "war-2",
  quote: "bellum",
  label: "zweites Vorkommen auf Seite 3",
  color: "#ff9800",
  page: 3,
  occurrence: 2
}
```

## PDF/OCR-Hinweis

Die PDF-Seite selbst wird als Canvas gerendert, deshalb bleibt das sichtbare Layout des PDF erhalten. Die Markierungen werden anhand der Textschicht des PDF berechnet.

Das bedeutet:

- normales PDF mit Text: funktioniert;
- gescanntes PDF mit vorhandener OCR-Textschicht: funktioniert;
- reines Bild-PDF ohne OCR-Textschicht: wird angezeigt, kann aber noch nicht durchsucht/markiert werden.

Für reine Bildscans kann später z. B. ein OCR-Adapter ergänzt werden, der erkannte Wörter samt Bounding Boxes an den Viewer übergibt.

## Bewusste Vereinfachungen der Version 0.1

- PDF-Markierungen werden aus PDF.js-Textitems geometrisch angenähert; für komplexe Schriften/Rotationen kann eine spätere TextLayer-Integration genauer sein.
- Überlappende TXT-Annotationen werden in dieser einfachen Version nicht verschachtelt.
- Zoom, Seiten-Navigation, Miniaturen und persistente Annotationen sind noch nicht enthalten.
