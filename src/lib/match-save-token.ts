import { createHmac, timingSafeEqual } from 'node:crypto';
import type { MatchSaveCursor } from '@/lib/sheets';

function getSigningSecret(): string {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) throw new Error('NEXTAUTH_SECRET is not configured');
    return secret;
}

function sign(encodedPayload: string): string {
    return createHmac('sha256', getSigningSecret())
        .update(encodedPayload)
        .digest('base64url');
}

export function createMatchSaveToken(cursor: MatchSaveCursor): string {
    const encodedPayload = Buffer.from(JSON.stringify(cursor)).toString('base64url');
    return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyMatchSaveToken(token: string): MatchSaveCursor | null {
    const [encodedPayload, suppliedSignature] = token.split('.');
    if (!encodedPayload || !suppliedSignature) return null;

    const expectedSignature = sign(encodedPayload);
    const supplied = Buffer.from(suppliedSignature);
    const expected = Buffer.from(expectedSignature);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
        return null;
    }

    try {
        return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()) as MatchSaveCursor;
    } catch {
        return null;
    }
}
