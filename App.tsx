import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MatchList from './components/MatchList';
import RecordMatch from './components/RecordMatch';
import LiveRecord from './components/LiveRecord';
import PlayerList from './components/PlayerList';
import Settings from './components/Settings';
import Vercel404Guide from './components/Vercel404Guide';
import { Shiai, Senshu } from './types';
import { fetchShiaiToSenshu, writeShiai as writeShiaiToSheet } from './services/sheetService';
import LoadingSpinner from './components/LoadingSpinner';
import { useTeamName } from './hooks/useTeamName';
import useLocalStorage from './hooks/useLocalStorage';

const App: React.FC = () => {
    const [shiaiList, setShiaiList] = useLocalStorage<Shiai[]>('matches', []);
    const [senshuList, setSenshuList] = useLocalStorage<Senshu[]>('players', []);
    const [yomikomiChuu, setYomikomiChuu] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { teamName, setTeamName } = useTeamName();
    const [doukiChuu, setDoukiChuu] = useState(false);

    const dataYomikomi = useCallback(async () => {
        setYomikomiChuu(true);
        setError(null);
        try {
            const { shiaiList, senshuList } = await fetchShiaiToSenshu();
            setShiaiList(shiaiList);
            setSenshuList(senshuList);
        } catch (err) {
            setError('Googleスプレッドシートからのデータ取得に失敗しました。ローカルにキャッシュされたデータを表示しています。接続とAPI設定を確認してください。');
            console.error('データ取得エラー:', err);
        } finally {
            setYomikomiChuu(false);
        }
    }, [setShiaiList, setSenshuList]);

    useEffect(() => {
        dataYomikomi();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    const shiaiTsuika = (shiai: Shiai) => {
        const newShiaiList = [...shiaiList, shiai];
        setShiaiList(newShiaiList);
    };
    
    const shiaiKakikomi = useCallback(async () => {
        setDoukiChuu(true);
        setError(null);
        try {
            await writeShiaiToSheet(shiaiList);
            alert('Googleスプレッドシートとの同期に成功しました！');
        } catch (err) {
            setError('Googleスプレッドシートとのデータ同期に失敗しました。データはローカルに保存されています。');
            console.error('データ同期エラー:', err);
            alert('Googleスプレッドシートとのデータ同期に失敗しました。後でもう一度お試しください。');
        } finally {
            setDoukiChuu(false);
        }
    }, [shiaiList]);


    if (yomikomiChuu) {
        return <div className="flex items-center justify-center h-screen bg-primary"><LoadingSpinner /></div>;
    }

    return (
        <HashRouter>
            <div className="min-h-screen bg-primary text-text-primary font-sans">
                <Header />
                <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
                    {error && (
                        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4" role="alert">
                            <strong className="font-bold">エラー: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                     <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" />} />
                        <Route path="/dashboard" element={<Dashboard shiaiList={shiaiList} teamName={teamName} />} />
                        <Route path="/matches" element={<MatchList shiaiList={shiaiList} shiaiKakikomi={shiaiKakikomi} doukiChuu={doukiChuu} teamName={teamName}/>} />
                        <Route path="/record" element={<RecordMatch senshuList={senshuList} shiaiTsuika={shiaiTsuika} teamName={teamName} />} />
                        <Route path="/live" element={<LiveRecord senshuList={senshuList} shiaiTsuika={shiaiTsuika} teamName={teamName}/>} />
                        <Route path="/players" element={<PlayerList senshuList={senshuList} />} />
                        <Route path="/settings" element={<Settings teamName={teamName} setTeamName={setTeamName} zenData={{shiaiList, senshuList}}/>} />
                        <Route path="/vercel-404-guide" element={<Vercel404Guide />} />
                    </Routes>
                </main>
            </div>
        </HashRouter>
    );
};

export default App;