'use strict';
/**
 * 비교 차트 플로우 통합 테스트
 * app.js의 addCompareApt / compareAptTrades 상태머신을 Node.js에서 재현
 *
 * cmpKey 형식: "아파트명|areaKey(㎡ 반올림)"
 *
 * 시나리오:
 *   A. 같은 지역 — aptFilter로 단지 전환 후 비교체크
 *   B. 다른 지역 — doSearch 두 번 후 각각 비교체크 (크로스 지역)
 *   C. clearCompareApts 후 상태 초기화
 *   D. 3개 초과 차단
 *   E. 단지 해제 후 재체크
 *   F. 같은 단지 다른 평수 독립 비교
 */

// ── 샘플 데이터 ───────────────────────────────────────────────────────────────
const GANGNAM = [
  { aptName: '래미안대치팰리스', year: 2025, month: 1, dealAmount: 300000, area: 84 },
  { aptName: '래미안대치팰리스', year: 2025, month: 2, dealAmount: 305000, area: 84 },
  { aptName: '래미안대치팰리스', year: 2025, month: 1, dealAmount: 200000, area: 59 },
  { aptName: '래미안대치팰리스', year: 2025, month: 2, dealAmount: 204000, area: 59 },
  { aptName: '은마아파트',       year: 2025, month: 1, dealAmount: 150000, area: 84 },
  { aptName: '은마아파트',       year: 2025, month: 2, dealAmount: 152000, area: 84 },
];
const SONGPA = [
  { aptName: '헬리오시티', year: 2025, month: 2, dealAmount: 200000, area: 59 },
  { aptName: '헬리오시티', year: 2025, month: 3, dealAmount: 205000, area: 59 },
  { aptName: '파크리오',   year: 2025, month: 1, dealAmount: 170000, area: 84 },
];

// ── 상태 (app.js 전역변수 대응) ───────────────────────────────────────────────
let allTrades, filteredTrades, selectedCompareApts, compareAptTrades;

function reset(trades = []) {
  allTrades           = [...trades];
  filteredTrades      = [...trades];
  selectedCompareApts = new Set();
  compareAptTrades    = {};
}

// ── app.js 함수 직접 복사 (DOM 없이 상태머신만) ───────────────────────────────
function addCompareApt(aptName, areaKey, checked) {
  const cmpKey = `${aptName}|${areaKey}`;
  if (checked) {
    if (selectedCompareApts.size >= 6) return 'overflow';
    selectedCompareApts.add(cmpKey);
    compareAptTrades[cmpKey] = allTrades.filter(
      t => t.aptName === aptName && Math.round(t.area) === areaKey
    );
  } else {
    selectedCompareApts.delete(cmpKey);
    delete compareAptTrades[cmpKey];
  }
  return 'ok';
}

function clearCompareApts() {
  selectedCompareApts.clear();
  compareAptTrades = {};
}

function getChartDatasets() {
  const allLabels = [...new Set(
    Object.values(compareAptTrades).flat()
      .map(t => `${t.year}-${String(t.month).padStart(2,'0')}`)
  )].sort();

  const datasets = [...selectedCompareApts].map(cmpKey => {
    const trades = compareAptTrades[cmpKey] || [];
    const monthly = {};
    trades.forEach(t => {
      const k = `${t.year}-${String(t.month).padStart(2,'0')}`;
      if (!monthly[k]) monthly[k] = { sum: 0, cnt: 0 };
      monthly[k].sum += t.dealAmount;
      monthly[k].cnt++;
    });
    return {
      name: cmpKey,
      dataPoints: allLabels.map(k => monthly[k] ? Math.round(monthly[k].sum / monthly[k].cnt) : null),
    };
  });
  return { allLabels, datasets };
}

