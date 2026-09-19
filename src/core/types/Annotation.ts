export interface AnnotationBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Annotation {
  id: string;
  labelId: string;
  quote: string;
  page?: number;
  occurrence?: number;
  start?: number;
  end?: number;
  comment?: string;
  metadata?: Record<string, unknown>;
  boundingBox?: AnnotationBoundingBox;
}
