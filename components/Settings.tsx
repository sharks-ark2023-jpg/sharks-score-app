import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchShiaiToSenshu } from '../services/sheetService';

interface SettingsProps {
    teamName: string;
    setTeamName: (name: string) => void;
    zenData: { shiaiList: any[], senshuList: any[] };
}

const Settings: React.FC<SettingsProps> = ({ teamName, setTeamName, zenData }) => {
    const [currentTeamName, setCurrentTeamName] = useState(teamName);
    const [apiStatus, setApiStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

    const handleSaveTeamName = () => {
        setTeamName(currentTeamName);
        alert('チーム名を更新しました！');
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(zenData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = 'soccer_recorder_backup.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };
    
    const testApiSetsuzoku = async () => {
        setApiStatus('testing');
        try {
            await fetchShiaiToSenshu();
            setApiStatus('success');
        } catch (error) {
            console.error("APIテスト失敗:", error);
            setApiStatus('error');
        }
    }
    
    const getApiStatusHyouji = () => {
        switch (apiStatus) {
            case 'testing': return <span className="text-yellow-400">テスト中...</span>;
            case 'success': return <span className="text-green-400">接続成功！</span>;
            case 'error': return <span className="text-red-400">接続失敗。コンソールを確認してください。</span>;
            default: return <span className="text-text-secondary">待機中</span>;
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-highlight">設定</h1>

            <div className="bg-secondary p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-text-primary">チーム名</h2>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={currentTeamName}
                        onChange={(e) => setCurrentTeamName(e.target.value)}
                        className="flex-grow bg-accent border border-gray-600 rounded-md px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-highlight"
                    />
                    <button onClick={handleSaveTeamName} className="px-4 py-2 bg-highlight text-white font-semibold rounded-md hover:bg-teal-500 transition-colors">
                        保存
                    </button>
                </div>
                 <p className="text-xs text-text-secondary mt-2">この名前はダッシュボードの統計計算に使用されます。</p>
            </div>
            
            <div className="bg-secondary p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-text-primary">データ管理</h2>
                <p className="text-sm text-text-secondary mb-4">すべての試合と選手のデータをバックアップとしてJSONファイルにエクスポートします。</p>
                <button onClick={handleExport} className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-500 transition-colors">
                    全データをエクスポート (.json)
                </button>
            </div>
            
             <div className="bg-secondary p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-text-primary">デバッグツール</h2>
                <div className="flex items-center justify-between">
                     <p className="text-sm text-text-secondary">Google Sheets APIへの接続をテストします。</p>
                     <button onClick={testApiSetsuzoku} disabled={apiStatus === 'testing'} className="px-4 py-2 bg-accent text-white font-semibold rounded-md hover:bg-gray-600 disabled:opacity-50 transition-colors">
                        {apiStatus === 'testing' ? 'テスト中...' : 'テスト実行'}
                    </button>
                </div>
                 <div className="mt-4 p-3 bg-primary rounded-md text-sm">
                    APIステータス: {getApiStatusHyouji()}
                </div>
                <div className="mt-4">
                     <Link to="/vercel-404-guide" className="text-sm text-highlight hover:underline">
                        Vercelデプロイで問題が発生していますか？ガイドはこちら
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Settings;