// ── 지역 코드 (법정동코드 앞 5자리) ──────────────────────────────────────────
const DISTRICTS = {
  '서울': {
    '강남구':'11680','강동구':'11740','강북구':'11305','강서구':'11500',
    '관악구':'11620','광진구':'11215','구로구':'11530','금천구':'11545',
    '노원구':'11350','도봉구':'11320','동대문구':'11230','동작구':'11590',
    '마포구':'11440','서대문구':'11410','서초구':'11650','성동구':'11200',
    '성북구':'11290','송파구':'11710','양천구':'11470','영등포구':'11560',
    '용산구':'11170','은평구':'11380','종로구':'11110','중구':'11140','중랑구':'11260',
  },
  '경기': {
    '고양시 덕양구':'41281','고양시 일산동구':'41285','고양시 일산서구':'41287',
    '과천시':'41290','광명시':'41210','광주시':'41610','구리시':'41310',
    '군포시':'41410','김포시':'41570','남양주시':'41360','부천시':'41190',
    '성남시 분당구':'41135','성남시 수정구':'41131','성남시 중원구':'41133',
    '수원시 권선구':'41113','수원시 영통구':'41117','수원시 장안구':'41111','수원시 팔달구':'41115',
    '시흥시':'41390','안산시 단원구':'41273','안산시 상록구':'41271',
    '안성시':'41550','안양시 동안구':'41173','안양시 만안구':'41171',
    '양주시':'41630','오산시':'41370','용인시 기흥구':'41463','용인시 수지구':'41465','용인시 처인구':'41461',
    '의왕시':'41430','의정부시':'41150','이천시':'41500','파주시':'41480',
    '평택시':'41220','포천시':'41650','하남시':'41450',
    '화성시 (동탄2신도시)':'41597','화성시 (병점/동탄1)':'41595',
    '화성시 (봉담/향남)':'41593','화성시 (송산/남양)':'41591',
    '부천시 (원미)':'41192','부천시 (소사)':'41194','부천시 (오정)':'41196',
  },
  '인천': {
    '강화군':'28710','계양구':'28245','남동구':'28200','동구':'28140',
    '미추홀구':'28177','부평구':'28237','서구':'28260','연수구':'28185','중구':'28110',
  },
  '부산': {
    '강서구':'26440','금정구':'26410','기장군':'26710','남구':'26290','동구':'26170',
    '동래구':'26260','부산진구':'26230','북구':'26320','사상구':'26530','사하구':'26380',
    '서구':'26140','수영구':'26500','연제구':'26470','영도구':'26200','중구':'26110','해운대구':'26350',
  },
  '대구': {
    '달서구':'27290','달성군':'27710','동구':'27140','북구':'27230',
    '서구':'27170','수성구':'27260','중구':'27110','남구':'27200',
  },
  '대전': { '대덕구':'30230','동구':'30110','서구':'30170','유성구':'30200','중구':'30140' },
  '광주': { '광산구':'29200','남구':'29155','동구':'29110','북구':'29170','서구':'29140' },
  '울산': { '남구':'31140','동구':'31170','북구':'31200','울주군':'31710','중구':'31110' },
  '세종': { '세종시':'36110' },
  '강원': { '강릉시':'42150','속초시':'42210','원주시':'42130','춘천시':'42110' },
  '충북': {
    '청주시 상당구':'43111','청주시 서원구':'43112','청주시 흥덕구':'43113','청주시 청원구':'43114','충주시':'43130',
  },
  '충남': { '아산시':'44200','천안시 동남구':'44131','천안시 서북구':'44133' },
  '전북': { '전주시 덕진구':'45113','전주시 완산구':'45111','익산시':'45140' },
  '전남': { '목포시':'46110','순천시':'46150','여수시':'46130' },
  '경북': { '경주시':'47130','구미시':'47190','포항시 남구':'47111','포항시 북구':'47113' },
  '경남': { '거제시':'48310','김해시':'48250','창원시 성산구':'48125','진주시':'48170' },
};

// ── LTV 정책 (2026.04.25 확인 기준) ─────────────────────────────────────────
// 출처: 금융위원회(fsc.go.kr), 국토교통부(molit.go.kr) 공식 보도자료
// ※ 정책 변경 시 아래 Set과 함수만 업데이트

// 서울 전역 자치구 LAWD_CD (2025.10.16 전역 투기과열지구 지정)
const SEOUL_CODES = new Set([
  '11110','11140','11170','11200','11215','11230','11260','11290','11305','11320',
  '11350','11380','11410','11440','11470','11500','11530','11545','11560','11590',
  '11620','11650','11680','11710','11740',
]);

// 경기 12곳 투기과열지구 (2025.10.16 추가 지정)
const METRO_STRONG_ZONE = new Set([
  '41290', // 과천시
  '41210', // 광명시
  '41135', // 성남시 분당구
  '41131', // 성남시 수정구
  '41133', // 성남시 중원구
  '41117', // 수원시 영통구
  '41111', // 수원시 장안구
  '41115', // 수원시 팔달구
  '41173', // 안양시 동안구
  '41465', // 용인시 수지구
  '41430', // 의왕시
  '41450', // 하남시
]);

// 토지거래허가구역 = 서울 전역 + 경기 12곳 (2025.10.20 ~ 2026.12.31 한시 지정)
// ※ SEOUL_CODES ∪ METRO_STRONG_ZONE 과 동일 → 별도 Set 불필요, isStrong 으로 판단

// 지역 구분: 'seoul' | 'metro-strong' | 'metro' | 'other'
function getRegionType(lawdCd) {
  if (SEOUL_CODES.has(lawdCd)) return 'seoul';
  if (METRO_STRONG_ZONE.has(lawdCd)) return 'metro-strong';
  const p = lawdCd.slice(0, 2);
  if (p === '11' || p === '41' || p === '28') return 'metro';
  return 'other';
}

// 지역 + KB(호가) 기준 가격 → 대출 금액 한도. null = 한도 없음.
function getLoanAmountCap(regionType, basePrice) {
  if (regionType === 'seoul' || regionType === 'metro-strong') {
    // 2025.10.16: 투기과열지구 가격 구간별 상한
    if (basePrice <= 150000) return { cap: 60000, label: '15억이하 → 6억 한도' };
    if (basePrice <= 250000) return { cap: 40000, label: '15~25억 → 4억 한도' };
    return { cap: 20000, label: '25억초과 → 2억 한도' };
  }
  if (regionType === 'metro') {
    // 2025.06.28: 기타 수도권(인천·경기 나머지) 일괄 6억 한도
    return { cap: 60000, label: '수도권 → 6억 한도' };
  }
  return null; // 비수도권: 금액 한도 없음
}

// LAWD_CD + 주택보유수 + 생애최초 → { ltv, badges, warning, regionType }
function getLtvPolicy(lawdCd, houseCount, isFirstBuyer) {
  const regionType  = getRegionType(lawdCd);
  const isStrong    = regionType === 'seoul' || regionType === 'metro-strong';
  const isMetroReg  = regionType === 'metro';
  const badges = [];
  let ltv = 0;
  let warning = '';

  if (houseCount >= 2) {
    ltv = 0;
    badges.push({ text: '대출 불가 (2주택↑)', color: 'red' });
    warning = '2주택 이상은 주담대 원칙적으로 불가합니다.';

  } else if (houseCount === 1) {
    if (isStrong) {
      ltv = 40;
      badges.push({ text: '1주택 처분조건부 LTV 40%', color: 'orange' });
      badges.push({ text: '투기과열·토지거래허가구역', color: 'red' });
      badges.push({ text: '15억이하 6억 / 15~25억 4억 / 25억↑ 2억', color: 'blue' });
    } else {
      ltv = 60;
      badges.push({ text: '1주택 처분조건부 LTV 60%', color: 'orange' });
      if (isMetroReg) badges.push({ text: '수도권 6억 한도', color: 'blue' });
    }
    warning = '기존 주택 처분 조건 확인 필요';

  } else {
    // 무주택
    if (isFirstBuyer) {
      // 생애최초 특례: 규제지역(투기과열)에서도 LTV 70% 유지 (2025.10.15 확정)
      if (isStrong) {
        ltv = 70;
        badges.push({ text: '생애최초 특례 LTV 70%', color: 'green' });
        badges.push({ text: '투기과열·토지거래허가구역', color: 'red' });
        badges.push({ text: '15억이하 6억 / 15~25억 4억 / 25억↑ 2억', color: 'blue' });
        warning = '생애최초 특례: 규제지역 일반(40%) 대비 완화 적용\n6개월 내 전입·실거주 의무 확인 필수';
      } else if (isMetroReg) {
        ltv = 70;
        badges.push({ text: '생애최초 LTV 70%', color: 'green' });
        badges.push({ text: '수도권 6억 한도', color: 'blue' });
      } else {
        ltv = 80;
        badges.push({ text: '생애최초 LTV 80%', color: 'green' });
      }
    } else {
      // 일반 무주택
      if (isStrong) {
        ltv = 40;
        badges.push({ text: '무주택 LTV 40%', color: 'green' });
        badges.push({ text: '투기과열·토지거래허가구역', color: 'red' });
        badges.push({ text: '15억이하 6억 / 15~25억 4억 / 25억↑ 2억', color: 'blue' });
      } else if (isMetroReg) {
        ltv = 70;
        badges.push({ text: '무주택 LTV 70%', color: 'green' });
        badges.push({ text: '수도권 6억 한도', color: 'blue' });
      } else {
        ltv = 70;
        badges.push({ text: '무주택 LTV 70%', color: 'green' });
      }
    }
  }

  // 토지거래허가구역 경고: 서울 전역 + 경기 12곳 (2025.10.20~2026.12.31)
  if (isStrong && houseCount < 2) {
    warning = (warning ? warning + '\n' : '') +
      '⚠️ 토지거래허가구역(~2026.12.31): 구청 허가 필수, 실거주 의무, 갭투자 불가';
  }

  return { ltv, badges, warning, regionType };
}

