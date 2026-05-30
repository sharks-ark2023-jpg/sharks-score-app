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
        <div className="space-y-2 pb-24">
            {/* ライブ試合: カード形式 */}
            {liveMatches.map((match) => (
                <Link
                    key={match.matchId}
                    href={`/grade/${gradeId}/match/${match.matchId}`}
                    className="block relative overflow-hidden bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-300/50 transition-all border border-slate-100 group active:scale-[0.98] ring-2 ring-red-500 ring-offset-2"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse" />

                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full">{match.matchDate}</span>
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-red-600 text-white shadow-lg shadow-red-200 uppercase tracking-widest">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                                    LIVE
                                    {match.matchPhase && match.matchPhase !== 'pre-game' && (
                                        <span className="border-l border-white/30 ml-1 pl-1 opacity-80">
                                            {match.matchFormat === 'one_game' ? 'IN GAME' : (
                                                <>
                                                    {match.matchPhase === '1H' && '1ST HALF'}
                                                    {match.matchPhase === 'halftime' && 'HT'}
                                                    {match.matchPhase === '2H' && '2ND HALF'}
                                                </>
                                            )}
                                        </span>
                                    )}
                                </span>
                                <span className="text-[9px] font-black text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 uppercase tracking-widest whitespace-nowrap">
                                    {match.matchFormat === 'halves' ? '前後半' : `${match.matchDuration ?? 15}min`}
                                </span>
                            </div>
                            {match.matchType === 'tournament' && (
                                <div className="text-[10px] font-black text-blue-600 truncate max-w-[200px] flex items-center gap-1.5 uppercase tracking-[0.1em]">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                    {match.tournamentName || 'Tournament'}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                            {match.lastUpdated && (
                                <span className="text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                    UPDATED: {new Date(match.lastUpdated).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 items-center my-6">
                        <div className="text-center px-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">SHARKS</span>
                            <div className="font-heading font-black text-sm text-slate-800 line-clamp-2 leading-tight">{teamName}</div>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <div className="flex items-center gap-4">
                                <span className="font-bebas font-black text-5xl text-slate-900 tabular-nums leading-none tracking-tighter">{match.ourScore}</span>
                                <span className="text-slate-900 text-3xl font-thin">-</span>
                                <span className="font-bebas font-black text-5xl text-slate-900 tabular-nums leading-none tracking-tighter">{match.opponentScore}</span>
                            </div>
                            {match.pkInfo?.isPk && (
                                <div className="text-[10px] font-black text-blue-600 mt-3 px-3 py-1 bg-blue-50 rounded-full border border-blue-100 uppercase tracking-[0.2em] shadow-sm">
                                    PK {match.pkInfo.ourPkScore} - {match.pkInfo.opponentPkScore}
                                </div>
                            )}
                            {match.matchFormat === 'halves' && (match.ourScore1H !== undefined || match.ourScore2H !== undefined) && (
                                <div className="mt-3 flex gap-3">
                                    <div className="text-[9px] font-black text-slate-500 flex items-center gap-1 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full">
                                        <span className="opacity-60">1H</span> {match.ourScore1H ?? 0}-{match.opponentScore1H ?? 0}
                                    </div>
                                    <div className="text-[9px] font-black text-slate-500 flex items-center gap-1 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full">
                                        <span className="opacity-60">2H</span> {match.ourScore2H ?? 0}-{match.opponentScore2H ?? 0}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="text-center px-2 border-l border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">対戦相手</span>
                            <div className="font-heading font-black text-sm text-slate-800 line-clamp-2 leading-tight uppercase">{match.opponentName}</div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                        {match.scorers ? (
                            <div className="text-[9px] font-black text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 flex items-center gap-2">
                                <span className="text-sm">⚽️</span>
                                <span className="uppercase tracking-widest">{match.scorers}</span>
                            </div>
                        ) : (
                            <div className="text-[9px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 uppercase tracking-widest">
                                No scorers recorded
                            </div>
                        )}
                        {match.mvp && (
                            <div className="text-[9px] font-black text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 flex items-center gap-2 ml-auto shadow-sm">
                                <span className="text-sm">⭐</span>
                                <span className="uppercase tracking-widest">MVP: {match.mvp}</span>
                            </div>
                        )}
                    </div>
                </Link>
            ))}

            {/* 終了試合: カード形式（刷新） */}
            {completedMatches.map((match) => {
                const resultLabel = match.result === 'win' ? 'WIN' : match.result === 'loss' ? 'LOSE' : 'DRAW';
                const resultStyle = match.result === 'win'
                    ? 'bg-[#00693E] text-white'
                    : match.result === 'loss'
                        ? 'bg-[#FF2D2D] text-white'
                        : 'bg-slate-400 text-white';
                const typeStyle = match.matchType === 'tournament'
                    ? 'bg-[#00693E] text-white'
                    : 'bg-[#1565FF] text-white';
                const typeLabel = match.matchType === 'tournament' ? '公式戦' : '練習試合';
                const formatLabel = match.matchFormat === 'halves'
                    ? '前後半'
                    : `${match.matchDuration ?? 15}MIN`;

                return (
                    <Link
                        key={match.matchId}
                        href={`/grade/${gradeId}/match/${match.matchId}/view`}
                        className="block bg-white px-4 pt-3 pb-3 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all active:scale-[0.99] group overflow-hidden"
                    >
                        {/* 上段: 種別バッジ + 日付 + 形式 */}
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0 ${typeStyle}`}>
                                {typeLabel}
                            </span>
                            <span className="text-[10px] font-black text-slate-500 tracking-tight">
                                {formatDate(match.matchDate)}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full uppercase tracking-widest ml-auto shrink-0">
                                {formatLabel}
                            </span>
                        </div>

                        {/* 中段: SHARKS + スコア + 対戦相手 + 矢印 */}
                        <div className="flex items-center gap-2">
                            {/* 自チーム */}
                            <div className="shrink-0 text-left">
                                <div className="text-[10px] font-black text-slate-800 leading-tight">SHARKS</div>
                                <div className="text-[9px] font-black text-slate-400 leading-tight">{gradeId}</div>
                            </div>

                            {/* スコア */}
                            <div className="flex items-center gap-1 flex-1 justify-center">
                                <span className="font-bebas font-black text-3xl text-slate-900 tabular-nums leading-none">{match.ourScore}</span>
                                <span className="text-slate-400 text-lg font-thin leading-none">-</span>
                                <span className="font-bebas font-black text-3xl text-slate-900 tabular-nums leading-none">{match.opponentScore}</span>
                            </div>

                            {/* 対戦相手 */}
                            <div className="shrink-0 text-right max-w-[100px]">
                                <div className="text-[11px] font-black text-slate-800 truncate leading-tight">{match.opponentName}</div>
                            </div>

                            {/* 右矢印 */}
                            <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>

                        {/* 下段: WIN/LOSE/DRAWバッジ */}
                        <div className="mt-2 flex items-center gap-2">
                            <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest ${resultStyle}`}>
                                {resultLabel}
                            </span>
                            {match.scorers && (
                                <span className="text-[9px] font-bold text-slate-400 truncate">⚽ {match.scorers}</span>
                            )}
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
