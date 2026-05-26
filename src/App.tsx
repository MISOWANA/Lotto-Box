import { useEffect, useRef, useState } from 'react';
import type { AppTab, DrawResult, LottoStats, RecommendationOption, RecommendedSet } from './types/lotto';
import { loadHistory, fetchLatestDraw } from './utils/lottoApi';
import { buildStats } from './utils/lottoStats';
import { generateRecommendations } from './utils/lottoGenerator';

import TabBar from './components/TabBar';
import DrawSummary from './components/DrawSummary';
import FilterPanel from './components/FilterPanel';
import RecommendationCard from './components/RecommendationCard';
import StatsPanel from './components/StatsPanel';
import HistoryPanel from './components/HistoryPanel';
import ErrorBoundary from './components/ErrorBoundary';

import './App.css';

const DEFAULT_OPTIONS: RecommendationOption = {
  setCount: 5,
  excludeBirthdayPattern: true,
  excludeConsecutive3: true,
  excludePopularPattern: true,
};

export default function App() {
  const [tab, setTab] = useState<AppTab>('main');
  const [draws, setDraws] = useState<DrawResult[]>([]);
  const [stats, setStats] = useState<LottoStats | null>(null);
  const [latestDraw, setLatestDraw] = useState<DrawResult | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [options, setOptions] = useState<RecommendationOption>(DEFAULT_OPTIONS);
  const [recommendations, setRecommendations] = useState<RecommendedSet[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const statsRef = useRef<LottoStats | null>(null);
  const drawsRef = useRef<DrawResult[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoadingHistory(true);
      setLoadError(null);
      try {
        const history = await loadHistory();
        if (cancelled) return;
        setDraws(history);
        drawsRef.current = history;

        const lastKnown = history.length > 0 ? history[history.length - 1] : null;
        setLatestDraw(lastKnown);

        const computed = buildStats(history);
        if (!cancelled) {
          setStats(computed);
          statsRef.current = computed;
        }

        // 최신 회차 재조회 (CORS 이슈 시 조용히 실패)
        const latest = await fetchLatestDraw(lastKnown?.drwNo);
        if (cancelled) return;
        if (latest) {
          setLatestDraw(latest);
          if (lastKnown && latest.drwNo > lastKnown.drwNo) {
            const updated = [...history, latest];
            setDraws(updated);
            drawsRef.current = updated;
            const recomputed = buildStats(updated);
            setStats(recomputed);
            statsRef.current = recomputed;
          }
        }
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : '데이터 로드 실패');
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const lastKnown = draws.length > 0 ? draws[draws.length - 1].drwNo : undefined;
      const latest = await fetchLatestDraw(lastKnown);
      if (latest) {
        setLatestDraw(latest);
        if (lastKnown && latest.drwNo > lastKnown) {
          const updated = [...draws, latest];
          setDraws(updated);
          drawsRef.current = updated;
          const recomputed = buildStats(updated);
          setStats(recomputed);
          statsRef.current = recomputed;
        }
      }
    } finally {
      setRefreshing(false);
    }
  }

  function handleGenerate() {
    if (!stats || draws.length === 0) {
      setGenError('데이터가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setGenerating(true);
    setGenError(null);

    setTimeout(() => {
      try {
        const results = generateRecommendations(drawsRef.current, statsRef.current!, options);
        if (results.length === 0) {
          setGenError('조건에 맞는 조합을 찾지 못했습니다. 옵션을 완화해보세요.');
        } else {
          setRecommendations(results);
        }
      } catch {
        setGenError('번호 생성 중 오류가 발생했습니다.');
      } finally {
        setGenerating(false);
      }
    }, 10);
  }

  if (loadError) {
    return (
      <div className="app-error">
        <p>⚠️ {loadError}</p>
        <button onClick={() => window.location.reload()}>다시 시도</button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-header__title">Lotto Box</h1>
        <p className="app-header__sub">미소야 이번호가 1등 당첨이야! 사랑해!</p>
      </header>

      <TabBar active={tab} onChange={setTab} />

      <main className="app-main">
        {tab === 'main' && (
          <div className="main-tab">
            {loadingHistory ? (
              <div className="loading-box">
                <span className="spinner" />
                <p>데이터 로드 중…</p>
              </div>
            ) : latestDraw ? (
              <DrawSummary draw={latestDraw} onRefresh={handleRefresh} refreshing={refreshing} />
            ) : (
              <p className="empty-msg">최신 회차 정보를 불러올 수 없습니다.</p>
            )}

            <FilterPanel
              options={options}
              onChange={setOptions}
              onGenerate={handleGenerate}
              generating={generating}
            />

            {genError && <p className="error-msg">{genError}</p>}

            {generating && (
              <div className="loading-box">
                <span className="spinner" />
                <p>최적 번호 조합 탐색 중…</p>
              </div>
            )}

            {!generating && recommendations.length > 0 && (
              <section className="rec-list">
                <h2 className="rec-list__title">추천 번호</h2>
                <p className="rec-list__notice">
                  이 결과는 내부 점수 모델 기반 참고용이며, 당첨을 보장하지 않습니다.
                </p>
                {recommendations.map((set, i) => (
                  <RecommendationCard key={set.numbers.join('-')} set={set} index={i} />
                ))}
              </section>
            )}
          </div>
        )}

        {tab === 'stats' && (
          <ErrorBoundary>
            {stats ? (
              <StatsPanel stats={stats} />
            ) : (
              <div className="loading-box">
                <span className="spinner" />
                <p>통계 계산 중…</p>
              </div>
            )}
          </ErrorBoundary>
        )}

        {tab === 'history' && (
          <ErrorBoundary>
            <HistoryPanel draws={draws} />
          </ErrorBoundary>
        )}
      </main>

      <footer className="app-footer">
        <p>비공식 개인용 도구 · 동행복권과 무관 · 당첨 보장 없음</p>
      </footer>
    </div>
  );
}
