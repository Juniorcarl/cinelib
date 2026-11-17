import { db } from '../index';
import { MediaFile, ReviewStatus } from '../../types';

export const MediaRepository = {
  async insertFile(file: Omit<MediaFile, 'id' | 'createdAt' | 'updatedAt'>) {
    const query = `
      INSERT OR IGNORE INTO files (path, filename, size_bytes, duration_ms, category, title_id, poster_url, review_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return db.execute(query, [
      file.path,
      file.filename,
      file.sizeBytes,
      file.durationMs,
      file.category,
      file.titleId,
      file.posterUrl || null,
      file.reviewStatus,
    ]);
  },

  async getAllFiles() {
    const result = await db.execute("SELECT * FROM files");
    return result.rows as unknown as MediaFile[];
  },

  async getNeedsReviewFiles() {
    const result = await db.execute(
      "SELECT * FROM files WHERE review_status = 'needs_review'"
    );
    return result.rows as unknown as MediaFile[];
  },

  async confirmFile(id: number, category: string, titleId: number | null) {
    return db.execute(
      "UPDATE files SET review_status = 'confirmed', category = ?, title_id = ?, updated_at = datetime('now') WHERE id = ?",
      [category, titleId, id]
    );
  },

  async updatePoster(id: number, posterUrl: string) {
    return db.execute(
      "UPDATE files SET poster_url = ? WHERE id = ?",
      [posterUrl, id]
    );
  },

  // ADD THIS FUNCTION
  async saveProgress(fileId: number, positionMs: number, durationMs: number) {
    return db.execute(
      `INSERT INTO progress (file_id, position_ms, duration_ms, updated_at) 
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(file_id) DO UPDATE SET 
       position_ms = excluded.position_ms, 
       duration_ms = excluded.duration_ms,
       updated_at = datetime('now')`,
      [fileId, positionMs, durationMs]
    );
  }
};