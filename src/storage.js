const MATCH_STORAGE_KEY = 'lol-teamfight-matches-v1';

export function loadMatches() {
  if (typeof localStorage === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(MATCH_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to load matches from storage:', error);
  }

  return [];
}

export function saveMatches(matches) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(MATCH_STORAGE_KEY, JSON.stringify(matches));
  } catch (error) {
    console.warn('Failed to save matches:', error);
  }
}
