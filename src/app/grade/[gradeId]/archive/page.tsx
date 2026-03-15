'use client';

import { useParams } from 'next/navigation';
import { Match } from '@/types';
import Link from 'next/link';
import useSWR from 'swr';

const fetcher = async (url: string) => {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'エラーが発生しました');
    return data;
};

const isActiveMonth = (dateStr: string) => {
    const now = new Date();
    const d = new Date(dateStr);
    const currentYM = now.getFullYear() * 100 + (now.getMonth() + 1);
    const matchYM = d.getFullYear() * 100 + (d.getMonth() + 1);
    if (matchYM === currentYM) return true;
    if (now.getDate() <= 15) {
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevYM = prev.getFullYear() * 100 + (prev.getMonth() + 1);
        if (matchYM === prevYM) return true;
    }
    return false;
};

export default function ArchivePage() {
    const { gradeId } = useParams() as { gradeId: string };

    const { data: matchesRes, isLoading, error } = useSWR<{ matches: Match[] }>(
        `/api/matches?grade=${gradeId}`,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 30_000 }
    );

    const allMatches = matchesRes?.matches || [];
    const archivedMatches = allMatches.filter(m => !m.isLive && !isActiveMonth(m.matchDate));

    // 月別グループ化 (YYYY-MM)
    const grouped = archivedMatches.reduce<Record<string, Match[]>>((acc, m) => {
        const ym = m.matchDate.slice(0, 7); // "YYYY-MM"
        if (!acc[ym]) acc[ym] = [];
        acc[ym].push(m);
        return acc;
    }, {});

    const sortedMonths = Object.keys(grouped).sort().reverse();

    const resultStyle = (result: string | undefined) =>
        result === 'win'
            ? 'bg-green-500 text-white'
            : result === 'loss'
                ? 'bg-red-500 text-white'
                : 'bg-slate-400 text-white';

    const resultLabel = (result: string | undefined) =>
        result === 'win' ? 'WIN' : result === 'loss' ? 'LOSE' : 'DRAW';

    return (
        <main className="flex-grow container mx-auto px-4 py-6 max-w-lg">
            <header className="mb-8 flex items-center gap-3">
                <Link
                    href={`/grade/${gradeId}`}
                    className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase">Archive</h1>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">過去の試合記録</p>
                </div>
            </header>

            {isLoading && (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm">
                    {error.message}
                </div>
            )}

            {!isLoading && sortedMonths.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100">
                    <p className="text-slate-300 font-black text-[10px] uppercase tracking-widest">No archived matches</p>
                </div>
            )}

            <div className="space-y-8">
                {sortedMonths.map(ym => {
                    const [year, month] = ym.split('-');
                    const monthMatches = grouped[ym];
                    const wins = monthMatches.filter(m => m.result === 'win').length;
                    const losses = monthMatches.filter(m => m.result === 'loss').length;
                    const draws = monthMatches.filter(m => m.result === 'draw').length;

                    return (
                        <section key={ym}>
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h2 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                                    {year}年{parseInt(month)}月
                                </h2>
                                <div className="flex gap-1.5 text-[9px] font-black">
                                    <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full">{wins}W</span>
                                    <span className="px-2 py-0.5 bg-red-50 text-red-500 rounded-full">{losses}L</span>
                                    <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full">{draws}D</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {monthMatches.map(match => (
                                    <Link
                                        key={match.matchId}
                                        href={`/grade/${gradeId}/match/${match.matchId}/view`}
                                        className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all active:scale-[0.99]"
                                    >
                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest shrink-0 w-12 text-center ${resultStyle(match.result)}`}>
                                            {resultLabel(match.result)}
                                        </span>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="text-xl font-black text-slate-900 tabular-nums leading-none">{match.ourScore}</span>
                                            <span className="text-slate-300 text-sm font-thin">-</span>
                                            <span className="text-xl font-black text-slate-900 tabular-nums leading-none">{match.opponentScore}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-black text-sm text-slate-800 truncate uppercase">{match.opponentName}</div>
                                            {match.scorers && (
                                                <div className="text-[9px] font-bold text-slate-400 truncate mt-0.5">⚽ {match.scorers}</div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <span className="text-[9px] font-black text-slate-400">{match.matchDate.slice(5)}</span>
                                            {match.matchType === 'tournament' && (
                                                <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full">公式</span>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>
        </main>
    );
}
