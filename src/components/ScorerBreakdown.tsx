import type { Match } from '@/types';
import { formatScorers, getUnassignedScorers, parseScorers } from '@/lib/goal-records';
import { resolveHalfScores } from '@/lib/half-scores';

export default function ScorerBreakdown({ match }: { match: Partial<Match> }) {
    const first = parseScorers(match.scorers1H);
    const second = parseScorers(match.scorers2H);
    let unassigned = getUnassignedScorers(match);
    const count = (entries: typeof first) => entries.reduce((sum, entry) => sum + entry.goals, 0);
    const [ourFirst, ourSecond] = resolveHalfScores(match.ourScore, match.ourScore1H, match.ourScore2H);
    const [opponentFirst, opponentSecond] = resolveHalfScores(match.opponentScore, match.opponentScore1H, match.opponentScore2H);

    // 片方のハーフに得点者の入る余地がない場合だけ、旧記録との対応が確定する。
    // 保存データは変更せず、両ハーフに可能性がある名前は全体の得点者として残す。
    if (match.matchFormat === 'halves' && ourFirst !== undefined && ourSecond !== undefined &&
        ourFirst + ourSecond === match.ourScore) {
        const remainingFirst = ourFirst - count(first);
        const remainingSecond = ourSecond - count(second);
        const unknownGoals = count(unassigned);
        if (remainingFirst > 0 && remainingSecond === 0 && unknownGoals <= remainingFirst) {
            first.push(...unassigned);
            unassigned = [];
        } else if (remainingSecond > 0 && remainingFirst === 0 && unknownGoals <= remainingSecond) {
            second.push(...unassigned);
            unassigned = [];
        }
    }

    const names = (entries: typeof first) => formatScorers(parseScorers(formatScorers(entries))).replace(/, /g, '、');
    const score = (our: number | undefined, opponent: number | undefined) => {
        if (our !== undefined && opponent !== undefined) return `${our}-${opponent}`;
        if (our === undefined && opponent === undefined) return '内訳未入力';
        return `自チーム ${our ?? '未入力'} / 相手 ${opponent ?? '未入力'}`;
    };
    const hasHalves = match.matchFormat === 'halves' && (
        match.ourScore1H !== undefined || match.ourScore2H !== undefined ||
        match.opponentScore1H !== undefined || match.opponentScore2H !== undefined || first.length > 0 || second.length > 0
    );
    const totalNames = match.matchFormat === 'halves' ? names(unassigned) : names(parseScorers(match.scorers));
    if (!hasHalves && !totalNames) return null;

    return (
        <div className="space-y-2 text-sm" role="group" aria-label={match.matchFormat === 'halves' ? '前後半のスコアと得点者' : '得点者'}>
            {hasHalves && (
                <>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-slate-100 py-2">
                        <span className="font-bold text-slate-500">前半</span>
                        <span className="font-black tabular-nums text-slate-900">{score(ourFirst, opponentFirst)}</span>
                        {first.length > 0 && <span className="font-bold text-slate-800">{names(first)}</span>}
                    </div>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-slate-100 py-2">
                        <span className="font-bold text-slate-500">後半</span>
                        <span className="font-black tabular-nums text-slate-900">{score(ourSecond, opponentSecond)}</span>
                        {second.length > 0 && <span className="font-bold text-slate-800">{names(second)}</span>}
                    </div>
                </>
            )}
            {totalNames && (
                <p className="py-2 font-bold text-slate-800">
                    <span className="mr-3 text-slate-500">{match.matchFormat === 'halves' ? '得点者（試合全体）' : '得点者'}</span>
                    {totalNames}
                </p>
            )}
        </div>
    );
}
