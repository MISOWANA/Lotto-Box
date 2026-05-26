import { useState } from 'react';
import type { DrawResult } from '../types/lotto';
import NumberBall from './NumberBall';
import { fetchDraw } from '../utils/lottoApi';
import './HistoryPanel.css';

const MAX_DRW_NO = 9999;

type Props = {
  draws: DrawResult[];
};

export default function HistoryPanel({ draws }: Props) {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState<DrawResult | null | 'not-found'>(null);
  const [searching, setSearching] = useState(false);
  const [inputError, setInputError] = useState('');

  const recentDraws = draws.slice(-20).reverse();

  function validateDrwNo(raw: string): number | null {
    const drwNo = parseInt(raw, 10);
    if (isNaN(drwNo) || drwNo < 1 || drwNo > MAX_DRW_NO || String(drwNo) !== raw.trim()) return null;
    return drwNo;
  }

  async function handleSearch() {
    setInputError('');
    const drwNo = validateDrwNo(query);
    if (drwNo === null) {
      setInputError(`1 ~ ${MAX_DRW_NO} 사이의 회차를 입력해주세요.`);
      return;
    }

    const local = draws.find((d) => d.drwNo === drwNo);
    if (local) { setSearched(local); return; }

    setSearching(true);
    const result = await fetchDraw(drwNo);
    setSearching(false);
    setSearched(result ?? 'not-found');
  }

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    // 숫자 외 문자 입력 차단
    if (val === '' || /^\d+$/.test(val)) {
      setQuery(val);
      setInputError('');
    }
  }

  return (
    <section className="history-panel">
      <h2 className="history-panel__title">회차 조회</h2>

      <div className="history-panel__search">
        <input
          type="number"
          className={`history-input${inputError ? ' history-input--error' : ''}`}
          placeholder="회차 번호 입력"
          value={query}
          onChange={handleQueryChange}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          min={1}
          max={MAX_DRW_NO}
          aria-label="조회할 로또 회차 번호"
          aria-describedby={inputError ? 'search-error' : undefined}
        />
        <button
          className="btn-search"
          onClick={handleSearch}
          disabled={searching}
          aria-label="회차 조회"
        >
          {searching ? '조회 중…' : '조회'}
        </button>
      </div>

      {inputError && (
        <p id="search-error" className="history-panel__error" role="alert">{inputError}</p>
      )}

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
