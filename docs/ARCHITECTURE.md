# TS_TextMarker Architecture

## Zielstruktur

```text
TS_TextMarker_Core
  - gemeinsame Datentypen
  - JSON-Datenmodell
  - Validierung
  - Serialisierung
  - dokumentunabhaengige Hilfsfunktionen

TS_TextMarker_Viewer
  - PDF darstellen
  - TXT darstellen
  - vorhandene Annotationen darstellen
  - Suchtreffer darstellen
  - Annotation-Labels darstellen
  - Navigation, Zoom und Dokumentdarstellung

TS_TextMarker_Editor
  - nutzt Core und Viewer
  - veraendert AnnotationDocument
  - exportiert wieder AnnotationDocument
```

Der aktuelle Stand bleibt in einem Repository, ist aber entlang dieser Grenzen strukturiert:

```text
src/
  core/
    types/
    validation/
    serialization/
    labels/
    index.ts
  viewer/
    TS_TextMarkerViewer.ts
    highlighting/
    pdf/
    text/
    index.ts
  index.ts
```

## Core

Core enthaelt das stabile JSON-Modell:

- `AnnotationDocument`
- `DocumentMetadata`
- `AnnotationLabel`
- `Annotation`
- optionale `AnnotationBoundingBox`

Ausserdem enthaelt Core:

- `validateAnnotationDocument`
- `assertAnnotationDocument`
- `parseAnnotationDocumentJson`
- `serializeAnnotationDocument`
- `cloneAnnotationDocument`
- `createLabelLookup`
- `getAnnotationLabel`

Der Viewer importiert Core-Typen nur ueber die oeffentliche Core-Schnittstelle:

```ts
import type { AnnotationDocument } from "../core";
```

Dieser Importpfad kann spaeter ohne API-Aenderung durch das Paket ersetzt werden:

```ts
import type { AnnotationDocument } from "@datenflix/ts-text-marker-core";
```

## Viewer

Der Viewer ist eine read-only Web Component:

```html
<ts-text-marker-viewer></ts-text-marker-viewer>
```

Er ist verantwortlich fuer:

- Dokument laden (`loadFile`, `loadText`)
- Suchmodus
- Annotationsmodus
- Treffer- und Annotation-Highlighting
- PDF-Canvas-Rendering mit Text-/Highlight-Layer
- TXT-Dokumentseite
- Navigation und Zoom

Er ist nicht verantwortlich fuer:

- Annotationen erstellen
- Annotationen veraendern
- Annotationen loeschen
- Annotationen speichern
- Labelsets bearbeiten
- Kommentare bearbeiten
- Annotationen per Textauswahl erzeugen

Demo-Daten liegen deshalb ausschliesslich in `demo/`.

## Editor-Vorbereitung

Der spaetere Editor soll getrennt entstehen:

```text
TS_TextMarker_Editor
    |
    v
nutzt TS_TextMarker_Viewer
    |
    v
liest und veraendert AnnotationDocument
    |
    v
exportiert wieder AnnotationDocument
```

Geplante Editor-Funktionen:

- Text auswaehlen
- Annotation hinzufuegen
- Annotation bearbeiten
- Annotation loeschen
- Label auswaehlen
- Kommentar hinzufuegen
- JSON importieren
- JSON exportieren

Diese Funktionen sind bewusst nicht im Viewer implementiert.

## Spaetere Repository-Trennung

Fuer getrennte Repositories waeren diese Schritte noetig:

1. `src/core` in ein eigenes Paket `@datenflix/ts-text-marker-core` verschieben.
2. Core-Paket mit eigener `package.json`, `tsconfig`, Tests und Build-Pipeline versehen.
3. Viewer-Imports von `../core` auf `@datenflix/ts-text-marker-core` umstellen.
4. Viewer-Paket als `@datenflix/ts-text-marker-viewer` mit Abhaengigkeit auf Core veroeffentlichen.
5. Demo- und Integrationstests gegen die Paketimporte laufen lassen.
6. Editor in ein drittes Paket verschieben und nur von Core und Viewer abhaengig machen.
