import { useState, useCallback } from 'react';
import type { Match } from '../types';

interface UseSpreadsheetReturn {
  writeToSheet: (matches: Match[]) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: string | null;
}

export const useSpreadsheet = (): UseSpreadsheetReturn => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const writeToSheet = useCallback(async (matches: Match[]) => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/write-sheet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ matches }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'サーバーでエラーが発生しました。');
            }
            
            setSuccess(result.message || 'シートへの書き込みに成功しました。');
            setTimeout(() => setSuccess(null), 5000); // 5秒後に成功メッセージをクリア

        } catch (e) {
            console.error("Error writing to sheet:", e);
            const errorMessage = e instanceof Error ? e.message : "不明なエラーが発生しました。";
            setError(`書き込みに失敗しました: ${errorMessage}`);
            setTimeout(() => setError(null), 5000); // 5秒後にエラーメッセージをクリア
        } finally {
            setLoading(false);
        }
    }, []);

    return { writeToSheet, loading, error, success };
};