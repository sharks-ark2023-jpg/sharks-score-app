import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import GradeSelector from '@/components/GradeSelector';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <main className="flex-grow container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">学年選択</h1>
        <p className="text-sm text-gray-500 mt-1">記録・閲覧する学年を選択してください</p>
      </header>

      <GradeSelector />
    </main>
  );
}