const BADGE_COLORS = {
  green:  { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  blue:   { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  orange: { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' },
  red:    { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
};

function renderLtvBadges({ badges, warning }) {
  const el = document.getElementById('ltvPolicyArea');
  if (!el) return;
  const badgeHtml = badges.map(b => {
    const c = BADGE_COLORS[b.color] || BADGE_COLORS.blue;
    return `<span style="display:inline-block;background:${c.bg};color:${c.text};border:1px solid ${c.border};border-radius:4px;padding:2px 7px;font-size:10px;font-weight:700;margin-right:3px;margin-bottom:3px;">${b.text}</span>`;
  }).join('');
  const warnHtml = warning
    ? `<div style="margin-top:4px;padding:5px 8px;background:#fefce8;border:1px solid #fde047;border-radius:5px;font-size:10px;color:#854d0e;line-height:1.6;white-space:pre-line;">${esc(warning)}</div>`
    : '';
  el.innerHTML = badgeHtml + warnHtml;
}

function applyLtvPolicy() {
  const lawdCd     = document.getElementById('gugunSel').value;
  const houseCount = +document.getElementById('houseCount').value || 0;
  const firstBuyerEl = document.getElementById('firstBuyer');
  // 생애최초는 무주택일 때만 유효
  if (firstBuyerEl) {
    firstBuyerEl.disabled = houseCount > 0;
    if (houseCount > 0) firstBuyerEl.checked = false;
  }
  const isFirstBuyer = firstBuyerEl?.checked && houseCount === 0;
  const policy = getLtvPolicy(lawdCd, houseCount, isFirstBuyer);
  document.getElementById('ltvPct').value = policy.ltv;
  renderLtvBadges(policy);
  return policy;
}

// 신용대출 상환방식에 따른 월부담 자동 계산 및 표시
function updateCreditDisplay() {
  const loan    = +document.getElementById('creditLoan').value  || 0;
  const rate    = +document.getElementById('creditRate').value  || 0;
  const type    = document.getElementById('creditRepayType')?.value || 'interest';
  const termMo  = +document.getElementById('creditTerm')?.value || 60;
  const el = document.getElementById('creditInterestDisplay');
  if (!el) return;
  if (!(loan > 0 && rate > 0)) { el.textContent = '이율 입력 시 자동 계산'; return; }

  // 실제 납부액
  const actualMonthly = type === 'amortize'
    ? monthlyPayment(loan, rate, termMo / 12)
    : loan * rate / 100 / 12;
  // DSR 산정액 (항상 원금균등, 최소 5년)
  const dsrTerm    = Math.max(termMo, 60);
  const dsrMonthly = monthlyPayment(loan, rate, dsrTerm / 12);

  const actualLabel = type === 'amortize' ? '실납부' : '실납부(이자만)';
  const dsrLabel    = dsrTerm !== termMo ? `DSR:${dsrTerm}개월균등` : 'DSR:원금균등';
  el.innerHTML = `<span>${actualLabel} ≈ ${actualMonthly.toFixed(1)}만원</span>`
    + (dsrMonthly !== actualMonthly
        ? ` <span style="color:#7c3aed;"> | ${dsrLabel} ≈ ${dsrMonthly.toFixed(1)}만원</span>`
        : '');
}

// 마이너스통장 월이자 자동 표시
function updateMinusDisplay() {
  const limit   = +document.getElementById('minusLimit')?.value || 0;
  const rate    = +document.getElementById('minusRate')?.value  || 0;
  const monthly = (limit > 0 && rate > 0) ? limit * rate / 100 / 12 : 0;
  const el = document.getElementById('minusInterestDisplay');
  if (!el) return;
  el.textContent = monthly > 0 ? `월이자 ≈ ${monthly.toFixed(1)}만원` : '이율 입력 시 자동 계산';
}

// 신용대출 분할상환 선택 시 잔여만기 필드 표시
function onCreditTypeChange() {
  const type = document.getElementById('creditRepayType')?.value;
  const wrap = document.getElementById('creditTermWrap');
  if (wrap) wrap.style.display = type === 'amortize' ? '' : 'none';
  updateCreditDisplay();
}

// ── 토큰 검색 헬퍼 ────────────────────────────────────────────────────────────
function tokenMatchScore(aptName, query) {
  const name = aptName.toLowerCase();
  const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  if (!tokens.length) return 1;
  const matched = tokens.filter(t => name.includes(t)).length;
  return matched / tokens.length;
}

function nameMatches(aptName, query) {
  return tokenMatchScore(aptName, query) > 0;
}

// ── 상태 ──────────────────────────────────────────────────────────────────────
let allTrades     = [];
let allRents      = [];     // 기간 검색 시 수집된 순전세 거래 목록
let filteredTrades = [];
let selectedArea  = null;   // null = 전체, number = Math.round(㎡)
let selectedDong  = null;   // null = 전체, string = 법정동명
let sortKey       = 'date'; // 정렬 기준 컬럼
let sortDir       = -1;     // 1 = 오름차순, -1 = 내림차순
let _chart        = null;   // Chart.js 인스턴스
let _rentData     = null;   // { rents:[], map:{} }
let _bldgCache    = {};     // key:"sggCd|bun|ji" → areaMap
let _supplyFetchAbort = null; // fetchAllSupplyAreas 취소 신호
let selectedTradeArea       = null; // 선택된 거래 전용면적(㎡)
let selectedTradeSupplyArea = null; // 건축물대장 실제 공급면적(㎡)

// ── 초기화 ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildSido();
  setDefaultMonth();
  applyLtvPolicy();
  updateCreditDisplay();
  updateMinusDisplay();
  calcAll();
});

function buildSido() {
  const sel = document.getElementById('sidoSel');
  Object.keys(DISTRICTS).forEach(s => sel.appendChild(new Option(s, s)));
  buildGugun();
}

function onSidoChange() { buildGugun(); }

function buildGugun() {
  const sido = document.getElementById('sidoSel').value;
  const sel = document.getElementById('gugunSel');
  sel.innerHTML = '';
  Object.entries(DISTRICTS[sido] || {})
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([name, code]) => sel.appendChild(new Option(name, code)));
  applyLtvPolicy();
}

function onGugunChange()     { applyLtvPolicy(); calcAll(); }
function onHouseCountChange(){ applyLtvPolicy(); calcAll(); }
function onFirstBuyerChange(){ applyLtvPolicy(); calcAll(); }

function setDefaultMonth() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  document.getElementById('dealMonth').value = `${y}-${m}`;
}

// ── API 조회 ──────────────────────────────────────────────────────────────────

// 시작월~종료월 배열 생성 (예: '2025-10' ~ '2026-04')
function monthsBetween(start, end) {
  const months = [];
  let [y, m] = start.split('-').map(Number);
  const [ey, em] = end.split('-').map(Number);
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    if (++m > 12) { m = 1; y++; }
  }
  return months;
}

// 기간 조회 토글
function toggleRangeMode() {
  const isRange = document.getElementById('rangeMode').checked;
  document.getElementById('singleMonthWrap').style.display = isRange ? 'none' : 'block';
  document.getElementById('rangeMonthWrap').style.display  = isRange ? 'flex'  : 'none';

  if (isRange) {
    const now = new Date();
    const end   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prev  = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const start = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    const s = document.getElementById('startMonth');
    const e = document.getElementById('endMonth');
    if (!s.value) s.value = start;
    if (!e.value) e.value = end;
  }
}

