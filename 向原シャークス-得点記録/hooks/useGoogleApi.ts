// Fix: Implement the full content for the custom hook, which was previously missing.
// This hook uses the Gemini API to generate a team performance summary.
import { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { Match } from '../types';

export const useGoogleGenAI = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<string | null>(null);

    const generateSummary = useCallback(async (matches: Match[], teamName: string) => {
        // Fix: Per guidelines, ensure API_KEY is available from process.env.
        if (!process.env.API_KEY) {
            setError("APIキーが設定されていません。");
            return;
        }
        
        setLoading(true);
        setError(null);
        setSummary(null);

        try {
            // Fix: Per guidelines, initialize GoogleGenAI with a named parameter {apiKey: ...}.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const simplifiedMatches = matches.map(m => ({
                date: m.date,
                opponent: m.homeTeam === teamName ? m.awayTeam : m.homeTeam,
                myScore: m.homeTeam === teamName ? m.homeScore : m.awayScore,
                opponentScore: m.homeTeam === teamName ? m.awayScore : m.homeScore,
                scorers: m.homeTeam === teamName ? m.scorers : [],
                tournament: m.tournamentName,
            }));

            const prompt = `
            あなたは優秀なサッカー分析官です。
            以下の試合データ（JSON形式）を分析し、チーム「${teamName}」のパフォーマンスについて、簡潔で分かりやすい日本語のレポートを作成してください。

            レポートに含める内容：
            1.  **総合評価**: チーム全体の最近の調子を総括してください。
            2.  **強み (Strengths)**: データから読み取れるチームの明確な強み（例：得点力、守備の堅さ、特定の選手への依存度など）を挙げてください。
            3.  **課題 (Weaknesses)**: 改善が必要な点（例：失点の多さ、得点力不足、特定のチームに対する苦手意識など）を指摘してください。
            4.  **注目選手 (Key Player)**: 最も多く得点している選手や、チームへの貢献度が高いと思われる選手を1〜2名挙げてください。
            5.  **次の試合への提言**: 分析結果に基づき、次の試合に向けて具体的なアドバイスをしてください。

            試合データ:
            ${JSON.stringify(simplifiedMatches, null, 2)}

            以上の内容を、プロの分析官らしい、しかし専門用語を使いすぎない丁寧な口調でまとめてください。
            `;
            
            // Fix: Per guidelines, use ai.models.generateContent.
            const response = await ai.models.generateContent({
                // Fix: Per guidelines, use an allowed model name.
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            // Fix: Per guidelines, access the generated text directly from response.text.
            const text = response.text;

            if (text) {
                setSummary(text);
            } else {
                setError("AIから有効な応答がありませんでした。");
            }

        } catch (e) {
            console.error("Error generating summary:", e);
            setError("レポートの生成中にエラーが発生しました。");
        } finally {
            setLoading(false);
        }
    }, []);

    return { generateSummary, loading, error, summary };
};
