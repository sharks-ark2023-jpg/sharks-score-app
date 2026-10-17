import type { Match } from '@/types';

export type Half = '1H' | '2H';
export type Scorer = { name: string; goals: number };

export const calculateResult = (our: number, opponent: number): 'win' | 'loss' | 'draw' =>
    our > opponent ? 'win' : our < opponent ? 'loss' : 'draw';

export function parseScorers(value = ''): Scorer[] {
    const counts = new Map<string, number>();
    value.split(',').map(part => part.trim()).filter(Boolean).forEach(part => {
        const match = part.match(/^(.+)\((\d+)\)$/);
        const name = match ? match[1].trim() : part;
        const goals = match ? Number(match[2]) : 1;
        if (name && goals > 0) counts.set(name, (counts.get(name) || 0) + goals);
    });
    return Array.from(counts, ([name, goals]) => ({ name, goals }));
}

export function formatScorers(entries: Scorer[]): string {
    return entries.filter(({ goals }) => goals > 0)
        .map(({ name, goals }) => goals > 1 ? `${name}(${goals})` : name).join(', ');
}

function changeScorer(value: string | undefined, name: string, amount: number): string {
    const entries = parseScorers(value);
    const entry = entries.find(scorer => scorer.name === name);
    if (entry) entry.goals += amount;
    else if (amount > 0) entries.push({ name, goals: amount });
    return formatScorers(entries);
}

/** 旧記録やハーフ未指定の得点を、推測で前後半へ割り振らない。 */
export function getUnassignedScorers(match: Partial<Match>): Scorer[] {
    const assigned = new Map<string, number>();
    [...parseScorers(match.scorers1H), ...parseScorers(match.scorers2H)].forEach(({ name, goals }) => {
        assigned.set(name, (assigned.get(name) || 0) + goals);
    });
    return parseScorers(match.scorers)
        .map(({ name, goals }) => ({ name, goals: Math.max(0, goals - (assigned.get(name) || 0)) }))
        .filter(({ goals }) => goals > 0);
}

/** 手入力でも合計を更新し、既存の内訳未記録は保持する。 */
export function setHalfScorers(match: Partial<Match>, half: Half, value: string): Partial<Match> {
    const updated = { ...match, [half === '1H' ? 'scorers1H' : 'scorers2H']: value };
    updated.scorers = formatScorers(parseScorers(formatScorers([
        ...getUnassignedScorers(match),
        ...parseScorers(updated.scorers1H),
        ...parseScorers(updated.scorers2H),
    ])));
    return updated;
}

export function canRemoveScorer(name: string, half: Half, match: Partial<Match>): boolean {
    if (!parseScorers(match.scorers).some(entry => entry.name === name)) return false;
    if (match.matchFormat !== 'halves') return (match.ourScore || 0) > 0;
    const score = half === '1H' ? match.ourScore1H : match.ourScore2H;
    const recorded = parseScorers(half === '1H' ? match.scorers1H : match.scorers2H);
    return (score || 0) > 0 && (
        recorded.some(entry => entry.name === name) ||
        ((score || 0) > recorded.reduce((sum, entry) => sum + entry.goals, 0) &&
            getUnassignedScorers(match).some(entry => entry.name === name))
    );
}

export function computeRemoveGoalData(playerName: string, half: Half, current: Partial<Match>): Partial<Match> {
    if (!canRemoveScorer(playerName, half, current)) return current;
    const updated = { ...current, scorers: changeScorer(current.scorers, playerName, -1) };
    if (current.matchFormat === 'halves') {
        const key = half === '1H' ? 'scorers1H' : 'scorers2H';
        updated[key] = changeScorer(current[key], playerName, -1);
    }
    updated.ourScore = Math.max(0, (current.ourScore || 0) - 1);
    if (half === '1H') updated.ourScore1H = Math.max(0, (current.ourScore1H || 0) - 1);
    if (half === '2H') updated.ourScore2H = Math.max(0, (current.ourScore2H || 0) - 1);
    updated.result = calculateResult(updated.ourScore, updated.opponentScore || 0);
    return updated;
}

export function computeScoreData(side: 'our' | 'opponent', amount: number, current: Partial<Match>, half?: Half): Partial<Match> {
    const phase = half || current.matchPhase;
    const updated = { ...current };
    // スコアだけを減らして、ハーフに記録済みの得点者を取り残さない。
    if (side === 'our' && amount < 0) {
        const recorded = current.matchFormat === 'halves' && (phase === '1H' || phase === '2H')
            ? parseScorers(phase === '1H' ? current.scorers1H : current.scorers2H)
            : parseScorers(current.scorers);
        const points = current.matchFormat === 'halves' && phase === '1H' ? current.ourScore1H
            : current.matchFormat === 'halves' && phase === '2H' ? current.ourScore2H : current.ourScore;
        if ((points || 0) + amount < recorded.reduce((sum, entry) => sum + entry.goals, 0)) return current;
    }
    if (side === 'our') {
        updated.ourScore = Math.max(0, (current.ourScore || 0) + amount);
        if (phase === '1H') updated.ourScore1H = Math.max(0, (current.ourScore1H || 0) + amount);
        if (phase === '2H') updated.ourScore2H = Math.max(0, (current.ourScore2H || 0) + amount);
    } else {
        updated.opponentScore = Math.max(0, (current.opponentScore || 0) + amount);
        if (phase === '1H') updated.opponentScore1H = Math.max(0, (current.opponentScore1H || 0) + amount);
        if (phase === '2H') updated.opponentScore2H = Math.max(0, (current.opponentScore2H || 0) + amount);
    }
    updated.result = calculateResult(updated.ourScore || 0, updated.opponentScore || 0);
    return updated;
}

export function computeGoalData(playerName: string, current: Partial<Match>, half?: Half): Partial<Match> {
    const updated = computeScoreData('our', 1, current, half);
    updated.scorers = changeScorer(current.scorers, playerName, 1);
    const phase = half || current.matchPhase;
    if (current.matchFormat === 'halves' && (phase === '1H' || phase === '2H')) {
        const key = phase === '1H' ? 'scorers1H' : 'scorers2H';
        updated[key] = changeScorer(current[key], playerName, 1);
    }
    return updated;
}
