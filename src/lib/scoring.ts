import { Match } from '@/types';
import { isHoliday } from 'holiday-jp';

export interface TopScorer {
  name: string;
  goals: number;
}

export type RankingFilter = 'all' | 'tournament' | 'friendly' | 'saturday' | 'sunday' | 'holiday';

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

  // プレイヤー名が指定されていれば、初期化
  if (playerNames) {
    playerNames.forEach(p => (counts[p] = 0));
  }

  // 全試合の得点者を集計
  matches.forEach(m => {
    if (!m.scorers) return;

    const parts = m.scorers.split(',').map(s => s.trim()).filter(Boolean);
    parts.forEach(p => {
      const match = p.match(/^(.+)\((\d+)\)$/);
      if (match) {
        // "佐藤(2)" 形式
        const name = match[1].trim();
        const count = parseInt(match[2]);
        if (!playerNames || playerNames.includes(name)) {
          counts[name] = (counts[name] || 0) + count;
        }
      } else {
        // "田中" 形式（得点1件）
        if (!playerNames || playerNames.includes(p)) {
          counts[p] = (counts[p] || 0) + 1;
        }
      }
    });
  });

  // ランキングを構築・ソート
  const ranking = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, goals]) => ({ name, goals }));

  // 制限がある場合はスライス
  if (limit !== undefined) {
    return ranking.slice(0, limit);
  }

  return ranking;
}
