// 空欄は、合計と記録済みの片方から一意に決まる場合だけ補う。
// 表示用の値を返し、保存済みデータには手を加えない。
export function resolveHalfScores(total: number | undefined, first: number | undefined, second: number | undefined): [number | undefined, number | undefined] {
    if (total === undefined || !Number.isInteger(total) || total < 0) return [first, second];
    if (first === undefined && second === undefined) return total === 0 ? [0, 0] : [first, second];
    if (first === undefined && second !== undefined && second >= 0 && second <= total) return [total - second, second];
    if (second === undefined && first !== undefined && first >= 0 && first <= total) return [first, total - first];
    return [first, second];
}
