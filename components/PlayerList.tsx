import React from 'react';
import { Senshu } from '../types';

interface PlayerListProps {
    senshuList: Senshu[];
}

const PlayerList: React.FC<PlayerListProps> = ({ senshuList }) => {
    return (
        <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-highlight mb-6">選手名簿</h1>
            <div className="bg-secondary rounded-lg shadow-md">
                {senshuList.length > 0 ? (
                    <ul className="divide-y divide-accent">
                        {senshuList.map((senshu, index) => (
                            <li key={index} className="px-6 py-4 text-text-primary">
                                {senshu}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="p-6 text-center text-text-secondary">選手が見つかりません。Googleスプレッドシートに選手を追加してください。</p>
                )}
            </div>
             <p className="text-sm text-text-secondary mt-4 text-center">
                選手の追加、編集、削除はGoogleスプレッドシートの「選手一覧」シートを編集してください。
            </p>
        </div>
    );
};

export default PlayerList;