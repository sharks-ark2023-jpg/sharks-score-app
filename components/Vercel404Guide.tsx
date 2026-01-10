import React from 'react';

const Vercel404Guide: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto bg-secondary p-8 rounded-lg shadow-xl text-text-primary">
      <h1 className="text-3xl font-bold text-highlight mb-4">Vercelデプロイ時の404エラーガイド</h1>
      <p className="text-text-secondary mb-6">
        Vercel上でReactのシングルページアプリケーション（SPA）とサーバーレス関数（Google Sheets接続用など）を併用する際、APIエンドポイント（例: `/api/read-sheet`）にアクセスすると404エラーが発生することがあります。これは多くの場合、Vercelのプロジェクト設定が原因です。
      </p>

      <h2 className="text-2xl font-semibold text-highlight mb-3">解決策: `vercel.json`</h2>
      <p className="mb-4">
        最も一般的な解決策は、プロジェクトのルートディレクトリに `vercel.json` ファイルを作成することです。このファイルで、Vercelにルーティングの処理方法とサーバーレス関数の場所を指示します。
      </p>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold mb-2">ステップ1: `vercel.json` ファイルの作成</h3>
          <p>プロジェクトのルートディレクトリ（`package.json` と同じ階層）に、`vercel.json` という名前で新しいファイルを作成します。</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-2">ステップ2: 以下の内容を追加</h3>
          <p className="mb-2">この設定をコピーして `vercel.json` ファイルに貼り付けてください。</p>
          <pre className="bg-primary p-4 rounded-md text-sm text-text-primary overflow-x-auto">
            <code>
{`{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
`}
            </code>
          </pre>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-2">設定内容の解説</h3>
          <ul className="list-disc list-inside space-y-2 text-text-secondary">
            <li>
              <strong className="text-text-primary">`"source": "/api/(.*)", "destination": "/api/$1"`:</strong> このルールは、`/api/` で始まるすべてのリクエストを、`/api` ディレクトリにあるサーバーレス関数に正しくルーティングします。
            </li>
            <li>
              <strong className="text-text-primary">`"source": "/(.*)", "destination": "/index.html"`:</strong> これはReact SPAの標準的な「キャッチオール」ルールです。他のすべてのリクエストを `index.html` に転送し、React Router（このアプリでは`HashRouter`）がクライアントサイドのルーティングを処理できるようにします。これにより、ページをリロードした際の404エラーを防ぎます。
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-2">ステップ3: 再デプロイ</h3>
          <p>
            作成した `vercel.json` ファイルをコミットし、Gitリポジトリにプッシュしてください。Vercelは自動的に更新された設定で新しいデプロイを開始します。これでAPIエンドポイントがアクセス可能になるはずです。
          </p>
        </div>
      </div>
    </div>
  );
};

export default Vercel404Guide;