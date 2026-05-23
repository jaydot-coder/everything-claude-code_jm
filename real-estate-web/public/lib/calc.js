// ── 순수 계산 함수 모음 (브라우저 + Node.js 공용) ────────────────────────────
// app.js 에서도 이 파일을 <script> 로 먼저 로드하므로 전역 함수로 정의한다.
// Node.js(Jest) 환경에서는 파일 끝 module.exports 로 require() 가능.

// 서울 자치구 LAWD_CD
const SEOUL_CODES_CALC = new Set([
  '11110','11140','11170','11200','11215','11230','11260','11290','11305','11320',
  '11350','11380','11410','11440','11470','11500','11530','11545','11560','11590',
  '11620','11650','11680','11710','11740',
]);

// 경기 12곳 투기과열지구
const METRO_STRONG_CALC = new Set([
  '41290','41210','41135','41131','41133',
  '41117','41111','41115','41173','41465','41430','41450',
]);

// 지역 구분: 'seoul' | 'metro-strong' | 'metro' | 'other'
function getRegionType(lawdCd) {
  if (SEOUL_CODES_CALC.has(lawdCd)) return 'seoul';
  if (METRO_STRONG_CALC.has(lawdCd)) return 'metro-strong';
  const p = lawdCd.slice(0, 2);
  if (p === '11' || p === '41' || p === '28') return 'metro';
  return 'other';
}

// 지역 + 기준가격 → 대출 금액 상한 (투기과열지구 구간별)
function getLoanAmountCap(regionType, basePrice) {
  if (regionType === 'seoul' || regionType === 'metro-strong') {
    if (basePrice <= 150000) return { cap: 60000, label: '15억이하 → 6억 한도' };
    if (basePrice <= 250000) return { cap: 40000, label: '15~25억 → 4억 한도' };
    return { cap: 20000, label: '25억초과 → 2억 한도' };
  }
  if (regionType === 'metro') {
    return { cap: 60000, label: '수도권 → 6억 한도' };
  }
  return null;
}

// 지역별 방공제 금액 (만원)
function getBangGongje(regionType) {
  if (regionType === 'seoul') return 5500;
  if (regionType === 'metro-strong' || regionType === 'metro') return 4800;
  return 2800;
}

// DSR 40% 역산 최대 대출 원금 (만원)
function maxLoanFromDSR(income, creditInterest, rate, term) {
  if (income <= 0 || rate <= 0 || term <= 0) return null;
  const maxMonthly = income * 0.40 / 12 - creditInterest;
  if (maxMonthly <= 0) return 0;
  const r = rate / 100 / 12;
  const n = term * 12;
  return Math.floor(maxMonthly * (1 - Math.pow(1 + r, -n)) / r);
}

