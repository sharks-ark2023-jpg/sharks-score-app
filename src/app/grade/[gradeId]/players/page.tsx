'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { CommonMaster } from '@/types';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PlayerManagementPage() {
    const { gradeId } = useParams() as { gradeId: string };
    const router = useRouter();
    const { data: players, mutate } = useSWR<CommonMaster[]>(`/api/masters?grade=${gradeId}&type=player`, fetcher);

    const [newName, setNewName] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleAddPlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/masters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim(), type: 'player', grade: gradeId }),
            });

            if (!res.ok) throw new Error('保存に失敗しました');

            setMessage({ type: 'success', text: `${newName} さんを追加しました` });
            setNewName('');
            mutate();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePlayer = async (name: string) => {
        if (!confirm(`${name} さんを削除してもよろしいですか？`)) return;

        try {
            const res = await fetch(`/api/masters?name=${encodeURIComponent(name)}&type=player&grade=${gradeId}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('削除に失敗しました');

            setMessage({ type: 'success', text: '削除しました' });
            mutate();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        }
    };

    return (
        <main className="container mx-auto px-4 py-8 max-w-lg">
            <header className="mb-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">{gradeId} 選手管理</h1>
                    <Link href={`/grade/${gradeId}`} className="text-sm text-blue-600 hover:underline">← ダッシュボード</Link>
                </div>
                <p className="text-sm text-gray-500 mt-1">得点者選択などの候補に表示される選手を管理します</p>
            </header>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <h2 className="text-sm font-bold text-gray-700 mb-4">新規選手追加</h2>
                <form onSubmit={handleAddPlayer} className="flex gap-2">
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="氏名を入力"
                        className="flex-grow rounded-lg border-gray-300 bg-gray-50 p-3 focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        追加
                    </button>
                </form>
                {message && (
                    <div className={`mt-4 p-3 rounded-lg text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <h2 className="text-sm font-bold text-gray-700 p-6 border-b">選手一覧 ({players?.filter(p => p.masterType === 'player').length || 0}名)</h2>
                <ul className="divide-y divide-gray-100">
                    {players?.filter(p => p.masterType === 'player').map((player) => (
                        <li key={player.name} className="flex justify-between items-center p-4 hover:bg-gray-50">
                            <span className="font-medium text-gray-900">{player.name}</span>
                            <button
                                onClick={() => handleDeletePlayer(player.name)}
                                className="text-red-500 hover:text-red-700 p-2"
                                title="削除"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </li>
                    ))}
                    {(!players || players.filter(p => p.masterType === 'player').length === 0) && (
                        <li className="p-12 text-center text-gray-400">選手が登録されていません</li>
                    )}
                </ul>
            </section>
        </main>
    );
}
