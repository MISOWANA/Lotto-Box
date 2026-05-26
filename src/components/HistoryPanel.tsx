import { useState } from 'react';
import type { DrawResult } from '../types/lotto';
import NumberBall from './NumberBall';
import { fetchDraw } from '../utils/lottoApi';
import './HistoryPanel.css';

type Props = {
  draws: DrawResult[];
};

export default function HistoryPanel({ draws }: Props) {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState<DrawResult | null | 'not-found'>(null);
  const [searching, setSearching] = useState(false);

  const recentDraws = draws.slice(-20).reverse();

  async function handleSearch() {
    const drwNo = parseInt(query, 10);
    if (isNaN(drwNo) || drwNo < 1) return;

    // 로컬에서 먼저 검색
    const local = draws.find((d) => d.drwNo === drwNo);
    if (local) { setSearched(local); return; }

    // 없으면 API 조회
    setSearching(true);
    const result = await fetchDraw(drwNo);
    setSearching(false);
    setSearched(result ?? 'not-found');
  }

  return (
    <section className="history-panel">
      <h2 className="history-panel__title">회차 조회</h2>

      <div className="history-panel__search">
        <input
          type="number"
          className="history-input"
          placeholder="회차 번호 입력"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          min={1}
        />
        <button className="btn-search" onClick={handleSearch} disabled={searching}>
          {searching ? '조회 중…' : '조회'}
        </button>
      </div>

      {searched === 'not-found' && (
        <p className="history-panel__notfound">해당 회차 데이터가 없습니다.</p>
      )}

      {searched && searched !== 'not-found' && (
        <DrawResultRow draw={searched} />
      )}

      <h3 className="history-panel__sub-title">최근 20회차</h3>
      <div className="history-list">
        {recentDraws.map((d) => (
          <DrawResultRow key={d.drwNo} draw={d} />
        ))}
      </div>
    </section>
  );
}

function DrawResultRow({ draw }: { draw: DrawResult }) {
  return (
    <div className="history-row">
      <div className="history-row__info">
        <span className="history-row__round">{draw.drwNo}회</span>
        <span className="history-row__date">{draw.drwNoDate}</span>
      </div>
      <div className="history-row__balls">
        {draw.numbers.map((n) => (
          <NumberBall key={n} number={n} size="sm" />
        ))}
        <span className="history-row__plus">+</span>
        <NumberBall number={draw.bonusNo} size="sm" bonus />
      </div>
    </div>
  );
}
