import { getMatches } from '@/lib/sheets';
import { getGradeSpreadsheetId } from '@/lib/spreadsheet-config';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import MatchDetailClient from '@/components/MatchDetailClient';

export default async function ViewMatchPage({ params }: { params: Promise<{ gradeId: string, matchId: string }> }) {
    const { gradeId, matchId } = await params;
    const spreadsheetId = getGradeSpreadsheetId(gradeId);

    if (!spreadsheetId) notFound();

    const matches = await getMatches(spreadsheetId, `${gradeId}_Matches`);
    const match = matches.find(m => m.matchId === matchId);

    if (!match) notFound();

    const session = await getServerSession(authOptions);
    const isLoggedIn = !!session;

    return (
        <MatchDetailClient match={match} gradeId={gradeId} isLoggedIn={isLoggedIn} />
    );
}
