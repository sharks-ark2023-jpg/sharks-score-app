import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shiai, Senshu, ShiaiShubetsu, Tokutensha } from '../types';
import Modal from './Modal';
import { PlusIcon, MinusIcon, CheckIcon } from './icons';

interface LiveRecordProps {
    senshuList: Senshu[];
    shiaiTsuika: (shiai: Shiai) => void;
    teamName: string;
}

const LiveRecord: React.FC<LiveRecordProps> = ({ senshuList, shiaiTsuika, teamName }) => {
    const navigate = useNavigate();
    const [shiaiShubetsu, setShiaiShubetsu] = useState<ShiaiShubetsu>(ShiaiShubetsu.KOSHIKI);
    const [homeTeam, setHomeTeam] = useState(teamName);
    const [awayTeam, setAwayTeam] = useState('対戦相手');
    const [homeScore, setHomeScore] = useState(0);
    const [awayScore, setAwayScore] = useState(0);
    const [homeZenhanScore, setHomeZenhanScore] = useState<number | null>(null);
    const [awayZenhanScore, setAwayZenhanScore] = useState<number | null>(null);
    const [tokutenshaList, setTokutenshaList] = useState<Tokutensha[]>([]);
    const [isHalfTime, setIsHalfTime] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHomeGoal, setIsHomeGoal] = useState(true);

    const openScorerModal = (isHome: boolean) => {
        if (isHome) {
            setHomeScore(s => s + 1);
        } else {
            setAwayScore(s => s + 1);
        }
        setIsHomeGoal(isHome);
        setIsModalOpen(true);
    };

    const addScorer = (senshu: Senshu) => {
        const existingScorer = tokutenshaList.find(s => s.senshu === senshu);
        if (existingScorer) {
            setTokutenshaList(tokutenshaList.map(s => s.senshu === senshu ? { ...s, tokutenSuu: s.tokutenSuu + 1 } : s));
        } else {
            setTokutenshaList([...tokutenshaList, { senshu, tokutenSuu: 1 }]);
        }
        setIsModalOpen(false);
    };

    const handleUndoGoal = (isHome: boolean) => {
        if(isHome && homeScore > 0) setHomeScore(s => s-1);
        if(!isHome && awayScore > 0) setAwayScore(s => s-1);
        // 簡単な取り消しロジックのため、特定の得点者は削除しません
    }

    const handleZenhanShuryo = () => {
        setHomeZenhanScore(homeScore);
        setAwayZenhanScore(awayScore);
        setIsHalfTime(true);
    };

    const handleShiaiShuryo = () => {
        const newShiai: Shiai = {
            id: crypto.randomUUID(),
            hizuke: new Date().toISOString().split('T')[0],
            kaijo: 'リアルタイム記録',
            homeTeam,
            awayTeam,
            homeScore,
            awayScore,
            homeZenhanScore,
            awayZenhanScore,
            tokutenshaList,
            shiaiShubetsu,
            taikaiMei: shiaiShubetsu === ShiaiShubetsu.KOSHIKI ? 'Live大会' : null,
        };
        shiaiTsuika(newShiai);
        alert('試合が終了し、記録されました！');
        navigate('/matches');
    };

    return (
        <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-highlight mb-4">リアルタイム試合記録</h1>
            <div className="bg-secondary p-6 rounded-lg shadow-xl space-y-4">
                 <div className="flex justify-center space-x-4 mb-4">
                    <button onClick={() => setShiaiShubetsu(ShiaiShubetsu.KOSHIKI)} className={`px-4 py-2 rounded-md ${shiaiShubetsu === ShiaiShubetsu.KOSHIKI ? 'bg-highlight text-white' : 'bg-accent'}`}>公式戦</button>
                    <button onClick={() => setShiaiShubetsu(ShiaiShubetsu.TM)} className={`px-4 py-2 rounded-md ${shiaiShubetsu === ShiaiShubetsu.TM ? 'bg-highlight text-white' : 'bg-accent'}`}>TM</button>
                </div>
                <div className="grid grid-cols-2 gap-4 items-center">
                    <input type="text" value={homeTeam} onChange={e => setHomeTeam(e.target.value)} className="team-name-input text-right"/>
                    <input type="text" value={awayTeam} onChange={e => setAwayTeam(e.target.value)} className="team-name-input text-left"/>
                </div>
                <div className="flex items-center justify-center space-x-4 md:space-x-8">
                    <span className="text-6xl md:text-8xl font-black text-white w-1/3 text-right">{homeScore}</span>
                    <span className="text-4xl md:text-6xl font-bold text-text-secondary">-</span>
                    <span className="text-6xl md:text-8xl font-black text-white w-1/3 text-left">{awayScore}</span>
                </div>
                {homeZenhanScore !== null && (
                    <p className="text-text-secondary">前半: {homeZenhanScore} - {awayZenhanScore}</p>
                )}
                <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2">
                        <button onClick={() => openScorerModal(true)} className="score-btn bg-green-500/80 hover:bg-green-500"><PlusIcon /> ゴール</button>
                        <button onClick={() => handleUndoGoal(true)} className="score-btn bg-red-500/80 hover:bg-red-500"><MinusIcon /> 取り消し</button>
                    </div>
                     <div className="space-y-2">
                        <button onClick={() => openScorerModal(false)} className="score-btn bg-green-500/80 hover:bg-green-500"><PlusIcon /> ゴール</button>
                         <button onClick={() => handleUndoGoal(false)} className="score-btn bg-red-500/80 hover:bg-red-500"><MinusIcon /> 取り消し</button>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 pt-6">
                    {shiaiShubetsu === ShiaiShubetsu.KOSHIKI && (
                        <button onClick={handleZenhanShuryo} disabled={isHalfTime} className="flex-1 finish-btn bg-yellow-500/80 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isHalfTime ? '前半を記録しました' : '前半終了'}
                        </button>
                    )}
                    <button onClick={handleShiaiShuryo} className="flex-1 finish-btn bg-blue-500/80 hover:bg-blue-500"><CheckIcon /> 試合終了</button>
                </div>
            </div>
            
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`得点者は？ (${isHomeGoal ? homeTeam : awayTeam})`}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 max-h-80 overflow-y-auto">
                    {senshuList.map(senshu => (
                        <button key={senshu} onClick={() => addScorer(senshu)} className="p-3 bg-accent hover:bg-highlight rounded-md text-text-primary transition-colors">
                            {senshu}
                        </button>
                    ))}
                     <button onClick={() => addScorer('不明な選手')} className="p-3 bg-accent hover:bg-highlight rounded-md text-text-primary transition-colors">不明な選手</button>
                </div>
            </Modal>
             <style>{`
                .team-name-input { background-color: transparent; border: none; font-size: 1.5rem; font-weight: bold; color: #e2e8f0; width: 100%; text-align: inherit; }
                .team-name-input:focus { outline: none; }
                .score-btn { width: 100%; display: flex; align-items: center; justify-content: center; padding: 0.75rem; border-radius: 0.375rem; font-weight: bold; color: white; transition: background-color 0.2s; }
                .finish-btn { width: 100%; display: flex; align-items: center; justify-content: center; padding: 1rem; border-radius: 0.375rem; font-weight: bold; color: white; transition: background-color 0.2s; }
            `}</style>
        </div>
    );
};

export default LiveRecord;