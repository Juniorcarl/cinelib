import { MediaFile } from '../../types';

const TMDB_API_KEY = '1d8b01f5afa6e96b237e55e9a15a5749';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export const fetchMoviePoster = async (title: string): Promise<string | null> => {
  try {
    const cleanTitle = encodeURIComponent(title);
    const response = await fetch(`${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${cleanTitle}`);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      // Find the first result that has a poster
      const validResult = data.results.find((r: any) => r.poster_path);
      if (validResult) {
        return `${IMAGE_BASE_URL}${validResult.poster_path}`;
      }
    }
    return null;
  } catch (error) {
    console.error('TMDB Fetch Error:', error);
    return null;
  }
};