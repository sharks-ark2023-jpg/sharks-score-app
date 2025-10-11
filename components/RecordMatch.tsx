import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shiai, Senshu, ShiaiShubetsu, Tokutensha } from '../types';

interface RecordMatchProps {
    senshuList: Senshu[];
    shiaiTsuika: (shiai: Shiai) => void;
    teamName: string;
}

const RecordMatch: React.FC<RecordMatchProps> = ({ senshuList, shiaiTsuika, teamName }) => {
    const navigate = useNavigate();
    const [shiaiShubetsu, setShiaiShubetsu] = useState<ShiaiShubetsu>(ShiaiShubetsu.KOSHIKI);
    const [hizuke, setHizuke] = useState(new Date().toISOString().split('T')[0]);
    const [homeTeam, setHomeTeam] = useState(teamName);
    const [awayTeam, setAwayTeam] = useState('');
    const [kaijo, setKaijo] = useState('');
    const [taikaiMei, setTaikaiMei] = useState('');
    const [homeScore, setHomeScore] = useState(0);
    const [awayScore, setAwayScore] = useState(0);
    const [homeZenhanScore, setHomeZenhanScore] = useState<number | null>(0);
    const [awayZenhanScore, setAwayZenhanScore] = useState<number | null>(0);
    const [tokutensha, setTokutensha] = useState<Record<Senshu, number>>({});

    const handleTokutenshaHenkou = (senshu: Senshu, count: number) => {
        const newTokutensha = { ...tokutensha };
        if (count > 0) {
            newTokutensha[senshu] = count;
        } else {
            delete newTokutensha[senshu];
        }
        setTokutensha(newTokutensha);
    };

    const handleSoushin = (e: React.FormEvent) => {
        e.preventDefault();
        const finalTokutensha: Tokutensha[] = Object.entries(tokutensha)
            .filter(([, count]) => count > 0)
            .map(([senshu, tokutenSuu]) => ({ senshu, tokutenSuu }));

        const newShiai: Shiai = {
            id: crypto.randomUUID(),
            hizuke,
            kaijo,
            homeTeam,
            awayTeam,
            homeScore,
            awayScore,
            homeZenhanScore: shiaiShubetsu === ShiaiShubetsu.KOSHIKI ? homeZenhanScore : null,
            awayZenhanScore: shiaiShubetsu === ShiaiShubetsu.KOSHIKI ? awayZenhanScore : null,
            tokutenshaList: finalTokutensha,
            shiaiShubetsu,
            taikaiMei: shiaiShubetsu === ShiaiShubetsu.KOSHIKI ? taikaiMei : null,
        };
        shiaiTsuika(newShiai);
        alert('試合を記録しました！');
        navigate('/matches');
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-highlight mb-6">試合を記録</h1>
            <form onSubmit={handleSoushin} className="space-y-6 bg-secondary p-8 rounded-lg shadow-xl">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">試合種別</label>
                    <div className="flex space-x-4">
                        <button type="button" onClick={() => setShiaiShubetsu(ShiaiShubetsu.KOSHIKI)} className={`flex-1 py-2 rounded-md ${shiaiShubetsu === ShiaiShubetsu.KOSHIKI ? 'bg-highlight text-white' : 'bg-accent'}`}>公式戦</button>
                        <button type="button" onClick={() => setShiaiShubetsu(ShiaiShubetsu.TM)} className={`flex-1 py-2 rounded-md ${shiaiShubetsu === ShiaiShubetsu.TM ? 'bg-highlight text-white' : 'bg-accent'}`}>トレーニングマッチ</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="date" value={hizuke} onChange={e => setHizuke(e.target.value)} className="input-field" required/>
                    <input type="text" placeholder="会場" value={kaijo} onChange={e => setKaijo(e.target.value)} className="input-field" required/>
                    {shiaiShubetsu === ShiaiShubetsu.KOSHIKI && <input type="text" placeholder="大会名" value={taikaiMei} onChange={e => setTaikaiMei(e.target.value)} className="input-field col-span-1 md:col-span-2" />}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="text" placeholder="ホームチーム" value={homeTeam} onChange={e => setHomeTeam(e.target.value)} className="input-field" required/>
                    <input type="text" placeholder="アウェイチーム" value={awayTeam} onChange={e => setAwayTeam(e.target.value)} className="input-field" required/>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">最終スコア</label>
                    <div className="flex items-center space-x-4">
                        <input type="number" value={homeScore} onChange={e => setHomeScore(Math.max(0, parseInt(e.target.value)))} className="input-field text-center w-full"/>
                        <span className="text-xl font-bold">-</span>
                        <input type="number" value={awayScore} onChange={e => setAwayScore(Math.max(0, parseInt(e.target.value)))} className="input-field text-center w-full"/>
                    </div>
                </div>

                {shiaiShubetsu === ShiaiShubetsu.KOSHIKI && (
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">前半スコア</label>
                        <div className="flex items-center space-x-4">
                            <input type="number" value={homeZenhanScore ?? ''} onChange={e => setHomeZenhanScore(e.target.value === '' ? null : Math.max(0, parseInt(e.target.value)))} className="input-field text-center w-full"/>
                            <span className="text-xl font-bold">-</span>
                            <input type="number" value={awayZenhanScore ?? ''} onChange={e => setAwayZenhanScore(e.target.value === '' ? null : Math.max(0, parseInt(e.target.value)))} className="input-field text-center w-full"/>
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">得点者</label>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {senshuList.map(senshu => (
                            <div key={senshu} className="flex justify-between items-center bg-accent p-2 rounded-md">
                                <span className="text-text-primary">{senshu}</span>
                                <div className="flex items-center space-x-2">
                                    <button type="button" onClick={() => handleTokutenshaHenkou(senshu, Math.max(0, (tokutensha[senshu] || 0) - 1))} className="scorer-btn">-</button>
                                    <span className="w-8 text-center font-bold text-highlight">{tokutensha[senshu] || 0}</span>
                                    <button type="button" onClick={() => handleTokutenshaHenkou(senshu, (tokutensha[senshu] || 0) + 1)} className="scorer-btn">+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <button type="submit" className="w-full bg-highlight text-white font-bold py-3 rounded-lg hover:bg-teal-500 transition-colors">試合を保存</button>
            </form>
             <style>{`
                .input-field { background-color: #2d3748; border: 1px solid #4a5568; color: #e2e8f0; padding: 0.75rem; border-radius: 0.375rem; width: 100%; }
                .input-field:focus { outline: none; border-color: #38b2ac; ring: 1px solid #38b2ac; }
                .scorer-btn { background-color: #4a5568; color: white; width: 2rem; height: 2rem; border-radius: 9999px; font-weight: bold; }
            `}</style>
        </div>
    );
};

export default RecordMatch;