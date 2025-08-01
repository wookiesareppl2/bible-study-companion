// Robust utility for safe JSON parsing from cache/localStorage
// If corrupted, logs a warning, removes the key, and triggers optional callback for UI feedback.
export function robustSafeParse<T>(key: string, fallback: T, onCorrupt?: () => void): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`[Cache] Corrupted data in localStorage for key "${key}". Resetting to default.`, e);
    localStorage.removeItem(key);
    if (onCorrupt) onCorrupt();
    return fallback;
  }
}

// Deprecated: use robustSafeParse instead
export function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

