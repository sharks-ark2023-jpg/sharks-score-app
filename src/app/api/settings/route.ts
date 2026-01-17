import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGlobalSettings, getCommonMasters, updateGlobalSettings } from '@/lib/sheets';

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
        const [settings, masters] = await Promise.all([
            getGlobalSettings(),
            getCommonMasters().catch(() => []) // Don't crash if Masters fails
        ]);
        return NextResponse.json({
            settings,
            masters,
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
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
