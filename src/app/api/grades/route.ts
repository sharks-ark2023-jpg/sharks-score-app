import { NextResponse } from 'next/server';
import { GradeConfig } from '@/types';

export async function GET() {
    const config = process.env.GRADES_CONFIG || '';
    const grades: GradeConfig[] = config.split(',').map(item => {
        const [name, spreadsheetId] = item.split(':');
        return { name, spreadsheetId };
    }).filter(g => g.name && g.spreadsheetId);

    return NextResponse.json(grades);
}
