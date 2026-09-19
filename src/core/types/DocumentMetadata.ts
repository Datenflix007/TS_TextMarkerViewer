export type DocumentType = "pdf" | "txt";

export interface DocumentMetadata {
  id: string;
  title?: string;
  source?: string;
  type?: DocumentType;
}
