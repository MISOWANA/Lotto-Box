import type { DrawResult } from '../types/lotto';

const NEW_API = 'https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseNewApiItem(d: any): DrawResult | null {
  if (!d || !d.ltEpsd) return null;
  const ymd = String(d.ltRflYmd ?? '');
  const drwNoDate = ymd.length === 8
    ? `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`
    : '';
  return {
    drwNo: Number(d.ltEpsd),
    drwNoDate,
    numbers: [
      Number(d.tm1WnNo), Number(d.tm2WnNo), Number(d.tm3WnNo),
      Number(d.tm4WnNo), Number(d.tm5WnNo), Number(d.tm6WnNo),
    ],
    bonusNo: Number(d.bnsWnNo),
    firstWinAmount: Number(d.rnk1WnAmt ?? 0),
    firstWinnerCount: Number(d.rnk1WnNope ?? 0),
    firstTotalAmount: Number(d.rnk1SumWnAmt ?? d.rnk1WnAmt ?? 0),
  };
}

function estimateMaxDrwNo(): number {
  const firstDraw = new Date('2002-12-07');
  const now = new Date();
  const weeks = Math.floor((now.getTime() - firstDraw.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return weeks + 1;
}

export async function fetchLatestDraw(lastKnownDrwNo?: number): Promise<DrawResult | null> {
  const estimate = estimateMaxDrwNo();
  const targetDrwNo = Math.max(estimate, (lastKnownDrwNo ?? 0) + 1);

  try {
    const url = `${NEW_API}?srchDir=center&srchLtEpsd=${targetDrwNo}`;
    const res = await fetch(url, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const list = data?.data?.list as unknown[];
    if (!Array.isArray(list) || list.length === 0) return null;

    // 가장 최신 회차 (list 첫 번째)
    const latest = parseNewApiItem(list[0]);
    return latest;
  } catch {
    return null;
  }
}

export async function fetchDraw(drwNo: number): Promise<DrawResult | null> {
  try {
    const url = `${NEW_API}?srchDir=center&srchLtEpsd=${drwNo}`;
    const res = await fetch(url, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const list = data?.data?.list as unknown[];
    if (!Array.isArray(list)) return null;
    // list에서 정확히 drwNo와 일치하는 항목 찾기
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = list.find((d: any) => Number(d.ltEpsd) === drwNo);
    return item ? parseNewApiItem(item) : null;
  } catch {
    return null;
  }
}

export async function loadHistory(): Promise<DrawResult[]> {
  const res = await fetch('/data/lotto-history.json', {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error('히스토리 데이터 로드 실패');
  const raw: unknown = await res.json();
  if (!Array.isArray(raw)) throw new Error('데이터 형식 오류');
  return raw as DrawResult[];
}
