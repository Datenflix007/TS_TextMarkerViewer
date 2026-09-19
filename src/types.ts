export type MarkerMode = "search" | "annotations";

export interface TextAnnotation {
  /** Eindeutige ID der Annotation. */
  id: string;
  /** Text, der im Dokument gesucht und markiert werden soll. */
  quote: string;
  /** Sichtbares Label über der Markierung. */
  label: string;
  /** CSS-Farbe, z. B. #ff9800 oder rgb(...). */
  color: string;
  /** Optional: nur auf dieser PDF-Seite markieren (1-basiert). */
  page?: number;
  /** Optional: nur das n-te Vorkommen markieren (1-basiert). */
  occurrence?: number;
}
