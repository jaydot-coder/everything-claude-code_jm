'use strict';
const {
  getRegionType, getLoanAmountCap, getBangGongje,
  maxLoanFromDSR, monthlyPayment,
  calcRegistrationFee, calcAgencyFee, calcAcquisitionTax,
  calcTransferTaxOnGain, calcTransferTax,
  computeLoan,
} = require('../public/lib/calc');

// ── getRegionType ─────────────────────────────────────────────────────────────
describe('getRegionType', () => {
  test('서울 강남구 → seoul', () => {
    expect(getRegionType('11680')).toBe('seoul');
  });
  test('과천시 → metro-strong', () => {
    expect(getRegionType('41290')).toBe('metro-strong');
  });
  test('수원 권선구 (투기과열 미지정) → metro', () => {
    expect(getRegionType('41113')).toBe('metro');
  });
  test('부산 해운대구 → other', () => {
    expect(getRegionType('26350')).toBe('other');
  });
});

// ── getLoanAmountCap ──────────────────────────────────────────────────────────
describe('getLoanAmountCap', () => {
  test('서울, 14억 → 6억 한도', () => {
    const result = getLoanAmountCap('seoul', 140000);
    expect(result.cap).toBe(60000);
  });
  test('서울, 20억 → 4억 한도', () => {
    const result = getLoanAmountCap('seoul', 200000);
    expect(result.cap).toBe(40000);
  });
  test('서울, 30억 → 2억 한도', () => {
    const result = getLoanAmountCap('seoul', 300000);
    expect(result.cap).toBe(20000);
  });
  test('수도권, 10억 → 6억 한도', () => {
    const result = getLoanAmountCap('metro', 100000);
    expect(result.cap).toBe(60000);
  });
  test('비수도권 → null (한도 없음)', () => {
    expect(getLoanAmountCap('other', 50000)).toBeNull();
  });
});

// ── getBangGongje ─────────────────────────────────────────────────────────────
describe('getBangGongje', () => {
  test('서울 → 5500만원', () => expect(getBangGongje('seoul')).toBe(5500));
  test('경기 투기과열 → 4800만원', () => expect(getBangGongje('metro-strong')).toBe(4800));
  test('일반 수도권 → 4800만원', () => expect(getBangGongje('metro')).toBe(4800));
  test('비수도권 → 2800만원', () => expect(getBangGongje('other')).toBe(2800));
});

// ── monthlyPayment ────────────────────────────────────────────────────────────
describe('monthlyPayment', () => {
  test('원금 0 → 0', () => {
    expect(monthlyPayment(0, 4.5, 30)).toBe(0);
  });
  test('금리 0 → 0', () => {
    expect(monthlyPayment(30000, 0, 30)).toBe(0);
  });
  test('3억 연4.5% 30년 원리금균등상환 ≈ 152만원', () => {
    const mp = monthlyPayment(30000, 4.5, 30);
    expect(mp).toBeGreaterThan(150);
    expect(mp).toBeLessThan(155);
  });
  test('10억 연3% 30년 월납입 계산', () => {
    const mp = monthlyPayment(100000, 3.0, 30);
    expect(mp).toBeGreaterThan(420);
    expect(mp).toBeLessThan(430);
  });
});

// ── maxLoanFromDSR ────────────────────────────────────────────────────────────
describe('maxLoanFromDSR', () => {
  test('소득 0 → null', () => {
    expect(maxLoanFromDSR(0, 0, 4.5, 30)).toBeNull();
  });
  test('기존 부채로 DSR 꽉 찬 경우 → 0', () => {
    // 연소득 5000만원, 기존 월 167만원 (DSR 40% 꽉 참)
    const result = maxLoanFromDSR(5000, 167, 4.5, 30);
    expect(result).toBeLessThanOrEqual(0);
  });
  test('연소득 1억, 기존부채 없음, 4.5% 30년 → 약 4.6억 이상', () => {
    const result = maxLoanFromDSR(10000, 0, 4.5, 30);
    expect(result).toBeGreaterThan(40000);
  });
});

// ── calcRegistrationFee ───────────────────────────────────────────────────────
describe('calcRegistrationFee', () => {
  test('3억 → 법무사50 + 인지15 + 채권할인', () => {
    const fee = calcRegistrationFee(30000);
    expect(fee).toBe(50 + 15 + Math.round(30000 * 0.0003));
  });
  test('5억 이상 → 법무사70', () => {
    const fee = calcRegistrationFee(60000);
    expect(fee).toBe(70 + 15 + Math.round(60000 * 0.0003));
  });
  test('10억 이상 → 법무사100 + 인지35', () => {
    const fee = calcRegistrationFee(100000);
    expect(fee).toBe(100 + 35 + Math.round(100000 * 0.0003));
  });
});

// ── calcAgencyFee ─────────────────────────────────────────────────────────────
describe('calcAgencyFee', () => {
  test('2억 미만 → 0.5% (최대 80만원)', () => {
    const { fee, rate } = calcAgencyFee(10000);
    expect(rate).toBe('0.5');
    expect(fee).toBeLessThanOrEqual(80);
  });
  test('5억 → 0.4%', () => {
    const { fee, rate } = calcAgencyFee(50000);
    expect(rate).toBe('0.4');
    expect(fee).toBe(200);
  });
  test('20억 → 0.7%', () => {
    const { rate } = calcAgencyFee(200000);
    expect(rate).toBe('0.7');
  });
});

