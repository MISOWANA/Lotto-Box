/**
 * 동행복권 전체 회차 데이터를 수집해 public/data/lotto-history.json 으로 저장.
 * 실행: node scripts/fetch-lotto-history.mjs
 *
 * 새 API: /lt645/selectPstLt645InfoNew.do?srchDir=center&srchLtEpsd={N}
 * → 한 번에 10개 회차 반환. Playwright로 브라우저 세션을 유지하며 수집.
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, '../public/data/lotto-history.json');

function estimateMaxDrwNo() {
  const firstDraw = new Date('2002-12-07');
  const now = new Date();
  const weeks = Math.floor((now - firstDraw) / (7 * 24 * 60 * 60 * 1000));
  return weeks + 1;
}

function parseDraw(d) {
  return {
    drwNo: Number(d.ltEpsd),
    drwNoDate: d.ltRflYmd
      ? `${d.ltRflYmd.slice(0, 4)}-${d.ltRflYmd.slice(4, 6)}-${d.ltRflYmd.slice(6, 8)}`
      : '',
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

async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  let existingMap = new Map();
  let startFrom = 1;

  if (existsSync(OUTPUT_PATH)) {
    try {
      const raw = JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'));
      if (Array.isArray(raw) && raw.length > 0) {
        for (const d of raw) existingMap.set(d.drwNo, d);
        startFrom = raw[raw.length - 1].drwNo + 1;
        console.log(`기존 데이터 ${raw.length}회차 로드. ${startFrom}회차부터 수집.`);
      }
    } catch {
      console.warn('기존 파일 파싱 실패, 처음부터 수집합니다.');
    }
  }

  const maxEstimate = estimateMaxDrwNo();
  console.log(`최대 추정 회차: ${maxEstimate}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'ko-KR',
  });

  console.log('사이트 방문 중 (WAF 초기화)…');
  const page = await context.newPage();
  await page.goto('https://www.dhlottery.co.kr/lt645/result', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  console.log('준비 완료.');

  // API는 1회 요청 시 10개 반환. 10 단위로 center 포인트를 증가시켜 호출.
  // center=N → returns N-4 to N+5 (roughly). step by 10.
  const collectedMap = new Map(existingMap);
  let consecutiveFails = 0;

  // srchLtEpsd center points to cover startFrom..maxEstimate
  // 첫 center: startFrom이 1이면 1부터, 아니면 startFrom을 포함하는 첫 배치
  const firstCenter = startFrom <= 10 ? 1 : Math.ceil((startFrom - 5) / 10) * 10 + 5;

  for (let center = firstCenter; center <= maxEstimate + 10; center += 10) {
    try {
      const episodesInBatch = await page.evaluate(async (c) => {
        const r = await fetch(`/lt645/selectPstLt645InfoNew.do?srchDir=center&srchLtEpsd=${c}`, {
          headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
        });
        const text = await r.text();
        if (!text.trim().startsWith('{')) return null;
        const json = JSON.parse(text);
        return json?.data?.list ?? null;
      }, center);

      if (!episodesInBatch) {
        consecutiveFails++;
        console.log(`\n  center=${center}: 응답 없음`);
        if (consecutiveFails >= 3) { console.log('\n연속 실패 — 종료.'); break; }
        await delay(1000);
        continue;
      }

      if (episodesInBatch.length === 0) {
        consecutiveFails++;
        if (consecutiveFails >= 3) { console.log('\n연속 빈 응답 — 종료.'); break; }
        await delay(300);
        continue;
      }

      consecutiveFails = 0;
      let newCount = 0;
      for (const item of episodesInBatch) {
        if (!item.ltEpsd) continue;
        const drwNo = Number(item.ltEpsd);
        if (drwNo < startFrom) continue; // 이미 있는 회차 스킵
        if (!collectedMap.has(drwNo)) {
          collectedMap.set(drwNo, parseDraw(item));
          newCount++;
        }
      }

      const total = collectedMap.size;
      process.stdout.write(`\r  center=${center} | 누적 ${total}회차 (+${newCount})       `);

      // 100회마다 중간 저장
      if (total % 100 < 10 && newCount > 0) {
        const sorted = [...collectedMap.values()].sort((a, b) => a.drwNo - b.drwNo);
        writeFileSync(OUTPUT_PATH, JSON.stringify(sorted, null, 0), 'utf-8');
      }

      await delay(100);
    } catch (err) {
      console.error(`\n  center=${center} 오류:`, err.message);
      consecutiveFails++;
      if (consecutiveFails >= 5) break;
      await delay(2000);
    }
  }

  await browser.close();

  const sorted = [...collectedMap.values()].sort((a, b) => a.drwNo - b.drwNo);
  console.log(`\n\n저장: ${OUTPUT_PATH} (${sorted.length}회차)`);
  writeFileSync(OUTPUT_PATH, JSON.stringify(sorted, null, 0), 'utf-8');
  console.log('완료.');
}

main().catch((err) => {
  console.error('수집 실패:', err);
  process.exit(1);
});
