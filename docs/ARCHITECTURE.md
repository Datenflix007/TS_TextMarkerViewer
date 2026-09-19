# TS_TextMarker Architecture

## Zielstruktur

```text
                 TS_TextMarkerCore
                         |
              +----------+----------+
              v                     v
     TS_TextMarkerViewer     zukuenftige Module
              ^
              |
     TS_TextMarkerEditor
```

Fuer den spaeteren Editor gilt:

```text
TS_TextMarkerEditor
       |
       +-- TS_TextMarkerCore
       |
       +-- TS_TextMarkerViewer
```

Der Viewer darf deshalb keine Editorlogik enthalten.

## Core

`TS_TextMarkerCore` ist ein eigenes Package:

```text
@datenflix007/ts-text-marker-core
```

Der Core enthaelt:

- `AnnotationDocument`
- `Annotation`
- `AnnotationLabel`
- `DocumentMetadata`
- `BoundingBox`
- `TextRange`
- `TextOccurrence`
- `validateAnnotationDocument`
- `findTextOccurrences`
- `resolveAnnotationRange`
- `getAnnotationLabel`
- `getLabelById`
- JSON-Serialisierung und weitere reine Utilities

Der Viewer importiert diese API direkt aus dem Package. Es gibt im Viewer kein eigenes konkurrierendes Annotation-Datenmodell mehr.

In der lokalen Entwicklungsumgebung loesen `tsconfig` und Vite den Package-Namen auf den benachbarten Checkout `../TS_TextMarkerCore` auf. Der Quellcode selbst verwendet trotzdem keine internen Core-Pfade.

## Viewer

`TS_TextMarkerViewer` ist eine read-only Web Component:

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
- Annotation-Labels anzeigen
- Label-Sichtbarkeit im Viewer toggeln
- Navigation und Zoom

Er ist nicht verantwortlich fuer:

- Annotationen erstellen
- Annotationen veraendern
- Annotationen loeschen
- Annotationen speichern
- Labelsets bearbeiten
- Kommentare bearbeiten
- Annotationen per Textauswahl erzeugen

## Datenfluss

```text
Core AnnotationDocument
        |
        v
Viewer validiert mit Core
        |
        v
Viewer loest Textbereiche und Labels mit Core auf
        |
        v
internes RenderHighlight[]
        |
        v
DOM / PDF Overlay
```

Das interne Render-Modell ist ausschliesslich Darstellung. Es ersetzt nicht das Core-Format und wird nicht nach aussen exportiert.

## Dependency-Richtung

```text
TS_TextMarkerCore
        ^
        |
TS_TextMarkerViewer
```

Der Viewer darf Core importieren. Der Core darf weder Viewer-spezifische Logik noch PDF.js, DOM APIs, Canvas oder Editorlogik importieren.

## Suchmodus

Im Suchmodus ruft der Viewer `findTextOccurrences` aus Core auf. Der Viewer entscheidet nur:

- welche CSS-Klasse genutzt wird
- welche Farbe Suchtreffer erhalten
- welcher Treffer aktiv ist
- wie Trefferzahl und Navigation dargestellt werden

Suchmarkierungen sind temporaer und veraendern das `AnnotationDocument` nicht.

## Annotationsmodus

Im Annotationsmodus ruft der Viewer Core-Funktionen auf:

- `validateAnnotationDocument` beim Setzen eines Dokuments
- `resolveAnnotationRange` fuer Textbereiche
- `getAnnotationLabel` fuer Name und Farbe

Annotationfarben kommen ausschliesslich ueber Labels:

```text
annotation.labelId -> label.id -> label.color
```

Der Viewer erwartet keine separate Farbe in einer Annotation.

## Viewer-spezifische Typen

Diese Typen bleiben bewusst im Viewer:

- `ViewerMode`
- `AnnotationDisplayStyle`
- `PdfRenderRequest`
- `PdfRenderStats`
- `TextRenderRequest`
- `TextRenderStats`
- `HighlightRange`
- PDF-Textpositionen und Overlay-Elemente

Sie beschreiben Darstellung und UI-Verhalten, nicht das gemeinsame Austauschformat.

## Editor-Vorbereitung

Der spaetere Editor soll das Core-Dokument besitzen und den Viewer nur aktualisieren:

```ts
viewer.setAnnotationDocument(
  editorState.annotationDocument
);
```

Wenn der Editor eine Annotation veraendert:

```text
Editor
  |
  v
AnnotationDocument aendern
  |
  v
viewer.setAnnotationDocument(updatedDocument)
  |
  v
Viewer rendert neu
```

Der Viewer bleibt dabei read-only.
