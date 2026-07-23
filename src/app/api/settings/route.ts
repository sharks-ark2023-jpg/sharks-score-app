import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGlobalSettings, getCommonMasters, updateGlobalSettings } from '@/lib/sheets';
import { getCached, setCached, invalidateCache } from '@/lib/cache';
import { getErrorMessage } from '@/lib/errors';

const SETTINGS_CACHE_KEY = 'settings:global';
const SETTINGS_TTL = 30_000;

export const dynamic = 'force-dynamic';

export async function GET() {
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
    } catch (error: unknown) {
        return NextResponse.json({
            error: getErrorMessage(error),
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
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