// 원리금균등상환 월납입액 (만원)
function monthlyPayment(principal, annualRate, termYears) {
  if (principal <= 0 || annualRate <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
}

// 등기비용 추정: 법무사+인지세+채권할인 (만원)
function calcRegistrationFee(price) {
  const lawyerFee    = price < 50000 ? 50 : price < 100000 ? 70 : 100;
  const stampTax     = price >= 100000 ? 35 : 15;
  const bondDiscount = Math.round(price * 0.0003);
  return lawyerFee + stampTax + bondDiscount;
}

// 중개보수 계산 (2024년 개정 요율)
function calcAgencyFee(price) {
  let rate;
  if      (price <   5000) rate = 0.006;
  else if (price <  20000) rate = 0.005;
  else if (price <  90000) rate = 0.004;
  else if (price < 120000) rate = 0.005;
  else if (price < 150000) rate = 0.006;
  else                     rate = 0.007;

  let fee = Math.round(price * rate);
  if (price <  5000) fee = Math.min(fee, 25);
  else if (price < 20000) fee = Math.min(fee, 80);

  return { fee, rate: (rate * 100).toFixed(1) };
}

// 취득세 계산
function calcAcquisitionTax(price, lawdCd, houseCount, excluAreaSqm, isFirstBuyer) {
  const region     = getRegionType(lawdCd);
  const isAdjusted = region === 'seoul' || region === 'metro-strong';
  const afterCount = houseCount + 1;

  let taxRate;
  if (afterCount === 1 || (afterCount === 2 && !isAdjusted)) {
    if      (price <= 60000) taxRate = 1;
    else if (price <= 90000) taxRate = 2;
    else                     taxRate = 3;
  } else if (afterCount === 2 && isAdjusted) {
    taxRate = 8;
  } else {
    taxRate = isAdjusted ? 12 : 8;
  }

  let acquisitionTax = Math.round(price * taxRate / 100);

  if (isFirstBuyer && afterCount === 1 && price <= 120000) {
    acquisitionTax = Math.max(0, acquisitionTax - 200);
  }

  const localEduTax = Math.round(acquisitionTax * 0.1);
  const specialTax  = (excluAreaSqm > 85 && taxRate <= 3)
    ? Math.round(acquisitionTax * 0.1) : 0;

  return { acquisitionTax, localEduTax, specialTax, total: acquisitionTax + localEduTax + specialTax, taxRate };
}

// 포맷 헬퍼 (Node.js 테스트에서도 사용)
function _fmtWan(wan) {
  if (!wan || isNaN(wan)) return '0만원';
  wan = Math.round(wan);
  if (wan >= 10000) {
    const eok = Math.floor(wan / 10000);
    const rem = wan % 10000;
    if (rem === 0) return `${eok.toLocaleString()}억원`;
    return `${eok.toLocaleString()}억 ${rem.toLocaleString()}만원`;
  }
  return `${wan.toLocaleString()}만원`;
}

// 양도소득세 핵심 계산
function calcTransferTaxOnGain(gain, holdYears, houseCount, opts) {
  opts = opts || {};
  let longHoldDeduct = 0;
  if (houseCount === 1 && holdYears >= 3) {
    longHoldDeduct = Math.min(holdYears * 8, 80) / 100;
  } else if (houseCount !== 1 && holdYears >= 3 && !opts.isAdjusted) {
    longHoldDeduct = Math.min(holdYears * 2, 30) / 100;
  }
  const taxableGain = Math.round(gain * (1 - longHoldDeduct));
  const afterDeduct = Math.max(0, taxableGain - 250);

  const brackets = [
    { limit: 1400,     rate: 0.06, prev: 0 },
    { limit: 5000,     rate: 0.15, prev: 126 },
    { limit: 8800,     rate: 0.24, prev: 576 },
    { limit: 15000,    rate: 0.35, prev: 1536 },
    { limit: 30000,    rate: 0.38, prev: 3706 },
    { limit: 50000,    rate: 0.40, prev: 9406 },
    { limit: 100000,   rate: 0.42, prev: 17406 },
    { limit: Infinity, rate: 0.45, prev: 38406 },
  ];

  let incomeTax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i];
    if (afterDeduct <= b.limit) {
      const prevLimit = i > 0 ? brackets[i - 1].limit : 0;
      incomeTax = (afterDeduct - prevLimit) * b.rate + b.prev;
      break;
    }
  }

  let surcharge = 0;
  if (opts.isAdjusted && houseCount === 2) surcharge = afterDeduct * 0.20;
  else if (opts.isAdjusted && houseCount >= 3) surcharge = afterDeduct * 0.30;

  const localTax = (incomeTax + surcharge) * 0.1;
  const total = Math.round(incomeTax + surcharge + localTax);

  return {
    tax: total,
    rate: afterDeduct > 0 ? (total / afterDeduct * 100).toFixed(1) : 0,
    gain: taxableGain,
    longHoldDeduct: Math.round(longHoldDeduct * 100),
    detail: `양도차익 ${_fmtWan(taxableGain)} · 장특공 ${Math.round(longHoldDeduct * 100)}%`,
  };
}

// 양도소득세 전체 계산 (비과세 요건 판단 포함)
function calcTransferTax(acqPrice, sellPrice, holdYears, isAdjusted, houseCount, isLongHoldExempt) {
  const gain = sellPrice - acqPrice;
  if (gain <= 0) return { tax: 0, detail: '양도차익 없음' };

  if (houseCount === 1 && holdYears >= 2) {
    if (sellPrice <= 120000) return { tax: 0, rate: 0, detail: '1주택 비과세 (12억 이하)' };
    const taxableGain = gain * (sellPrice - 120000) / sellPrice;
    return calcTransferTaxOnGain(taxableGain, holdYears, houseCount, { partial: true });
  }

  return calcTransferTaxOnGain(gain, holdYears, houseCount, { isAdjusted });
}

