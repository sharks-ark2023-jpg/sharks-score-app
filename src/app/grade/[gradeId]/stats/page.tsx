'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { Match } from '@/types';
import { calcTopScorers, filterRankingMatches, RankingFilter } from '@/lib/scoring';

const fetcher = (url: string) => fetch(url).then(async (r) => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'エラーが発生しました');
    return data;
});

// 当月 + (今月15日以前なら先月も含む) の判定
const isRecentMonth = (dateStr: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    const matchDate = new Date(`${dateStr}T00:00:00`);
    return matchDate >= start && matchDate <= today;
};

// 今年度（4月〜翌3月）の判定
const isCurrentFiscalYear = (dateStr: string): boolean => {
    const now = new Date();
    const d = new Date(dateStr);
    // 今年度の開始年（4月〜）
    const fiscalStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const fiscalStart = new Date(fiscalStartYear, 3, 1); // 4月1日
    const fiscalEnd = new Date(fiscalStartYear + 1, 2, 31, 23, 59, 59); // 翌3月31日
    return d >= fiscalStart && d <= fiscalEnd;
};

type StatCounts = { win: number; loss: number; draw: number; total: number };

const countResults = (matches: Match[]): StatCounts => {
    const win = matches.filter(m => m.result === 'win').length;
    const loss = matches.filter(m => m.result === 'loss').length;
    const draw = matches.filter(m => m.result === 'draw').length;
    return { win, loss, draw, total: win + loss + draw };
};

const winRate = (counts: StatCounts): string => {
    if (counts.total === 0) return '-%';
    return `${Math.round((counts.win / counts.total) * 100)}%`;
};

// 連勝/連敗ストリーク（完了試合を日付降順で見て、同じ結果が続く数を数える）
const calcStreak = (matches: Match[]): { result: 'win' | 'loss' | 'draw'; count: number } | null => {
    const completed = matches
        .filter(m => !m.isLive && (m.result === 'win' || m.result === 'loss' || m.result === 'draw'))
        .slice() // copy to avoid mutation
        .sort((a, b) => (b.matchDate > a.matchDate ? 1 : b.matchDate < a.matchDate ? -1 : 0));
    if (completed.length === 0) return null;
    const first = completed[0].result as 'win' | 'loss' | 'draw';
    let count = 1;
    for (let i = 1; i < completed.length; i++) {
        if (completed[i].result === first) { count++; } else { break; }
    }
    return { result: first, count };
};

