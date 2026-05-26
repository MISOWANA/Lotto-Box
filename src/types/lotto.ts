export type DrawResult = {
  drwNo: number;
  drwNoDate: string;
  numbers: number[];
  bonusNo: number;
  firstWinAmount: number;
  firstWinnerCount: number;
  firstTotalAmount: number;
};

export type RecommendationOption = {
  setCount: number;
  excludeBirthdayPattern: boolean;
  excludeConsecutive3: boolean;
  excludePopularPattern: boolean;
};

export type RecommendedSet = {
  numbers: number[];
  score: number;
  reasons: string[];
  stats: {
    oddEven: string;
    sum: number;
    sectionSpread: string;
    includesHighNumbers: boolean;
    duplicatedPastFirstPrize: boolean;
  };
};

export type LottoStats = {
  numberFrequencyAll: Record<number, number>;
  numberFrequencyRecent30: Record<number, number>;
  numberFrequencyRecent100: Record<number, number>;
  oddEvenDistribution: Record<string, number>;
  sumDistribution: number[];
  sectionDistribution: Record<string, number>;
  consecutivePatternCount: number;
  lowHighDistribution: { low: number; high: number };
  totalDraws: number;
  sumAvg: number;
  sumStdDev: number;
};

export type AppTab = 'main' | 'stats' | 'history' | 'settings';

export type AppStatus = 'loading' | 'success' | 'error' | 'empty';
