import React, { useState } from 'react';
import type { Match } from '../types';
import { useGoogleGenAI } from '../hooks/useGoogleApi';

interface SettingsProps {
    myTeamName: string;
    setMyTeamName: (name: string) => void;
    matches: Match[];
    players: string[];
}

const Settings: React.FC<SettingsProps> = ({ myTeamName, setMyTeamName, matches, players }) => {
    const [teamNameInput, setTeamNameInput] = useState(myTeamName);
    const { generateSummary, loading, error, summary } = useGoogleGenAI();
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [debugLoading, setDebugLoading] = useState(false);
    const [debugError, setDebugError] = useState<string | null>(null);

    const handleSaveTeamName = () => {
        if (teamNameInput.trim()) {
            setMyTeamName(teamNameInput.trim());
            alert('チーム名を保存しました。');
        } else {
            alert('チーム名を入力してください。');
        }
    };
    
    const handleExportJson = () => {
        const dataStr = JSON.stringify({ myTeamName, matches, players }, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `${myTeamName}_data.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };
    
    const handleGenerateSummary = () => {
        if (matches.length > 0) {
            generateSummary(matches, myTeamName);
        } else {
            alert('要約を生成するには、少なくとも1試合のデータが必要です。');
        }
    };

    const handleCheckHealth = async () => {
        setDebugLoading(true);
        setDebugInfo(null);
        setDebugError(null);
        try {
            const res = await fetch('/api/health');
            const data = await res.json();
            if (!res.ok) {
                throw new Error(`サーバーからエラーが返されました (ステータス: ${res.status})。APIが正しくデプロイされていません。`);
            }
            setDebugInfo(data);
        } catch (err) {
            console.error(err);
            setDebugError(err instanceof Error ? err.message : '不明なエラーが発生しました。');
        } finally {
            setDebugLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">チーム名設定</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">ここで設定したチーム名は、あなたのブラウザにのみ保存されます。</p>
                <div className="flex items-end space-x-2">
                    <div className="flex-grow">
                        <label htmlFor="team-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">あなたのチーム名</label>
                        <input
                            id="team-name"
                            type="text"
                            value={teamNameInput}
                            onChange={(e) => setTeamNameInput(e.target.value)}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button onClick={handleSaveTeamName} className="bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition-colors">保存</button>
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">AIによる戦績レポート</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    記録された試合データをもとに、Gemini AIがチームの強み、弱み、改善点を分析し、レポートを生成します。
                </p>
                <button 
                    onClick={handleGenerateSummary} 
                    disabled={loading || matches.length === 0}
                    className="w-full sm:w-auto bg-purple-600 text-white font-bold py-3 px-6 rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {loading ? 'レポート生成中...' : 'レポートを生成'}
                </button>
                 {error && <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">{error}</div>}
                 {summary && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md border dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-100">AI分析レポート</h4>
                        <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{summary}</p>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">データバックアップ</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">現在の全データをJSONファイルとして、お使いのデバイスにダウンロードします。</p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={handleExportJson} className="flex-1 bg-gray-600 text-white font-bold py-3 px-4 rounded-md hover:bg-gray-700 transition-colors">
                        全データをエクスポート (JSON)
                    </button>
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">デバッグ: サーバー接続テスト</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    データの読み書きがうまくいかない場合、このテストを実行してください。APIサーバーが正しく動作しているか、環境変数が設定されているかを確認できます。
                </p>
                <button 
                    onClick={handleCheckHealth} 
                    disabled={debugLoading}
                    className="w-full sm:w-auto bg-yellow-500 text-black font-bold py-3 px-6 rounded-md hover:bg-yellow-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {debugLoading ? 'テスト中...' : '接続と設定をテスト'}
                </button>
                {debugError && (
                    <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
                        <p className="font-bold">テスト失敗</p>
                        <p>{debugError}</p>
                        <p className="mt-2 text-sm">これは、Vercelのプロジェクト設定（Root Directoryなど）が原因でAPIがデプロイされていない可能性が高いです。</p>
                    </div>
                )}
                {debugInfo && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md border dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-100">テスト結果</h4>
                        <pre className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;