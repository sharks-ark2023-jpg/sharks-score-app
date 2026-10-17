import type { Match } from '@/types';
import { getUnassignedScorers, parseScorers } from '@/lib/goal-records';

export default function ScorerBreakdown({ match }: { match: Partial<Match> }) {
    const groups = match.matchFormat === 'halves' ? [
        { label: '前半の得点者', entries: parseScorers(match.scorers1H) },
        { label: '後半の得点者', entries: parseScorers(match.scorers2H) },
        { label: '前後半の内訳未記録', entries: getUnassignedScorers(match) },
    ] : [{ label: '得点者', entries: parseScorers(match.scorers) }];

    return (
        <div className="space-y-3" role="group" aria-label="得点者の内訳">
            {groups.filter(group => group.label !== '前後半の内訳未記録' || group.entries.length > 0).map(group => (
                <div key={group.label} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <p className="text-xs font-black text-slate-500 mb-1">{group.label}</p>
                    <p className="text-sm font-bold text-slate-800">
                        {group.entries.length > 0
                            ? group.entries.map(({ name, goals }) => `${name} ${goals}点`).join('、')
                            : '得点者の記録なし'}
                    </p>
                </div>
            ))}
        </div>
    );
}
