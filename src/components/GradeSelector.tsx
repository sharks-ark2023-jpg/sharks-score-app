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
                    className="flex items-center justify-between p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                >
                    <span className="text-lg font-semibold text-gray-900">{grade.name}</span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
                    </svg>
                </Link>
            ))}
        </div>
    );
}
