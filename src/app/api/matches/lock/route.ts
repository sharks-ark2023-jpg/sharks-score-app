import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateMatchLock, getMatches } from '@/lib/sheets';

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

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { grade, matchId, action } = await req.json();

    if (!grade || !matchId) {
        return NextResponse.json({ error: 'Grade and matchId are required' }, { status: 400 });
    }

    const spreadsheetId = getSpreadsheetId(grade);
    if (!spreadsheetId) {
        return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 404 });
    }

    try {
        if (action === 'acquire') {
            // Check if already locked by someone else
            const matches = await getMatches(spreadsheetId, `${grade}_Matches`);
            const match = matches.find(m => m.matchId === matchId);

            if (match && match.editingBy && match.editingBy !== session.user.email) {
                const expires = match.editingExpires ? new Date(match.editingExpires) : null;
                if (expires && expires > new Date()) {
                    return NextResponse.json({
                        locked: true,
                        lockedBy: match.editingBy
                    }, { status: 423 }); // Locked
                }
            }

            // Set lock (1 minute duration for refresh)
            const expiresAt = new Date(Date.now() + 60 * 1000).toISOString();
            await updateMatchLock(spreadsheetId, `${grade}_Matches`, matchId, session.user.email, expiresAt);
            return NextResponse.json({ success: true, expiresAt });
        } else if (action === 'release') {
            await updateMatchLock(spreadsheetId, `${grade}_Matches`, matchId, null, null);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
