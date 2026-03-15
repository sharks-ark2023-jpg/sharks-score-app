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

    const liveMatches = matches.filter(m => m.isLive);
    const completedMatches = matches.filter(m => !m.isLive);

    return (
        <div className="space-y-2">
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
                                <span className="text-5xl font-black text-slate-900 tabular-nums leading-none tracking-tighter">{match.ourScore}</span>
                                <span className="text-slate-900 text-3xl font-thin">-</span>
                                <span className="text-5xl font-black text-slate-900 tabular-nums leading-none tracking-tighter">{match.opponentScore}</span>
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

            {/* 終了試合: リスト形式 */}
            {completedMatches.map((match) => {
                const resultLabel = match.result === 'win' ? 'WIN' : match.result === 'loss' ? 'LOSE' : 'DRAW';
                const resultStyle = match.result === 'win'
                    ? 'bg-green-500 text-white'
                    : match.result === 'loss'
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-400 text-white';

                const formatLabel = match.matchFormat === 'halves'
                    ? '前後半'
                    : `${match.matchDuration ?? 15}min`;

                return (
                    <Link
                        key={match.matchId}
                        href={`/grade/${gradeId}/match/${match.matchId}/view`}
                        className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all active:scale-[0.99] group"
                    >
                        {/* 結果バッジ */}
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest shrink-0 w-12 text-center ${resultStyle}`}>
                            {resultLabel}
                        </span>

                        {/* スコア */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xl font-black text-slate-900 tabular-nums leading-none">{match.ourScore}</span>
                            <span className="text-slate-900 text-sm font-thin">-</span>
                            <span className="text-xl font-black text-slate-900 tabular-nums leading-none">{match.opponentScore}</span>
                        </div>

                        {/* 対戦相手 */}
                        <div className="flex-1 min-w-0">
                            <div className="font-black text-sm text-slate-800 truncate uppercase">{match.opponentName}</div>
                            {match.scorers && (
                                <div className="text-[9px] font-bold text-slate-400 mt-0.5 break-all leading-relaxed">⚽ {match.scorers}</div>
                            )}
                        </div>

                        {/* メタ情報 */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{match.matchDate}</span>
                            <div className="flex items-center gap-1">
                                {match.matchType === 'tournament' && (
                                    <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full uppercase tracking-widest">公式</span>
                                )}
                                <span className="text-[8px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-full uppercase tracking-widest">{formatLabel}</span>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
