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
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500">試合記録がありません</p>
                <Link
                    href={`/grade/${gradeId}/match/new`}
                    className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    最初の試合を記録
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {matches.map((match) => (
                <Link
                    key={match.matchId}
                    href={`/grade/${gradeId}/match/${match.matchId}`}
                    className="block bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{match.matchDate}</span>
                                {match.isLive && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black bg-red-600 text-white animate-pulse">
                                        LIVE
                                        {match.matchPhase && match.matchPhase !== 'pre-game' && (
                                            <span className="border-l border-white/30 ml-1 pl-1">
                                                {match.matchPhase === '1H' && '前半'}
                                                {match.matchPhase === 'halftime' && 'HT'}
                                                {match.matchPhase === '2H' && '後半'}
                                            </span>
                                        )}
                                    </span>
                                )}
                                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                    {match.matchFormat === 'halves' ? '前後半' : '1本'}
                                </span>
                            </div>
                            {match.matchType === 'tournament' && (
                                <div className="text-[10px] font-bold text-red-600 truncate max-w-[150px] flex items-center gap-1">
                                    🏆 {match.tournamentName || '公式戦・大会'}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            {match.isLive && match.lastUpdated && (
                                <span className="text-[9px] font-bold text-red-500">
                                    更新: {new Date(match.lastUpdated).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                            <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter ${match.result === 'win' ? 'bg-green-100 text-green-700' :
                                match.result === 'loss' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                {match.result === 'win' ? 'WIN' : match.result === 'loss' ? 'LOSE' : 'DRAW'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between my-3">
                        <div className="flex-1 text-center font-bold text-sm truncate text-gray-700">{teamName}</div>
                        <div className="flex flex-col items-center gap-0 mx-2">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl font-black text-gray-900 leading-none">{match.ourScore}</span>
                                <span className="text-gray-200 text-xl">-</span>
                                <span className="text-3xl font-black text-gray-900 leading-none">{match.opponentScore}</span>
                            </div>
                            {match.pkInfo?.isPk && (
                                <div className="text-[10px] font-black text-blue-600 mt-1">
                                    PK {match.pkInfo.ourPkScore} - {match.pkInfo.opponentPkScore}
                                </div>
                            )}
                            {match.matchFormat === 'halves' && (match.ourScore1H !== undefined || match.ourScore2H !== undefined) && (
                                <div className="text-[8px] font-bold text-gray-400 mt-1 flex gap-2">
                                    <span>前半: {match.ourScore1H ?? 0}-{match.opponentScore1H ?? 0}</span>
                                    <span>後半: {match.ourScore2H ?? 0}-{match.opponentScore2H ?? 0}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 text-center font-bold text-sm truncate text-gray-700">{match.opponentName}</div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                        {match.scorers && (
                            <div className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                ⚽️ {match.scorers}
                            </div>
                        )}
                        {match.mvp && (
                            <div className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                                ⭐ MVP: {match.mvp}
                            </div>
                        )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-50 flex justify-between items-center">
                        <span className="text-[9px] font-bold text-gray-300">@{match.venueName || '未設定'}</span>
                        {match.memo && <span className="text-[9px] text-gray-400 truncate max-w-[100px] italic">"{match.memo}"</span>}
                    </div>
                </Link>
            ))}
        </div>
    );
}
