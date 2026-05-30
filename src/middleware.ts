import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isLineInAppBrowser(req: NextRequest): boolean {
    const ua = req.headers.get('user-agent') || '';
    return ua.includes('Line/');
}

export default withAuth(
    function middleware(req) {
        if (isLineInAppBrowser(req)) {
            const redirectUrl = req.nextUrl.clone();
            redirectUrl.pathname = '/line-redirect';
            return NextResponse.redirect(redirectUrl);
        }
        return NextResponse.next();
    },
    {
        pages: {
            signIn: '/auth/signin',
        },
    }
);

export const config = {
    matcher: [
        '/grade/:gradeId/match/new',
        '/grade/:gradeId/match/:matchId',
    ],
};
