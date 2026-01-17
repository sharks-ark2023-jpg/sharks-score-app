'use client';

import { useState, useEffect } from 'react';
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

    const { data: matches, error, isLoading } = useSWR<Match[]>(
        `/api/matches?grade=${gradeId}`,
        fetcher,
        { refreshInterval: 15000 } // Live感を出すため 15秒に短縮
    );

    const { data: settingsData } = useSWR<{ settings: GlobalSettings }>(
        `/api/settings?grade=${gradeId}`,
        fetcher
    );

    const teamName = settingsData?.settings?.teamName || 'シャークス';

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                <p className="font-bold">エラーが発生しました</p>
                <p className="text-sm">{error.message}</p>
                {error.message.includes('not found') && (
                    <p className="mt-2 text-xs">スプレッドシートに「{gradeId}_Matches」シートがあるか確認してください。</p>
                )}
            </div>
        );
    }

    const allMatches = Array.isArray(matches) ? matches : [];

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
                    <h1 className="text-2xl font-bold text-gray-900">{teamName} {gradeId}</h1>
                    <Link href="/" className="text-sm text-blue-600 hover:underline">← 学年選択に戻る</Link>
                </div>
                <div className="flex gap-2">
                    <Link
                        href={`/grade/${gradeId}/players`}
                        className="px-4 py-2 border border-gray-200 text-gray-600 font-bold rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-sm flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        選手管理
                    </Link>
                    <Link
                        href={`/grade/${gradeId}/match/new`}
                        className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-colors text-sm"
                    >
                        新規記録
                    </Link>
                </div>
            </header>

            {/* Live Matches Section */}
            {liveMatches.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-sm font-black text-red-600 flex items-center gap-2 mb-3">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                        </span>
                        試合中 (リアルタイム速報)
                    </h2>
                    <div className="space-y-4">
                        <MatchList matches={liveMatches} gradeId={gradeId} teamName={teamName} />
                    </div>
                </section>
            )}

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="text-xs font-bold px-3 py-2 rounded-full border-gray-200 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="all">すべての年度</option>
                    {years.map(y => <option key={y} value={y}>{y}年度</option>)}
                </select>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="text-xs font-bold px-3 py-2 rounded-full border-gray-200 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="all">すべての種別</option>
                    <option value="friendly">フレンドリー</option>
                    <option value="tournament">大会</option>
                </select>
            </div>

            <MatchList matches={nonLiveMatches} gradeId={gradeId} teamName={teamName} />
        </main>
    );
}
