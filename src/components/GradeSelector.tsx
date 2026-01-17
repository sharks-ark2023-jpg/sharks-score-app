'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GradeConfig } from '@/types';

export default function GradeSelector() {
    const [grades, setGrades] = useState<GradeConfig[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/grades')
            .then(res => res.json())
            .then(data => {
                setGrades(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch grades:', err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (grades.length === 0) {
        return (
            <div className="text-center p-8 bg-white rounded-lg shadow">
                <p className="text-gray-500">学年が設定されていません。.env.localを確認してください。</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {grades.map((grade) => (
                <Link
                    key={grade.name}
                    href={`/grade/${grade.name}`}
                    className="group relative overflow-hidden p-8 bg-white rounded-[2rem] shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col items-center justify-center gap-4 active:scale-95"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-2 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                        <span className="font-black text-xl">{grade.name.replace(/[^0-9]/g, '') || 'G'}</span>
                    </div>
                    <span className="relative font-black text-2xl text-gray-900 tracking-tight group-hover:text-blue-900 transition-colors uppercase">
                        {grade.name}
                    </span>
                    <span className="relative text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-blue-400">
                        View Dashboard
                    </span>
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </div>
                </Link>
            ))}
        </div>
    );
}