async function doSearch() {
  const lawdCd  = document.getElementById('gugunSel').value;
  const isRange = document.getElementById('rangeMode').checked;
  let months = [];

  if (isRange) {
    const start = document.getElementById('startMonth').value;
    const end   = document.getElementById('endMonth').value;
    if (!lawdCd || !start || !end) { alert('지역과 조회 기간을 선택해주세요.'); return; }
    if (start > end) { alert('시작월이 종료월보다 늦습니다.'); return; }
    months = monthsBetween(start, end);
  } else {
    const rawMonth = document.getElementById('dealMonth').value;
    if (!lawdCd || !rawMonth) { alert('지역과 거래 월을 선택해주세요.'); return; }
    months = [rawMonth];
  }

  document.getElementById('tableArea').innerHTML =
    `<div class="loading"><div class="spin"></div>데이터 조회 중…</div>`;
  document.getElementById('statsRow').innerHTML = '';

  try {
    let merged = [];
    let mergedRents = [];

    // 월별 API를 4개씩 병렬 요청 (공공API 부하 고려)
    const CONCURRENT = 4;
    for (let i = 0; i < months.length; i += CONCURRENT) {
      const batch = months.slice(i, i + CONCURRENT);
      if (months.length > 1) {
        document.getElementById('tableArea').innerHTML =
          `<div class="loading"><div class="spin"></div>${Math.min(i + CONCURRENT, months.length)} / ${months.length}개월 조회 중…</div>`;
      }
      const results = await Promise.all(batch.map(async m => {
        const dealYmd = m.replace('-', '');
        const [tradeRes, rentJson] = await Promise.all([
          fetch(`/api/apt-trade?lawd_cd=${lawdCd}&deal_ymd=${dealYmd}`),
          fetch(`/api/apt-rent?lawd_cd=${lawdCd}&deal_ymd=${dealYmd}`)
            .then(r => r.ok ? r.json() : null).catch(() => null),
        ]);
        const tradeData = await tradeRes.json();
        if (!tradeRes.ok) throw new Error(tradeData.error || '조회 실패');
        return { trades: tradeData.trades || [], rents: rentJson?.rents || [] };
      }));
      results.forEach(r => {
        merged = merged.concat(r.trades);
        mergedRents = mergedRents.concat(r.rents);
      });
    }

    allTrades    = merged;
    allRents     = mergedRents;
    selectedArea = null;
    selectedDong = null;
    _rentData    = null;
    document.getElementById('rentArea').innerHTML = '';
    applyFilter();

    const gugunName = document.getElementById('gugunSel').selectedOptions[0]?.text || '';
    const sido      = document.getElementById('sidoSel').value;
    const periodLabel = months.length > 1
      ? `${months[0].replace('-', '년 ')}월 ~ ${months[months.length - 1].replace('-', '년 ')}월`
      : `${months[0].replace('-', '년 ')}월`;
    document.getElementById('updateBadge').textContent =
      `${sido} ${gugunName} ${periodLabel} · ${new Date().toLocaleTimeString('ko-KR')} 업데이트`;

  } catch (e) {
    document.getElementById('tableArea').innerHTML = `<div class="error">⚠️ ${e.message}</div>`;
  }
}

function applyFilter() {
  const q = document.getElementById('aptFilter').value.trim().toLowerCase();

  // 1) 아파트명 필터 (토큰 기반: 순서 무관, 부분 매칭)
  const nameFiltered = q
    ? allTrades
        .filter(t => nameMatches(t.aptName, q))
        .sort((a, b) => tokenMatchScore(b.aptName, q) - tokenMatchScore(a.aptName, q))
    : [...allTrades];

  // 2) 동 칩 렌더 (동 필터 전 기준)
  renderDongChips(nameFiltered);

  // 3) 동 필터
  const dongFiltered = selectedDong
    ? nameFiltered.filter(t => t.dong === selectedDong)
    : [...nameFiltered];

  // 4) 면적 칩 렌더 (동 필터 후 기준)
  renderAreaChips(dongFiltered);

  // 5) 면적 필터
  filteredTrades = selectedArea !== null
    ? dongFiltered.filter(t => Math.round(t.area) === selectedArea)
    : [...dongFiltered];

  // 6) 정렬
  filteredTrades.sort((a, b) => {
    if (sortKey === 'aptName') return sortDir * a.aptName.localeCompare(b.aptName, 'ko');
    let va, vb;
    switch (sortKey) {
      case 'pricePerPyeong': {
        const sa = getSupM2(a), sb = getSupM2(b);
        va = sa != null ? a.dealAmount / (sa / 3.3058) : 0;
        vb = sb != null ? b.dealAmount / (sb / 3.3058) : 0; break;
      }
      case 'date':
        va = +`${a.year}${a.month}${a.day}`;
        vb = +`${b.year}${b.month}${b.day}`; break;
      default:
        va = +a[sortKey] || 0;
        vb = +b[sortKey] || 0;
    }
    return sortDir * (va - vb);
  });

  renderStats();
  renderChart(filteredTrades);
  if (_rentData) renderRentSummary();

  // 이전 조회 취소 후 새 조회 시작
  if (_supplyFetchAbort) _supplyFetchAbort.cancelled = true;
  const abort = { cancelled: false };
  _supplyFetchAbort = abort;

  // 조회 중 로딩 표시
  document.getElementById('tableArea').innerHTML =
    `<div class="loading"><div class="spin"></div>공급면적 조회 중…</div>`;

  fetchAllSupplyAreas(filteredTrades, abort).then(() => {
    if (abort.cancelled) return;
    // 칩·테이블 한 번에 렌더링
    const q  = document.getElementById('aptFilter').value.trim().toLowerCase();
    const nf = q ? allTrades.filter(t => nameMatches(t.aptName, q)) : [...allTrades];
    const df = selectedDong ? nf.filter(t => t.dong === selectedDong) : [...nf];
    renderAreaChips(df);
    renderTable();
  }).catch(() => {
    if (!abort.cancelled) renderTable();
  });
}

function renderAreaChips(nameFiltered) {
  const el = document.getElementById('areaChipsRow');
  if (!el) return;

  const counts = {};
  const excluByArea = {};
  nameFiltered.forEach(t => {
    const k = Math.round(t.area);
    counts[k] = (counts[k] || 0) + 1;
    if (!excluByArea[k]) excluByArea[k] = { sum: 0, cnt: 0 };
    excluByArea[k].sum += t.area;
    excluByArea[k].cnt++;
  });
  const areas = Object.keys(counts).map(Number).sort((a, b) => a - b);

  // 면적 종류가 1개 이하면 칩 불필요
  if (areas.length <= 1) {
    el.innerHTML = '';
    if (selectedArea !== null && !counts[selectedArea]) selectedArea = null;
    return;
  }

  // 선택된 면적이 현재 결과에 없으면 초기화
  if (selectedArea !== null && !counts[selectedArea]) selectedArea = null;

  const total = nameFiltered.length;
  // 전용면적 그룹별 실제 공급면적 평균
  const supplyByArea = {};
  nameFiltered.forEach(t => {
    const k = Math.round(t.area);
    const s = getSupM2(t);
    if (s == null) return;
    if (!supplyByArea[k]) supplyByArea[k] = { sum: 0, cnt: 0 };
    supplyByArea[k].sum += s;
    supplyByArea[k].cnt++;
  });

  const chips = [
    { area: null, label: `전체 ${total.toLocaleString()}건` },
    ...areas.map(a => {
      const entry = supplyByArea[a];
      const avgSupM2 = entry ? entry.sum / entry.cnt : null;
      const excluEntry = excluByArea[a];
      const avgExcluM2 = excluEntry ? excluEntry.sum / excluEntry.cnt : a;
      const supLabel = avgSupM2 != null
        ? `${(avgSupM2 / 3.3058).toFixed(1)}평/${avgSupM2.toFixed(1)}㎡ (전용 ${(+pyeong(avgExcluM2)).toFixed(1)}평/${avgExcluM2.toFixed(1)}㎡)`
        : `전용 ${(+pyeong(avgExcluM2)).toFixed(1)}평/${avgExcluM2.toFixed(1)}㎡`;
      return { area: a, label: `${supLabel} · ${counts[a]}건` };
    }),
  ];

  el.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px;">${
    chips.map(c => {
      const on = c.area === selectedArea;
      return `<button onclick="selectArea(${c.area})"
        style="padding:4px 11px;border:1.5px solid ${on ? '#2563eb' : '#e2e8f0'};
               border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;
               background:${on ? '#2563eb' : '#f8fafc'};
               color:${on ? '#fff' : '#374151'};white-space:nowrap;"
      >${c.label}</button>`;
    }).join('')
  }</div>`;
}

function selectArea(area) {
  selectedArea = area;
  applyFilter();
}

// ── 동 필터 칩 ────────────────────────────────────────────────────────────────
function renderDongChips(trades) {
  const el = document.getElementById('dongChipsRow');
  if (!el) return;

  const counts = {};
  trades.forEach(t => { if (t.dong) counts[t.dong] = (counts[t.dong] || 0) + 1; });
  const dongs = Object.keys(counts).sort((a, b) => a.localeCompare(b, 'ko'));

  if (dongs.length === 0) {
    el.innerHTML = '';
    return;
  }
  if (selectedDong && !counts[selectedDong]) selectedDong = null;

  if (selectedDong && !counts[selectedDong]) selectedDong = null;

  const chips = [
    { dong: null, label: `전체 ${trades.length.toLocaleString()}건` },
    ...dongs.map(d => ({ dong: d, label: `${d} (${counts[d]})` })),
  ];

  el.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px;">${
    chips.map(c => {
      const on = c.dong === selectedDong;
      const arg = c.dong === null ? 'null' : `'${esc(c.dong)}'`;
      return `<button onclick="selectDong(${arg})"
        style="padding:4px 11px;border:1.5px solid ${on ? '#7c3aed' : '#e2e8f0'};
               border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;
               background:${on ? '#7c3aed' : '#f8fafc'};
               color:${on ? '#fff' : '#374151'};white-space:nowrap;"
      >${c.label}</button>`;
    }).join('')
  }</div>`;
}

