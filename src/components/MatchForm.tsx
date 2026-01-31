'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Match, CommonMaster, GlobalSettings } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import useSWR from 'swr';
import Autocomplete from './Autocomplete';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface MatchFormProps {
    gradeId: string;
    initialMatch?: Match;
    onSaved?: () => void;
}

export default function MatchForm({ gradeId, initialMatch, onSaved }: MatchFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState<Partial<Match>>(
        initialMatch || {
            matchId: uuidv4(),
            matchDate: new Date().toISOString().split('T')[0],
            matchType: 'friendly',
            matchFormat: 'halves',
            opponentName: '',
            venueName: '',
            ourScore: 0,
            opponentScore: 0,
            result: 'draw',
            isLive: false,
            matchPhase: 'pre-game',
            matchDuration: 15,
        }
    );
    const [mode, setMode] = useState<'simple' | 'full'>('full');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data } = useSWR<{ settings: GlobalSettings, masters: CommonMaster[] }>(
        `/api/settings?grade=${gradeId}`,
        fetcher
    );

    const { data: matchesData } = useSWR<{ matches: Match[] }>(
        `/api/matches?grade=${gradeId}`,
        fetcher
    );

    const teamName = data?.settings?.teamName || '自チーム';
    const venues = data?.masters?.filter(m => m.masterType === 'venue') || [];
    const opponents = data?.masters?.filter(m => m.masterType === 'opponent') || [];
    const players = data?.masters?.filter(m => m.masterType === 'player' && (!m.grade || m.grade === gradeId)) || [];

    const calculateResult = (our: number, opponent: number): 'win' | 'loss' | 'draw' => {
        if (our > opponent) return 'win';
        if (our < opponent) return 'loss';
        return 'draw';
    };

    const incrementScore = (side: 'our' | 'opponent', amount: number) => {
        setFormData(prev => {
            const phase = prev.matchPhase;
            const updated = { ...prev };

            if (side === 'our') {
                updated.ourScore = Math.max(0, (prev.ourScore || 0) + amount);
                if (phase === '1H') updated.ourScore1H = Math.max(0, (prev.ourScore1H || 0) + amount);
                if (phase === '2H') updated.ourScore2H = Math.max(0, (prev.ourScore2H || 0) + amount);
            } else {
                updated.opponentScore = Math.max(0, (prev.opponentScore || 0) + amount);
                if (phase === '1H') updated.opponentScore1H = Math.max(0, (prev.opponentScore1H || 0) + amount);
                if (phase === '2H') updated.opponentScore2H = Math.max(0, (prev.opponentScore2H || 0) + amount);
            }

            updated.result = calculateResult(updated.ourScore || 0, updated.opponentScore || 0);
            return updated;
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let newValue: any = value;

        if (type === 'checkbox') {
            newValue = (e.target as HTMLInputElement).checked;
        } else if (type === 'number') {
            newValue = parseInt(value || '0');
        }

        setFormData(prev => {
            const updated = { ...prev, [name]: newValue };

            // 前後半入力時の合計計算（手動入力時）
            if (name === 'ourScore1H' || name === 'ourScore2H') {
                updated.ourScore = (updated.ourScore1H || 0) + (updated.ourScore2H || 0);
            }
            if (name === 'opponentScore1H' || name === 'opponentScore2H') {
                updated.opponentScore = (updated.opponentScore1H || 0) + (updated.opponentScore2H || 0);
            }

            if (name.includes('Score')) {
                updated.result = calculateResult(updated.ourScore || 0, updated.opponentScore || 0);
            }
            return updated;
        });
    };


    const handleQuickScorer = (playerName: string) => {
        // 先にスコアを加算
        incrementScore('our', 1);

        setFormData(prev => {
            const currentScorers = prev.scorers || '';
            const parts = currentScorers.split(',').map(s => s.trim()).filter(Boolean);
            const nameMap: Record<string, number> = {};

            parts.forEach(p => {
                const match = p.match(/^(.+)\((\d+)\)$/);
                if (match) {
                    const name = match[1].trim();
                    const count = parseInt(match[2]);
                    nameMap[name] = (nameMap[name] || 0) + count;
                } else {
                    nameMap[p] = (nameMap[p] || 0) + 1;
                }
            });

            nameMap[playerName] = (nameMap[playerName] || 0) + 1;

            const updatedScorers = Object.entries(nameMap)
                .map(([name, count]) => count > 1 ? `${name}(${count})` : name)
                .join(', ');

            return {
                ...prev,
                scorers: updatedScorers
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent, stayOnPage: boolean = false) => {
        if (e) e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const res = await fetch('/api/matches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grade: gradeId,
                    match: formData,
                }),
            });

            if (res.status === 409) {
                setError('他のユーザーが更新しました。再読み込みして確認してください。');
            } else if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || '保存に失敗しました');
            } else {
                if (onSaved) onSaved();

                if (!stayOnPage) {
                    if (!initialMatch && confirm('保存しました。同じ対戦相手・会場で次の試合を記録しますか？')) {
                        // 継続入力モード：スコアやIDをリセットして対戦相手・会場を維持
                        setFormData(prev => ({
                            ...prev,
                            matchId: uuidv4(),
                            ourScore: 0,
                            ourScore1H: 0,
                            ourScore2H: 0,
                            opponentScore: 0,
                            opponentScore1H: 0,
                            opponentScore2H: 0,
                            result: 'draw',
                            isLive: false,
                            matchPhase: 'pre-game',
                            scorers: '',
                            mvp: '',
                            memo: '',
                            pkInfo: undefined,
                        }));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                        router.push(`/grade/${gradeId}`);
                    }
                }
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!initialMatch?.matchId || !confirm('この試合記録を削除してもよろしいですか？')) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/matches?grade=${gradeId}&matchId=${initialMatch.matchId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('削除に失敗しました');
            if (onSaved) onSaved();
            router.push(`/grade/${gradeId}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-xl font-bold text-gray-900">
                    {initialMatch ? '試合記録を編集' : '新規試合を記録'}
                </h2>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setMode('simple')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${mode === 'simple' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                    >
                        簡易
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('full')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${mode === 'full' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                    >
                        通常
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                <div className={`grid grid-cols-1 gap-4 ${mode === 'simple' ? 'hidden' : 'block'}`}>
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700">試合日</span>
                        <input
                            type="date"
                            name="matchDate"
                            value={formData.matchDate}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2"
                            required
                        />
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">種別</span>
                            <select
                                name="matchType"
                                value={formData.matchType}
                                onChange={(e) => {
                                    const val = e.target.value as 'friendly' | 'tournament';
                                    setFormData(prev => ({
                                        ...prev,
                                        matchType: val,
                                        matchFormat: val === 'tournament' ? 'halves' : prev.matchFormat
                                    }));
                                }}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2"
                            >
                                <option value="friendly">練習試合 (Friendly)</option>
                                <option value="tournament">公式戦・大会 (Tournament/Official)</option>
                            </select>
                        </label>
                        {formData.matchType === 'tournament' && (
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">大会名</span>
                                <input
                                    type="text"
                                    name="tournamentName"
                                    value={formData.tournamentName || ''}
                                    onChange={handleChange}
                                    placeholder="大会名を入力"
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2"
                                />
                            </label>
                        )}
                    </div>

                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100 mb-2">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${formData.isLive ? 'bg-red-600 animate-pulse' : 'bg-gray-300'}`}></div>
                            <div>
                                <span className="text-xs font-black text-gray-700 block uppercase tracking-widest">Live Recording</span>
                                <span className="text-[10px] text-gray-500 block leading-tight">リアルタイムで得点を記録・公開</span>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="isLive"
                                checked={formData.isLive}
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                    </div>

                    <div className={`grid grid-cols-2 gap-4 ${mode === 'simple' ? 'hidden' : 'block'}`}>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">試合形式</span>
                            <div className="flex bg-gray-100 p-1 rounded-lg mt-1 gap-1">
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, matchFormat: 'halves' }))}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${formData.matchFormat === 'halves' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                                >
                                    前後半
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, matchFormat: 'one_game' }))}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${formData.matchFormat === 'one_game' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                                >
                                    1本
                                </button>
                            </div>
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">試合時間 (分)</span>
                            <div className="relative mt-1">
                                <input
                                    type="number"
                                    name="matchDuration"
                                    value={formData.matchDuration || 15}
                                    onChange={handleChange}
                                    placeholder="15"
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2 pr-10 text-center font-bold"
                                />
                                <span className="absolute right-3 top-2 text-[10px] items-center flex h-6 text-gray-400 font-bold uppercase pointer-events-none">min</span>
                            </div>
                        </label>
                    </div>
                </div>

                <Autocomplete
                    label="対戦相手"
                    value={formData.opponentName || ''}
                    onChange={(val) => setFormData(p => ({ ...p, opponentName: val }))}
                    options={opponents}
                    placeholder="対戦チーム名"
                    required
                />

                <Autocomplete
                    label="会場"
                    value={formData.venueName || ''}
                    onChange={(val) => setFormData(p => ({ ...p, venueName: val }))}
                    options={venues}
                    placeholder="会場名"
                />

                {/* Live Match Control */}
                {mode === 'full' && (
                    <div className="bg-red-50 p-5 rounded-[2rem] border border-red-100 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${formData.isLive ? 'bg-red-600 animate-ping' : 'bg-gray-300'}`}></span>
                                Live Match Control
                            </h3>
                            <span className="text-[10px] font-black text-gray-400 bg-white px-2 py-1 rounded-full border border-red-100 uppercase tracking-widest">
                                {formData.matchPhase === 'pre-game' && '試合前'}
                                {formData.matchPhase === '1H' && '前半進行中'}
                                {formData.matchPhase === 'halftime' && 'ハーフタイム'}
                                {formData.matchPhase === '2H' && '後半進行中'}
                                {formData.matchPhase === 'full-time' && '試合終了'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {formData.matchPhase === 'pre-game' && (
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, matchPhase: p.matchFormat === 'one_game' ? '2H' : '1H', isLive: true }))}
                                    className="col-span-2 py-4 bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all uppercase text-xs tracking-[0.2em]"
                                >
                                    {formData.matchFormat === 'one_game' ? '試合開始 (Start)' : '前半開始 (Start 1H)'}
                                </button>
                            )}
                            {formData.matchPhase === '1H' && (
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, matchPhase: 'halftime' }))}
                                    className="col-span-2 py-4 bg-orange-500 text-white font-black rounded-2xl shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all uppercase text-xs tracking-[0.2em]"
                                >
                                    前半終了 (HT)
                                </button>
                            )}
                            {formData.matchPhase === 'halftime' && (
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, matchPhase: '2H' }))}
                                    className="col-span-2 py-4 bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all uppercase text-xs tracking-[0.2em]"
                                >
                                    後半開始 (Start 2H)
                                </button>
                            )}
                            {formData.matchPhase === '2H' && (
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, matchPhase: 'full-time', isLive: false }))}
                                    className="col-span-2 py-4 bg-gray-900 text-white font-black rounded-2xl shadow-lg shadow-gray-200 hover:bg-black transition-all uppercase text-xs tracking-[0.2em]"
                                >
                                    試合終了 (End Match)
                                </button>
                            )}
                            {formData.matchPhase === 'full-time' && (
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, matchPhase: '2H', isLive: true }))}
                                    className="col-span-2 py-3 border-2 border-gray-200 text-gray-400 font-bold rounded-2xl hover:bg-gray-50 transition-all text-[10px] tracking-widest"
                                >
                                    入力ミス？後半に戻る
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {formData.matchFormat === 'halves' && mode === 'full' && (
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-2">
                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest text-center border-b border-blue-100 pb-1">前半 (1st Half)</p>
                            <div className="grid grid-cols-2 gap-2">
                                <label className="block">
                                    <span className="text-[9px] font-bold text-gray-400 block text-center uppercase">SHARKS</span>
                                    <input
                                        type="number"
                                        name="ourScore1H"
                                        value={formData.ourScore1H || 0}
                                        onChange={handleChange}
                                        className="mt-1 block w-full text-center font-bold rounded-lg border-gray-200 bg-white p-2"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-[9px] font-bold text-gray-400 block text-center uppercase">相手</span>
                                    <input
                                        type="number"
                                        name="opponentScore1H"
                                        value={formData.opponentScore1H || 0}
                                        onChange={handleChange}
                                        className="mt-1 block w-full text-center font-bold rounded-lg border-gray-200 bg-white p-2"
                                    />
                                </label>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest text-center border-b border-blue-100 pb-1">後半 (2nd Half)</p>
                            <div className="grid grid-cols-2 gap-2">
                                <label className="block">
                                    <span className="text-[9px] font-bold text-gray-400 block text-center uppercase">SHARKS</span>
                                    <input
                                        type="number"
                                        name="ourScore2H"
                                        value={formData.ourScore2H || 0}
                                        onChange={handleChange}
                                        className="mt-1 block w-full text-center font-bold rounded-lg border-gray-200 bg-white p-2"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-[9px] font-bold text-gray-400 block text-center uppercase">相手</span>
                                    <input
                                        type="number"
                                        name="opponentScore2H"
                                        value={formData.opponentScore2H || 0}
                                        onChange={handleChange}
                                        className="mt-1 block w-full text-center font-bold rounded-lg border-gray-200 bg-white p-2"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-xl">
                    <div className="text-center">
                        <span className="text-xs font-bold text-blue-800">{teamName}</span>
                        <div className="flex items-center justify-center gap-2 mt-1">
                            <button
                                type="button"
                                onClick={() => incrementScore('our', -1)}
                                className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600 font-bold active:scale-95 transition-transform"
                            >
                                -
                            </button>
                            <span className="text-3xl font-black w-12 text-blue-900">{formData.ourScore}</span>
                            <button
                                type="button"
                                onClick={() => incrementScore('our', 1)}
                                className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600 font-bold active:scale-95 transition-transform"
                            >
                                +
                            </button>
                        </div>
                    </div>
                    <div className="text-center">
                        <span className="text-xs font-bold text-gray-800">相手</span>
                        <div className="flex items-center justify-center gap-2 mt-1">
                            <button
                                type="button"
                                onClick={() => incrementScore('opponent', -1)}
                                className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 font-bold active:scale-95 transition-transform"
                            >
                                -
                            </button>
                            <span className="text-3xl font-black w-12 text-gray-900">{formData.opponentScore}</span>
                            <button
                                type="button"
                                onClick={() => incrementScore('opponent', 1)}
                                className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 font-bold active:scale-95 transition-transform"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Scorer Buttons */}
                {players.length > 0 && (
                    <div className="p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">タップで得点を記録 (自チーム)</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {players.map(player => (
                                <button
                                    key={player.name}
                                    type="button"
                                    onClick={() => handleQuickScorer(player.name)}
                                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                                >
                                    {player.number && (
                                        <span className="bg-gray-100 px-1 rounded text-[10px] text-gray-500 group-hover:bg-blue-500 group-hover:text-blue-100">
                                            {player.number}
                                        </span>
                                    )}
                                    {player.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {/* Advanced Options Toggle */}
                <div className="pt-2">
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full py-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-white hover:border-blue-100 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                    >
                        {showAdvanced ? (
                            <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                                閉じる
                            </>
                        ) : (
                            <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                試合詳細オプションを表示 (PK・MVP・メモ)
                            </>
                        )}
                    </button>
                </div>

                {showAdvanced && mode === 'full' && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.pkInfo?.isPk}
                                onChange={(e) => setFormData(p => ({ ...p, pkInfo: { ...p.pkInfo, isPk: e.target.checked, type: 'tiebreaker' } }))}
                                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            <span className="text-xs font-bold text-gray-700">PK戦あり</span>
                        </label>
                        {formData.pkInfo?.isPk && (
                            <div className="grid grid-cols-2 gap-4 mt-3">
                                <label className="block">
                                    <span className="text-[10px] uppercase font-bold text-gray-500">自チームPK</span>
                                    <input
                                        type="number"
                                        value={formData.pkInfo?.ourPkScore || 0}
                                        onChange={(e) => setFormData(p => ({ ...p, pkInfo: { ...p.pkInfo!, ourPkScore: parseInt(e.target.value || '0') } }))}
                                        className="mt-1 block w-full text-center font-bold rounded-lg border-gray-300 bg-white p-1"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-[10px] uppercase font-bold text-gray-500">相手PK</span>
                                    <input
                                        type="number"
                                        value={formData.pkInfo?.opponentPkScore || 0}
                                        onChange={(e) => setFormData(p => ({ ...p, pkInfo: { ...p.pkInfo!, opponentPkScore: parseInt(e.target.value || '0') } }))}
                                        className="mt-1 block w-full text-center font-bold rounded-lg border-gray-300 bg-white p-1"
                                    />
                                </label>
                            </div>
                        )}
                    </div>
                )}


                <Autocomplete
                    label="得点者 (自チーム)"
                    value={formData.scorers || ''}
                    onChange={(val) => setFormData(p => ({ ...p, scorers: val }))}
                    options={players}
                    placeholder="例: 佐藤(2), 田中"
                    showNumber={true}
                />


                {showAdvanced && mode === 'full' && (
                    <>
                        <Autocomplete
                            label="MVP"
                            value={formData.mvp || ''}
                            onChange={(val) => setFormData(p => ({ ...p, mvp: val }))}
                            options={players}
                            placeholder="選手名を選択"
                            showNumber={true}
                        />

                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">メモ</span>
                            <textarea
                                name="memo"
                                value={formData.memo || ''}
                                onChange={handleChange}
                                rows={3}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2"
                            />
                        </label>
                    </>
                )}
            </div>

            <div className="flex flex-col gap-3 pt-6 border-t border-gray-100">
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 px-4 py-4 border-2 border-gray-100 text-gray-400 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase text-[10px] tracking-widest"
                    >
                        CANCEL
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-[2] px-4 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:bg-blue-300 transition-all uppercase text-[10px] tracking-widest"
                    >
                        {saving ? 'SAVING...' : formData.isLive ? '試合を保存して戻る' : '試合記録を保存'}
                    </button>
                </div>

                {formData.isLive && (
                    <button
                        type="button"
                        onClick={(e) => handleSubmit(e as any, true)}
                        disabled={saving}
                        className="w-full py-4 bg-white border-2 border-blue-600 text-blue-600 font-black rounded-2xl shadow-lg shadow-blue-50 hover:bg-blue-50 transition-all uppercase text-[10px] tracking-[0.2em]"
                    >
                        {saving ? 'UPDATING...' : '途中保存 (現在のスコアを公開)'}
                    </button>
                )}
            </div>

            {
                initialMatch && (
                    <div className="pt-4 border-t border-gray-100 flex justify-center">
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={saving}
                            className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 p-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            この試合記録を削除する
                        </button>
                    </div>
                )
            }
        </form >
    );
}
