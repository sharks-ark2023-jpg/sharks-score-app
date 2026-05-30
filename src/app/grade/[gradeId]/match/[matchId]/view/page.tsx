import { getMatches } from '@/lib/sheets';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import MatchDetailClient from '@/components/MatchDetailClient';

function getSpreadsheetId(gradeName: string) {
    const config = process.env.GRADES_CONFIG || '';
    const grades = config.split(',').reduce((acc, item) => {
        const [name, id] = item.split(':');
        acc[name] = id;
        return acc;
    }, {} as Record<string, string>);
    return grades[gradeName];
}

export default async function ViewMatchPage({ params }: { params: Promise<{ gradeId: string, matchId: string }> }) {
    const { gradeId, matchId } = await params;
    const spreadsheetId = getSpreadsheetId(gradeId);

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