export default function StatsPage() {
    const { gradeId } = useParams() as { gradeId: string };
    const { data, isLoading, error } = useSWR<{ matches: Match[] }>(
        `/api/matches?grade=${gradeId}`,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 30_000 }
    );

    const allMatches = data?.matches || [];
    const [rankingFilter, setRankingFilter] = useState<RankingFilter>('all');

    // セクション1: 過去1ヶ月の戦績（完了試合のみ）
    const recentMatches = allMatches.filter(m => !m.isLive && isRecentMonth(m.matchDate));
    const recentCounts = countResults(recentMatches);
    const recentGoalsFor = recentMatches.reduce((sum, m) => sum + m.ourScore, 0);
    const recentGoalsAgainst = recentMatches.reduce((sum, m) => sum + m.opponentScore, 0);

    // セクション2: 今年度 公式戦戦績
    const officialMatches = allMatches.filter(
        m => !m.isLive && m.matchType === 'tournament' && isCurrentFiscalYear(m.matchDate)
    );
    const officialCounts = countResults(officialMatches);
    const tournamentNames = Array.from(
        new Set(officialMatches.map(m => m.tournamentName).filter((n): n is string => !!n))
    );

    // セクション3: トップスコアラー（上位5名、選手フィルタなし）
    const topScorers = calcTopScorers(filterRankingMatches(allMatches, rankingFilter), undefined, 5);

    // 連勝/連敗ストリーク
    const streak = calcStreak(allMatches);

    // ローディング
    if (isLoading) {
        return (
            <main className="container mx-auto px-4 py-6 max-w-lg pb-24">
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
                        <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase">STATS</h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">戦績ダッシュボード</p>
                    </div>
                </header>
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="container mx-auto px-4 py-6 max-w-lg pb-24">
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
                        <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase">STATS</h1>
                    </div>
                </header>
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm font-bold">
                    {error.message}
                </div>
            </main>
        );
    }

    return (
        <main className="container mx-auto px-4 py-6 max-w-lg pb-24">
            {/* ページヘッダー */}
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
                    <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase">STATS</h1>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{gradeId} 戦績ダッシュボード</p>
                </div>
            </header>

            <div className="space-y-6">

                {/* セクション1: 過去1ヶ月の戦績 */}
                <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">
                        Recent Record
                    </h2>
                    {recentCounts.total === 0 ? (
                        <p className="text-center text-slate-300 font-black text-[10px] uppercase tracking-widest py-8">
                            No Matches
                        </p>
                    ) : (
                        <>
                            {/* W / D / L カード */}
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                <div className="flex flex-col items-center justify-center bg-[#00693E]/10 rounded-2xl py-5 gap-1">
                                    <span className="font-bebas font-black text-5xl leading-none text-[#00693E]">{recentCounts.win}</span>
                                    <span className="text-[9px] font-black text-[#00693E] tracking-widest uppercase">Win</span>
                                </div>
                                <div className="flex flex-col items-center justify-center bg-slate-100 rounded-2xl py-5 gap-1">
                                    <span className="font-bebas font-black text-5xl leading-none text-[#94A3B8]">{recentCounts.draw}</span>
                                    <span className="text-[9px] font-black text-[#94A3B8] tracking-widest uppercase">Draw</span>
                                </div>
                                <div className="flex flex-col items-center justify-center bg-[#FF2D2D]/10 rounded-2xl py-5 gap-1">
                                    <span className="font-bebas font-black text-5xl leading-none text-[#FF2D2D]">{recentCounts.loss}</span>
                                    <span className="text-[9px] font-black text-[#FF2D2D] tracking-widest uppercase">Lose</span>
                                </div>
                            </div>

                            {/* 勝率 + 得失点 + ストリーク */}
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-baseline gap-1">
                                    <span className="font-bebas font-black text-3xl text-slate-700 leading-none">{winRate(recentCounts)}</span>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Win Rate</span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-black text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <span className="text-[#00693E]">得点</span>
                                        <span className="font-bebas font-black text-xl leading-none text-slate-700">{recentGoalsFor}</span>
                                    </span>
                                    <span className="text-slate-200">|</span>
                                    <span className="flex items-center gap-1">
                                        <span className="text-[#FF2D2D]">失点</span>
                                        <span className="font-bebas font-black text-xl leading-none text-slate-700">{recentGoalsAgainst}</span>
                                    </span>
                                </div>
                            </div>

                            {/* ストリーク */}
                            {streak && streak.count >= 2 && (
                                <div className="mt-4 px-1 flex items-center gap-2">
                                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${
                                        streak.result === 'win'
                                            ? 'bg-[#00693E]/10 text-[#00693E]'
                                            : streak.result === 'loss'
                                                ? 'bg-[#FF2D2D]/10 text-[#FF2D2D]'
                                                : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {streak.count}連{streak.result === 'win' ? '勝' : streak.result === 'loss' ? '敗' : '分け'}中
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </section>

                {/* セクション2: 今年度 公式戦戦績 */}
                <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">
                        Official Matches — This Season
                    </h2>
                    {officialCounts.total === 0 ? (
                        <p className="text-center text-slate-300 font-black text-[10px] uppercase tracking-widest py-8">
                            No Official Matches
                        </p>
                    ) : (
                        <>
                            {/* W / D / L カード */}
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                <div className="flex flex-col items-center justify-center bg-[#00693E]/10 rounded-2xl py-5 gap-1">
                                    <span className="font-bebas font-black text-5xl leading-none text-[#00693E]">{officialCounts.win}</span>
                                    <span className="text-[9px] font-black text-[#00693E] tracking-widest uppercase">Win</span>
                                </div>
                                <div className="flex flex-col items-center justify-center bg-slate-100 rounded-2xl py-5 gap-1">
                                    <span className="font-bebas font-black text-5xl leading-none text-[#94A3B8]">{officialCounts.draw}</span>
                                    <span className="text-[9px] font-black text-[#94A3B8] tracking-widest uppercase">Draw</span>
                                </div>
                                <div className="flex flex-col items-center justify-center bg-[#FF2D2D]/10 rounded-2xl py-5 gap-1">
                                    <span className="font-bebas font-black text-5xl leading-none text-[#FF2D2D]">{officialCounts.loss}</span>
                                    <span className="text-[9px] font-black text-[#FF2D2D] tracking-widest uppercase">Lose</span>
                                </div>
                            </div>

                            {/* 勝率 */}
                            <div className="flex items-baseline gap-1 px-1 mb-5">
                                <span className="font-bebas font-black text-3xl text-slate-700 leading-none">{winRate(officialCounts)}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Win Rate</span>
                            </div>

                            {/* 大会名一覧 */}
                            {tournamentNames.length > 0 && (
                                <div className="border-t border-slate-100 pt-4">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Tournaments</p>
                                    <div className="flex flex-wrap gap-2">
                                        {tournamentNames.map(name => (
                                            <span
                                                key={name}
                                                className="text-[10px] font-black text-[#1565FF] bg-[#1565FF]/10 px-3 py-1.5 rounded-full tracking-wide"
                                            >
                                                {name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </section>

                {/* セクション3: トップスコアラー */}
                <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">
                        Top Scorers
                    </h2>
                    <div className="flex flex-wrap gap-2 mb-5">
                        {([['all', '総合'], ['tournament', '公式'], ['friendly', 'フレンドリー'], ['saturday', '土曜'], ['sunday', '日曜'], ['holiday', '祝日']] as const).map(([filter, label]) => (
                            <button key={filter} type="button" onClick={() => setRankingFilter(filter)} className={`px-3 py-1.5 rounded-full text-[10px] font-black ${rankingFilter === filter ? 'bg-[#00693E] text-white' : 'bg-slate-100 text-slate-500'}`}>{label}</button>
                        ))}
                    </div>
                    {topScorers.length === 0 ? (
                        <p className="text-center text-slate-300 font-black text-[10px] uppercase tracking-widest py-8">
                            No Score Data
                        </p>
                    ) : (
                        <div className="space-y-0.5 border border-slate-100/60 rounded-2xl overflow-hidden bg-slate-50/30 shadow-inner">
                            {(() => {
                                let lastGoals = -1;
                                let currentRank = 0;
                                let skipCount = 0;

                                return topScorers.map(({ name, goals }) => {
                                    if (goals !== lastGoals) {
                                        currentRank += 1 + skipCount;
                                        skipCount = 0;
                                        lastGoals = goals;
                                    } else {
                                        skipCount++;
                                    }

                                    const isTop3 = currentRank <= 3;
                                    const rankStyle = currentRank === 1
                                        ? 'text-slate-950 font-extrabold text-lg'
                                        : currentRank === 2
                                            ? 'text-slate-850 font-extrabold text-base'
                                            : currentRank === 3
                                                ? 'text-slate-750 font-extrabold text-sm'
                                                : 'text-slate-400 font-bold text-xs';

                                    return (
                                        <div key={name} className="flex items-center gap-5 px-5 py-3.5 bg-white border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors">
                                            {/* 順位 */}
                                            <span className={`w-6 text-center shrink-0 ${rankStyle}`}>
                                                {currentRank}
                                            </span>

                                            {/* 選手名 */}
                                            <span className={`flex-1 text-slate-800 text-sm truncate ${isTop3 ? 'font-black' : 'font-bold'}`}>
                                                {name}
                                            </span>

                                            {/* 得点数 */}
                                            <div className="flex items-baseline shrink-0">
                                                <span className="font-bebas font-black text-2xl leading-none text-slate-900">{goals}</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">goals</span>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    )}
                </section>

            </div>
        </main>
    );
}
