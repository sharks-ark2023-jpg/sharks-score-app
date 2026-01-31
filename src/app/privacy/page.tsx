'use client';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
    return (
        <main className="container mx-auto px-4 py-12 max-w-2xl bg-white min-h-screen">
            <header className="mb-12 text-center">
                <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Privacy Policy</h1>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">プライバシーポリシー</p>
            </header>

            <div className="space-y-8 text-gray-700 leading-relaxed">
                <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-3 border-l-4 border-blue-600 pl-3">1. 取得する情報</h2>
                    <p className="text-sm">
                        本アプリ（Sharks Score App）は、Google認証を通じて以下の情報を取得します。
                    </p>
                    <ul className="list-disc list-inside mt-2 text-sm ml-2 space-y-1">
                        <li>Googleアカウントに登録されているメールアドレス</li>
                        <li>プロフィール名、およびプロフィール画像（表示用）</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-3 border-l-4 border-blue-600 pl-3">2. 利用目的</h2>
                    <p className="text-sm">
                        取得した情報は、以下の目的のみに利用いたします。
                    </p>
                    <ul className="list-disc list-inside mt-2 text-sm ml-2 space-y-1">
                        <li>試合記録の作成者・更新者の識別および管理</li>
                        <li>アプリ内での適切なユーザー表示</li>
                        <li>不正アクセスの防止およびセキュリティ管理</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-3 border-l-4 border-blue-600 pl-3">3. 第三者への提供</h2>
                    <p className="text-sm">
                        法令に基づく場合を除き、取得した個人情報をユーザーの同意なく第三者に提供することはありません。
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-3 border-l-4 border-blue-600 pl-3">4. データの管理</h2>
                    <p className="text-sm">
                        本アプリは、管理目的でGoogleスプレッドシートを使用します。データへのアクセスは、認証された関係者のみに制限されています。
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-3 border-l-4 border-blue-600 pl-3">5. お問い合わせ先</h2>
                    <p className="text-sm">
                        プライバシーポリシーに関するお問い合わせは、以下までご連絡ください。
                    </p>
                    <p className="mt-2 text-sm font-bold text-blue-600">
                        sharks.ark2023@gmail.com
                    </p>
                </section>
            </div>

            <footer className="mt-16 pt-8 border-t border-gray-50 text-center">
                <Link
                    href="/"
                    className="inline-block px-6 py-3 bg-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 transition-all text-xs tracking-widest uppercase"
                >
                    ホームに戻る
                </Link>
            </footer>
        </main>
    );
}