// ── 시나리오 A: 같은 지역, aptFilter 전환 ─────────────────────────────────────
describe('시나리오 A — 같은 지역, aptFilter로 단지 전환', () => {
  beforeEach(() => reset(GANGNAM));

  test('래미안 84㎡ 체크 후 filteredTrades가 은마로 바뀌어도 캐시 유지', () => {
    filteredTrades = GANGNAM.filter(t => t.aptName === '래미안대치팰리스');
    expect(addCompareApt('래미안대치팰리스', 84, true)).toBe('ok');
    expect(compareAptTrades['래미안대치팰리스|84']).toHaveLength(2);

    filteredTrades = GANGNAM.filter(t => t.aptName === '은마아파트');

    expect(selectedCompareApts.has('래미안대치팰리스|84')).toBe(true);
    expect(compareAptTrades['래미안대치팰리스|84']).toHaveLength(2);
  });

  test('aptFilter 전환 후 두 번째 단지 체크 → 차트에 두 단지 모두 표시', () => {
    filteredTrades = GANGNAM.filter(t => t.aptName === '래미안대치팰리스');
    addCompareApt('래미안대치팰리스', 84, true);

    filteredTrades = GANGNAM.filter(t => t.aptName === '은마아파트');
    addCompareApt('은마아파트', 84, true);

    expect(selectedCompareApts.size).toBe(2);
    const { allLabels, datasets } = getChartDatasets();
    expect(allLabels).toHaveLength(2); // 2025-01, 2025-02

    const rDS = datasets.find(d => d.name === '래미안대치팰리스|84');
    const eDS = datasets.find(d => d.name === '은마아파트|84');
    expect(rDS?.dataPoints.filter(v => v !== null)).toHaveLength(2);
    expect(eDS?.dataPoints.filter(v => v !== null)).toHaveLength(2);
  });
});

// ── 시나리오 B: 다른 지역 doSearch 2회 (크로스 지역) ─────────────────────────
describe('시나리오 B — 다른 지역 doSearch 2회 (크로스 지역 비교)', () => {
  beforeEach(() => reset(GANGNAM));

  test('강남 래미안 84㎡ 체크 후 송파구 재조회 → 캐시 유지됨', () => {
    addCompareApt('래미안대치팰리스', 84, true);
    expect(compareAptTrades['래미안대치팰리스|84']).toHaveLength(2);

    allTrades = [...SONGPA];
    filteredTrades = [...SONGPA];

    expect(selectedCompareApts.has('래미안대치팰리스|84')).toBe(true);
    expect(compareAptTrades['래미안대치팰리스|84']).toHaveLength(2);
  });

  test('크로스 지역 체크 → 차트 라벨이 두 지역 기간 모두 포함', () => {
    addCompareApt('래미안대치팰리스', 84, true); // 강남: 2025-01, 2025-02

    allTrades = [...SONGPA];
    filteredTrades = [...SONGPA];
    addCompareApt('헬리오시티', 59, true); // 송파: 2025-02, 2025-03

    const { allLabels, datasets } = getChartDatasets();
    expect(allLabels).toContain('2025-01');
    expect(allLabels).toContain('2025-02');
    expect(allLabels).toContain('2025-03');
    expect(allLabels).toHaveLength(3);

    const idx = allLabels.indexOf('2025-02');
    const rDS = datasets.find(d => d.name === '래미안대치팰리스|84');
    const hDS = datasets.find(d => d.name === '헬리오시티|59');
    expect(rDS?.dataPoints[idx]).toBe(305000);
    expect(hDS?.dataPoints[idx]).toBe(200000);
  });

  test('헬리오 캐시가 강남 데이터를 오염시키지 않음', () => {
    addCompareApt('래미안대치팰리스', 84, true);
    allTrades = [...SONGPA];
    addCompareApt('헬리오시티', 59, true);

    expect(compareAptTrades['헬리오시티|59'].every(t => t.aptName === '헬리오시티')).toBe(true);
    expect(compareAptTrades['래미안대치팰리스|84'].every(t => t.aptName === '래미안대치팰리스')).toBe(true);
  });
});

// ── 시나리오 C: clearCompareApts ───────────────────────────────────────────────
describe('시나리오 C — clearCompareApts 후 상태 초기화', () => {
  test('clear 후 selectedCompareApts · compareAptTrades 비워짐', () => {
    reset(GANGNAM);
    addCompareApt('래미안대치팰리스', 84, true);
    addCompareApt('은마아파트', 84, true);

    clearCompareApts();
    expect(selectedCompareApts.size).toBe(0);
    expect(Object.keys(compareAptTrades)).toHaveLength(0);
  });
});

