'use client';

import { signIn } from 'next-auth/react';

export default function SignInPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-blue-900">Sharks Score</h1>
                    <p className="mt-2 text-gray-600">少年サッカークラブ 試合記録アプリ</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => signIn('google', { callbackUrl: '/' })}
                        className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        Googleでログイン
                    </button>
                </div>

                <div className="mt-8 text-center text-xs text-gray-400">
                    &copy; {new Date().getFullYear()} Sharks Score App
                </div>
            </div>
        </div>
    );
}
