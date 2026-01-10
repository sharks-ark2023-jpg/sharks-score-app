import MatchForm from '@/components/MatchForm';
import Link from 'next/link';

export default async function NewMatchPage({ params }: { params: Promise<{ gradeId: string }> }) {
    const { gradeId } = await params;

    return (
        <main className="flex-grow container mx-auto px-4 py-8">
            <header className="mb-6 max-w-lg mx-auto">
                <Link href={`/grade/${gradeId}`} className="text-sm text-blue-600 hover:underline">← 戻る</Link>
            </header>

            <MatchForm gradeId={gradeId} />
        </main>
    );
}
