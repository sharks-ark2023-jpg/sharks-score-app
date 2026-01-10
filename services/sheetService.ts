import { Shiai, Senshu, ShiaiShubetsu, Tokutensha } from '../types';

const API_BASE_URL = '/api';

const parseTokutensha = (tokutenshaString: string | undefined): Tokutensha[] => {
    if (!tokutenshaString) return [];
    const names = tokutenshaString.split(',').map(s => s.trim());
    const tokutenshaCounts = names.reduce((acc, name) => {
        acc[name] = (acc[name] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(tokutenshaCounts).map(([senshu, tokutenSuu]) => ({ senshu, tokutenSuu }));
};

const formatTokutensha = (tokutenshaList: Tokutensha[]): string => {
    return tokutenshaList
        .flatMap(({ senshu, tokutenSuu }) => Array(tokutenSuu).fill(senshu))
        .join(',');
};

export const fetchShiaiToSenshu = async (): Promise<{ shiaiList: Shiai[], senshuList: Senshu[] }> => {
    const response = await fetch(`${API_BASE_URL}/read-sheet`);
    if (!response.ok) {
        throw new Error('ネットワーク応答がありませんでした');
    }
    const data = await response.json();
    
    const shiaiList: Shiai[] = data.matches.map((row: any[]) => ({
        id: row[0] || crypto.randomUUID(),
        hizuke: row[1] || '',
        kaijo: row[2] || '',
        homeTeam: row[3] || '',
        awayTeam: row[4] || '',
        homeScore: parseInt(row[5], 10) || 0,
        awayScore: parseInt(row[6], 10) || 0,
        homeZenhanScore: row[7] !== '' && row[7] !== null ? parseInt(row[7], 10) : null,
        awayZenhanScore: row[8] !== '' && row[8] !== null ? parseInt(row[8], 10) : null,
        tokutenshaList: parseTokutensha(row[9]),
        shiaiShubetsu: row[10] === '公式' ? ShiaiShubetsu.KOSHIKI : ShiaiShubetsu.TM,
        taikaiMei: row[11] || null,
    }));

    const senshuList: Senshu[] = data.players.map((row: any[]) => row[0]).filter(Boolean);

    return { shiaiList, senshuList };
};

export const writeShiai = async (shiaiList: Shiai[]): Promise<void> => {
    const dataToWrite = shiaiList.map(shiai => [
        shiai.id,
        shiai.hizuke,
        shiai.kaijo,
        shiai.homeTeam,
        shiai.awayTeam,
        shiai.homeScore,
        shiai.awayScore,
        shiai.homeZenhanScore,
        shiai.awayZenhanScore,
        formatTokutensha(shiai.tokutenshaList),
        shiai.shiaiShubetsu,
        shiai.taikaiMei,
    ]);

    const response = await fetch(`${API_BASE_URL}/write-sheet`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matches: dataToWrite }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Googleスプレッドシートへのデータ書き込みに失敗しました');
    }
};