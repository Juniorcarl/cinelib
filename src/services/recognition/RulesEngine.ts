export interface ParsedMedia {
  title: string;
  year: number | null;
  category: 'Movie' | 'Series' | 'Anime' | 'Documentary' | 'Unknown';
  seasonNumber: number;
  episodeNumber: number;
  confidence: 'high' | 'medium' | 'low';
}

export const parseFilename = (filename: string, folder: string = ''): ParsedMedia => {
  let cleanName = filename.replace(/\.[^/.]+$/, "").toLowerCase();
  let originalName = filename.replace(/\.[^/.]+$/, "");
  let seasonNumber = 1;
  let episodeNumber = 1;
  let confidence: 'high' | 'medium' | 'low' = 'low';

  // 1. Junk Filter (Ignore personal videos, WhatsApp, etc.)
  const junkKeywords = ['whatsapp', 'screen record', 'camera', 'dcim', 'video_', 'vid_'];
  const isJunk = junkKeywords.some(keyword => cleanName.includes(keyword) || folder.toLowerCase().includes(keyword));
  
  if (isJunk) {
    return { title: '', year: null, category: 'Unknown', seasonNumber: 0, episodeNumber: 0, confidence: 'low' };
  }

  // 2. Extract Season and Episode
  const seMatch = cleanName.match(/s(\d+)[\s._-]*e(\d+)/i);
  if (seMatch) {
    seasonNumber = parseInt(seMatch[1], 10);
    episodeNumber = parseInt(seMatch[2], 10);
    confidence = 'high';
  }

  // 3. Extract Year
  const yearMatch = originalName.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : null;
  if (year) confidence = 'high';

  // 4. Clean Title
  let title = originalName.replace(/s\d+[\s._-]*e\d+/gi, "").replace(/[._]/g, " ").trim();
  if (yearMatch) title = title.replace(yearMatch[0], "").trim();
  
  // Remove junk words from title
  const junkWords = ["1080p", "720p", "4k", "bluray", "webrip", "x264", "x265", "hevc", "aac"];
  junkWords.forEach(word => { title = title.replace(new RegExp(`\\b${word}\\b`, 'gi'), ""); });
  title = title.replace(/\s+/g, " ").trim();

  // 5. Determine Category with Confidence Scoring
  let category: ParsedMedia['category'] = 'Unknown';
  const combinedContext = `${folder} ${cleanName}`.toLowerCase();

  if (combinedContext.includes('anime') || combinedContext.includes('sub')) {
    category = 'Anime';
    confidence = 'high';
  } else if (combinedContext.includes('documentary') || combinedContext.includes('bbc') || combinedContext.includes('natgeo')) {
    category = 'Documentary';
    confidence = 'high';
  } else if (seMatch) {
    category = 'Series';
  } else if (year) {
    category = 'Movie';
  } else if (folder.toLowerCase().includes('movies')) {
    category = 'Movie';
    confidence = 'medium';
  } else if (folder.toLowerCase().includes('series') || folder.toLowerCase().includes('tv')) {
    category = 'Series';
    confidence = 'medium';
  }

  // If we don't know what it is, mark it as Unknown with low confidence
  return { title, year, category, seasonNumber, episodeNumber, confidence };
};