import { unstable_cache, revalidateTag } from 'next/cache';
import { getSettingsBundle } from '@/lib/sheets';

const SETTINGS_TAG = 'google-sheets-settings';

export const getCachedSettingsBundle = unstable_cache(
    getSettingsBundle,
    ['google-sheets-settings'],
    {
        revalidate: 300,
        tags: [SETTINGS_TAG],
    }
);

export function invalidateSettingsBundle(): void {
    revalidateTag(SETTINGS_TAG, { expire: 0 });
}
