'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Match, GlobalSettings } from '@/types';
import MatchList from '@/components/MatchList';
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
            <div className="p-4 bg-red-50 text-red-700 rounded-lg max-w-2xl mx-auto mt-8">
                <p className="font-bold">エラーが発生しました</p>
                <p className="text-sm">{error.message}</p>
                {spreadsheetId && (
                    <div className="mt-4">
                        <a
                            href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-white px-3 py-2 rounded-lg border border-red-200 text-xs font-black hover:bg-red-100 transition-colors"
                        >
                            連携先シートを開いて確認
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                )}
            </div>
        );
    }

    const allMatches = Array.isArray(matchesRes?.matches) ? matchesRes!.matches : [];

    // Extract available years
    const years = Array.from(new Set(allMatches.map(m => m.matchDate.split('-')[0]))).sort().reverse();

    const filteredMatches = allMatches.filter(m => {
        const matchYear = m.matchDate.split('-')[0];
        const yearMatch = filterYear === 'all' || matchYear === filterYear;
        const typeMatch = filterType === 'all' || m.matchType === filterType;
        return yearMatch && typeMatch;
    });

    const liveMatches = allMatches.filter(m => m.isLive);
    const nonLiveMatches = filteredMatches.filter(m => !m.isLive);

    return (
        <main className="flex-grow container mx-auto px-4 py-8 max-w-2xl">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{teamName} {gradeId}</h1>
                    <Link href="/" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        学年選択
                    </Link>
                </div>
                <div className="flex gap-2">
                    <Link
                        href={`/grade/${gradeId}/players`}
                        className="px-4 py-3 bg-white border-2 border-gray-50 text-gray-600 font-black rounded-2xl shadow-sm hover:shadow-md hover:border-gray-100 transition-all text-xs uppercase"
                    >
                        PLAYERS
                    </Link>
                    <Link
                        href={`/grade/${gradeId}/match/new`}
                        className="px-4 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5 transition-all text-xs uppercase"
                    >
                        NEW MATCH
                    </Link>
                </div>
            </header>

            {/* Live Matches Section */}
            {liveMatches.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-[10px] font-black text-red-600 flex items-center gap-2 mb-4 uppercase tracking-[0.2em]">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                        </span>
                        Match In Progress
                    </h2>
                    <div className="space-y-4">
                        <MatchList matches={liveMatches} gradeId={gradeId} teamName={teamName} />
                    </div>
                </section>
            )}

            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="text-[10px] font-black px-4 py-2 rounded-full border-2 border-gray-50 bg-white shadow-sm focus:border-blue-500 outline-none uppercase tracking-widest"
                >
                    <option value="all">ALL YEARS</option>
                    {years.map(y => <option key={y} value={y}>{y}年度</option>)}
                </select>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="text-[10px] font-black px-4 py-2 rounded-full border-2 border-gray-50 bg-white shadow-sm focus:border-blue-500 outline-none uppercase tracking-widest"
                >
                    <option value="all">ALL TYPES</option>
                    <option value="friendly">FRIENDLY</option>
                    <option value="tournament">TOURNAMENT</option>
                </select>
            </div>

            <MatchList matches={nonLiveMatches} gradeId={gradeId} teamName={teamName} />

            {/* Connection Status Section */}
            <section className="mt-12 pt-8 border-t-2 border-gray-50">
                <div className="bg-gray-50 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-2xl">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">DATABASE CONNECTED</p>
                            <p className="text-xs font-bold text-gray-700 mt-1">{gradeId}_Matches シートと同期中</p>
                        </div>
                    </div>
                    {spreadsheetId && (
                        <a
                            href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white px-5 py-3 rounded-2xl border-2 border-gray-100 text-[10px] font-black text-blue-600 hover:bg-blue-50 hover:border-blue-100 transition-all uppercase tracking-widest shadow-sm"
                        >
                            Open Google Sheets
                        </a>
                    )}
                </div>
            </section>
        </main>
    );
}
