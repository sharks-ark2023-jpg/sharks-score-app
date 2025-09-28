import React, { useState, useEffect } from 'react';
import type { Match, AutocompleteData } from '../types';

interface RealtimeTrackerProps {
    myTeam: string;
    players: string[];
    activeMatch: Match | null;
    autocompleteData: AutocompleteData | null;
    onStartMatch: (opponentTeam: string, venue: string, matchType: '公式' | 'TM', tournamentName?: string) => void;
    onUpdateMatch: (match: Match) => void;
    onEndMatch: () => void;
}

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
);
const MinusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" /></svg>
);

const ScorerModal: React.FC<{players: string[], onSelect: (scorer: string) => void, onClose: () => void}> = ({ players, onSelect, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">得点者を選択</h3>
                </div>
                {players.length > 0 ? (
                    <ul className="p-4 max-h-64 overflow-y-auto">
                        {players.map(player => (
                            <li key={player}>
                                <button onClick={() => onSelect(player)} className="w-full text-left p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    {player}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="p-4 text-gray-600 dark:text-gray-400">記録されている選手がいません。「選手管理」タブで選手を追加してください。</p>
                )}
            </div>
        </div>
    );
};

const RealtimeTracker: React.FC<RealtimeTrackerProps> = ({ myTeam, players, activeMatch, autocompleteData, onStartMatch, onUpdateMatch, onEndMatch }) => {
    const [opponentTeam, setOpponentTeam] = useState('');
    const [venue, setVenue] = useState('');
    const [matchType, setMatchType] = useState<'公式' | 'TM'>('公式');
    const [tournamentName, setTournamentName] = useState('');
    const [error, setError] = useState('');
    const [isScorerModalOpen, setIsScorerModalOpen] = useState(false);

    const handleStartMatchClick = () => {
        setError('');
        if (!opponentTeam.trim() || !venue.trim()) {
            setError('対戦相手と会場名を入力してください。');
            return;
        }
        if (matchType === '公式' && !tournamentName.trim()) {
            setError('公式戦の場合は大会名を入力してください。');
            return;
        }
        if (myTeam.trim().toLowerCase() === opponentTeam.trim().toLowerCase()) {
            setError('あなたのチームと対戦相手のチームは異なる必要があります。');
            return;
        }
        onStartMatch(opponentTeam.trim(), venue.trim(), matchType, matchType === '公式' ? tournamentName.trim() : undefined);
        setOpponentTeam('');
        setVenue('');
        setTournamentName('');
        setMatchType('公式');
    };

    const handleScoreChange = (team: 'home' | 'away', delta: 1 | -1) => {
        if (!activeMatch) return;
        
        if (team === 'home') {
            const newScore = activeMatch.homeScore + delta;
            if (newScore < 0) return;

            if (delta === 1) {
                if (players.length > 0) {
                    setIsScorerModalOpen(true);
                } else {
                    onUpdateMatch({ ...activeMatch, homeScore: newScore, scorers: [...activeMatch.scorers, '不明'] });
                }
            } else { // delta === -1
                const newScorers = activeMatch.scorers.slice(0, -1);
                onUpdateMatch({ ...activeMatch, homeScore: newScore, scorers: newScorers });
            }
        } else { // away team
            const newScore = activeMatch.awayScore + delta;
            if (newScore < 0) return;
            onUpdateMatch({ ...activeMatch, awayScore: newScore });
        }
    };

    const handleSelectScorer = (scorer: string) => {
        if (!activeMatch) return;
        const newScore = activeMatch.homeScore + 1;
        onUpdateMatch({
            ...activeMatch,
            homeScore: newScore,
            scorers: [...activeMatch.scorers, scorer],
        });
        setIsScorerModalOpen(false);
    };

    const handleEndMatchClick = () => {
        if (window.confirm('この試合を終了しますか？')) {
            onEndMatch();
        }
    };

    if (!activeMatch) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">新しい試合を開始</h3>
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="rt-opponent-team" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">対戦相手*</label>
                            <input id="rt-opponent-team" list="opponent-list" type="text" placeholder="対戦相手チーム名" value={opponentTeam} onChange={(e) => setOpponentTeam(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                            {autocompleteData && autocompleteData.opponents.length > 0 && (
                                <datalist id="opponent-list">
                                    {autocompleteData.opponents.map(o => <option key={o} value={o} />)}
                                </datalist>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">試合種別*</label>
                            <div className="flex items-center h-full gap-4 p-2 rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="radio" name="rt-matchType" value="公式" checked={matchType === '公式'} onChange={() => setMatchType('公式')} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"/>
                                    <span className="text-gray-800 dark:text-gray-200">公式</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="radio" name="rt-matchType" value="TM" checked={matchType === 'TM'} onChange={() => setMatchType('TM')} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"/>
                                    <span className="text-gray-800 dark:text-gray-200">TM</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {matchType === '公式' && (
                        <div>
                            <label htmlFor="rt-tournament-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">大会名*</label>
                            <input id="rt-tournament-name" type="text" placeholder="例：市大会予選" value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        </div>
                    )}

                    <div>
                        <label htmlFor="rt-venue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">会場名*</label>
                        <input id="rt-venue" list="venue-list" type="text" placeholder="例：国立競技場" value={venue} onChange={(e) => setVenue(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                         {autocompleteData && autocompleteData.venues.length > 0 && (
                            <datalist id="venue-list">
                                {autocompleteData.venues.map(v => <option key={v} value={v} />)}
                            </datalist>
                        )}
                    </div>
                    
                    <button onClick={handleStartMatchClick} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition duration-300 ease-in-out">試合開始</button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            {isScorerModalOpen && <ScorerModal players={players} onSelect={handleSelectScorer} onClose={() => setIsScorerModalOpen(false)} />}
            
            <div className="text-center mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">{activeMatch.date} @ {activeMatch.venue}</p>
                {activeMatch.tournamentName && <p className="text-sm font-bold text-gray-600 dark:text-gray-300">{activeMatch.tournamentName} ({activeMatch.matchType})</p>}
            </div>
            
            <div className="flex justify-around items-center mb-6">
                <div className="text-center w-2/5">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">{activeMatch.homeTeam}</h4>
                    <p className="text-6xl font-black text-blue-600 dark:text-blue-400 my-2">{activeMatch.homeScore}</p>
                    <div className="flex justify-center gap-2">
                        <button onClick={() => handleScoreChange('home', 1)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"><PlusIcon /></button>
                        <button onClick={() => handleScoreChange('home', -1)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"><MinusIcon /></button>
                    </div>
                </div>

                <div className="text-4xl font-bold text-gray-400 dark:text-gray-500">VS</div>

                <div className="text-center w-2/5">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">{activeMatch.awayTeam}</h4>
                    <p className="text-6xl font-black text-gray-700 dark:text-gray-300 my-2">{activeMatch.awayScore}</p>
                    <div className="flex justify-center gap-2">
                         <button onClick={() => handleScoreChange('away', 1)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"><PlusIcon /></button>
                         <button onClick={() => handleScoreChange('away', -1)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"><MinusIcon /></button>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                 <h5 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">得点者 ({myTeam}):</h5>
                <p className="text-sm text-gray-800 dark:text-gray-200 min-h-[1.25rem] break-words">
                    {activeMatch.scorers.length > 0 ? activeMatch.scorers.join(', ') : 'なし'}
                </p>
            </div>
            
            <div className="mt-6">
                <button onClick={handleEndMatchClick} className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-md hover:bg-red-700 transition">試合終了</button>
            </div>
        </div>
    );
};

export default RealtimeTracker;