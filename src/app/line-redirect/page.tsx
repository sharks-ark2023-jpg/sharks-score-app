'use client';

import { useEffect, useState } from 'react';

export default function LineRedirectPage() {
    const [url, setUrl] = useState('');

    useEffect(() => {
        setUrl(window.location.href.replace('/line-redirect', '').replace(/\?.*/, ''));
    }, []);

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 max-w-sm w-full text-center space-y-6">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-lg font-black text-slate-900 mb-2">ブラウザで開いてください</h1>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        このアプリはLINE内ブラウザでは正しく動作しません。<br />
                        Safariまたは外部ブラウザで開いてください。
                    </p>
                </div>
                <a
                    href={`https://sharks-score-app-detp.vercel.app`}
                    className="block w-full py-4 bg-blue-600 text-white font-black rounded-2xl text-sm uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all"
                >
                    Safariで開く
                </a>
                <p className="text-[10px] text-slate-400">
                    iPhoneの場合：右下の「…」→「ブラウザで開く」でも開けます
                </p>
            </div>
        </main>
    );
}
