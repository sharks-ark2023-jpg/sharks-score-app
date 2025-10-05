import React, { useState, useEffect } from 'react';
import type { Match, AutocompleteData } from '../types';

interface AddMatchFormProps {
    onAddMatch: (match: Omit<Match, 'id'>) => void;
    myTeam: string;
    players: string[];
    autocompleteData: AutocompleteData | null;
}

const AddMatchForm: React.FC<AddMatchFormProps> = ({ onAddMatch, myTeam, players, autocompleteData }) => {
    const [opponentTeam, setOpponentTeam] = useState('');
    const [venue, setVenue] = useState('');
    const [tournamentName, setTournamentName] = useState('');
    const [myTeamScore, setMyTeamScore] = useState('');
    const [opponentScore, setOpponentScore] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [matchType, setMatchType] = useState<'公式' | 'TM'>('公式');
    const [error, setError] = useState('');
    const [scorers, setScorers] = useState<string[]>([]);
    
    useEffect(() => {
        const score = parseInt(myTeamScore, 10);
        if (!isNaN(score) && score >= 0) {
            if (scorers.length !== score) {
                const newScorers = Array.from({ length: score }, (_, i) => scorers[i] || '');
                setScorers(newScorers);
            }
        } else {
            setScorers([]);
        }
    }, [myTeamScore, scorers.length]);
    
    const handleScorerChange = (index: number, name: string) => {
        const newScorers = [...scorers];
        newScorers[index] = name;
        setScorers(newScorers);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!opponentTeam.trim() || !venue.trim() || myTeamScore === '' || opponentScore === '') return setError('会場名、スコア、対戦相手を含むすべてのフィールドを入力してください。');
        if (matchType === '公式' && !tournamentName.trim()) return setError('公式戦の場合は大会名を入力してください。');
        if (myTeam.trim().toLowerCase() === opponentTeam.trim().toLowerCase()) return setError('あなたのチームと対戦相手のチームは異なる必要があります。');
        if (scorers.length > 0 && scorers.some(s => s === '')) return setError('すべての得点者を選択してください。');

        const homeTeam = myTeam;
        const awayTeam = opponentTeam.trim();
        const homeScore = parseInt(myTeamScore, 10);
        const awayScore = parseInt(opponentScore, 10);

        onAddMatch({ 
            date, 
            venue: venue.trim(), 
            homeTeam, 
            awayTeam, 
            homeScore, 
            awayScore, 
            scorers, 
            matchType, 
            tournamentName: matchType === '公式' ? tournamentName.trim() : undefined 
        });

        setOpponentTeam('');
        setVenue('');
        setTournamentName('');
        setMyTeamScore('');
        setOpponentScore('');
        setScorers([]);
        setMatchType('公式');
        setError('');
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">試合を詳細記録</h3>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="opponent-team" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">対戦相手*</label>
                        <input id="opponent-team" list="opponent-list" type="text" placeholder="対戦相手チーム名" value={opponentTeam} onChange={(e) => setOpponentTeam(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        {autocompleteData && autocompleteData.opponents.length > 0 && (
                            <datalist id="opponent-list">
                                {autocompleteData.opponents.map(o => <option key={o} value={o} />)}
                            </datalist>
                        )}
                    </div>
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">日付*</label>
                        <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">試合種別*</label>
                         <div className="flex items-center h-full gap-4 p-2 rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                             <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="radio" name="add-matchType" value="公式" checked={matchType === '公式'} onChange={() => setMatchType('公式')} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"/>
                                <span className="text-gray-800 dark:text-gray-200">公式</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="radio" name="add-matchType" value="TM" checked={matchType === 'TM'} onChange={() => setMatchType('TM')} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"/>
                                <span className="text-gray-800 dark:text-gray-200">TM</span>
                            </label>
                        </div>
                    </div>
                    {matchType === '公式' && (
                        <div>
                            <label htmlFor="tournament-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">大会名*</label>
                            <input id="tournament-name" type="text" placeholder="例：市大会予選" value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        </div>
                    )}
                </div>

                <div>
                    <label htmlFor="venue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">会場名*</label>
                    <input id="venue" list="venue-list" type="text" placeholder="例：国立競技場" value={venue} onChange={(e) => setVenue(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    {autocompleteData && autocompleteData.venues.length > 0 && (
                        <datalist id="venue-list">
                            {autocompleteData.venues.map(v => <option key={v} value={v} />)}
                        </datalist>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4 items-center">
                    <input type="number" placeholder={`${myTeam}のスコア`} value={myTeamScore} onChange={(e) => setMyTeamScore(e.target.value)} min="0" className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required />
                    <input type="number" placeholder="対戦相手のスコア" value={opponentScore} onChange={(e) => setOpponentScore(e.target.value)} min="0" className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required />
                </div>
                {scorers.length > 0 && (
                    <div className="space-y-3 p-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-100">得点者 ({myTeam})</h4>
                         {players.length === 0 ? (
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">得点者を記録するには、まず「選手管理」タブで選手を登録してください。</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {scorers.map((scorer, index) => (
                                <div key={index}>
                                    <label htmlFor={`scorer-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">得点 {index + 1}</label>
                                    <select id={`scorer-${index}`} value={scorer} onChange={(e) => handleScorerChange(index, e.target.value)} className="mt-1 w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                                        <option value="" disabled>選手を選択</option>
                                        {players.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            ))}
                            </div>
                        )}
                    </div>
                )}
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition duration-300 ease-in-out transform hover:-translate-y-1">試合を追加</button>
            </form>
        </div>
    );
};

export default AddMatchForm;
