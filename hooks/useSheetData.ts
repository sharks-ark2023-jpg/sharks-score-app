import { useState, useEffect, useCallback } from 'react';
import type { Match } from '../types';

interface SheetData {
    matches: Match[];
    players: string[];
}

interface UseSheetDataReturn {
    data: SheetData | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export const useSheetData = (): UseSheetDataReturn => {
    const [data, setData] = useState<SheetData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/read-sheet');
            // まずレスポンスをテキストとして取得
            const responseText = await response.text();

            if (!response.ok) {
                 // エラーメッセージをJSONから抽出しようと試みるが、テキストにもフォールバックする
                try {
                    const errorResult = JSON.parse(responseText);
                    throw new Error(errorResult.message || 'サーバーでエラーが発生しました。');
                } catch (e) {
                    // JSONパースに失敗した場合、生のレスポンスを表示
                    throw new Error(`サーバーエラー: ${response.status} ${response.statusText}。環境変数が正しく設定されているか、シートが共有されているか確認してください。`);
                }
            }

            try {
                const result = JSON.parse(responseText);
                // 日付の降順で試合をソート
                if (result.matches && Array.isArray(result.matches)) {
                    result.matches.sort((a: Match, b: Match) => new Date(b.date).getTime() - new Date(a.date).getTime());
                }
                setData(result);
            } catch (e) {
                console.error('JSON解析エラー:', e);
                console.error('サーバーからの応答:', responseText);
                // ユーザーに分かりやすいエラーメッセージを表示
                const displayableError = responseText.length > 150 ? responseText.substring(0, 150) + '...' : responseText;
                throw new Error(`サーバーからの応答形式が不正です: ${displayableError}`);
            }

        } catch (e) {
            console.error("シートデータの取得または処理中にエラー:", e);
            const errorMessage = e instanceof Error ? e.message : "不明なエラーが発生しました。";
            setError(`データ読み込みエラー: ${errorMessage} 環境変数が正しく設定されているか、シートが共有されているか確認してください。`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
};
