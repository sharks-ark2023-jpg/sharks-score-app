// Fix: Implement the full PlayerManagement component, which was previously missing.
import React, { useState } from 'react';

interface PlayerManagementProps {
    players: string[];
    setPlayers: React.Dispatch<React.SetStateAction<string[]>>;
}

const PlayerManagement: React.FC<PlayerManagementProps> = ({ players, setPlayers }) => {
    const [newPlayer, setNewPlayer] = useState('');
    const [error, setError] = useState('');

    const handleAddPlayer = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const trimmedPlayer = newPlayer.trim();

        if (!trimmedPlayer) {
            setError('選手名を入力してください。');
            return;
        }

        if (players.some(p => p.toLowerCase() === trimmedPlayer.toLowerCase())) {
            setError('この選手はすでに登録されています。');
            return;
        }

        setPlayers(prevPlayers => [...prevPlayers, trimmedPlayer].sort());
        setNewPlayer('');
    };
    
    const handleDeletePlayer = (playerToDelete: string) => {
        if (window.confirm(`「${playerToDelete}」を削除しますか？`)) {
            setPlayers(prevPlayers => prevPlayers.filter(p => p !== playerToDelete));
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Add player form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">選手を登録</h3>
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
                <form onSubmit={handleAddPlayer} className="flex items-start space-x-2">
                    <div className="flex-grow">
                        <label htmlFor="player-name" className="sr-only">選手名</label>
                        <input
                            id="player-name"
                            type="text"
                            value={newPlayer}
                            onChange={(e) => setNewPlayer(e.target.value)}
                            placeholder="例：山田 太郎"
                            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button type="submit" className="bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition-colors duration-300">追加</button>
                </form>
            </div>
            
            {/* Player list */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">登録選手一覧 ({players.length}名)</h3>
                {players.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                        {players.map(player => (
                            <li key={player} className="py-3 flex justify-between items-center">
                                <span className="text-gray-900 dark:text-white">{player}</span>
                                <button 
                                    onClick={() => handleDeletePlayer(player)} 
                                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm font-medium"
                                >
                                    削除
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">まだ選手が登録されていません。</p>
                )}
            </div>
        </div>
    );
};

export default PlayerManagement;
