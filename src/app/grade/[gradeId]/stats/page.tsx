'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { Match } from '@/types';
import { calcTopScorers } from '@/lib/scoring';

const fetcher = (url: string) => fetch(url).then(async (r) => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'エラーが発生しました');
    return data;
});

// 当月 + (今月15日以前なら先月も含む) の判定
const isRecentMonth = (dateStr: string): boolean => {
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

export default function StatsPage() {
    const { gradeId } = useParams() as { gradeId: string };
    const { data, isLoading, error } = useSWR<{ matches: Match[] }>(
        `/api/matches?grade=${gradeId}`,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 30_000 }
    );

    const allMatches = data?.matches || [];

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
    const topScorers = calcTopScorers(allMatches, undefined, 5);

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
                                    <span className="font-bebas text-5xl leading-none text-[#00693E]">{recentCounts.win}</span>
                                    <span className="text-[9px] font-black text-[#00693E] tracking-widest uppercase">Win</span>
                                </div>
                                <div className="flex flex-col items-center justify-center bg-slate-100 rounded-2xl py-5 gap-1">
                                    <span className="font-bebas text-5xl leading-none text-[#94A3B8]">{recentCounts.draw}</span>
                                    <span className="text-[9px] font-black text-[#94A3B8] tracking-widest uppercase">Draw</span>
                                </div>
                                <div className="flex flex-col items-center justify-center bg-[#FF2D2D]/10 rounded-2xl py-5 gap-1">
                                    <span className="font-bebas text-5xl leading-none text-[#FF2D2D]">{recentCounts.loss}</span>
                                    <span className="text-[9px] font-black text-[#FF2D2D] tracking-widest uppercase">Lose</span>
                                </div>
                            </div>

                            {/* 勝率 + 得失点 */}
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-baseline gap-1">
                                    <span className="font-bebas text-3xl text-slate-700 leading-none">{winRate(recentCounts)}</span>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Win Rate</span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-black text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <span className="text-[#00693E]">GF</span>
                                        <span className="font-bebas text-xl leading-none text-slate-700">{recentGoalsFor}</span>
                                    </span>
                                    <span className="text-slate-200">|</span>
                                    <span className="flex items-center gap-1">
                                        <span className="text-[#FF2D2D]">GA</span>
                                        <span className="font-bebas text-xl leading-none text-slate-700">{recentGoalsAgainst}</span>
                                    </span>
                                </div>
                            </div>
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
                                    <span className="font-bebas text-5xl leading-none text-[#00693E]">{officialCounts.win}</span>
                                    <span className="text-[9px] font-black text-[#00693E] tracking-widest uppercase">Win</span>
                                </div>
                                <div className="flex flex-col items-center justify-center bg-slate-100 rounded-2xl py-5 gap-1">
                                    <span className="font-bebas text-5xl leading-none text-[#94A3B8]">{officialCounts.draw}</span>
                                    <span className="text-[9px] font-black text-[#94A3B8] tracking-widest uppercase">Draw</span>
                                </div>
                                <div className="flex flex-col items-center justify-center bg-[#FF2D2D]/10 rounded-2xl py-5 gap-1">
                                    <span className="font-bebas text-5xl leading-none text-[#FF2D2D]">{officialCounts.loss}</span>
                                    <span className="text-[9px] font-black text-[#FF2D2D] tracking-widest uppercase">Lose</span>
                                </div>
                            </div>

                            {/* 勝率 */}
                            <div className="flex items-baseline gap-1 px-1 mb-5">
                                <span className="font-bebas text-3xl text-slate-700 leading-none">{winRate(officialCounts)}</span>
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
                    {topScorers.length === 0 ? (
                        <p className="text-center text-slate-300 font-black text-[10px] uppercase tracking-widest py-8">
                            No Score Data
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {topScorers.map(({ name, goals }, index) => (
                                <div key={name} className="flex items-center gap-4">
                                    {/* 順位バッジ */}
                                    <span
                                        className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                                            index === 0
                                                ? 'bg-amber-400 text-amber-900'
                                                : index === 1
                                                    ? 'bg-slate-300 text-slate-700'
                                                    : index === 2
                                                        ? 'bg-orange-300 text-orange-900'
                                                        : 'bg-slate-100 text-slate-400'
                                        }`}
                                    >
                                        {index + 1}
                                    </span>

                                    {/* 選手名 */}
                                    <span className="flex-1 font-black text-slate-800 text-sm truncate">{name}</span>

                                    {/* 得点数 */}
                                    <div className="flex items-baseline gap-1 shrink-0">
                                        <span className="font-bebas text-3xl leading-none text-slate-800">{goals}</span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">goals</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

            </div>
        </main>
    );
}
