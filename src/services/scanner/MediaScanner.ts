import { NativeModules } from 'react-native';
import { MediaRepository } from '../../database/repositories/mediaRepository';
import { parseFilename } from '../recognition/RulesEngine';

interface NativeVideo {
  id: number;
  filename: string;
  sizeBytes: number;
  durationMs: number;
  path: string;
  folder: string;
}

const { MediaScanner } = NativeModules;

export const scanDeviceForVideos = async () => {
  try {
    const videos: NativeVideo[] = await MediaScanner.scanVideos();
    let savedCount = 0;

    for (const video of videos) {
      const parsed = parseFilename(video.filename, video.folder);

      // If it's junk or we are not confident, skip it (or mark as needs_review)
      if (parsed.category === 'Unknown') {
        continue; 
      }

      await MediaRepository.insertFile({
        path: video.path,
        filename: video.filename,
        sizeBytes: video.sizeBytes,
        durationMs: video.durationMs,
        category: parsed.category,
        titleId: null,
        posterUrl: null,
        reviewStatus: parsed.confidence === 'high' ? 'confirmed' : 'needs_review',
      });
      savedCount++;
    }
    
    return savedCount;
  } catch (error) {
    console.error('Failed to scan videos:', error);
    throw error;
  }
};