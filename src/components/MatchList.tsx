'use client';

import { Match } from '@/types';
import Link from 'next/link';

interface MatchListProps {
    matches: Match[];
    gradeId: string;
    teamName?: string;
}

export default function MatchList({ matches, gradeId, teamName = '自チーム' }: MatchListProps) {
    if (matches.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No match records yet</p>
                <Link
                    href={`/grade/${gradeId}/match/new`}
                    className="mt-6 inline-flex px-6 py-3 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
                >
                    ADD FIRST MATCH
                </Link>
            </div>
        );
    }

    const formatDate = (dateStr: string): string => {
        const d = new Date(dateStr + 'T00:00:00');
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${weekdays[d.getDay()]})`;
    };

    const liveMatches = matches.filter(m => m.isLive);
    const completedMatches = matches.filter(m => !m.isLive);

    return (
        <div className="space-y-2.5 pb-24">
            {/* ライブ試合: カード形式 */}
            {liveMatches.map((match) => (
                <Link
                    key={match.matchId}
                    href={`/grade/${gradeId}/match/${match.matchId}`}
                    className="block bg-white px-4 py-3 rounded-xl shadow-md transition-all border border-red-200 group active:scale-[0.98] ring-1 ring-red-500/40 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-[4px] bg-red-600 animate-pulse" />

                    {/* 上段: LIVEタグ + 日付 + 時間 */}
                    <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-black bg-red-600 text-white tracking-widest uppercase shrink-0 shadow-sm shadow-red-100">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                            LIVE
                        </span>
                        <span className="text-[10px] font-black text-slate-400">
                            {formatDate(match.matchDate)}
                        </span>
                        <span className="text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full uppercase tracking-widest ml-auto shrink-0">
                            {match.matchFormat === 'halves' ? '前後半' : `${match.matchDuration ?? 15}MIN`}
                        </span>
                    </div>

                    {/* 中段: SHARKS U12 vs 対戦相手 */}
                    <div className="flex items-center justify-between my-4 relative">
                        {/* 自チーム */}
                        <div className="w-1/3 text-left">
                            <span className="text-[10px] font-black text-slate-400 block tracking-wider leading-none truncate">{teamName}</span>
                            <span className="text-[13px] font-black text-slate-800 leading-tight">U12</span>
                        </div>

                        {/* スコア */}
                        <div className="w-1/3 flex flex-col items-center justify-center">
                            <div className="flex items-center gap-3">
                                <span className="font-bebas font-black text-4xl text-slate-900 tabular-nums leading-none tracking-tighter">{match.ourScore}</span>
                                <span className="text-slate-400 text-2xl font-thin leading-none">-</span>
                                <span className="font-bebas font-black text-4xl text-slate-900 tabular-nums leading-none tracking-tighter">{match.opponentScore}</span>
                            </div>
                        </div>

                        {/* 対戦相手 */}
                        <div className="w-1/3 min-w-0 text-right flex items-center justify-end gap-1.5">
                            <span
                                className="line-clamp-2 min-w-0 text-[13px] font-black text-slate-800 leading-tight [overflow-wrap:anywhere]"
                                title={match.opponentName}
                            >
                                {match.opponentName}
                            </span>
                            <svg className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>

                    {/* 下段: 付加情報 */}
                    <div className="mt-2 flex flex-wrap gap-2 pt-3 border-t border-slate-100/60">
                        {match.matchPhase && match.matchPhase !== 'pre-game' && (
                            <span className="text-[8px] font-black text-red-600 bg-red-50 border border-red-100/50 px-2 py-0.5 rounded-md uppercase tracking-widest shrink-0">
                                {match.matchPhase === '1H' ? '前半戦' : match.matchPhase === 'halftime' ? 'ハーフタイム' : '後半戦'}
                            </span>
                        )}
                        {match.scorers && (
                            <span className="text-[9px] font-bold text-slate-400 truncate max-w-[200px]">⚽ {match.scorers}</span>
                        )}
                    </div>
                </Link>
            ))}

            {/* 終了試合: カード形式（刷新） */}
            {completedMatches.map((match) => {
                const resultLabel = match.result === 'win' ? 'WIN' : match.result === 'loss' ? 'LOSE' : 'DRAW';
                const resultStyle = match.result === 'win'
                    ? 'bg-sharks-green text-white'
                    : match.result === 'loss'
                        ? 'bg-sharks-red text-white'
                        : 'bg-slate-500 text-white';
                const typeStyle = match.matchType === 'tournament'
                    ? 'bg-sharks-green text-white'
                    : 'bg-sharks-blue text-white';
                const typeLabel = match.matchType === 'tournament' ? '公式戦' : '練習試合';
                const formatLabel = match.matchFormat === 'halves'
                    ? '前後半'
                    : `${match.matchDuration ?? 15}MIN`;

                return (
                    <Link
                        key={match.matchId}
                        href={`/grade/${gradeId}/match/${match.matchId}/view`}
                        className="block bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-[0_4px_12px_rgba(13,27,42,0.08)] hover:shadow-md transition-all active:scale-[0.99] group"
                    >
                        {/* 上段: 種別バッジ + 日付 + 形式 */}
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-widest shrink-0 ${typeStyle}`}>
                                {typeLabel}
                            </span>
                            <span className="text-[10px] font-black text-slate-400">
                                {formatDate(match.matchDate)}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full uppercase tracking-widest ml-auto shrink-0">
                                {formatLabel}
                            </span>
                        </div>

                        {/* 中段: SHARKS U12 vs 対戦相手 */}
                        <div className="flex items-center justify-between my-2 relative">
                            {/* 自チーム */}
                            <div className="w-1/3 text-left">
                                <span className="text-[10px] font-black text-slate-400 block tracking-wider leading-none truncate">{teamName}</span>
                                <span className="text-[13px] font-black text-slate-800 leading-tight">U12</span>
                            </div>

                            {/* スコアと勝敗バッジ */}
                            <div className="w-1/3 flex flex-col items-center justify-center">
                                <div className="flex items-center gap-3">
                                    <span className="font-bebas font-black text-4xl text-slate-900 tabular-nums leading-none tracking-tighter">{match.ourScore}</span>
                                    <span className="text-slate-400 text-2xl font-thin leading-none">-</span>
                                    <span className="font-bebas font-black text-4xl text-slate-900 tabular-nums leading-none tracking-tighter">{match.opponentScore}</span>
                                </div>
                                <div className="mt-1.5 flex justify-center">
                                    <span className={`text-[8px] font-black px-2.5 py-0.5 rounded-md tracking-wider leading-none shadow-sm ${resultStyle}`}>
                                        {resultLabel}
                                    </span>
                                </div>
                            </div>

                            {/* 対戦相手 */}
                            <div className="w-1/3 min-w-0 text-right flex items-center justify-end gap-1.5">
                                <span
                                    className="line-clamp-2 min-w-0 text-[13px] font-black text-slate-800 leading-tight [overflow-wrap:anywhere]"
                                    title={match.opponentName}
                                >
                                    {match.opponentName}
                                </span>
                                <svg className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>

                        {/* 下段: 会場・得点者 */}
                        {(match.venueName || match.scorers) && (
                            <div className="mt-2 pt-2.5 border-t border-slate-100/60 flex flex-wrap items-center gap-x-3 gap-y-1">
                                {match.venueName && (
                                    <span className="min-w-0 max-w-full text-[9px] font-bold text-slate-500 truncate">
                                        📍 {match.venueName}
                                    </span>
                                )}
                                {match.scorers && (
                                    <span className="min-w-0 max-w-full text-[9px] font-bold text-slate-400 truncate">
                                        ⚽ {match.scorers}
                                    </span>
                                )}
                            </div>
                        )}
                    </Link>
                );
            })}
        </div>
    );
}
