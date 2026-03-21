/**
 * Bot API key authentication.
 * All /api/bot/* endpoints call this before doing anything.
 */
export function checkBotKey(request: Request): Response | null {
  const expectedKey = process.env.BOT_API_KEY;
  if (!expectedKey) {
    return Response.json(
      { success: false, error: 'Bot API not configured on server' },
      { status: 503 }
    );
  }

  const provided = request.headers.get('X-Bot-Key');
  if (provided !== expectedKey) {
    return Response.json(
      { success: false, error: 'Unauthorized: invalid or missing X-Bot-Key header' },
      { status: 401 }
    );
  }

  return null; // auth passed
}

/**
 * Extract a numeric likes count from an outreach_notes string.
 * Looks for patterns like "likes: 12k", "1.2万点赞", "❤️ 5,432", etc.
 * Returns 0 if nothing is found.
 */
export function extractLikes(notes: string | null | undefined): number {
  if (!notes) return 0;

  // Pattern: explicit "likes:" / "赞:" label followed by a number
  const labelMatch = notes.match(
    /(?:likes?|❤️|点赞|赞)[:\s]*([0-9][0-9,_.]*)\s*([kKwW万]?)/i
  );
  if (labelMatch) return parseShorthand(labelMatch[1], labelMatch[2]);

  // Pattern: bare number followed by "likes" / "赞"
  const suffixMatch = notes.match(
    /([0-9][0-9,_.]*)\s*([kKwW万]?)\s*(?:likes?|❤️|点赞|赞)/i
  );
  if (suffixMatch) return parseShorthand(suffixMatch[1], suffixMatch[2]);

  // Fallback: first standalone number >= 10 (avoid matching dates/IDs)
  const numMatch = notes.match(/\b([0-9][0-9,_.]{1,})\b/);
  if (numMatch) {
    const n = parseInt(numMatch[1].replace(/[,_]/g, ''), 10);
    if (n >= 10) return n;
  }

  return 0;
}

function parseShorthand(digits: string, suffix: string): number {
  const base = parseFloat(digits.replace(/[,_]/g, ''));
  const s = suffix.toLowerCase();
  if (s === 'k') return Math.round(base * 1_000);
  if (s === 'w' || s === '万') return Math.round(base * 10_000);
  return Math.round(base);
}

export type LikesTier = '<1k' | '1k-5k' | '5k-20k' | '20k-100k' | '100k+';

export function likesToTier(likes: number): LikesTier {
  if (likes < 1_000) return '<1k';
  if (likes < 5_000) return '1k-5k';
  if (likes < 20_000) return '5k-20k';
  if (likes < 100_000) return '20k-100k';
  return '100k+';
}