function selectDong(dong) {
  selectedDong = dong;
  applyFilter();
}

// ── 컬럼 정렬 ─────────────────────────────────────────────────────────────────
function setSort(key) {
  if (sortKey === key) {
    sortDir = -sortDir;
  } else {
    sortKey = key;
    sortDir = -1;
  }
  applyFilter();
}

function th(label, key) {
  const on = sortKey === key;
  const arrow = on ? (sortDir === 1 ? ' ▲' : ' ▼') : '';
  return `<th onclick="setSort('${key}')" style="cursor:pointer;user-select:none;${on ? 'color:#2563eb;' : ''}">${label}${arrow}</th>`;
}

// ── 가격 추이 차트 ────────────────────────────────────────────────────────────
function renderChart(trades) {
  const el     = document.getElementById('chartArea');
  const canvas = document.getElementById('trendCanvas');
  if (!el || !canvas) return;

  if (!trades.length) {
    el.style.display = 'none';
    if (_chart) { _chart.destroy(); _chart = null; }
    return;
  }

  // 월별 평균가 집계
  const monthly = {};
  trades.forEach(t => {
    const key = `${t.year}-${t.month}`;
    if (!monthly[key]) monthly[key] = { sum: 0, cnt: 0 };
    monthly[key].sum += t.dealAmount;
    monthly[key].cnt += 1;
  });

  const labels = Object.keys(monthly).sort();
  if (labels.length < 2) {
    el.style.display = 'none';
    if (_chart) { _chart.destroy(); _chart = null; }
    return;
  }

  const tradeData = labels.map(k => Math.round(monthly[k].sum / monthly[k].cnt));
  el.style.display = 'block';

  // 월별 전세가율 계산 (filteredTrades 기준 단지/면적 키와 매칭되는 allRents만 사용)
  const tradeKeys = new Set(trades.map(t => `${t.aptName}__${Math.round(t.area)}`));
  const rentMonthly = {};
  allRents.forEach(r => {
    if (!tradeKeys.has(`${r.aptName}__${Math.round(r.area)}`)) return;
    const ym = `${r.dealYear}-${r.dealMonth}`;
    if (!rentMonthly[ym]) rentMonthly[ym] = { sum: 0, cnt: 0 };
    rentMonthly[ym].sum += r.deposit;
    rentMonthly[ym].cnt += 1;
  });
  const rentRatioData = labels.map(k => {
    if (!rentMonthly[k] || !monthly[k]) return null;
    return +(rentMonthly[k].sum / rentMonthly[k].cnt / (monthly[k].sum / monthly[k].cnt) * 100).toFixed(1);
  });
  const hasRentData = rentRatioData.some(v => v !== null);

  if (_chart) { _chart.destroy(); _chart = null; }

  const datasets = [{
    label: '월평균 거래가',
    data: tradeData,
    borderColor: '#2563eb',
    backgroundColor: 'rgba(37,99,235,0.07)',
    tension: 0.3,
    fill: true,
    pointRadius: 4,
    pointHoverRadius: 6,
    yAxisID: 'y',
  }];

  if (hasRentData) {
    datasets.push({
      label: '전세가율(%)',
      data: rentRatioData,
      borderColor: '#059669',
      backgroundColor: 'transparent',
      tension: 0.3,
      fill: false,
      pointRadius: 4,
      pointHoverRadius: 6,
      yAxisID: 'y1',
      spanGaps: true,
    });
  }

  const scales = {
    y: {
      ticks: { callback: v => fmtWan(v), font: { size: 10 } },
      grid: { color: 'rgba(0,0,0,0.05)' },
    },
    x: { ticks: { font: { size: 10 } } },
  };
  if (hasRentData) {
    scales.y1 = {
      position: 'right',
      ticks: { callback: v => v + '%', font: { size: 10 } },
      grid: { drawOnChartArea: false },
    };
  }

  _chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels.map(l => l.replace('-', '년 ') + '월'),
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: hasRentData },
        tooltip: {
          callbacks: {
            label: ctx => ctx.dataset.yAxisID === 'y1'
              ? ` ${ctx.parsed.y}%`
              : ' ' + fmtWan(ctx.parsed.y),
          },
        },
      },
      scales,
    },
  });
}

// ── 전세가율 ──────────────────────────────────────────────────────────────────
async function loadRentData() {
  const lawdCd = document.getElementById('gugunSel').value;
  const isRange = document.getElementById('rangeMode').checked;
  const month  = isRange
    ? document.getElementById('endMonth').value
    : document.getElementById('dealMonth').value;

  if (!lawdCd || !month) { alert('먼저 지역과 거래 월을 설정한 후 전세가율을 조회해주세요.'); return; }

  const dealYmd = month.replace('-', '');
  const rentBtn = document.getElementById('rentBtn');
  if (rentBtn) rentBtn.disabled = true;
  document.getElementById('rentArea').innerHTML =
    `<div class="loading"><div class="spin"></div>전세 데이터 조회 중…</div>`;

  try {
    const res  = await fetch(`/api/apt-rent?lawd_cd=${lawdCd}&deal_ymd=${dealYmd}`);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch {
      throw new Error('서버가 HTML을 반환했습니다. 터미널에서 서버를 재시작해주세요: node server.js');
    }
    if (!res.ok) throw new Error(data.error || '전세 조회 실패');

    const map = {};
    (data.rents || []).forEach(r => {
      const k = `${r.aptName}__${Math.round(r.area)}`;
      if (!map[k]) map[k] = [];
      map[k].push(r.deposit);
    });
    _rentData = { rents: data.rents || [], map };
    renderRentSummary();
  } catch (e) {
    document.getElementById('rentArea').innerHTML =
      `<div class="error">⚠️ 전세 조회 실패: ${esc(e.message)}</div>`;
  } finally {
    if (rentBtn) rentBtn.disabled = false;
  }
}

function renderRentSummary() {
  const el = document.getElementById('rentArea');
  if (!el || !_rentData) return;

  // filteredTrades 기준 매매 평균가
  const tradeMap = {};
  filteredTrades.forEach(t => {
    const k = `${t.aptName}__${Math.round(t.area)}`;
    if (!tradeMap[k]) tradeMap[k] = [];
    tradeMap[k].push(t.dealAmount);
  });

  const rows = [];
  Object.entries(tradeMap).forEach(([k, prices]) => {
    const deposits = _rentData.map[k];
    if (!deposits || !deposits.length) return;

    const avgTrade   = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const avgDeposit = Math.round(deposits.reduce((a, b) => a + b, 0) / deposits.length);
    if (!avgTrade) return;
    const ratio = +(avgDeposit / avgTrade * 100).toFixed(1);

    const [aptName, areaKey] = k.split('__');
    rows.push({ aptName, area: +areaKey, avgTrade, avgDeposit, ratio });
  });

  if (!rows.length) {
    el.innerHTML = `<div style="font-size:11px;color:#9ca3af;padding:8px 0;">매칭되는 전세 데이터 없음 (같은 아파트·면적 기준)</div>`;
    return;
  }

  rows.sort((a, b) => b.ratio - a.ratio);

  const tableRows = rows.map(r => {
    const style = r.ratio >= 80 ? 'color:#b91c1c;font-weight:800;'
                : r.ratio >= 70 ? 'color:#c2410c;font-weight:700;'
                : r.ratio >= 60 ? 'color:#d97706;'
                : 'color:#15803d;';
    return `<tr>
      <td>${esc(r.aptName)}</td>
      <td>${pyeong(r.area)}평</td>
      <td>${fmtWan(r.avgTrade)}</td>
      <td>${fmtWan(r.avgDeposit)}</td>
      <td style="${style}">${r.ratio}%</td>
    </tr>`;
  }).join('');

  el.innerHTML = `
    <div style="margin-top:12px;border-top:1px solid #e2e8f0;padding-top:10px;">
      <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;">📊 전세가율 (매매평균 대비 전세평균)</div>
      <div class="tbl-wrap">
        <table>
          <thead><tr>
            <th>아파트명</th><th>면적</th><th>매매평균</th><th>전세평균</th><th>전세가율</th>
          </tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
      <div style="font-size:10px;color:#9ca3af;margin-top:4px;">※ 동일 아파트·면적 기준 / 빨강 80%↑ 위험 · 주황 70%↑ 주의 · 초록 60%↓ 양호</div>
    </div>
  `;
}