// ── calcAcquisitionTax ────────────────────────────────────────────────────────
describe('calcAcquisitionTax', () => {
  test('6억 이하 무주택, 서울 → 취득세 1% + 지방교육세 0.1%', () => {
    const r = calcAcquisitionTax(60000, '11680', 0, 84, false);
    expect(r.taxRate).toBe(1);
    expect(r.acquisitionTax).toBe(600);
    expect(r.localEduTax).toBe(60);
    expect(r.specialTax).toBe(0); // 85㎡ 이하
    expect(r.total).toBe(660);
  });
  test('9억 초과, 1주택 기존 보유, 서울 → 8% 중과', () => {
    const r = calcAcquisitionTax(100000, '11680', 1, 84, false);
    expect(r.taxRate).toBe(8);
  });
  test('생애최초 12억 이하 → 최대 200만원 감면', () => {
    const without = calcAcquisitionTax(100000, '11680', 0, 84, false);
    const with1st = calcAcquisitionTax(100000, '11680', 0, 84, true);
    expect(with1st.acquisitionTax).toBe(without.acquisitionTax - 200);
  });
  test('전용 85㎡ 초과 + 1~3% 구간 → 농어촌특별세 부과', () => {
    const r = calcAcquisitionTax(70000, '11680', 0, 86, false);
    expect(r.specialTax).toBeGreaterThan(0);
  });
});

// ── calcTransferTax / calcTransferTaxOnGain ───────────────────────────────────
describe('calcTransferTax', () => {
  test('차익 없음 → tax=0', () => {
    const r = calcTransferTax(80000, 70000, 5, false, 1, false);
    expect(r.tax).toBe(0);
  });
  test('1주택 2년 이상, 12억 이하 → 비과세', () => {
    const r = calcTransferTax(50000, 80000, 3, false, 1, false);
    expect(r.tax).toBe(0);
    expect(r.detail).toMatch('비과세');
  });
  test('1주택 12억 초과분은 과세', () => {
    const r = calcTransferTax(80000, 150000, 5, false, 1, false);
    expect(r.tax).toBeGreaterThan(0);
  });
  test('2주택 조정지역 양도 → 중과세 적용', () => {
    const normal = calcTransferTax(50000, 80000, 5, false, 2, false);
    const adjusted = calcTransferTax(50000, 80000, 5, true, 2, false);
    expect(adjusted.tax).toBeGreaterThan(normal.tax);
  });
});

describe('calcTransferTaxOnGain', () => {
  test('1주택 10년 보유 → 장특공 80%', () => {
    const r = calcTransferTaxOnGain(30000, 10, 1, {});
    expect(r.longHoldDeduct).toBe(80);
  });
  test('1주택 5년 보유 → 장특공 40%', () => {
    const r = calcTransferTaxOnGain(30000, 5, 1, {});
    expect(r.longHoldDeduct).toBe(40);
  });
  test('보유 2년 미만 → 장특공 0%', () => {
    const r = calcTransferTaxOnGain(10000, 2, 1, {});
    expect(r.longHoldDeduct).toBe(0);
  });
});

// ── computeLoan ───────────────────────────────────────────────────────────────
describe('computeLoan', () => {
  const baseInp = {
    income: 10000, liquidAssets: 30000, creditLoan: 0,
    currentAptPrice: 0, currentMortgage: 0,
    creditRate: 0, creditTermMo: 60, minusLimit: 0, minusRate: 0, otherMonthly: 0,
    target: 90000, kbPrice: 90000, ltvPct: 70,
    rate: 4.5, term: 30,
    houseCount: 0, isFirstBuyer: false,
    lawdCd: '11680',
    rateType: 'hybrid', bangGongjeApply: true, gracePeriod: 0, excluArea: 84,
  };

  test('서울 9억 KB × 70% = 6.3억 → 6억 한도 적용, effectiveLoan=54500 (6억-방공제5500)', () => {
    const r = computeLoan(baseInp);
    // KB 9억 × 70% = 63000 > 60000(한도) → ltvLoan = 60000
    // effectiveLoan = 60000 - 5500(방공제) = 54500
    expect(r.ltvLoan).toBe(60000);
    expect(r.effectiveLoan).toBe(54500);
    expect(r.capInfo).not.toBeNull();
  });

  test('DSR 계산값이 0~100 범위 내', () => {
    const r = computeLoan(baseInp);
    expect(r.dsr).toBeGreaterThan(0);
    expect(r.dsr).toBeLessThan(100);
  });

  test('canBuy: 자금 충분 여부 계산', () => {
    const rich = computeLoan({ ...baseInp, liquidAssets: 100000 });
    expect(rich.canBuy).toBe(true);
    const poor = computeLoan({ ...baseInp, liquidAssets: 1000 });
    expect(poor.canBuy).toBe(false);
  });

  test('스트레스 금리 가산: hybrid → baseStress*0.8 (서울)', () => {
    const r = computeLoan(baseInp);
    expect(r.stressAdd).toBeCloseTo(3.0 * 0.8, 5);
  });

  test('거치기간 설정 시 mpAfterGrace > mp', () => {
    const r = computeLoan({ ...baseInp, gracePeriod: 3 });
    expect(r.mpAfterGrace).toBeGreaterThan(r.mp);
  });
});
