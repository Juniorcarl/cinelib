import { MediaRepository } from '../../database/repositories/mediaRepository';
import { parseFilename } from '../recognition/RulesEngine';

const MOCK_FILES = [
  "The.Matrix.1999.1080p.BluRay.mkv",
  "Breaking.Bad.S01E01.720p.WEBRip.mp4",
  "Attack.on.Titan.S04E01.1080p.mkv",
  "Planet.Earth.2006.Documentary.mkv",
  "Inception.2010.2160p.4k.mkv",
  "Stranger.Things.S02E03.1080p.mp4"
];

export const injectMockData = async () => {
  for (const filename of MOCK_FILES) {
    const parsed = parseFilename(filename);
    
    // Insert into database
    await MediaRepository.insertFile({
      path: `/storage/emulated/0/Movies/${filename}`,
      filename: filename,
      sizeBytes: 1500000000, // Fake 1.5GB size
      durationMs: 7200000,   // Fake 2 hours
      category: parsed.category === 'Unknown' ? null : parsed.category,
      titleId: null,
      posterUrl: null,       // <-- Add this line
      reviewStatus: 'confirmed',
    });
  }
  return MOCK_FILES.length;
};