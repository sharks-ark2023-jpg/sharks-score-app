'use client';

import { useState, useEffect, useRef } from 'react';
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
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lockInfo, setLockInfo] = useState<{ locked: boolean, lockedBy?: string } | null>(null);
    const [lastGoalSnapshot, setLastGoalSnapshot] = useState<Partial<Match> | null>(null);
    const [savedToast, setSavedToast] = useState(false);
    const lockTimerRef = useRef<NodeJS.Timeout | null>(null);
    const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
    const liveSavePendingRef = useRef<Partial<Match> | null>(null);
    const liveSaveInFlightRef = useRef(false);
    const liveSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastLiveSaveAtRef = useRef(0);
    const formDataRef = useRef(formData);

    const { data } = useSWR<{ settings: GlobalSettings, masters: CommonMaster[] }>(
        `/api/settings?grade=${gradeId}`,
        fetcher
    );

    const teamName = data?.settings?.teamName || '自チーム';
    const venues = data?.masters?.filter(m => m.masterType === 'venue') || [];
    const opponents = data?.masters?.filter(m => m.masterType === 'opponent') || [];
    const players = data?.masters?.filter(m => m.masterType === 'player' && (!m.grade || m.grade === gradeId)) || [];

    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    useEffect(() => {
        return () => {
            if (liveSaveTimerRef.current) clearTimeout(liveSaveTimerRef.current);
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (!initialMatch) return;

        const acquireLock = async () => {
            try {
                const res = await fetch('/api/matches/lock', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        grade: gradeId,
                        matchId: initialMatch.matchId,
                        action: 'acquire'
                    })
                });
                const data = await res.json();
                if (res.status === 423) {
                    setLockInfo({ locked: true, lockedBy: data.lockedBy });
                } else if (res.ok) {
                    setLockInfo({ locked: false });
                    // Start refresh timer
                    if (lockTimerRef.current) clearInterval(lockTimerRef.current);
                    lockTimerRef.current = setInterval(acquireLock, 45000); // 45s refresh for 60s lock
                }
            } catch (err) {
                console.error('Lock error:', err);
            }
        };

        acquireLock();

        return () => {
            if (lockTimerRef.current) clearInterval(lockTimerRef.current);
            // Release lock
            fetch('/api/matches/lock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grade: gradeId,
                    matchId: initialMatch.matchId,
                    action: 'release'
                })
            }).catch(console.error);
        };
    }, [gradeId, initialMatch]);

    const calculateResult = (our: number, opponent: number): 'win' | 'loss' | 'draw' => {
        if (our > opponent) return 'win';
        if (our < opponent) return 'loss';
        return 'draw';
    };

    const computeScoreData = (side: 'our' | 'opponent', amount: number, current: Partial<Match>) => {
            const phase = current.matchPhase;
            const updated = { ...current };

            if (side === 'our') {
                updated.ourScore = Math.max(0, (current.ourScore || 0) + amount);
                if (phase === '1H') updated.ourScore1H = Math.max(0, (current.ourScore1H || 0) + amount);
                if (phase === '2H') updated.ourScore2H = Math.max(0, (current.ourScore2H || 0) + amount);
            } else {
                updated.opponentScore = Math.max(0, (current.opponentScore || 0) + amount);
                if (phase === '1H') updated.opponentScore1H = Math.max(0, (current.opponentScore1H || 0) + amount);
                if (phase === '2H') updated.opponentScore2H = Math.max(0, (current.opponentScore2H || 0) + amount);
            }

            updated.result = calculateResult(updated.ourScore || 0, updated.opponentScore || 0);
            return updated;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let newValue: string | number | boolean = value;

        if (type === 'checkbox') {
            newValue = (e.target as HTMLInputElement).checked;
        } else if (type === 'number') {
            newValue = value === '' ? '' : parseInt(value);
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


    const computeGoalData = (playerName: string, current: Partial<Match>): Partial<Match> => {
        const phase = current.matchPhase;
        const updated = { ...current };
        updated.ourScore = Math.max(0, (current.ourScore || 0) + 1);
        if (phase === '1H') updated.ourScore1H = Math.max(0, (current.ourScore1H || 0) + 1);
        if (phase === '2H') updated.ourScore2H = Math.max(0, (current.ourScore2H || 0) + 1);
        updated.result = calculateResult(updated.ourScore || 0, updated.opponentScore || 0);

        const parts = (current.scorers || '').split(',').map(s => s.trim()).filter(Boolean);
        const nameMap: Record<string, number> = {};
        parts.forEach(p => {
            const m = p.match(/^(.+)\((\d+)\)$/);
            if (m) { nameMap[m[1].trim()] = (nameMap[m[1].trim()] || 0) + parseInt(m[2]); }
            else { nameMap[p] = (nameMap[p] || 0) + 1; }
        });
        nameMap[playerName] = (nameMap[playerName] || 0) + 1;
        updated.scorers = Object.entries(nameMap)
            .map(([name, count]) => count > 1 ? `${name}(${count})` : name)
            .join(', ');
        return updated;
    };

    const handleQuickScorer = (playerName: string) => {
        const currentData = formDataRef.current;
        setLastGoalSnapshot(currentData);
        const newData = computeGoalData(playerName, currentData);
        formDataRef.current = newData;
        setFormData(newData);
        if (currentData.matchPhase !== 'pre-game') {
            scheduleLiveSave(newData);
        }
    };

    const handleUndoGoal = async () => {
        if (!lastGoalSnapshot) return;
        const currentData = formDataRef.current;
        const snapshot = { ...lastGoalSnapshot, lastUpdated: currentData.lastUpdated };
        formDataRef.current = snapshot;
        setFormData(snapshot);
        setLastGoalSnapshot(null);
        if (currentData.matchPhase !== 'pre-game') {
            scheduleLiveSave(snapshot);
        } else {
            await doSave(snapshot, true);
        }
    };

    const doSave = async (dataToSave: Partial<Match>, stayOnPage: boolean = false): Promise<string | null> => {
        setSaving(true);
        setError(null);
        try {
            const res = await fetch('/api/matches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grade: gradeId,
                    match: dataToSave,
                    syncMasters: !stayOnPage,
                }),
            });

            if (res.status === 409) {
                setError('他のユーザーが更新しました。再読み込みして確認してください。');
                return null;
            } else if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || '保存に失敗しました');
            } else {
                const data: { lastUpdated?: string } = await res.json();
                // Show save toast when auto-saving (stayOnPage = true)
                if (stayOnPage) {
                    setSavedToast(true);
                    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                    toastTimerRef.current = setTimeout(() => setSavedToast(false), 2000);
                }

                if (!stayOnPage) {
                    // Fix: confirm前にonSavedを呼ばない（タブ切替でコンポーネントが破棄されるのを防ぐ）
                    const continueMatch = !initialMatch && confirm('保存しました。同じ対戦相手・会場で次の試合を記録しますか？');
                    if (continueMatch) {
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
                        if (onSaved) onSaved();
                        else router.push(`/grade/${gradeId}`);
                    }
                }
                if (!stayOnPage) router.refresh();
                return data.lastUpdated || null;
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : '保存に失敗しました');
            return null;
        } finally {
            setSaving(false);
        }
    };

    const enqueueLiveSave = async (data: Partial<Match>) => {
        liveSavePendingRef.current = data;
        if (liveSaveInFlightRef.current) return;

        liveSaveInFlightRef.current = true;
        try {
            while (liveSavePendingRef.current) {
                const nextData = liveSavePendingRef.current;
                liveSavePendingRef.current = null;
                const lastUpdated = await doSave(nextData, true);
                if (!lastUpdated) {
                    liveSavePendingRef.current = null;
                    break;
                }

                formDataRef.current = { ...formDataRef.current, lastUpdated };
                setFormData(prev => ({ ...prev, lastUpdated }));
                const pendingData = liveSavePendingRef.current as Partial<Match> | null;
                if (pendingData) {
                    liveSavePendingRef.current = { ...pendingData, lastUpdated };
                }
                lastLiveSaveAtRef.current = Date.now();
            }
        } finally {
            liveSaveInFlightRef.current = false;
        }
    };

    const scheduleLiveSave = (data: Partial<Match>) => {
        liveSavePendingRef.current = data;
        if (liveSaveTimerRef.current) clearTimeout(liveSaveTimerRef.current);

        const minimumIntervalRemaining = Math.max(
            0,
            3_000 - (Date.now() - lastLiveSaveAtRef.current)
        );
        const delay = Math.max(1_500, minimumIntervalRemaining);
        liveSaveTimerRef.current = setTimeout(() => {
            liveSaveTimerRef.current = null;
            const pendingData = liveSavePendingRef.current;
            if (pendingData) enqueueLiveSave(pendingData);
        }, delay);
    };

    const flushLiveSave = (data: Partial<Match>) => {
        if (liveSaveTimerRef.current) {
            clearTimeout(liveSaveTimerRef.current);
            liveSaveTimerRef.current = null;
        }
        liveSavePendingRef.current = null;
        return enqueueLiveSave(data);
    };

    const incrementScore = (side: 'our' | 'opponent', amount: number) => {
        const currentData = formDataRef.current;
        const updated = computeScoreData(side, amount, currentData);
        formDataRef.current = updated;
        setFormData(updated);
        if (currentData.matchPhase !== 'pre-game') {
            scheduleLiveSave(updated);
        }
    };

    const handlePhaseChange = (matchPhase: Match['matchPhase'], isLive: boolean = true) => {
        const updated = { ...formDataRef.current, matchPhase, isLive };
        formDataRef.current = updated;
        setFormData(updated);
        flushLiveSave(updated);
    };

    const handleSubmit = async (e: React.FormEvent, stayOnPage: boolean = false) => {
        if (e) e.preventDefault();
        // Fix: 試合中フェーズのまま保存しようとした場合に確認
        const phase = formData.matchPhase;
        if (!formData.isLive && phase !== 'full-time' && phase !== 'pre-game') {
            if (!confirm('試合がまだ終了していません。このまま保存しますか？（試合履歴に表示されます）')) return;
        }
        await doSave(formData, stayOnPage);
    };

    // Fix: 試合終了ボタンで状態更新＋即時保存
    const handleEndMatch = async () => {
        const finalData = { ...formDataRef.current, matchPhase: 'full-time' as const, isLive: false };
        formDataRef.current = finalData;
        setFormData(finalData);
        if (liveSaveTimerRef.current) {
            clearTimeout(liveSaveTimerRef.current);
            liveSaveTimerRef.current = null;
        }
        liveSavePendingRef.current = null;
        await doSave(finalData, false);
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
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : '削除に失敗しました');
            setSaving(false);
        }
    };

    const isLiveMode = formData.matchPhase !== 'pre-game';

    if (lockInfo?.locked) {
        return (
            <div className="max-w-lg mx-auto bg-orange-50 p-8 rounded-[2rem] border border-orange-200 text-center shadow-xl">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h2 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-widest">Editing Locked</h2>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    現在、<span className="font-bold text-orange-700">{lockInfo.lockedBy}</span> さんがこの試合を編集しています。<br />
                    二重更新を防ぐため、編集がロックされています。
                </p>
                <button
                    onClick={() => router.back()}
                    className="w-full py-4 bg-white border-2 border-gray-200 text-gray-400 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase text-[10px] tracking-widest"
                >
                    戻る
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={isLiveMode ? "max-w-lg mx-auto space-y-4 pb-24 px-3 pt-3" : "space-y-6 max-w-lg mx-auto bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative pb-24"}>
            {!isLiveMode && (
            <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-xl font-bold text-gray-900">
                    {initialMatch ? '試合記録を編集' : '新規試合を記録'}
                </h2>
            </div>
            )}

            {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {/* ========== 試合情報入力（ライブ中は非表示） ========== */}
                {!isLiveMode && (
                <div className="grid grid-cols-1 gap-4">
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
                                <option value="friendly">練習試合</option>
                                <option value="tournament">公式戦・大会</option>
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
                                    autoCapitalize="none"
                                    autoCorrect="off"
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

                    <div className="grid grid-cols-2 gap-4">
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
                                    value={formData.matchDuration ?? ''}
                                    onChange={handleChange}
                                    placeholder="15"
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2 pr-10 text-center font-bold"
                                />
                                <span className="absolute right-3 top-2 text-[10px] items-center flex h-6 text-gray-400 font-bold uppercase pointer-events-none">min</span>
                            </div>
                        </label>
                    </div>
                </div>
                )}

                {!isLiveMode && (
                <>
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
                </>
                )}

                {/* ========== pre-game: 試合開始ボタン（ライブ前） ========== */}
                {formData.matchPhase === 'pre-game' && (
                    <div className="bg-red-50 p-5 rounded-[2rem] border border-red-100">
                        <button
                            type="button"
                            onClick={() => handlePhaseChange('1H')}
                            className="w-full py-4 bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all uppercase text-xs tracking-[0.2em]"
                        >
                            {formData.matchFormat === 'one_game' ? '試合開始 (Start)' : '前半開始 (Start 1H)'}
                        </button>
                    </div>
                )}

                {/* ========== ライブ中UI（1H / halftime / 2H / full-time） ========== */}
                {formData.matchPhase !== 'pre-game' && (
                    <div className="space-y-4">
                        {/* ライブヘッダー (カンプ②) */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#00693E] to-[#00472A] rounded-xl text-white shadow-md border border-[#004D33]/30">
                            {/* LIVE インジケーター */}
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="relative flex h-2 w-2 flex-shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                                </span>
                                <span className="text-red-500 font-black text-xs tracking-wider uppercase">● LIVE</span>
                                <span className="text-slate-300 font-bold text-xs">
                                    {formData.matchPhase === '1H' && (formData.matchFormat === 'one_game' ? '進行中' : '前半')}
                                    {formData.matchPhase === 'halftime' && 'ハーフタイム'}
                                    {formData.matchPhase === '2H' && '後半'}
                                    {formData.matchPhase === 'full-time' && '試合終了'}
                                </span>
                            </div>

                            {/* フェーズアクションボタン */}
                            <div className="min-w-0">
                                {formData.matchPhase === '1H' && formData.matchFormat !== 'one_game' && (
                                    <button
                                        type="button"
                                        onClick={() => handlePhaseChange('halftime')}
                                        disabled={saving}
                                        className="px-4 py-2 bg-amber-400 text-amber-950 hover:bg-amber-300 disabled:opacity-50 font-black rounded-lg text-[11px] tracking-wider transition-all shadow-sm"
                                    >
                                        前半終了
                                    </button>
                                )}
                                {formData.matchPhase === '1H' && formData.matchFormat === 'one_game' && (
                                    <button
                                        type="button"
                                        onClick={handleEndMatch}
                                        disabled={saving}
                                        className="px-4 py-2 bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 font-black rounded-lg text-[11px] tracking-wider transition-all shadow-sm"
                                    >
                                        試合終了
                                    </button>
                                )}
                                {formData.matchPhase === 'halftime' && (
                                    <button
                                        type="button"
                                        onClick={() => handlePhaseChange('2H')}
                                        disabled={saving}
                                        className="px-4 py-2 bg-white text-sharks-green hover:bg-green-50 disabled:opacity-50 font-black rounded-lg text-[11px] tracking-wider transition-all shadow-sm"
                                    >
                                        後半開始
                                    </button>
                                )}
                                {formData.matchPhase === '2H' && (
                                    <button
                                        type="button"
                                        onClick={handleEndMatch}
                                        disabled={saving}
                                        className="px-4 py-2 bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 font-black rounded-lg text-[11px] tracking-wider transition-all shadow-sm"
                                    >
                                        試合終了
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* スコア大表示 (カンプ②) */}
                        <div className="flex items-center justify-between px-6 py-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <div className="text-left w-1/3">
                                <span className="text-[10px] font-black text-slate-400 block tracking-wider uppercase leading-none">SHARKS</span>
                                <span className="text-[13px] font-black text-slate-800 leading-tight">U12</span>
                            </div>
                            <div className="flex items-center justify-center gap-3 w-1/3">
                                <span className="font-bebas font-black text-5xl text-slate-950 leading-none">{formData.ourScore}</span>
                                <span className="text-slate-300 text-3xl font-thin leading-none">-</span>
                                <span className="font-bebas font-black text-5xl text-slate-950 leading-none">{formData.opponentScore}</span>
                            </div>
                            <div className="text-right w-1/3">
                                <span className="text-[10px] font-black text-slate-400 block tracking-wider uppercase leading-none">対戦相手</span>
                                <span className="text-[13px] font-black text-slate-800 leading-tight truncate block">{formData.opponentName || 'OPPONENT'}</span>
                            </div>
                        </div>

                        {/* スコア入力カウンター 2列カード (カンプ②) */}
                        <div className="space-y-1">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest block pl-1">スコアを入力</span>
                            <div className="grid grid-cols-2 gap-4">
                                {/* SHARKS入力 */}
                                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                                    <div className="bg-sharks-blue text-white text-center py-1.5 text-[10px] font-black tracking-widest uppercase">
                                        SHARKS
                                    </div>
                                    <div className="p-3 flex items-center justify-between gap-1 flex-grow">
                                        <button
                                            type="button"
                                            onClick={() => incrementScore('our', -1)}
                                            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200/60 active:scale-90 transition-all"
                                        >
                                            −
                                        </button>
                                        <span className="font-bebas font-black text-4xl text-slate-900 leading-none min-w-[30px] text-center">
                                            {formData.ourScore}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => incrementScore('our', 1)}
                                            className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200/50 active:scale-90 transition-all"
                                        >
                                            ＋
                                        </button>
                                    </div>
                                </div>

                                {/* 対戦相手入力 */}
                                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                                    <div className="bg-[#2D3748] text-white text-center py-1.5 text-[10px] font-black tracking-widest uppercase">
                                        対戦相手
                                    </div>
                                    <div className="p-3 flex items-center justify-between gap-1 flex-grow">
                                        <button
                                            type="button"
                                            onClick={() => incrementScore('opponent', -1)}
                                            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200/60 active:scale-90 transition-all"
                                        >
                                            −
                                        </button>
                                        <span className="font-bebas font-black text-4xl text-slate-900 leading-none min-w-[30px] text-center">
                                            {formData.opponentScore}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => incrementScore('opponent', 1)}
                                            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold border border-slate-200/60 active:scale-90 transition-all"
                                        >
                                            ＋
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 得点者を直接記録 */}
                        {players.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest block pl-1">得点者をタップ</span>
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="grid grid-cols-3 gap-2">
                                        {players.map(player => (
                                            <button
                                                key={player.name}
                                                type="button"
                                                onClick={() => handleQuickScorer(player.name)}
                                                className="px-1.5 py-3 rounded-lg text-[11px] font-black transition-all active:scale-95 flex items-center justify-start gap-1.5 border leading-none bg-white text-[#2D3748] border-slate-200/80 hover:bg-blue-50 hover:border-sharks-blue"
                                            >
                                                {player.number && (
                                                    <span className="text-[9px] font-black w-4 text-center shrink-0 text-slate-400">
                                                        {player.number}
                                                    </span>
                                                )}
                                                <span className="truncate flex-1 text-left">{player.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Undo Goal Button */}
                        {lastGoalSnapshot !== null && (
                            <div className="flex justify-center mt-2">
                                <button
                                    type="button"
                                    onClick={handleUndoGoal}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black rounded-xl hover:bg-amber-100 transition-all active:scale-95 uppercase tracking-widest"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                    直前の得点を取り消す
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ========== pre-game: 従来のスコア入力エリア ========== */}
                {formData.matchPhase === 'pre-game' && (
                    <>
                        {formData.matchFormat === 'halves' && (
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

                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                            <div className="text-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{teamName}</span>
                                <div className="flex items-center justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => incrementScore('our', -1)}
                                        className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-100 transition-all active:scale-95"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                        </svg>
                                    </button>
                                    <span className="font-bebas font-black text-6xl w-16 text-slate-900 leading-none">{formData.ourScore}</span>
                                    <button
                                        type="button"
                                        onClick={() => incrementScore('our', 1)}
                                        className="w-12 h-12 rounded-2xl bg-blue-600 shadow-lg shadow-blue-100 flex items-center justify-center text-white hover:bg-blue-700 transition-all active:scale-95"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="text-center border-l border-slate-100">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">対戦相手</span>
                                <div className="flex items-center justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => incrementScore('opponent', -1)}
                                        className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-100 transition-all active:scale-95"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                        </svg>
                                    </button>
                                    <span className="font-bebas font-black text-6xl w-16 text-slate-900 leading-none">{formData.opponentScore}</span>
                                    <button
                                        type="button"
                                        onClick={() => incrementScore('opponent', 1)}
                                        className="w-12 h-12 rounded-2xl bg-slate-900 shadow-lg shadow-slate-200 flex items-center justify-center text-white hover:bg-black transition-all active:scale-95"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Quick Scorer Buttons (pre-game) */}
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
                                                <span className="bg-slate-100 px-1.5 rounded-md text-[10px] font-black text-slate-500">
                                                    {player.number}
                                                </span>
                                            )}
                                            {player.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Undo Goal Button (pre-game) */}
                        {lastGoalSnapshot !== null && (
                            <div className="flex justify-center">
                                <button
                                    type="button"
                                    onClick={handleUndoGoal}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-black rounded-2xl hover:bg-amber-100 transition-all active:scale-95 uppercase tracking-widest"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                    直前の得点を取り消す
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Advanced Options・得点者（ライブ中は非表示） */}
                {!isLiveMode && (
                <>
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

                {showAdvanced && (
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


                {showAdvanced && (
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
                </>
                )}
            </div>

            {!formData.isLive && (
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
                        {saving ? 'SAVING...' : '試合記録を保存'}
                    </button>
                </div>
            </div>
            )}

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
            {/* Save Toast Notification */}
            {savedToast && (
                <div className="fixed bottom-24 right-6 bg-green-600 text-white px-4 py-3 rounded-2xl shadow-lg shadow-green-200 text-sm font-bold flex items-center gap-2 animate-pulse">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                    保存済み ✓
                </div>
            )}
        </form >
    );
}
