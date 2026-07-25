import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateGlobalSettings } from '@/lib/sheets';
import { getErrorMessage } from '@/lib/errors';
import { getCommonSpreadsheetId } from '@/lib/spreadsheet-config';
import { getCachedSettingsBundle, invalidateSettingsBundle } from '@/lib/settings-cache';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const cached = await getCachedSettingsBundle();
        return NextResponse.json({
            ...cached,
            envCommonId: getCommonSpreadsheetId(),
            envUnifiedId: process.env.APP_SPREADSHEET_ID,
            envGradesConfig: process.env.GRADES_CONFIG
        });
    } catch (error: unknown) {
        return NextResponse.json({
            error: getErrorMessage(error),
            spreadsheetId: getCommonSpreadsheetId()
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
        invalidateSettingsBundle();
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
