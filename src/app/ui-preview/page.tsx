'use client';

import { useState } from 'react';
import MatchList from '@/components/MatchList';
import type { Match } from '@/types';

type PreviewScreen = 'home' | 'live' | 'detail' | 'ranking';

const now = '2026-07-23T12:00:00.000Z';

const previewMatches: Match[] = [
  {
    matchId: 'preview-1',
    matchDate: '2026-05-24',
    matchType: 'tournament',
    opponentName: 'TFA',
    venueName: '向原グラウンド',
    matchFormat: 'one_game',
    matchDuration: 15,
    ourScore: 0,
    opponentScore: 3,
    result: 'loss',
    isLive: false,
    scorers: '',
    lastUpdated: now,
    lastUpdatedBy: 'preview',
    createdAt: now,
    createdBy: 'preview',
  },
  {
    matchId: 'preview-2',
    matchDate: '2026-05-23',
    matchType: 'friendly',
    opponentName: 'FCレパード',
    venueName: '向原グラウンド',
    matchFormat: 'one_game',
    matchDuration: 15,
    ourScore: 2,
    opponentScore: 2,
    result: 'draw',
    isLive: false,
    scorers: 'いたる, はるひと',
    lastUpdated: now,
    lastUpdatedBy: 'preview',
    createdAt: now,
    createdBy: 'preview',
  },
  {
    matchId: 'preview-3',
    matchDate: '2026-05-23',
    matchType: 'friendly',
    opponentName: 'ブルーウイング',
    venueName: '向原グラウンド',
    matchFormat: 'one_game',
    matchDuration: 15,
    ourScore: 3,
    opponentScore: 1,
    result: 'win',
    isLive: false,
    scorers: 'いたる(2), しおん',
    lastUpdated: now,
    lastUpdatedBy: 'preview',
    createdAt: now,
    createdBy: 'preview',
  },
];

const players = [
  ['1', 'ゆい'],
  ['2', 'しおん'],
  ['3', 'はるひと'],
  ['4', 'ゆうが'],
  ['5', 'けい'],
  ['6', 'あさと'],
  ['7', 'いたる'],
  ['8', 'あやと'],
  ['9', 'あおと'],
  ['10', 'えいた'],
  ['11', 'たいせい'],
  ['12', 'りこ'],
];

const rankings = [
  ['いたる', 7],
  ['はるひと', 4],
  ['しおん', 3],
  ['ゆうが', 2],
  ['けい', 2],
  ['あさと', 1],
];

function PreviewHeader({ title }: { title: string }) {
  return (
    <header className="bg-sharks-ink px-4 py-4 text-white">
      <div className="flex items-center justify-between">
        <span className="text-xl" aria-hidden="true">‹</span>
        <h1 className="text-base font-black">{title}</h1>
        <span className="w-5" />
      </div>
    </header>
  );
}