// 대출 가능액 종합 계산 (순수함수)
function computeLoan(inp) {
  const {
    income, liquidAssets, creditLoan, currentAptPrice, currentMortgage,
    creditRate, creditTermMo, minusLimit, minusRate, otherMonthly,
    target, kbPrice, ltvPct, rate, term, houseCount, isFirstBuyer,
    lawdCd, rateType, bangGongjeApply, gracePeriod, excluArea,
  } = inp;

  const creditDsrTerm      = Math.max(creditTermMo || 60, 60);
  const creditMonthly      = (creditLoan > 0 && creditRate > 0)
    ? monthlyPayment(creditLoan, creditRate, creditDsrTerm / 12) : 0;
  const creditInterestOnly = creditLoan * creditRate / 100 / 12;
  const minusMonthly       = (minusLimit || 0) * (minusRate || 0) / 100 / 12;
  const existingMonthly    = creditMonthly + minusMonthly + (otherMonthly || 0);
  const existingInterest   = creditInterestOnly + minusMonthly;

  const regionType  = getRegionType(lawdCd || '00000');
  const basePrice   = kbPrice > 0 ? kbPrice : target;
  const rawLtvLoan  = Math.floor(basePrice * ltvPct / 100);
  let ltvLoan = rawLtvLoan;
  let capInfo = null;
  if (houseCount < 2) {
    const capResult = getLoanAmountCap(regionType, basePrice);
    if (capResult && rawLtvLoan > capResult.cap) { ltvLoan = capResult.cap; capInfo = capResult; }
  }

  const bangGongjeAmt = bangGongjeApply ? getBangGongje(regionType) : 0;
  const loanAfterBG   = Math.max(0, ltvLoan - bangGongjeAmt);
  const dsrMaxLoan    = income > 0 && rate > 0
    ? maxLoanFromDSR(income, existingMonthly, rate, term) : null;
  let effectiveLoan   = loanAfterBG;
  let dsrCapApplied   = false;
  if (dsrMaxLoan !== null && dsrMaxLoan < loanAfterBG) {
    effectiveLoan = Math.max(0, dsrMaxLoan);
    dsrCapApplied = true;
  }

  const remainCash    = (liquidAssets || 0) + (currentAptPrice || 0) - (currentMortgage || 0);
  const totalFunds    = remainCash + effectiveLoan;
  const taxInfo       = calcAcquisitionTax(target, lawdCd || '00000', houseCount, excluArea || 85, isFirstBuyer);
  const buyFee        = calcAgencyFee(target);
  const sellFee       = currentAptPrice > 0 ? calcAgencyFee(currentAptPrice) : { fee: 0, rate: '0' };
  const regFee        = calcRegistrationFee(target);
  const totalAcqCost  = taxInfo.total + buyFee.fee + sellFee.fee + regFee;
  const requiredFunds = target + totalAcqCost;
  const surplus       = totalFunds - requiredFunds;
  const canBuy        = surplus >= 0;

  const mp             = monthlyPayment(effectiveLoan, rate, term);
  const graceInterest  = effectiveLoan * rate / 100 / 12;
  const graceRemTerm   = term - (gracePeriod || 0);
  const mpAfterGrace   = gracePeriod > 0 && graceRemTerm > 0
    ? monthlyPayment(effectiveLoan, rate, graceRemTerm) : mp;
  const mpForDsr       = gracePeriod > 0 ? mpAfterGrace : mp;
  const dsr            = income > 0 ? (mpForDsr + existingMonthly) * 12 / income * 100 : 0;
  const dti            = income > 0 ? (mpForDsr + existingInterest) * 12 / income * 100 : 0;

  const baseStress    = (regionType !== 'other') ? 3.0 : 0.75;
  const stressFactor  = rateType === 'variable' ? 1.0 : rateType === 'hybrid' ? 0.8 : rateType === 'periodic' ? 0.4 : 0.0;
  const stressAdd     = +(baseStress * stressFactor).toFixed(2);
  const mpStress      = monthlyPayment(effectiveLoan, rate + stressAdd, term);
  const dsrStress     = income > 0 ? (mpStress + existingMonthly) * 12 / income * 100 : 0;
  const totalInterest  = mp * term * 12 - effectiveLoan;
  const annualInterest = term > 0 ? totalInterest / term : 0;

  return {
    income, currentAptPrice, target, kbPrice, ltvPct, rate, term, houseCount, isFirstBuyer,
    bangGongjeApply, rateType, gracePeriod, excluArea,
    creditDsrTerm, creditMonthly, creditInterestOnly,
    minusMonthly, otherMonthly, existingMonthly, existingInterest,
    remainCash, regionType, rawLtvLoan, ltvLoan, capInfo,
    bangGongjeAmt, loanAfterBG, dsrMaxLoan, effectiveLoan, dsrCapApplied,
    totalFunds, taxInfo, buyFee, sellFee, regFee, totalAcqCost,
    requiredFunds, surplus, canBuy,
    mp, graceInterest, mpAfterGrace, graceRemTerm, mpForDsr,
    dsr, dti, stressAdd, mpStress, dsrStress,
    totalInterest, annualInterest,
  };
}

// Node.js (Jest) 환경에서 require() 지원
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getRegionType, getLoanAmountCap, getBangGongje,
    maxLoanFromDSR, monthlyPayment,
    calcRegistrationFee, calcAgencyFee, calcAcquisitionTax,
    calcTransferTaxOnGain, calcTransferTax,
    computeLoan,
  };
}
