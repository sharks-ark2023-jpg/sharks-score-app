'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Match, GlobalSettings } from '@/types';
import MatchList from '@/components/MatchList';
import MatchForm from '@/components/MatchForm';
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
    const [filterYear, setFilterYear] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<'history' | 'input' | 'players'>('history');

    const { data: matchesRes, error, isLoading, mutate } = useSWR<{ matches: Match[], spreadsheetId: string }>(
        `/api/matches?grade=${gradeId}`,
        fetcher,
        { refreshInterval: 15000 }
    );

    const { data: settingsData } = useSWR<{ settings: GlobalSettings }>(
        `/api/settings?grade=${gradeId}`,
        fetcher
    );

    const teamName = settingsData?.settings?.teamName || 'シャークス';
    const spreadsheetId = matchesRes?.spreadsheetId || (error as any)?.spreadsheetId;

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

    const getFiscalYear = (dateStr: string) => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 0-indexed
        return month >= 4 ? year.toString() : (year - 1).toString();
    };

    const allMatches = matchesRes?.matches || [];
    const years = Array.from(new Set(allMatches.map(m => getFiscalYear(m.matchDate)))).sort().reverse();
    const liveMatches = allMatches.filter(m => m.isLive);

    const filteredMatches = allMatches.filter(m => {
        const matchFY = getFiscalYear(m.matchDate);
        const yearMatch = filterYear === 'all' || matchFY === filterYear;
        const typeMatch = filterType === 'all' || m.matchType === filterType;
        return yearMatch && typeMatch;
    });

    return (
        <main className="flex-grow container mx-auto px-4 py-6 max-w-lg">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">{teamName} {gradeId}</h1>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Team Score Dashboard</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/" className="p-2.5 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600 transition-colors" title="学年選択へ">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </Link>
                </div>
            </header>

            {/* Tab Switcher */}
            <nav className="flex bg-gray-100 p-1 rounded-2xl mb-8 gap-1 shadow-inner">
                <button
                    onClick={() => setActiveTab('input')}
                    className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${activeTab === 'input' ? 'bg-white shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    試合入力
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${activeTab === 'history' ? 'bg-white shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    試合履歴
                </button>
                <button
                    onClick={() => setActiveTab('players')}
                    className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${activeTab === 'players' ? 'bg-white shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    選手管理
                </button>
            </nav>

            {activeTab === 'input' && (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-6 flex items-center justify-between px-1">
                        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            Match Registration
                        </h2>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] shadow-2xl shadow-blue-50 border border-gray-50">
                        <MatchForm gradeId={gradeId} onSaved={() => {
                            mutate();
                            setActiveTab('history');
                        }} />
                    </div>
                </section>
            )}

            {activeTab === 'history' && (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Game Logs</h2>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={filterYear}
                                onChange={(e) => setFilterYear(e.target.value)}
                                className="text-[9px] font-black border-2 border-gray-50 rounded-full px-3 py-1.5 bg-gray-50 text-gray-400 focus:bg-white focus:border-blue-500 transition-all outline-none"
                            >
                                <option value="all">ALL YEARS</option>
                                {years.map(y => <option key={y} value={y}>{y}年度</option>)}
                            </select>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="text-[9px] font-black border-2 border-gray-50 rounded-full px-3 py-1.5 bg-gray-50 text-gray-400 focus:bg-white focus:border-blue-500 transition-all outline-none"
                            >
                                <option value="all">TYPES</option>
                                <option value="friendly">FRIENDLY</option>
                                <option value="tournament">OFFICIAL</option>
                            </select>
                        </div>
                    </div>

                    {filteredMatches.length === 0 && !isLoading ? (
                        <div className="p-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                            <p className="text-gray-300 font-black text-[10px] uppercase tracking-widest">No Matches Found</p>
                            <button
                                onClick={() => setActiveTab('input')}
                                className="mt-4 text-[10px] font-black text-blue-500 hover:text-blue-700 transition-colors"
                            >
                                START RECORDING →
                            </button>
                        </div>
                    ) : (
                        <MatchList matches={filteredMatches.filter(m => !m.isLive)} gradeId={gradeId} teamName={teamName} />
                    )}
                </section>
            )}

            {activeTab === 'players' && (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-6 flex items-center justify-between px-1">
                        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Team Portal</h2>
                        <Link href={`/grade/${gradeId}/players`} className="text-[10px] font-black text-blue-600 hover:underline">
                            選手管理画面へ →
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 text-center space-y-4">
                            <div className="mx-auto w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <h3 className="font-black text-gray-900 uppercase tracking-tighter text-xl">選手情報の管理</h3>
                            <p className="text-xs text-gray-400 font-bold leading-relaxed">
                                登録された選手の確認や、<br />
                                新規選手の追加・背番号の編集などが行えます。
                            </p>
                            <Link
                                href={`/grade/${gradeId}/players`}
                                className="inline-block w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all uppercase text-[10px] tracking-widest"
                            >
                                管理ページを開く
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Connection Status Section */}
            <footer className="mt-16 pt-8 border-t border-gray-50">
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
                <p className="mt-8 text-center text-[10px] text-gray-200 font-black tracking-widest uppercase">System Update v1.31 - Tabbed Layout</p>
            </footer>
        </main>
    );
}
