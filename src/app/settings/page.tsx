'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { GlobalSettings } from '@/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SettingsPage() {
    const router = useRouter();
    const { data, mutate } = useSWR<{ settings: GlobalSettings }>('/api/settings?grade=U12', fetcher);

    const [formData, setFormData] = useState<Partial<GlobalSettings>>({});
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (data?.settings) {
            setFormData(data.settings);
        }
    }, [data]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('保存に失敗しました');

            setMessage({ type: 'success', text: '設定を保存しました' });
            mutate(); // Refresh local cache
            router.refresh();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    if (!data) return <div className="p-8 text-center">読み込み中...</div>;

    return (
        <main className="container mx-auto px-4 py-8 max-w-lg">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 text-center">チーム設定</h1>
                <p className="text-sm text-gray-500 text-center mt-1">アプリ全体の表示や色を設定します</p>
            </header>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                {message && (
                    <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <label className="block">
                    <span className="text-sm font-bold text-gray-700">チーム名</span>
                    <input
                        type="text"
                        value={formData.teamName || ''}
                        onChange={e => setFormData(p => ({ ...p, teamName: e.target.value }))}
                        className="mt-1 block w-full rounded-lg border-gray-300 bg-gray-50 p-3 focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </label>

                <label className="block">
                    <span className="text-sm font-bold text-gray-700">チームカラー</span>
                    <div className="flex gap-4 mt-1 items-center">
                        <input
                            type="color"
                            value={formData.teamColor || '#1e3a8a'}
                            onChange={e => setFormData(p => ({ ...p, teamColor: e.target.value }))}
                            className="h-10 w-20 rounded cursor-pointer border-none p-0"
                        />
                        <span className="text-xs font-mono text-gray-500 uppercase">{formData.teamColor}</span>
                    </div>
                </label>

                <label className="block">
                    <span className="text-sm font-bold text-gray-700">ロゴ画像URL</span>
                    <input
                        type="url"
                        value={formData.teamLogoUrl || ''}
                        onChange={e => setFormData(p => ({ ...p, teamLogoUrl: e.target.value }))}
                        placeholder="https://example.com/logo.png"
                        className="mt-1 block w-full rounded-lg border-gray-300 bg-gray-50 p-3 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {formData.teamLogoUrl && (
                        <div className="mt-3 flex justify-center p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <img src={formData.teamLogoUrl} alt="Preview" className="h-16 object-contain" />
                        </div>
                    )}
                </label>

                <div className="pt-4 flex gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        戻る
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-[2] px-4 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all uppercase tracking-tight"
                    >
                        {saving ? '保存中...' : '設定を適用'}
                    </button>
                </div>
            </form>
        </main>
    );
}
