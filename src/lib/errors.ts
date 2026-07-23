export function getErrorMessage(error: unknown, fallback = '予期しないエラーが発生しました'): string {
    return error instanceof Error ? error.message : fallback;
}

export type AppError = Error & {
    spreadsheetId?: string;
};
