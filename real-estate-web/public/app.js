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

// 신용대출 이율 → 월이자 자동 계산 및 표시
function updateCreditDisplay() {
  const loan = +document.getElementById('creditLoan').value || 0;
  const rate = +document.getElementById('creditRate').value || 0;
  const monthly = (loan > 0 && rate > 0) ? loan * rate / 100 / 12 : 0;
  const el = document.getElementById('creditInterestDisplay');
  if (!el) return;
  el.textContent = monthly > 0
    ? `월이자 ≈ ${monthly.toFixed(1)}만원`
    : '이율 입력 시 자동 계산';
}

// ── 상태 ──────────────────────────────────────────────────────────────────────
let allTrades = [];
let filteredTrades = [];
let selectedArea = null; // null = 전체, number = Math.round(㎡) 기준

// ── 초기화 ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildSido();
  setDefaultMonth();
  applyLtvPolicy();
  updateCreditDisplay();
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

    for (let i = 0; i < months.length; i++) {
      const m = months[i];
      if (months.length > 1) {
        document.getElementById('tableArea').innerHTML =
          `<div class="loading"><div class="spin"></div>${i + 1} / ${months.length}개월 조회 중… (${m})</div>`;
      }
      const dealYmd = m.replace('-', '');
      const res  = await fetch(`/api/apt-trade?lawd_cd=${lawdCd}&deal_ymd=${dealYmd}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '조회 실패');
      merged = merged.concat(data.trades || []);
    }

    allTrades = merged;
    selectedArea = null; // 새 조회마다 면적 필터 초기화
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

  // 아파트명 필터 (면적 칩 생성 기준)
  const nameFiltered = q
    ? allTrades.filter(t => t.aptName.toLowerCase().includes(q))
    : [...allTrades];

  // 면적 필터 추가 적용
  filteredTrades = selectedArea !== null
    ? nameFiltered.filter(t => Math.round(t.area) === selectedArea)
    : [...nameFiltered];

  filteredTrades.sort((a, b) =>
    +`${b.year}${b.month}${b.day}` - +`${a.year}${a.month}${a.day}`
  );

  renderAreaChips(nameFiltered);
  renderStats();
  renderTable();
}

function renderAreaChips(nameFiltered) {
  const el = document.getElementById('areaChipsRow');
  if (!el) return;

  // 면적별 건수 집계 (Math.round 기준 그룹화)
  const counts = {};
  nameFiltered.forEach(t => {
    const k = Math.round(t.area);
    counts[k] = (counts[k] || 0) + 1;
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
  const chips = [
    { area: null, label: `전체 ${total.toLocaleString()}건` },
    ...areas.map(a => ({
      area: a,
      label: `${pyeong(a)}평 (${a}㎡) · ${counts[a]}건`,
    })),
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

  const rows = filteredTrades.slice(0, 300).map(t => `
    <tr>
      <td class="t-apt">${esc(t.aptName)}</td>
      <td class="t-price">${fmtWan(t.dealAmount)}</td>
      <td class="t-area">${pyeong(t.area)}평<br><span class="t-muted">(${t.area.toFixed(1)}㎡전용)</span></td>
      <td>${t.floor}층</td>
      <td>${t.year}.${t.month}.${t.day}</td>
      <td class="t-muted">${t.buildYear}</td>
      <td><button class="btn btn-green" onclick="pickTrade(${t.dealAmount},'${esc(t.aptName)}')">선택</button></td>
    </tr>
  `).join('');

  el.innerHTML = `
    <div style="font-size:11px;color:#9ca3af;margin-bottom:6px;">${filteredTrades.length.toLocaleString()}건 (최대 300건 표시)</div>
    <div class="tbl-wrap">
      <table>
        <thead><tr>
          <th>아파트명</th><th>거래금액</th><th>전용면적</th>
          <th>층</th><th>계약일</th><th>건축년도</th><th></th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function pickTrade(price, name) {
  document.getElementById('targetPrice').value = price;
  document.getElementById('aptNameInput').value = name;
  document.getElementById('selBanner').style.display = 'block';
  document.getElementById('selBannerTxt').textContent = `${name}  ·  ${fmtWan(price)}`;
  calcAll();
  // 오른쪽 패널 결과로 스크롤
  const right = document.querySelector('.right');
  if (right && right.scrollTo) {
    right.scrollTo({ top: right.scrollHeight, behavior: 'smooth' });
  }
}

function clearSel() {
  document.getElementById('selBanner').style.display = 'none';
  document.getElementById('targetPrice').value = '';
  document.getElementById('aptNameInput').value = '';
  calcAll();
}

// ── 대출 계산 ─────────────────────────────────────────────────────────────────

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
  const creditInterest  = creditLoan * creditRate / 100 / 12; // 만원/월 (자동 계산)

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

  // 대출 + 현금 합계
  const totalFunds = remainCash + ltvLoan;

  // 대출+현금 - 호가
  const surplus = totalFunds - target;
  const canBuy  = surplus >= 0;

  // 원리금 균등상환 월상환액 (일반 금리)
  const mp = monthlyPayment(ltvLoan, rate, term);

  // DSR = (월상환액 + 신용대출 월이자) × 12 / 연봉
  const dsr = income > 0 ? (mp + creditInterest) * 12 / income * 100 : 0;

  // 스트레스 금리: 수도권(서울·경기·인천) +3%, 비수도권 +1.5% (2025.10.15 강화)
  const stressAdd = (regionType !== 'other') ? 3.0 : 1.5;
  const mpStress  = monthlyPayment(ltvLoan, rate + stressAdd, term);
  const dsrStress = income > 0 ? (mpStress + creditInterest) * 12 / income * 100 : 0;

  // 연간 순이자 = (총상환액 - 대출원금) / 만기
  const totalInterest  = mp * term * 12 - ltvLoan;
  const annualInterest = term > 0 ? totalInterest / term : 0;

  // ── 결과 렌더링 ──
  const aptName = document.getElementById('aptNameInput').value.trim();

  el.innerHTML = `
    ${aptName ? `<div style="font-size:13px;font-weight:800;color:#1e40af;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">${esc(aptName)}</div>` : ''}

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
      <div class="at-row at-key">
        <span class="at-label">대출 + 현금 합계</span>
        <span class="at-value">${fmtWan(totalFunds)}</span>
      </div>
      <div class="at-row at-key ${canBuy ? 'at-ok' : 'at-fail'}">
        <span class="at-label">${canBuy ? '✓ 구매 가능' : '✗ 자금 부족'} <span class="at-hint">(대출+현금 − 호가 ${fmtWan(target)})</span></span>
        <span class="at-value">${canBuy ? '+' : '−'}${fmtWan(Math.abs(surplus))}</span>
      </div>
    </div>

    <!-- 상환 부담 -->
    <div class="at-group">
      <div class="at-header">상환 부담</div>
      <div class="at-row">
        <span class="at-label">원리금 균등 월상환액 <span class="at-hint">(금리 ${rate}%)</span></span>
        <span class="at-value">${ltvLoan > 0 ? fmtWan(Math.round(mp)) + '/월' : '—'}</span>
      </div>
      <div class="at-row ${dsrClass(dsr)}">
        <div style="flex:1">
          <span class="at-label">DSR <span class="at-hint">((월상환+신용이자)×12/연봉)</span></span>
          ${income > 0 ? dsrBar(dsr) : ''}
        </div>
        <span class="at-value">${income > 0 ? dsr.toFixed(1) + '%' : '—'}</span>
      </div>
      <div class="at-row">
        <span class="at-label">스트레스 월상환액 <span class="at-hint">(금리 ${(rate + stressAdd).toFixed(1)}% · 스트레스 +${stressAdd}%)</span></span>
        <span class="at-value">${ltvLoan > 0 ? fmtWan(Math.round(mpStress)) + '/월' : '—'}</span>
      </div>
      <div class="at-row ${dsrClass(dsrStress)}">
        <div style="flex:1">
          <span class="at-label">스트레스 DSR</span>
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
        <span class="at-value">${ltvLoan > 0 ? fmtWan(Math.round(annualInterest)) + '/년' : '—'}</span>
      </div>
      <div class="at-row">
        <span class="at-label">총 이자 (${term}년)</span>
        <span class="at-value">${ltvLoan > 0 ? fmtWan(Math.round(totalInterest)) : '—'}</span>
      </div>
    </div>

    <p class="disclaimer">
      ※ 정책확인: 2026.04.25 | 출처: 금융위원회·국토교통부 공식 보도자료<br>
      ※ 투기과열·토지거래허가구역(서울전역·경기12곳, ~2026.12.31)<br>
      &nbsp;&nbsp;무주택 LTV 40% / 생애최초 특례 LTV 70% / 1주택 처분조건부 LTV 40%<br>
      &nbsp;&nbsp;가격구간 한도: 15억이하 6억 · 15~25억 4억 · 25억초과 2억<br>
      ※ 기타수도권(인천·경기 나머지): 무주택 LTV 70%, 1주택 LTV 60%, 일괄 6억 한도<br>
      ※ 비수도권: 무주택 LTV 70% (생애최초 80%), 1주택 LTV 60%, 한도 없음<br>
      ※ 스트레스 DSR 금리: 수도권 +3%, 비수도권 +1.5%<br>
      ※ DSR = (월상환액 + 신용대출 월이자) × 12 ÷ 연봉 × 100
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
