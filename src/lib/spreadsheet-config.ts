import { GradeConfig } from '@/types';

function parseGradesConfig(config = process.env.GRADES_CONFIG || ''): GradeConfig[] {
    return config
        .split(',')
        .map(item => {
            const separatorIndex = item.indexOf(':');
            if (separatorIndex === -1) return null;

            const name = item.slice(0, separatorIndex).trim();
            const spreadsheetId = item.slice(separatorIndex + 1).trim();
            return name && spreadsheetId ? { name, spreadsheetId } : null;
        })
        .filter((grade): grade is GradeConfig => grade !== null);
}

export function getGrades(): GradeConfig[] {
    const unifiedSpreadsheetId = process.env.APP_SPREADSHEET_ID?.trim();

    return parseGradesConfig().map(grade => ({
        ...grade,
        spreadsheetId: unifiedSpreadsheetId || grade.spreadsheetId,
    }));
}

export function getGradeSpreadsheetId(gradeName: string): string | undefined {
    return getGrades().find(grade => grade.name === gradeName)?.spreadsheetId;
}

export function getCommonSpreadsheetId(): string | undefined {
    return process.env.APP_SPREADSHEET_ID?.trim()
        || process.env.COMMON_SPREADSHEET_ID?.trim()
        || undefined;
}
