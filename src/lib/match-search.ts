import type { Match } from '@/types';

export function normalizeOpponentName(value: string = ''): string {
    return value.normalize('NFKC').toLowerCase().replace(/\s+/g, '');
}

export function matchesOpponent(match: Pick<Match, 'opponentName'>, query: string): boolean {
    return normalizeOpponentName(match.opponentName).includes(normalizeOpponentName(query));
}
