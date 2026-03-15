import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGlobalSettings, getCommonMasters, updateGlobalSettings } from '@/lib/sheets';
import { getCached, setCached, invalidateCache } from '@/lib/cache';

const SETTINGS_CACHE_KEY = 'settings:global';
const SETTINGS_TTL = 30_000;

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

    // grade is optional for settings if we only want global ones, 
    // but the app currently uses it to find the spreadsheet context.
    try {
        let cached = getCached<{ settings: unknown; masters: unknown }>(SETTINGS_CACHE_KEY);
        if (!cached) {
            const [settings, masters] = await Promise.all([
                getGlobalSettings(),
                getCommonMasters().catch(() => [])
            ]);
            cached = { settings, masters };
            setCached(SETTINGS_CACHE_KEY, cached, SETTINGS_TTL);
        }
        return NextResponse.json({
            ...cached,
            envCommonId: process.env.COMMON_SPREADSHEET_ID,
            envGradesConfig: process.env.GRADES_CONFIG
        });
    } catch (err: any) {
        return NextResponse.json({
            error: err.message,
            spreadsheetId: process.env.COMMON_SPREADSHEET_ID
        }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const settings = await req.json();
        await updateGlobalSettings(settings, session.user.email);
        invalidateCache(SETTINGS_CACHE_KEY);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
