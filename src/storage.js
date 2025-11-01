
const MATCH_STORAGE_KEY = 'lol-teamfight-matches-v2';
const LEGACY_KEYS = ['lol-teamfight-matches-v1'];

function readMatchesFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.warn(`Failed to read matches from ${key}:`, error);
    return null;
  }
}

export function loadMatches() {
  if (typeof localStorage === 'undefined') {
    return [];
  }

  const current = readMatchesFromStorage(MATCH_STORAGE_KEY);
  if (current) {
    return current;
  }

  for (const legacyKey of LEGACY_KEYS) {
    const legacy = readMatchesFromStorage(legacyKey);
    if (legacy) {
      return legacy;
    }
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
