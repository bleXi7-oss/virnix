// Matches the three common YouTube URL formats, with or without https/www.
const ID_PATTERNS: [RegExp, number][] = [
  [/youtube\.com\/watch\?(?:[^#]*&)?v=([\w-]{11})/, 1],
  [/youtu\.be\/([\w-]{11})/, 1],
  [/youtube\.com\/shorts\/([\w-]{11})/, 1],
];

export function isValidYouTubeUrl(url: string): boolean {
  return ID_PATTERNS.some(([p]) => p.test(url));
}

export function getYouTubeVideoId(url: string): string | null {
  for (const [pattern, group] of ID_PATTERNS) {
    const match = url.match(pattern);
    if (match) return match[group];
  }
  return null;
}