export default function UiPreviewPage() {
  const [screen, setScreen] = useState<PreviewScreen>('home');
  const [selectedPlayer, setSelectedPlayer] = useState('7');

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg bg-[#F5F7FA] pb-28">
      <nav className="sticky top-0 z-[90] grid grid-cols-4 gap-1 border-b border-slate-200 bg-white/95 p-2 backdrop-blur">
        {([
          ['home', 'ホーム'],
          ['live', 'ライブ'],
          ['detail', '詳細'],
          ['ranking', '順位'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setScreen(id)}
            className={`rounded-lg px-2 py-2 text-[11px] font-black ${
              screen === id ? 'bg-sharks-navy text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {screen === 'home' && (
        <>
          <header className="stadium-hero px-5 pt-7">
            <div className="relative z-10 flex items-center justify-between pb-7">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-sharks-accent bg-sharks-navy/85 shadow-lg">
                  <span className="font-bebas text-2xl">S</span>
                </div>
                <div>
                  <h1 className="text-lg font-black drop-shadow-md">向原シャークス U12</h1>
                  <p className="text-[9px] font-black tracking-[0.2em] text-white/75">MATCH CENTER</p>
                </div>
              </div>
              <span className="text-xl" aria-label="設定">⚙</span>
            </div>
            <div className="relative z-10 grid grid-cols-2 text-center text-xs font-black">
              <span className="border-b-[3px] border-sharks-accent py-3">試合履歴</span>
              <span className="border-b-[3px] border-transparent py-3 text-white/70">ランキング</span>
            </div>
          </header>
          <section className="app-surface px-3 pt-4">
            <h2 className="mb-3 text-sm font-black text-slate-800">最近の試合</h2>
            <MatchList matches={previewMatches} gradeId="U12" teamName="SHARKS" />
          </section>
        </>
      )}

      {screen === 'live' && (
        <>
          <div className="flex items-center justify-between bg-gradient-to-r from-[#00693E] to-[#00472A] px-4 py-3 text-white">
            <span className="rounded-md bg-sharks-red px-2.5 py-1 text-xs font-black">● LIVE</span>
            <div className="text-center">
              <p className="text-[10px] font-bold">前半</p>
              <p className="font-bebas text-3xl leading-none">08:24</p>
            </div>
            <button type="button" className="rounded-lg border border-white/60 px-3 py-2 text-[10px] font-black">前半終了</button>
          </div>
          <section className="space-y-5 px-3 py-4">
            <div className="compact-card flex items-center justify-between px-5 py-6">
              <div className="w-1/3 font-black"><span className="block text-xs">SHARKS</span><span>U12</span></div>
              <div className="flex items-center gap-3 font-bebas text-6xl"><span>1</span><span className="text-3xl">-</span><span>0</span></div>
              <div className="w-1/3 text-right text-xs font-black">対戦相手</div>
            </div>
            <div>
              <h2 className="mb-2 text-sm font-black">スコアを入力</h2>
              <div className="grid grid-cols-2 gap-3">
                {['SHARKS', '対戦相手'].map((team, index) => (
                  <div key={team} className="compact-card overflow-hidden">
                    <div className={`${index === 0 ? 'bg-sharks-blue' : 'bg-slate-600'} py-2 text-center text-xs font-black text-white`}>{team}</div>
                    <div className="flex items-center justify-between p-3">
                      <button type="button" className="h-8 w-8 rounded-full bg-slate-100 text-xl">−</button>
                      <span className="font-bebas text-5xl">{index === 0 ? 1 : 0}</span>
                      <button type="button" className="h-8 w-8 rounded-full bg-slate-100 text-xl">＋</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-3 text-sm font-black">得点した選手を選択</h2>
              <div className="grid grid-cols-3 gap-2">
                {players.map(([number, name]) => (
                  <button
                    key={number}
                    type="button"
                    onClick={() => setSelectedPlayer(number)}
                    className={`rounded-lg border px-2 py-3 text-xs font-black shadow-sm ${
                      selectedPlayer === number ? 'border-sharks-blue bg-sharks-blue text-white' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <span className="mr-1.5 opacity-70">{number}</span>{name}
                  </button>
                ))}
              </div>
            </div>
            <button type="button" className="w-full rounded-xl bg-sharks-blue py-4 text-sm font-black text-white shadow-lg">得点を記録する</button>
          </section>
        </>
      )}

      {screen === 'detail' && (
        <>
          <PreviewHeader title="試合詳細" />
          <section className="bg-white">
            <div className="flex items-center justify-between px-5 pt-5 text-xs font-bold text-slate-500">
              <span>2026.05.24（土）</span><span>15MIN</span>
            </div>
            <div className="px-5 pt-3"><span className="rounded-md bg-sharks-red px-3 py-1 text-[10px] font-black text-white">LOSE</span></div>
            <div className="grid grid-cols-3 items-center px-5 py-8 text-center">
              <div className="font-black">SHARKS<br />U12</div>
              <div className="flex items-center justify-center gap-3 font-bebas text-7xl"><span>0</span><span className="text-4xl">-</span><span>3</span></div>
              <div className="font-black">TFA</div>
            </div>
            <div className="grid grid-cols-2 border-b border-slate-200 text-center text-sm font-black">
              <span className="border-b-[3px] border-sharks-green py-3 text-sharks-green">試合記録</span>
              <span className="py-3 text-slate-500">基本情報</span>
            </div>
          </section>
          <section className="m-3 rounded-xl border border-slate-200 bg-white px-4">
            {[['いたる', 1], ['はるひと', 2], ['しおん', 3]].map(([name, goals]) => (
              <div key={String(name)} className="flex items-center border-b border-slate-100 py-5 last:border-0">
                <span className="mr-3 text-xl">⚽</span>
                <span className="flex-1 text-sm font-black">{name}</span>
                <span className="text-sm font-black">{goals}点</span>
              </div>
            ))}
          </section>
        </>
      )}

      {screen === 'ranking' && (
        <>
          <PreviewHeader title="得点ランキング" />
          <section className="px-3 py-4">
            <div className="mb-3 rounded-xl border-b-[3px] border-sharks-accent bg-sharks-ink py-3 text-center text-sm font-black text-white">
              チーム内 得点ランキング
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {rankings.map(([name, goals], index) => (
                <div key={String(name)} className="flex items-center border-b border-slate-100 px-5 py-4 last:border-0">
                  <span className="w-9 font-bebas text-2xl">{index + 1}</span>
                  <span className="flex-1 text-sm font-black">{name}</span>
                  <span className="font-bebas text-2xl">{goals}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-[10px] font-bold text-slate-400">固定ダミーデータによるUI確認画面です</p>
          </section>
        </>
      )}
    </main>
  );
}