function renderStats() {
  const box = document.getElementById('statsRow');
  if (!filteredTrades.length) { box.innerHTML = ''; return; }

  const prices = filteredTrades.map(t => t.dealAmount);
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

  box.innerHTML = `
    <div class="stats-row">
      <div class="stat-box"><div class="sl">거래 건수</div><div class="sv">${filteredTrades.length.toLocaleString()}건</div></div>
      <div class="stat-box"><div class="sl">최고가</div><div class="sv">${fmtWan(max)}</div></div>
      <div class="stat-box"><div class="sl">최저가</div><div class="sv">${fmtWan(min)}</div></div>
      <div class="stat-box"><div class="sl">평균가</div><div class="sv">${fmtWan(avg)}</div></div>
    </div>
  `;
}

function renderTable() {
  const el = document.getElementById('tableArea');
  if (!filteredTrades.length) {
    el.innerHTML = `<div class="empty">검색 결과가 없습니다.</div>`;
    return;
  }

  const rows = filteredTrades.slice(0, 300).map(t => {
    const supM2      = getSupM2(t);
    const exclPyeong = pyeong(t.area);
    const supCell    = supM2 != null
      ? `${(supM2 / 3.3058).toFixed(1)}평/${supM2.toFixed(1)}㎡<br><span class="t-muted">(전용 ${exclPyeong}평/${t.area.toFixed(1)}㎡)</span>`
      : `—<br><span class="t-muted">(전용 ${exclPyeong}평/${t.area.toFixed(1)}㎡)</span>`;
    const ppp = supM2 != null ? Math.round(t.dealAmount / (supM2 / 3.3058)) : 0;
    return `<tr>
      <td class="t-apt">${esc(t.aptName)}</td>
      <td class="t-muted" style="white-space:nowrap;">${esc(t.dong)}</td>
      <td class="t-price">${fmtWan(t.dealAmount)}</td>
      <td style="font-size:11px;color:#6b7280;white-space:nowrap;">${ppp > 0 ? fmtWan(ppp) + '/평' : '—'}</td>
      <td class="t-area">${supCell}</td>
      <td>${t.floor}층</td>
      <td style="white-space:nowrap;">${t.year}.${t.month}.${t.day}</td>
      <td class="t-muted">${t.buildYear}</td>
      <td><button class="btn btn-green" onclick="pickTrade(${t.dealAmount},'${esc(t.aptName)}',${t.area},'${esc(t.jibun)}','${t.sggCd}')">선택</button></td>
    </tr>`;
  }).join('');

  el.innerHTML = `
    <div style="font-size:11px;color:#9ca3af;margin-bottom:6px;">${filteredTrades.length.toLocaleString()}건 (최대 300건 표시)</div>
    <div class="tbl-wrap">
      <table>
        <thead><tr>
          ${th('아파트명', 'aptName')}
          ${th('동', 'dong')}
          ${th('거래금액', 'dealAmount')}
          ${th('평당가', 'pricePerPyeong')}
          ${th('전용면적', 'area')}
          ${th('층', 'floor')}
          ${th('계약일', 'date')}
          ${th('건축년도', 'buildYear')}
          <th></th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

async function pickTrade(price, name, area, jibun, sggCd) {
  document.getElementById('targetPrice').value = price;
  document.getElementById('aptNameInput').value = name;
  document.getElementById('selBanner').style.display = 'block';
  document.getElementById('selBannerTxt').textContent = `${name}  ·  ${fmtWan(price)}`;
  selectedTradeArea       = area  || null;
  selectedTradeSupplyArea = null;
  calcAll();

  // 건축물대장 API로 실제 공급면적 비동기 조회
  if (jibun && sggCd && area) {
    const supply = await fetchBuildingSupplyArea(sggCd, jibun, area);
    if (supply !== null) {
      selectedTradeSupplyArea = supply;
      calcAll();
    }
  }

  const right = document.querySelector('.right');
  if (right && right.scrollTo) right.scrollTo({ top: right.scrollHeight, behavior: 'smooth' });
}

function clearSel() {
  document.getElementById('selBanner').style.display = 'none';
  document.getElementById('targetPrice').value = '';
  document.getElementById('aptNameInput').value = '';
  selectedTradeArea       = null;
  selectedTradeSupplyArea = null;
  calcAll();
}

// ── 대출 계산 ─────────────────────────────────────────────────────────────────

// DSR 40% 기준 역산: 해당 조건에서 가능한 최대 대출 원금 (만원)
function maxLoanFromDSR(income, creditInterest, rate, term) {
  if (income <= 0 || rate <= 0 || term <= 0) return null;
  const maxMonthly = income * 0.40 / 12 - creditInterest;
  if (maxMonthly <= 0) return 0;
  const r = rate / 100 / 12;
  const n = term * 12;
  return Math.floor(maxMonthly * (1 - Math.pow(1 + r, -n)) / r);
}

// 지역별 방공제(소액임차인 최우선변제금) 금액 (만원)
function getBangGongje(regionType) {
  if (regionType === 'seoul') return 5500;
  if (regionType === 'metro-strong' || regionType === 'metro') return 4800;
  return 2800;
}

// 등기비용 추정: 법무사 보수 + 인지세 + 국민주택채권 할인 손실 (만원)
function calcRegistrationFee(price) {
  const lawyerFee    = price < 50000 ? 50 : price < 100000 ? 70 : 100;
  const stampTax     = price >= 100000 ? 35 : 15;
  const bondDiscount = Math.round(price * 0.0003);
  return lawyerFee + stampTax + bondDiscount;
}

function monthlyPayment(principal, annualRate, termYears) {
  if (principal <= 0 || annualRate <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
}

function calcAll() {
  // ── 재무 현황 입력값 ──
  const income          = +document.getElementById('annualIncome').value    || 0;
  const liquidAssets    = +document.getElementById('liquidAssets').value    || 0;
  const creditLoan      = +document.getElementById('creditLoan').value      || 0;
  const currentAptPrice = +document.getElementById('currentAptPrice').value || 0;
  const currentMortgage = +document.getElementById('currentMortgage').value || 0;
  const creditRate      = +document.getElementById('creditRate').value      || 0;

  // 신용대출 상환방식 (실제 납부액 표시용)
  const creditRepayType = document.getElementById('creditRepayType')?.value || 'interest';
  const creditTermMo    = +document.getElementById('creditTerm')?.value || 60;
  // DSR 산정: 실제 상환방식 무관, 원금균등분할상환 가정 (금감원 기준)
  // 단기 대출도 최소 60개월(5년) 기준 적용 → 우회 방지
  const creditDsrTerm   = Math.max(creditTermMo, 60);
  const creditMonthly   = (creditLoan > 0 && creditRate > 0)
    ? monthlyPayment(creditLoan, creditRate, creditDsrTerm / 12)
    : 0;
  // DTI용 이자만 (원금 제외)
  const creditInterestOnly = creditLoan * creditRate / 100 / 12;
  // 마이너스통장 (한도 × 이율 / 12, 이자만 DSR/DTI 반영)
  const minusLimit   = +document.getElementById('minusLimit')?.value   || 0;
  const minusRate    = +document.getElementById('minusRate')?.value    || 0;
  const minusMonthly = minusLimit * minusRate / 100 / 12;
  // 기타 대출 월상환액 (자동차·학자금 등)
  const otherMonthly = +document.getElementById('otherLoanMonthly')?.value || 0;
  // 기존 대출 합계: DSR용(원리금) / DTI용(이자만)
  const existingMonthly  = creditMonthly + minusMonthly + otherMonthly;
  const existingInterest = creditInterestOnly + minusMonthly; // 기타는 이자 분리 불가 → DTI 보수적

  // ── 목표 아파트 입력값 ──
  const target    = +document.getElementById('targetPrice').value  || 0;
  const kbPrice   = +document.getElementById('kbPrice').value      || 0;
  const ltvPct    = +document.getElementById('ltvPct').value       || 60;
  const rate      = +document.getElementById('intRate').value      || 4.5;
  const term      = +document.getElementById('loanTerm').value     || 30;

  const el = document.getElementById('resultArea');

  if (!target) {
    el.innerHTML = `<div class="empty">호가를 입력하면 자동으로 계산됩니다.</div>`;
    return;
  }

  // ── 핵심 계산 ──

  // 잔여 현금 = 유동자산 + 현재 아파트 예상 매도가 - 현재 주담대
  const remainCash = liquidAssets + currentAptPrice - currentMortgage;

  // 생애최초 여부
  const houseCount    = +document.getElementById('houseCount').value || 0;
  const isFirstBuyer  = document.getElementById('firstBuyer')?.checked && houseCount === 0;

  // LTV 기준 한도 대출 = KB시세(또는 호가) × LTV%
  const lawdCd    = document.getElementById('gugunSel').value;
  const regionType = getRegionType(lawdCd);
  const basePrice = kbPrice > 0 ? kbPrice : target;
  const rawLtvLoan = Math.floor(basePrice * ltvPct / 100);
  let ltvLoan = rawLtvLoan;
  let capInfo = null;

  // 지역·가격 구간별 대출 금액 한도 적용 (2025.10.16 기준)
  if (houseCount < 2) {
    const capResult = getLoanAmountCap(regionType, basePrice);
    if (capResult && rawLtvLoan > capResult.cap) {
      ltvLoan  = capResult.cap;
      capInfo  = capResult;
    }
  }

  // 방공제 차감 옵션 (MCI 미가입 시 체크)
  const bangGongjeApply = document.getElementById('bangGongjeCheck')?.checked ?? true;
  const bangGongjeAmt   = bangGongjeApply ? getBangGongje(regionType) : 0;
  const loanAfterBG     = Math.max(0, ltvLoan - bangGongjeAmt);

  // DSR 40% 역산 최대 대출 (기존 대출 합계 전체 차감)
  const dsrMaxLoan = income > 0 && rate > 0 ? maxLoanFromDSR(income, existingMonthly, rate, term) : null;

  // 실제 적용 대출 = min(방공제 후 LTV 한도, DSR 40% 역산)
  let effectiveLoan = loanAfterBG;
  let dsrCapApplied = false;
  if (dsrMaxLoan !== null && dsrMaxLoan < loanAfterBG) {
    effectiveLoan = Math.max(0, dsrMaxLoan);
    dsrCapApplied = true;
  }

  // 방공제 힌트 텍스트 업데이트
  const bgHint = document.getElementById('bangGongjeHint');
  if (bgHint) bgHint.textContent = `(${fmtWan(getBangGongje(regionType))})`;

  // 대출 + 현금 합계
  const totalFunds = remainCash + effectiveLoan;

  // ── 취득 비용 계산 ──
  const excluArea = selectedTradeArea || 85; // 면적 미선택 시 85㎡ 기본
  const taxInfo   = calcAcquisitionTax(target, lawdCd, houseCount, excluArea, isFirstBuyer);
  const buyFee    = calcAgencyFee(target);
  const sellFee   = currentAptPrice > 0 ? calcAgencyFee(currentAptPrice) : { fee: 0, rate: '0' };
  const regFee    = calcRegistrationFee(target);
  const totalAcqCost = taxInfo.total + buyFee.fee + sellFee.fee + regFee;

  // 실제 필요 자금 = 호가 + 취득비용
  const requiredFunds = target + totalAcqCost;
  const surplus = totalFunds - requiredFunds;
  const canBuy  = surplus >= 0;

  // 원리금 균등상환 월상환액 (실제 적용 대출 기준)
  const mp = monthlyPayment(effectiveLoan, rate, term);

  // DSR = (신규주담대 원리금 + 기존 대출 합계) × 12 / 연봉
  const dsr = income > 0 ? (mp + existingMonthly) * 12 / income * 100 : 0;
  // DTI = (신규주담대 원리금 + 기존 대출 이자합계) × 12 / 연봉  (정책대출 심사 기준)
  const dti = income > 0 ? (mp + existingInterest) * 12 / income * 100 : 0;

  // 스트레스 DSR: 10.15 대책(2025.10.16~) 수도권 기준금리 하한 3%로 상향
  // 비수도권: 0.75% 유예(25년말), 금리유형별: 변동100%/혼합형80%/주기형40%/순수고정0%
  const baseStress   = (regionType !== 'other') ? 3.0 : 0.75;
  const rateType     = document.getElementById('rateType')?.value || 'hybrid';
  const stressFactor = rateType === 'variable' ? 1.0 : rateType === 'hybrid' ? 0.8 : rateType === 'periodic' ? 0.4 : 0.0;
  const stressAdd    = +(baseStress * stressFactor).toFixed(2);
  const mpStress  = monthlyPayment(effectiveLoan, rate + stressAdd, term);
  const dsrStress = income > 0 ? (mpStress + existingMonthly) * 12 / income * 100 : 0;

  // 연간 순이자 = (총상환액 - 대출원금) / 만기
  const totalInterest  = mp * term * 12 - effectiveLoan;
  const annualInterest = term > 0 ? totalInterest / term : 0;

  // ── 결과 렌더링 ──
  const aptName = document.getElementById('aptNameInput').value.trim();

  el.innerHTML = `
    ${aptName ? `<div style="font-size:13px;font-weight:800;color:#1e40af;margin-bottom:4px;">${esc(aptName)}</div>` : ''}
    ${selectedTradeArea ? (() => {
      const supplyM2  = selectedTradeSupplyArea || null;
      const estM2     = Math.round(selectedTradeArea / 0.74 * 10) / 10;
      const areaLine  = supplyM2
        ? `공급 <b>${(supplyM2 / 3.3058).toFixed(1)}평(${supplyM2.toFixed(1)}㎡)</b> · 전용 ${pyeong(selectedTradeArea)}평(${selectedTradeArea.toFixed(1)}㎡) <span style="color:#059669;font-size:9px;">●건축물대장</span>`
        : `공급 약${(estM2 / 3.3058).toFixed(1)}평(${estM2.toFixed(1)}㎡) · 전용 ${pyeong(selectedTradeArea)}평(${selectedTradeArea.toFixed(1)}㎡) <span style="color:#9ca3af;font-size:9px;">※전용률74%추정</span>`;
      return `<div style="font-size:11px;color:#374151;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">${areaLine}</div>`;
    })() : (aptName ? `<div style="margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #e2e8f0;"></div>` : '')}

    <!-- 자금 분석 -->
    <div class="at-group">
      <div class="at-header">자금 분석</div>
      <div class="at-row">
        <span class="at-label">잔여 현금 <span class="at-hint">(유동+현아파트−주담대)</span></span>
        <span class="at-value">${fmtWan(remainCash)}</span>
      </div>
      <div class="at-row ${capInfo ? 'at-warn' : ''}">
        <span class="at-label">LTV 한도 대출
          <span class="at-hint">(${kbPrice > 0 ? 'KB시세' : '호가'} × ${ltvPct}%${capInfo ? ` = ${fmtWan(rawLtvLoan)} → ${capInfo.label}` : ''})</span>
        </span>
        <span class="at-value">${fmtWan(ltvLoan)}</span>
      </div>
      ${bangGongjeApply && ltvLoan > 0 ? `
      <div class="at-row">
        <span class="at-label">방공제 차감 <span class="at-hint">(소액임차인 최우선변제 · ${regionType === 'seoul' ? '서울' : (regionType === 'metro-strong' || regionType === 'metro') ? '경기·인천' : '기타'})</span></span>
        <span class="at-value" style="color:#7c3aed;">−${fmtWan(bangGongjeAmt)}</span>
      </div>` : ''}
      ${dsrMaxLoan !== null && ltvLoan > 0 ? `
      <div class="at-row ${dsrCapApplied ? 'at-warn' : ''}">
        <span class="at-label">DSR 40% 역산 최대 대출 <span class="at-hint">((연봉×40%÷12−기존대출) 역산)</span>${dsrCapApplied ? ' <span style="color:#c2410c;font-size:10px;font-weight:800;">← 실제 적용</span>' : ' <span style="font-size:10px;color:#9ca3af;">여유 있음</span>'}</span>
        <span class="at-value" style="${dsrCapApplied ? 'color:#c2410c;' : 'color:#9ca3af;'}">${fmtWan(Math.round(dsrMaxLoan))}</span>
      </div>` : ''}
      ${ltvLoan > 0 && (bangGongjeApply || dsrCapApplied) ? `
      <div class="at-row at-key" style="background:#f5f3ff;border:1px solid #ede9fe;">
        <span class="at-label" style="font-weight:700;color:#6d28d9;">실제 적용 대출</span>
        <span class="at-value" style="font-size:15px;color:#6d28d9;">${fmtWan(effectiveLoan)}</span>
      </div>` : ''}
      <div class="at-row at-key">
        <span class="at-label">대출 + 현금 합계</span>
        <span class="at-value">${fmtWan(totalFunds)}</span>
      </div>
    </div>

    <!-- 취득 비용 -->
    <div class="at-group">
      <div class="at-header">취득 비용</div>
      <div class="at-row">
        <span class="at-label">취득세 <span class="at-hint">(${taxInfo.taxRate}% · ${excluArea > 85 ? '85㎡ 초과' : '85㎡ 이하'}${isFirstBuyer && houseCount === 0 ? ' · 생애최초 감면' : ''})</span></span>
        <span class="at-value">${fmtWan(taxInfo.acquisitionTax)}</span>
      </div>
      <div class="at-row">
        <span class="at-label">지방교육세 <span class="at-hint">(취득세 × 10%)</span></span>
        <span class="at-value">${fmtWan(taxInfo.localEduTax)}</span>
      </div>
      ${taxInfo.specialTax > 0 ? `
      <div class="at-row">
        <span class="at-label">농어촌특별세 <span class="at-hint">(85㎡ 초과 · 취득세 × 10%)</span></span>
        <span class="at-value">${fmtWan(taxInfo.specialTax)}</span>
      </div>` : ''}
      <div class="at-row">
        <span class="at-label">매수 중개보수 <span class="at-hint">(${buyFee.rate}% · 호가 기준)</span></span>
        <span class="at-value">${fmtWan(buyFee.fee)}</span>
      </div>
      ${sellFee.fee > 0 ? `
      <div class="at-row">
        <span class="at-label">매도 중개보수 <span class="at-hint">(${sellFee.rate}% · 현아파트 ${fmtWan(currentAptPrice)} 기준)</span></span>
        <span class="at-value">${fmtWan(sellFee.fee)}</span>
      </div>` : ''}
      <div class="at-row">
        <span class="at-label">등기비용 <span class="at-hint">(법무사·인지세·채권할인, 추정)</span></span>
        <span class="at-value">≈${fmtWan(regFee)}</span>
      </div>
      <div class="at-row at-key">
        <span class="at-label">취득 비용 합계 <span class="at-hint">(세금+등기+중개비)</span></span>
        <span class="at-value">${fmtWan(totalAcqCost)}</span>
      </div>
      <div class="at-row at-key ${canBuy ? 'at-ok' : 'at-fail'}">
        <span class="at-label">${canBuy ? '✓ 구매 가능' : '✗ 자금 부족'} <span class="at-hint">(대출+현금 − 호가 − 취득비용)</span></span>
        <span class="at-value">${canBuy ? '+' : '−'}${fmtWan(Math.abs(surplus))}</span>
      </div>
    </div>

    <!-- 상환 부담 -->
    <div class="at-group">
      <div class="at-header">상환 부담</div>
      <div class="at-row">
        <span class="at-label">신규 주담대 월상환액 <span class="at-hint">(금리 ${rate}% · ${fmtWan(effectiveLoan)})</span></span>
        <span class="at-value">${effectiveLoan > 0 ? fmtWan(Math.round(mp)) + '/월' : '—'}</span>
      </div>
      <div class="at-row ${dsrClass(dsr)}">
        <div style="flex:1">
          <span class="at-label">DSR <span class="at-hint">(총부채원리금상환비율 · 은행 심사)</span></span>
          <div class="dsr-breakdown">
            ${effectiveLoan > 0 ? `<div class="dsr-item"><span>└ 주담대 (금리${rate}%·${term}년 원리금균등)</span><span class="dsr-val">${mp.toFixed(1)}만원/월</span></div>` : ''}
            ${creditMonthly > 0 ? `<div class="dsr-item"><span>└ 신용대출 (원금균등 ${creditDsrTerm}개월 DSR 기준)</span><span class="dsr-val">${creditMonthly.toFixed(1)}만원/월</span></div>` : ''}
            ${minusMonthly > 0 ? `<div class="dsr-item"><span>└ 마이너스통장 (이자만)</span><span class="dsr-val">${minusMonthly.toFixed(1)}만원/월</span></div>` : ''}
            ${otherMonthly > 0 ? `<div class="dsr-item"><span>└ 기타 대출</span><span class="dsr-val">${otherMonthly.toFixed(1)}만원/월</span></div>` : ''}
            ${income > 0 ? `<div class="dsr-formula">= 월합계 ${(mp + existingMonthly).toFixed(1)}만원 × 12 ÷ 연봉 ${income}만원 = ${dsr.toFixed(1)}%</div>` : ''}
          </div>
          ${income > 0 ? dsrBar(dsr) : ''}
        </div>
        <span class="at-value">${income > 0 ? dsr.toFixed(1) + '%' : '—'}</span>
      </div>
      <div class="at-row ${dsrClass(dti)}">
        <div style="flex:1">
          <span class="at-label">DTI <span class="at-hint">(참고 · 정책대출 심사 기준)</span></span>
          <div class="dsr-breakdown">
            ${effectiveLoan > 0 ? `<div class="dsr-item"><span>└ 주담대 원리금</span><span class="dsr-val">${mp.toFixed(1)}만원/월</span></div>` : ''}
            ${creditInterestOnly > 0 ? `<div class="dsr-item"><span>└ 신용대출 이자만</span><span class="dsr-val">${creditInterestOnly.toFixed(1)}만원/월</span></div>` : ''}
            ${minusMonthly > 0 ? `<div class="dsr-item"><span>└ 마이너스통장 이자</span><span class="dsr-val">${minusMonthly.toFixed(1)}만원/월</span></div>` : ''}
            ${otherMonthly > 0 ? `<div class="dsr-item" style="color:#d1d5db;"><span>└ 기타대출 (이자 분리 불가 · DTI 제외)</span><span class="dsr-val" style="color:#d1d5db;">—</span></div>` : ''}
            ${income > 0 ? `<div class="dsr-formula">= 월합계 ${(mp + existingInterest).toFixed(1)}만원 × 12 ÷ 연봉 ${income}만원 = ${dti.toFixed(1)}%</div>` : ''}
          </div>
          ${income > 0 ? dsrBar(dti) : ''}
        </div>
        <span class="at-value" style="font-size:12px;">${income > 0 ? dti.toFixed(1) + '%' : '—'}</span>
      </div>
      <div class="at-row">
        <span class="at-label">스트레스 월상환액 <span class="at-hint">(기준금리 ${rate}% + 스트레스 +${stressAdd}% = ${(rate + stressAdd).toFixed(1)}%)</span></span>
        <span class="at-value">${effectiveLoan > 0 ? fmtWan(Math.round(mpStress)) + '/월' : '—'}</span>
      </div>
      <div class="at-row ${dsrClass(dsrStress)}">
        <div style="flex:1">
          <span class="at-label">스트레스 DSR</span>
          <div class="dsr-breakdown">
            ${effectiveLoan > 0 ? `<div class="dsr-item"><span>└ 주담대-스트레스 (금리 ${(rate+stressAdd).toFixed(1)}%·${term}년)</span><span class="dsr-val">${mpStress.toFixed(1)}만원/월</span></div>` : ''}
            ${existingMonthly > 0 ? `<div class="dsr-item"><span>└ 기존 대출 합계</span><span class="dsr-val">${existingMonthly.toFixed(1)}만원/월</span></div>` : ''}
            ${income > 0 ? `<div class="dsr-formula">= 월합계 ${(mpStress + existingMonthly).toFixed(1)}만원 × 12 ÷ 연봉 ${income}만원 = ${dsrStress.toFixed(1)}%</div>` : ''}
          </div>
          ${income > 0 ? dsrBar(dsrStress) : ''}
        </div>
        <span class="at-value">${income > 0 ? dsrStress.toFixed(1) + '%' : '—'}</span>
      </div>
    </div>

    <!-- 이자 분석 -->
    <div class="at-group">
      <div class="at-header">이자 분석</div>
      <div class="at-row">
        <span class="at-label">연간 순이자 <span class="at-hint">(${term}년 총이자 ÷ ${term})</span></span>
        <span class="at-value">${effectiveLoan > 0 ? fmtWan(Math.round(annualInterest)) + '/년' : '—'}</span>
      </div>
      <div class="at-row">
        <span class="at-label">총 이자 (${term}년)</span>
        <span class="at-value">${effectiveLoan > 0 ? fmtWan(Math.round(totalInterest)) : '—'}</span>
      </div>
    </div>

    <p class="disclaimer">
      ※ 정책확인: 2026.04.25 | 출처: 금융위원회·국토교통부 공식 보도자료<br>
      ※ 취득세: 1주택 6억↓1% / 6~9억2% / 9억↑3% | 조정 2주택 8% | 조정 3주택↑ 12%<br>
      ※ 생애최초 취득세 감면: 12억이하 최대 200만원 / 지방교육세 취득세×10% 추가<br>
      ※ 농어촌특별세: 전용 85㎡ 초과 시 취득세×10% 추가<br>
      ※ 중개보수: 2억~9억 0.4% / 9억~12억 0.5% / 12~15억 0.6% / 15억↑ 0.7% (협의 가능)<br>
      ※ 등기비용: 법무사 보수 + 인지세(10억이하 15만·초과 35만) + 국민주택채권 할인 손실 추정<br>
      ※ 공급면적: 건축물대장 API 매칭 시 실제값, 미매칭 시 전용/0.74 추정<br>
      ※ 방공제(소액임차인 최우선변제): 서울 5,500만 / 경기·인천 4,800만 / 기타 2,800만<br>
      &nbsp;&nbsp;MCI(소액임차보증보험) 가입 시 방공제 없이 LTV 한도까지 대출 가능 → 체크 해제<br>
      ※ DSR 40% 역산: 연봉 입력 시 실제 받을 수 있는 최대 대출원금 자동 산출<br>
      &nbsp;&nbsp;실제 적용 대출 = min(방공제 후 LTV 한도, DSR 40% 역산 한도)<br>
      ※ 투기과열·토지거래허가구역(서울전역·경기12곳, ~2026.12.31)<br>
      &nbsp;&nbsp;무주택 LTV 40% / 생애최초 특례 LTV 70% / 1주택 처분조건부 LTV 40%<br>
      &nbsp;&nbsp;가격구간 한도: 15억이하 6억 · 15~25억 4억 · 25억초과 2억<br>
      ※ 기타수도권(인천·경기 나머지): 무주택 LTV 70%, 1주택 LTV 60%, 일괄 6억 한도<br>
      ※ 비수도권: 무주택 LTV 70% (생애최초 80%), 1주택 LTV 60%, 한도 없음<br>
      ※ 스트레스 DSR: 10.15 대책(2025.10.16~) 수도권 기준 스트레스 금리 하한 3.0% / 비수도권 0.75%(25년말 유예)<br>
      &nbsp;&nbsp;금리유형별 적용비율 — 변동금리 100% / 혼합형(5년고정+변동) 80% / 주기형(5년) 40% / 순수고정 0%<br>
      &nbsp;&nbsp;예) 수도권 혼합형: 3.0%×80%=2.4% / 수도권 변동: 3.0% / 수도권 주기형: 3.0%×40%=1.2%<br>
      ※ DSR = (신규주담대 원리금 + 기존대출 월상환합계) × 12 ÷ 연봉 (은행 심사 기준)<br>
      ※ DTI = (신규주담대 원리금 + 기존대출 이자합계) × 12 ÷ 연봉 (정책대출 심사 참고)<br>
      ※ 신용대출 DSR 산정: 실제 상환방식 무관, 원금균등분할상환 가정 (최소 5년/60개월)<br>
      &nbsp;&nbsp;만기일시상환이라도 60개월 원금균등 기준 DSR 적용 (금감원 2021년 가계부채 관리방안)<br>
      ※ 마이너스통장: 한도 × 이율 / 12 이자만 DSR/DTI 반영 (금감원 기준)<br>
      ※ 전세대출: DSR 산정 제외 → 기타 대출에 입력하지 마세요
    </p>
  `;
}

function dsrClass(dsr) {
  if (dsr <= 0) return '';
  if (dsr < 36) return 'at-ok';
  if (dsr < 45) return 'at-warn';
  return 'at-fail';
}

function dsrBar(dsr) {
  const pct = Math.min(dsr / 50 * 100, 100).toFixed(1);
  const cls = dsr < 36 ? 'dsr-ok' : (dsr < 45 ? 'dsr-warn' : 'dsr-fail');
  return `<div class="dsr-bar-track"><div class="dsr-bar-fill ${cls}" style="width:${pct}%"></div></div>`;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function fmtWan(wan) {
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

function pyeong(sqm) { return (sqm / 3.3058).toFixed(1); }

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── 건축물대장 공급면적 조회 ─────────────────────────────────────────────────────

// 거래별 실제 공급면적 반환 (없으면 null)
function getSupM2(t) {
  return t.supplyM2 != null ? t.supplyM2 : null;
}

// 거래 목록의 단지들에 대해 건축물대장 조회 완료까지 대기 (렌더링은 호출자 담당)
async function fetchAllSupplyAreas(trades, abort) {
  // 표시되는 300건의 고유 단지만 대상
  const visible = trades.slice(0, 300);
  const groups = [...new Map(
    visible
      .filter(t => t.jibun && t.sggCd)
      .map(t => [`${t.sggCd}|${t.jibun}`, { sggCd: t.sggCd, jibun: t.jibun }])
  ).values()];

  const BATCH = 3;
  for (let i = 0; i < groups.length; i += BATCH) {
    if (abort.cancelled) return;
    await Promise.all(groups.slice(i, i + BATCH).map(async ({ sggCd, jibun }) => {
      const [bun, ji] = parseJibun(jibun);
      const cacheKey = `${sggCd}|${bun}|${ji}`;
      if (!_bldgCache[cacheKey]) {
        try {
          const res  = await fetch(`/api/building-area?sigunguCd=${sggCd}&bun=${bun}&ji=${ji}`);
          const data = await res.json();
          _bldgCache[cacheKey] = (res.ok && data.areaMap) ? data.areaMap : {};
        } catch {
          _bldgCache[cacheKey] = {};
        }
      }
      const areaMap = _bldgCache[cacheKey];
      if (!Object.keys(areaMap || {}).length) return;
      allTrades.forEach(t => {
        if (t.sggCd !== sggCd || t.jibun !== jibun || t.supplyM2 != null) return;
        const supply = findSupplyArea(areaMap, t.area);
        if (supply !== null) t.supplyM2 = supply;
      });
    }));
  }
}

function parseJibun(jibun) {
  const parts = String(jibun || '').trim().split('-');
  return [parts[0] || '0', parts[1] || '0'];
}

function findSupplyArea(areaMap, excluArea) {
  const key = String(Math.round(excluArea * 10) / 10);
  if (areaMap[key]) return areaMap[key].supply;
  // ±1㎡ 이내 근사 탐색
  for (const k of Object.keys(areaMap)) {
    if (Math.abs(+k - excluArea) < 1.0) return areaMap[k].supply;
  }
  return null;
}

async function fetchBuildingSupplyArea(sggCd, jibun, excluArea) {
  if (!jibun || !sggCd) return null;
  const [bun, ji] = parseJibun(jibun);
  const cacheKey  = `${sggCd}|${bun}|${ji}`;
  console.log('[건축물대장 조회]', { sggCd, jibun, bun, ji, excluArea });
  if (_bldgCache[cacheKey]) {
    const r = findSupplyArea(_bldgCache[cacheKey], excluArea);
    console.log('[건축물대장 캐시 hit]', { cacheKey, result: r });
    return r;
  }
  try {
    const url = `/api/building-area?sigunguCd=${sggCd}&bun=${bun}&ji=${ji}`;
    console.log('[건축물대장 API 요청]', url);
    const res  = await fetch(url);
    const data = await res.json();
    console.log('[건축물대장 API 응답]', { ok: res.ok, count: data.count, areaMapKeys: Object.keys(data.areaMap || {}), areaMap: data.areaMap });
    if (!res.ok || !data.areaMap) return null;
    _bldgCache[cacheKey] = data.areaMap;
    const result = findSupplyArea(data.areaMap, excluArea);
    console.log('[건축물대장 매칭 결과]', { excluArea, result, areaMapKeys: Object.keys(data.areaMap) });
    return result;
  } catch (e) {
    console.error('[건축물대장 오류]', e);
    return null;
  }
}

// ── 취득세 계산 ──────────────────────────────────────────────────────────────────
// 취득 후 보유 수 = houseCount + 1 기준
function calcAcquisitionTax(price, lawdCd, houseCount, excluAreaSqm, isFirstBuyer) {
  const region     = getRegionType(lawdCd);
  const isAdjusted = region === 'seoul' || region === 'metro-strong';
  const afterCount = houseCount + 1;

  let taxRate;
  if (afterCount === 1 || (afterCount === 2 && !isAdjusted)) {
    if      (price <= 60000)  taxRate = 1;
    else if (price <= 90000)  taxRate = 2;
    else                      taxRate = 3;
  } else if (afterCount === 2 && isAdjusted) {
    taxRate = 8;
  } else {
    taxRate = isAdjusted ? 12 : 8;
  }

  let acquisitionTax = Math.round(price * taxRate / 100);

  // 생애최초 감면: 12억 이하, 최대 200만원
  if (isFirstBuyer && afterCount === 1 && price <= 120000) {
    acquisitionTax = Math.max(0, acquisitionTax - 200);
  }

  const localEduTax = Math.round(acquisitionTax * 0.1);
  // 농어촌특별세: 전용 85㎡ 초과 + 기본세율(1~3%) 적용 구간만
  const specialTax  = (excluAreaSqm > 85 && taxRate <= 3)
    ? Math.round(acquisitionTax * 0.1) : 0;

  return { acquisitionTax, localEduTax, specialTax, total: acquisitionTax + localEduTax + specialTax, taxRate };
}

// ── 중개보수 계산 (2024년 개정 요율) ─────────────────────────────────────────────
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
