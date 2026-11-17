export type ReviewStatus = 'confirmed' | 'needs_review';

export interface MediaFile {
  id: number;
  path: string;
  filename: string;
  sizeBytes: number;
  durationMs: number | null;
  category: string | null;
  titleId: number | null;
  posterUrl: string | null;
  reviewStatus: ReviewStatus;
  // NEW: Metadata for grouping
  parsedTitle?: string; 
  seasonNumber?: number;
  episodeNumber?: number;
}