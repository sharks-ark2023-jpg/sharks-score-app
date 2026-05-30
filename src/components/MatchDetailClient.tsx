'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Match } from '@/types';
import MatchAnalysis from '@/components/MatchAnalysis';

interface Props {
  match: Match;
  gradeId: string;
  isLoggedIn: boolean;
}

const parseScorers = (scorers: string): { name: string; goals: number }[] => {
  if (!scorers) return [];
  return scorers
    .split(',')
    .map(s => {
      const t = s.trim();
      const m = t.match(/^(.+)\((\d+)\)$/);
      return m ? { name: m[1].trim(), goals: parseInt(m[2]) } : { name: t, goals: 1 };
    })
    .filter(s => s.name);
};

export default function MatchDetailClient({ match, gradeId, isLoggedIn }: Props) {
  const [activeTab, setActiveTab] = useState<'record' | 'info'>('record');

  const matchId = match.matchId;

  const resultLabel =
    match.result === 'win' ? 'WIN' : match.result === 'loss' ? 'LOSE' : 'DRAW';
  const resultStyle =
    match.result === 'win'
      ? 'bg-[#00693E] text-white shadow-green-100'
      : match.result === 'loss'
      ? 'bg-[#FF2D2D] text-white shadow-red-100'
      : 'bg-slate-400 text-white shadow-slate-100';

  const formatLabel =
    match.matchFormat === 'halves' ? '前後半' : `${match.matchDuration ?? 15}min`;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: '試合詳細', url: window.location.href });
    }
  };

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  const scorerList = match.scorers ? parseScorers(match.scorers) : [];

  return (
    <main className="flex-grow container mx-auto px-4 py-8 max-w-lg pb-24">
      {/* ヘッダー */}
      <header className="mb-6 flex items-center justify-between">
        <Link
          href={`/grade/${gradeId}`}
          className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <span className="text-lg font-black text-gray-900">試合詳細</span>

        <div className="flex items-center gap-2">
          {canShare && (
            <button
              onClick={handleShare}
              className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="シェア"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
          )}
          {isLoggedIn && (
            <Link
              href={`/grade/${gradeId}/match/${matchId}`}
              className="text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors uppercase tracking-widest border border-blue-100"
            >
              編集する
            </Link>
          )}
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-lg shadow-slate-200/60 border border-slate-100 overflow-hidden">
        {/* ヘッダー帯: 日付・形式・バッジ */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {match.matchDate}
            </span>
            <div className="flex items-center gap-2">
              {match.matchType === 'tournament' && (
                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 uppercase tracking-widest">
                  {match.tournamentName || '公式戦'}
                </span>
              )}
              <span className="text-[9px] font-black text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100 uppercase tracking-widest">
                {formatLabel}
              </span>
            </div>
          </div>
          {!match.isLive && (
            <span
              className={`inline-block text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${resultStyle}`}
            >
              {resultLabel}
            </span>
          )}
        </div>

        {/* スコア */}
        <div className="px-6 py-8">
          <div className="grid grid-cols-3 items-center">
            <div className="text-center">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                SHARKS
              </span>
              <div className="font-heading font-black text-sm text-slate-700 leading-tight">
                {gradeId}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-3">
                <span className="font-bebas font-black text-7xl text-slate-900 leading-none">
                  {match.ourScore}
                </span>
                <span className="text-slate-900 text-4xl font-thin">-</span>
                <span className="font-bebas font-black text-7xl text-slate-900 leading-none">
                  {match.opponentScore}
                </span>
              </div>
              {match.pkInfo?.isPk && (
                <div className="text-[10px] font-black text-blue-600 mt-3 px-3 py-1 bg-blue-50 rounded-full border border-blue-100 uppercase tracking-[0.2em]">
                  PK {match.pkInfo.ourPkScore} - {match.pkInfo.opponentPkScore}
                </div>
              )}
              {match.matchFormat === 'halves' &&
                (match.ourScore1H !== undefined || match.ourScore2H !== undefined) && (
                  <div className="mt-3 flex gap-3">
                    <div className="text-[9px] font-black text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100 uppercase tracking-widest">
                      1H {match.ourScore1H ?? 0}-{match.opponentScore1H ?? 0}
                    </div>
                    <div className="text-[9px] font-black text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100 uppercase tracking-widest">
                      2H {match.ourScore2H ?? 0}-{match.opponentScore2H ?? 0}
                    </div>
                  </div>
                )}
            </div>
            <div className="text-center">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                対戦相手
              </span>
              <div className="font-heading font-black text-sm text-slate-700 leading-tight">
                {match.opponentName}
              </div>
            </div>
          </div>
        </div>

        {/* タブ */}
        <div className="flex border-b border-slate-100">
          <button
            className={`flex-1 py-3 text-sm font-black tracking-wide transition-colors ${
              activeTab === 'record'
                ? 'border-b-2 border-[#00693E] text-[#00693E]'
                : 'text-slate-400'
            }`}
            onClick={() => setActiveTab('record')}
          >
            試合記録
          </button>
          <button
            className={`flex-1 py-3 text-sm font-black tracking-wide transition-colors ${
              activeTab === 'info'
                ? 'border-b-2 border-[#00693E] text-[#00693E]'
                : 'text-slate-400'
            }`}
            onClick={() => setActiveTab('info')}
          >
            基本情報
          </button>
        </div>

        {/* 試合記録タブ */}
        {activeTab === 'record' && (
          <div className="px-6 pt-5 pb-6 space-y-4">
            {/* 得点記録 */}
            {scorerList.length > 0 && (
              <div className="space-y-4 py-1">
                {scorerList.map((scorer, i) => (
                  <div key={i} className="flex items-center gap-3.5 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-sm shrink-0 shadow-sm">
                      ⚽
                    </div>
                    <span className="font-bold text-[13px] flex-1 text-slate-800 tracking-wide">{scorer.name}</span>
                    <span className="font-black text-sm text-slate-850 shrink-0">
                      {scorer.goals}<span className="text-[10px] font-bold text-slate-500 ml-0.5">点</span>
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* AI分析 */}
            <div className="pt-2 border-t border-slate-50">
              <MatchAnalysis gradeId={gradeId} match={match} />
            </div>
          </div>
        )}

        {/* 基本情報タブ */}
        {activeTab === 'info' && (
          <div className="px-6 pt-5 pb-6 space-y-3">
            {match.venueName && (
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-slate-300 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <p className="text-xs font-bold text-slate-500">{match.venueName}</p>
              </div>
            )}
            {match.mvp && (
              <div className="flex items-center gap-2">
                <span className="text-base shrink-0">⭐</span>
                <p className="text-xs font-bold text-amber-700">MVP: {match.mvp}</p>
              </div>
            )}
            {match.memo && (
              <div className="mt-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-500 italic leading-relaxed">&quot;{match.memo}&quot;</p>
              </div>
            )}
            {match.pkInfo?.isPk && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 uppercase tracking-[0.2em]">
                  PK {match.pkInfo.ourPkScore} - {match.pkInfo.opponentPkScore}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
