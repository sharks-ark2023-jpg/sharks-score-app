'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Match, GlobalSettings } from '@/types';
import MatchList from '@/components/MatchList';
import Modal from '@/components/Modal';
import Link from 'next/link';
import useSWR from 'swr';

const fetcher = async (url: string) => {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'エラーが発生しました');
    }
    return data;
};

export default function GradeDashboard() {
    const { gradeId } = useParams() as { gradeId: string };
    const [filterType, setFilterType] = useState<string>('all');
    const [isBandModalOpen, setIsBandModalOpen] = useState(false);
    const [bandDate, setBandDate] = useState('');
    const [bandText, setBandText] = useState('');
    const [copied, setCopied] = useState(false);

    const { data: matchesRes, error, isLoading } = useSWR<{ matches: Match[], spreadsheetId: string }>(
        `/api/matches?grade=${gradeId}`,
        fetcher,
        { refreshInterval: 15000 }
    );

    const { data: settingsData } = useSWR<{ settings: GlobalSettings }>(
        `/api/settings?grade=${gradeId}`,
        fetcher
    );

    const teamName = settingsData?.settings?.teamName || 'シャークス';
    const spreadsheetId = matchesRes?.spreadsheetId ||
        (error as Error & { spreadsheetId?: string } | undefined)?.spreadsheetId;

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <main className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl shadow-sm max-w-lg mx-auto">
                    <p className="font-bold flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        読み込みエラー
                    </p>
                    <p className="mt-2 text-sm opacity-80">{error.message}</p>
                    {spreadsheetId && (
                        <div className="mt-4">
                            <a
                                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-red-200 text-xs font-bold hover:bg-red-50 transition-colors"
                            >
                                GOOGLE SHEET を確認
                            </a>
                        </div>
                    )}
                </div>
            </main>
        );
    }

    const allMatches = matchesRes?.matches || [];
    const liveMatches = allMatches.filter(m => m.isLive);

    // アクティブ期間: 当月 + (15日以前なら前月も含む)
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

    const activeMatches = allMatches.filter(m => isActiveMonth(m.matchDate));

    const filteredMatches = activeMatches.filter(m => {
        const typeMatch = filterType === 'all' || m.matchType === filterType;
        return typeMatch;
    });

    const hasArchive = allMatches.some(m => !isActiveMonth(m.matchDate));

    const parseScorers = (scorers: string): string => {
        if (!scorers) return '';
        return scorers.split(',').map(s => {
            const t = s.trim();
            const m = t.match(/^(.+)\((\d+)\)$/);
            return m ? `${m[1].trim()}×${m[2]}` : t;
        }).filter(Boolean).join(' ');
    };

    const generateBandText = (date: string): string => {
        const dayMatches = allMatches.filter(m => m.matchDate === date).slice().reverse();
        if (dayMatches.length === 0) return '（この日の試合記録がありません）';
        const first = dayMatches[0];
        const d = new Date(date + 'T00:00:00');
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        const dateStr = `${d.getMonth() + 1}月${d.getDate()}日(${weekdays[d.getDay()]})`;
        const eventName = first.matchType === 'tournament' && first.tournamentName ? first.tournamentName : 'フレンドリー';
        const formatStr = first.matchFormat === 'halves' ? '前後半' : `${first.matchDuration ?? 15}分１本`;
        const nums = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫','⑬','⑭','⑮','⑯','⑰','⑱','⑲','⑳'];
        const matchLines = dayMatches.map((m, i) => {
            const num = nums[i] || `(${i + 1})`;
            const sym = m.result === 'win' ? '○' : m.result === 'loss' ? '●' : '△';
            const score = `${m.ourScore}-${m.opponentScore}`;
            const scorerStr = parseScorers(m.scorers || '');
            const names = scorerStr ? scorerStr.split(' ').filter(Boolean) : [];
            if (names.length === 0) return `${num}${sym}${score}`;
            if (names.length <= 3) return `${num}${sym}${score}　${scorerStr}`;
            return `${num}${sym}${score}\n　${scorerStr}`;
        }).join('\n');
        const lines = ['【試合結果】', gradeId, `${dateStr} ${eventName}`];
        if (first.venueName) lines.push(`@${first.venueName}`);
        lines.push(formatStr, matchLines, '', '〇〇コーチ、〇〇コーチご指導ありがとうございました。', '〇〇父、審判ありがとうございました。', '保護者の皆様、引率、撮影、応援のご協力ありがとうございました。', '', `${gradeId}マネ　〇〇、〇〇`, '#試合結果');
        return lines.join('\n');
    };

    const openBandModal = () => {
        const today = new Date().toISOString().split('T')[0];
        setBandDate(today);
        setBandText(generateBandText(today));
        setIsBandModalOpen(true);
        setCopied(false);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(bandText);
        } catch {
            const el = document.createElement('textarea');
            el.value = bandText;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <main className="flex-grow max-w-lg mx-auto w-full pb-24 bg-[#F5F7FA]">
            <header className="stadium-hero px-5 pt-6 pb-0">
              <div className="relative z-10 flex items-center justify-between pb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-sharks-navy/85 border-2 border-sharks-accent flex items-center justify-center shrink-0 shadow-lg">
                        <span className="text-white font-bebas text-2xl leading-none">S</span>
                    </div>
                    <div>
                        <h1 className="font-black text-lg tracking-tight text-white drop-shadow-md">{teamName} {gradeId}</h1>
                        <p className="text-[9px] font-black text-white/75 uppercase tracking-[0.2em]">MATCH CENTER</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link href="/settings" className="p-2.5 rounded-xl text-white bg-black/15 border border-white/20 hover:bg-black/25 transition-colors" title="設定">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </Link>
                </div>
              </div>
              <div className="relative z-10 grid grid-cols-2 text-center text-xs font-black">
                <span className="py-3 border-b-[3px] border-sharks-accent">試合履歴</span>
                <Link href={`/grade/${gradeId}/stats`} className="py-3 border-b-[3px] border-transparent text-white/75">ランキング</Link>
              </div>
            </header>

            <section className="app-surface animate-in fade-in slide-in-from-bottom-4 duration-500 px-3 pt-4">
                    {liveMatches.length > 0 && (
                        <div className="mb-10">
                            <h2 className="text-[10px] font-black text-red-600 flex items-center gap-2 mb-4 uppercase tracking-[0.2em]">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                                </span>
                                Match In Progress
                            </h2>
                            <MatchList matches={liveMatches} gradeId={gradeId} teamName={teamName} />
                        </div>
                    )}

                    <div className="flex justify-between items-center mb-6 pl-1 gap-2">
                        <div className="flex items-center gap-2">
                            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recent Matches</h2>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={openBandModal}
                                className="text-[9px] font-black border-2 border-gray-100 rounded-full px-3 py-1.5 bg-white text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all outline-none whitespace-nowrap"
                            >
                                BAND書き出し
                            </button>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="text-[9px] font-black border-2 border-gray-50 rounded-full px-3 py-1.5 bg-gray-50 text-gray-500 focus:bg-white focus:border-blue-500 transition-all outline-none"
                            >
                                <option value="all">ALL TYPES</option>
                                <option value="friendly">FRIENDLY</option>
                                <option value="tournament">OFFICIAL</option>
                            </select>
                        </div>
                    </div>

                    {filteredMatches.length === 0 && !isLoading ? (
                        <div className="p-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                            <p className="text-gray-300 font-black text-[10px] uppercase tracking-widest">No Matches Found</p>
                            <p className="mt-4 text-[10px] font-black text-blue-500">
                                START RECORDING →
                            </p>
                        </div>
                    ) : (
                        <MatchList matches={filteredMatches.filter(m => !m.isLive)} gradeId={gradeId} teamName={teamName} />
                    )}

                    {hasArchive && (
                        <div className="mt-8 text-center">
                            <Link
                                href={`/grade/${gradeId}/archive`}
                                className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                                過去の試合を見る
                            </Link>
                        </div>
                    )}
                </section>

            {/* BAND書き出しモーダル */}
            <Modal isOpen={isBandModalOpen} onClose={() => setIsBandModalOpen(false)} title="BAND書き出し">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">日付</label>
                        <input
                            type="date"
                            value={bandDate}
                            onChange={(e) => {
                                setBandDate(e.target.value);
                                setBandText(generateBandText(e.target.value));
                                setCopied(false);
                            }}
                            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 focus:outline-none focus:border-blue-400"
                        />
                    </div>
                    <textarea
                        value={bandText}
                        onChange={(e) => setBandText(e.target.value)}
                        className="w-full h-80 border border-gray-100 rounded-2xl p-4 text-sm text-gray-700 leading-relaxed resize-none focus:outline-none focus:border-blue-300 bg-gray-50"
                    />
                    <button
                        onClick={handleCopy}
                        className={`w-full py-4 font-black rounded-2xl text-xs uppercase tracking-widest transition-all active:scale-95 ${copied ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'bg-gray-900 text-white hover:bg-black shadow-xl shadow-gray-200'}`}
                    >
                        {copied ? '✓ コピーしました' : '📋 コピー'}
                    </button>
                </div>
            </Modal>

            {/* Connection Status Section */}
            <footer className="mt-8 pt-8 border-t border-gray-50">
                <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                    <h2 className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em]">Connection Status</h2>
                </div>
                {spreadsheetId && (
                    <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between group">
                        <div className="truncate">
                            <p className="text-[10px] font-bold text-gray-400 truncate max-w-[180px] font-mono">{spreadsheetId}</p>
                        </div>
                        <a
                            href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white text-gray-400 rounded-xl border border-gray-100 hover:text-green-600 hover:border-green-100 transition-all shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                )}
                <p className="mt-6 text-center text-[10px] text-gray-200 font-black tracking-widest uppercase">SHARKS SCORE APP v1.3</p>
            </footer>
        </main>
    );
}
