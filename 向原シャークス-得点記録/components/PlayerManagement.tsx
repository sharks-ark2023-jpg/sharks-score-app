import React from 'react';

interface PlayerManagementProps {
    players: string[];
}

const PlayerManagement: React.FC<PlayerManagementProps> = ({ players }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">登録選手一覧 ({players.length}名)</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                選手の追加・編集・削除は、共有されているGoogleスプレッドシートの「選手一覧」シートで直接行ってください。
            </p>
            {players.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                    {players.map(player => (
                        <li key={player} className="py-3">
                            <span className="text-gray-900 dark:text-white">{player}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500 dark:text-gray-400 mt-6 text-center">
                    選手が登録されていません。Googleスプレッドシートの「選手一覧」シートに追加してください。
                </p>
            )}
        </div>
    );
};

export default PlayerManagement;