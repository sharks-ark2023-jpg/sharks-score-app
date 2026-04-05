'use client';

import { useState } from 'react';
import { Match } from '@/types';

interface MatchAnalysisProps {
    gradeId: string;
    match: Match;
}

export default function MatchAnalysis({ gradeId, match }: MatchAnalysisProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setError(null);
        setAnalysis(null);

        try {
            const res = await fetch('/api/matches/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grade: gradeId,
                    matchId: match.matchId,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || '分析に失敗しました');
            }

            const data = await res.json();
            setAnalysis(data.analysis);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="bg-blue-50 rounded-[2rem] p-6 border border-blue-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="text-xs font-black text-blue-700 uppercase tracking-widest">AI試合分析</h3>
            </div>

            {!analysis && !error && (
                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full py-3 bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:bg-blue-300 transition-all uppercase text-xs tracking-widest"
                >
                    {isAnalyzing ? '分析中...' : 'AI で試合を分析'}
                </button>
            )}

            {isAnalyzing && (
                <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
            )}

            {analysis && (
                <div className="bg-white rounded-xl p-4 border border-blue-100">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{analysis}</p>
                    <button
                        onClick={() => setAnalysis(null)}
                        className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        別の分析を見る →
                    </button>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-xs text-red-700 font-bold">{error}</p>
                    <button
                        onClick={() => setError(null)}
                        className="mt-2 text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
                    >
                        閉じる
                    </button>
                </div>
            )}
        </div>
    );
}
