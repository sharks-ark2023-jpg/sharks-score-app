import { Match } from '@/types';
import { isHoliday } from 'holiday-jp';

export interface TopScorer {
  name: string;
  goals: number;
}

export type RankingFilter = 'all' | 'tournament' | 'friendly' | 'saturday' | 'sunday' | 'holiday';

function parseScorerEntry(entry: string): { name: string; goals: number } {
  const matchedEntry = entry.match(/^(.+)\((\d+)\)$/);
  if (!matchedEntry) return { name: entry, goals: 1 };

  return {
    name: matchedEntry[1].trim(),
    goals: Number.parseInt(matchedEntry[2], 10),
  };
}

export function filterRankingMatches(matches: Match[], filter: RankingFilter): Match[] {
  return matches.filter(match => {
    if (filter === 'all') return true;
    if (filter === 'tournament' || filter === 'friendly') return match.matchType === filter;
    const date = new Date(`${match.matchDate}T00:00:00`);
    const day = date.getDay();
    if (filter === 'holiday') return day !== 0 && day !== 6 && isHoliday(date);
    return filter === 'saturday' ? day === 6 : day === 0;
  });
}

/**
 * 試合データから得点ランキングを計算
 * @param matches - 試合データの配列
 * @param playerNames - 登録選手の名前（ランキングに含める選手をフィルタ）
 * @param limit - 返すランキング件数（デフォルト無制限）
 * @returns 得点でソート済みのランキング配列
 */
export function calcTopScorers(
  matches: Match[],
  playerNames?: string[],
  limit?: number
): TopScorer[] {
  const counts: Record<string, number> = {};
  const registeredPlayers = playerNames ? new Set(playerNames) : null;

  if (playerNames) {
    playerNames.forEach(name => {
      counts[name] = 0;
    });
  }

  matches.forEach(match => {
    if (!match.scorers) return;

    match.scorers
      .split(',')
      .map(entry => entry.trim())
      .filter(Boolean)
      .map(parseScorerEntry)
      .forEach(({ name, goals }) => {
        if (!registeredPlayers || registeredPlayers.has(name)) {
          counts[name] = (counts[name] || 0) + goals;
        }
      });
  });

  const ranking = Object.entries(counts)
    .filter(([, goals]) => goals > 0)
    .sort(([, goalsA], [, goalsB]) => goalsB - goalsA)
    .map(([name, goals]) => ({ name, goals }));

  return limit === undefined ? ranking : ranking.slice(0, limit);
}
