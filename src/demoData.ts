import type { TextAnnotation } from "./types";

/**
 * Demonstrativer lateinischer Text nach Motiven aus Flavius Josephus,
 * Bellum Iudaicum. Er dient ausschließlich als lokaler Demo-/Blindtext
 * und ist nicht als zitierfähige Edition gedacht.
 */
export const JOSEPHUS_DEMO_TEXT = `FLAVIUS IOSEPHUS — BELLUM IUDAICUM

De bello Iudaeorum et de urbe Hierosolymorum

Cum per totam Iudaeam magna esset perturbatio, alii pacem cupiebant,
alii autem arma parabant. Hierosolyma, urbs antiqua et clara, multitudine
hominum completa erat. In templo sacerdotes ritus maiores servabant,
dum extra muros rumor belli cotidie crescebat.

Iosephus narrat non solum pugnas et exercitus, sed etiam consilia,
dissensiones civium atque timorem eorum qui pacem desiderabant.
Romani disciplina et multitudine militum valebant; Iudaei autem locorum
scientia atque fortitudine resistebant.

Urbs saepe in narratione quasi centrum rerum apparet. Verba bellum,
pax, urbs et populus iterantur, quia historia de conflictu civili atque
de imperio Romano simul agitur.

[Textus demonstrativus ad probationem componentis.]`;

export const JOSEPHUS_DEMO_ANNOTATIONS: TextAnnotation[] = [
  {
    id: "city",
    quote: "Hierosolyma",
    label: "Ort: Jerusalem",
    color: "#ef5350"
  },
  {
    id: "war",
    quote: "bellum",
    label: "Konfliktbegriff",
    color: "#ff9800"
  },
  {
    id: "peace",
    quote: "pacem",
    label: "Friedensbegriff",
    color: "#42a5f5"
  },
  {
    id: "romans",
    quote: "Romani",
    label: "Akteur: Römer",
    color: "#7e57c2"
  }
];
