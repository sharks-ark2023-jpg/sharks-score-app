import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMatches } from '@/lib/sheets';
import { GoogleGenerativeAI } from '@google/generative-ai';

function getSpreadsheetId(gradeName: string) {
    const config = process.env.GRADES_CONFIG || '';
    const grades = config.split(',').reduce((acc, item) => {
        const [name, id] = item.split(':');
        acc[name] = id;
        return acc;
    }, {} as Record<string, string>);
    return grades[gradeName];
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'GEMINI_API_KEY が設定されていません' }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { grade, matchId } = body;

        if (!grade || !matchId) {
            return NextResponse.json({ error: 'grade と matchId が必要です' }, { status: 400 });
        }

        const spreadsheetId = getSpreadsheetId(grade);
        if (!spreadsheetId) {
            return NextResponse.json({ error: '学年が見つかりません' }, { status: 404 });
        }

        const allMatches = await getMatches(spreadsheetId, `${grade}_Matches`);
        const match = allMatches.find(m => m.matchId === matchId);

        if (!match) {
            return NextResponse.json({ error: '試合が見つかりません' }, { status: 404 });
        }

        // 試合情報をテキストに整形
        const resultLabel = match.result === 'win' ? '勝利' : match.result === 'loss' ? '敗北' : '引き分け';
        const scoreText = `${match.ourScore} - ${match.opponentScore}`;
        const scorersText = match.scorers ? `得点者: ${match.scorers}` : '得点者なし';
        const mvpText = match.mvp ? `MVP: ${match.mvp}` : '';
        const memoText = match.memo ? `メモ: ${match.memo}` : '';
        const formatText = match.matchFormat === 'halves'
            ? `前後半制 (各${match.matchDuration}分)`
            : `1本制 (${match.matchDuration}分)`;

        const matchInfo = [
            `試合日: ${match.matchDate}`,
            `対戦相手: ${match.opponentName}`,
            `試合形式: ${match.matchType === 'tournament' ? '大会' : '練習試合'}`,
            `フォーマット: ${formatText}`,
            `スコア: ${scoreText} (${resultLabel})`,
            match.matchFormat === 'halves' ? `前半: ${match.ourScore1H ?? 0} - ${match.opponentScore1H ?? 0} / 後半: ${match.ourScore2H ?? 0} - ${match.opponentScore2H ?? 0}` : '',
            scorersText,
            mvpText,
            memoText,
        ].filter(Boolean).join('\n');

        const prompt = `あなたは少年サッカーコーチの助手です。以下の試合データをもとに、子供たちやコーチ向けの簡単な試合振り返りコメントを日本語で150〜200字程度で書いてください。良かった点や改善のヒントを前向きなトーンで伝えてください。

${matchInfo}

振り返りコメント:`;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const analysis = result.response.text();

        return NextResponse.json({ analysis });
    } catch (error: any) {
        console.error('Analysis error:', error);
        return NextResponse.json({ error: error.message || '分析に失敗しました' }, { status: 500 });
    }
}
