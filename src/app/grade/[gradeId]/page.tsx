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
        { refreshInterval: 30000 }
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

    return (
        <main className="flex-grow container mx-auto px-4 py-8 max-w-2xl">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{teamName} {gradeId}</h1>
                    <Link href="/" className="text-sm text-blue-600 hover:underline">← 学年選択に戻る</Link>
                </div>
                <Link
                    href={`/grade/${gradeId}/match/new`}
                    className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-colors text-sm"
                >
                    新規記録
                </Link>
            </header>

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

            <MatchList matches={filteredMatches} gradeId={gradeId} teamName={teamName} />
        </main>
    );
}
