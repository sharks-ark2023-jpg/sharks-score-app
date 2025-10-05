import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        res.status(405).json({ message: 'Method Not Allowed' });
        return;
    }

    try {
        const sheetIdSet = !!process.env.GOOGLE_SHEET_ID;
        const clientEmailSet = !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
        const privateKeySet = !!process.env.GOOGLE_SHEETS_PRIVATE_KEY;

        res.status(200).json({
            status: 'ok',
            message: 'API is running.',
            timestamp: new Date().toISOString(),
            environmentVariables: {
                GOOGLE_SHEET_ID: sheetIdSet ? '設定済み' : '未設定',
                GOOGLE_SHEETS_CLIENT_EMAIL: clientEmailSet ? '設定済み' : '未設定',
                GOOGLE_SHEETS_PRIVATE_KEY: privateKeySet ? '設定済み' : '未設定'
            }
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'An internal server error occurred during health check.',
        });
    }
}