// ── 시나리오 D: 6개 초과 차단 ─────────────────────────────────────────────────
describe('시나리오 D — 6개 초과 차단', () => {
  test('6개까지 정상 추가, 7번째 체크 시 overflow 반환 · 상태 불변', () => {
    // 6개 채울 데이터 (aptName+area 6종)
    const ALL = [
      { aptName: '단지A', area: 84, year: 2025, month: 1, dealAmount: 100000 },
      { aptName: '단지B', area: 84, year: 2025, month: 1, dealAmount: 110000 },
      { aptName: '단지C', area: 59, year: 2025, month: 1, dealAmount: 120000 },
      { aptName: '단지D', area: 84, year: 2025, month: 1, dealAmount: 130000 },
      { aptName: '단지E', area: 59, year: 2025, month: 1, dealAmount: 140000 },
      { aptName: '단지F', area: 84, year: 2025, month: 1, dealAmount: 150000 },
      { aptName: '단지G', area: 84, year: 2025, month: 1, dealAmount: 160000 },
    ];
    reset(ALL);
    addCompareApt('단지A', 84, true);
    addCompareApt('단지B', 84, true);
    addCompareApt('단지C', 59, true);
    addCompareApt('단지D', 84, true);
    addCompareApt('단지E', 59, true);
    addCompareApt('단지F', 84, true);
    expect(selectedCompareApts.size).toBe(6);

    const res = addCompareApt('단지G', 84, true);
    expect(res).toBe('overflow');
    expect(selectedCompareApts.size).toBe(6);
    expect(compareAptTrades['단지G|84']).toBeUndefined();
  });
});

// ── 시나리오 E: 해제 후 재체크 ────────────────────────────────────────────────
describe('시나리오 E — 단지 해제 후 다른 단지 추가', () => {
  test('래미안 해제 → 캐시 삭제 → 헬리오 추가 → 은마+헬리오만 차트에', () => {
    reset(GANGNAM);
    addCompareApt('래미안대치팰리스', 84, true);
    addCompareApt('은마아파트', 84, true);

    addCompareApt('래미안대치팰리스', 84, false);
    expect(selectedCompareApts.has('래미안대치팰리스|84')).toBe(false);
    expect(compareAptTrades['래미안대치팰리스|84']).toBeUndefined();
    expect(selectedCompareApts.has('은마아파트|84')).toBe(true);

    allTrades = [...SONGPA];
    addCompareApt('헬리오시티', 59, true);

    const { datasets } = getChartDatasets();
    expect(datasets.map(d => d.name)).not.toContain('래미안대치팰리스|84');
    expect(datasets.map(d => d.name)).toContain('은마아파트|84');
    expect(datasets.map(d => d.name)).toContain('헬리오시티|59');
  });
});

// ── 시나리오 F: 같은 단지, 다른 평수 독립 비교 ────────────────────────────────
describe('시나리오 F — 같은 단지 다른 평수 독립 비교', () => {
  test('래미안 84㎡ 와 래미안 59㎡ 별도 캐시로 관리됨', () => {
    reset(GANGNAM);
    addCompareApt('래미안대치팰리스', 84, true);
    addCompareApt('래미안대치팰리스', 59, true);

    expect(selectedCompareApts.size).toBe(2);
    expect(compareAptTrades['래미안대치팰리스|84']).toHaveLength(2);
    expect(compareAptTrades['래미안대치팰리스|59']).toHaveLength(2);

    expect(compareAptTrades['래미안대치팰리스|84'].every(t => Math.round(t.area) === 84)).toBe(true);
    expect(compareAptTrades['래미안대치팰리스|59'].every(t => Math.round(t.area) === 59)).toBe(true);
  });

  test('같은 단지 두 평수의 월평균가가 차트에서 독립적으로 표시됨', () => {
    reset(GANGNAM);
    addCompareApt('래미안대치팰리스', 84, true);
    addCompareApt('래미안대치팰리스', 59, true);

    const { allLabels, datasets } = getChartDatasets();
    expect(allLabels).toHaveLength(2); // 2025-01, 2025-02

    const d84 = datasets.find(d => d.name === '래미안대치팰리스|84');
    const d59 = datasets.find(d => d.name === '래미안대치팰리스|59');

    const idx01 = allLabels.indexOf('2025-01');
    expect(d84?.dataPoints[idx01]).toBe(300000); // 84㎡ 1월 평균
    expect(d59?.dataPoints[idx01]).toBe(200000); // 59㎡ 1월 평균 (섞이지 않음)
  });
});
