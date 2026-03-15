import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMatches, upsertMatch, updateCommonMaster, deleteMatch } from '@/lib/sheets';
import { Match } from '@/types';
import { getCached, setCached, invalidateCache } from '@/lib/cache';

const MATCHES_TTL = 15_000;

export const dynamic = 'force-dynamic';

function getSpreadsheetId(gradeName: string) {
    const config = process.env.GRADES_CONFIG || '';
    const grades = config.split(',').reduce((acc, item) => {
        const [name, id] = item.split(':');
        acc[name] = id;
        return acc;
    }, {} as Record<string, string>);
    return grades[gradeName];
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const grade = searchParams.get('grade');

    if (!grade) {
        return NextResponse.json({ error: 'Grade is required' }, { status: 400 });
    }

    const spreadsheetId = getSpreadsheetId(grade);
    if (!spreadsheetId) {
        return NextResponse.json({ error: 'Spreadsheet not found for grade' }, { status: 404 });
    }

    const cacheKey = `matches:${grade}`;
    try {
        let cached = getCached<{ matches: unknown; spreadsheetId: string }>(cacheKey);
        if (!cached) {
            const matches = await getMatches(spreadsheetId, `${grade}_Matches`);
            matches.reverse();
            cached = { matches, spreadsheetId };
            setCached(cacheKey, cached, MATCHES_TTL);
        }
        return NextResponse.json(cached);
    } catch (err: any) {
        return NextResponse.json({ error: err.message, spreadsheetId }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { grade, match }: { grade: string, match: Match } = await req.json();

    if (!grade || !match) {
        return NextResponse.json({ error: 'Grade and match data are required' }, { status: 400 });
    }

    const spreadsheetId = getSpreadsheetId(grade);
    if (!spreadsheetId) {
        return NextResponse.json({ error: 'Spreadsheet not found for grade' }, { status: 404 });
    }

    try {
        await upsertMatch(spreadsheetId, `${grade}_Matches`, match, session.user.email);
        invalidateCache(`matches:${grade}`);

        // マスターデータへの同期（非同期で実行）
        if (match.opponentName) {
            updateCommonMaster(match.opponentName, 'opponent').catch(console.error);
        }
        if (match.venueName) {
            updateCommonMaster(match.venueName, 'venue').catch(console.error);
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        if (err.message === 'CONFLICT') {
            return NextResponse.json({ error: 'Conflict' }, { status: 409 });
        }
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const grade = searchParams.get('grade');
    const matchId = searchParams.get('matchId');

    if (!grade || !matchId) {
        return NextResponse.json({ error: 'Grade and matchId are required' }, { status: 400 });
    }

    const spreadsheetId = getSpreadsheetId(grade);
    if (!spreadsheetId) {
        return NextResponse.json({ error: 'Spreadsheet not found for grade' }, { status: 404 });
    }

    try {
        await deleteMatch(spreadsheetId, `${grade}_Matches`, matchId);
        invalidateCache(`matches:${grade}`);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
