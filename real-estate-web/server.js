require('dotenv').config();
const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const SERVICE_KEY_ENC = process.env.SERVICE_KEY_ENC;
const API_BASE = 'http://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade';
const PAGE_SIZE = 1000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

async function fetchAptPage(lawdCd, dealYmd, pageNo) {
  const url = `${API_BASE}?serviceKey=${SERVICE_KEY_ENC}` +
    `&LAWD_CD=${lawdCd}&DEAL_YMD=${dealYmd}&pageNo=${pageNo}&numOfRows=${PAGE_SIZE}`;

  const response = await axios.get(url, {
    timeout: 20000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/xml, text/xml, */*',
    },
  });

  const raw = response.data || '';

  if (typeof raw === 'string' && raw.trim().startsWith('[')) {
    let apiErr;
    try { apiErr = JSON.parse(raw); } catch (_) {}
    const msg = apiErr?.[0]?.errMsg || apiErr?.[0]?.returnReasonCode || raw.slice(0, 200);
    throw Object.assign(new Error(`공공API 오류: ${msg}`), { isApiError: true });
  }

  const parser = new xml2js.Parser({ explicitArray: false, trim: true });
  const result = await parser.parseStringPromise(raw);

  const header = result?.response?.header;
  const code = String(header?.resultCode || '');
  if (code && code !== '00' && code !== '000') {
    throw Object.assign(
      new Error(`API 응답 오류 [${code}]: ${header?.resultMsg}`),
      { isApiError: true }
    );
  }

  const body = result?.response?.body;
  let items = body?.items?.item || [];
  if (!Array.isArray(items)) items = items ? [items] : [];

  return {
    totalCount: parseInt(body?.totalCount || 0, 10),
    items,
  };
}

function mapTrades(items) {
  // 첫 번째 아이템의 필드 목록 확인 (개발 디버그)
  if (items.length > 0) {
    const sample = items[0];
    console.log('[mapTrades 전체 키]', Object.keys(sample).join(', '));
    console.log('[mapTrades 샘플]', JSON.stringify(sample));
  }
  return items
    .map(item => ({
      aptName:    item.aptNm       || '',
      dealAmount: parseInt((item.dealAmount || '0').replace(/[,\s]/g, ''), 10),
      area:       parseFloat(item.excluUseAr || '0'),
      floor:      parseInt(item.floor || '0', 10),
      year:       item.dealYear    || '',
      month:      String(item.dealMonth || '').padStart(2, '0'),
      day:        String(item.dealDay   || '').padStart(2, '0'),
      buildYear:  item.buildYear   || '',
      dong:       item.umdNm       || '',
      cancelled:  (item.cdealType || '').trim() !== '',
      jibun:      item.jibun       || '',
      sggCd:      item.sggCd       || '',
      umdNm:      item.umdNm       || '',
    }))
    .filter(t => t.aptName && t.dealAmount > 0 && !t.cancelled);
}

app.get('/api/apt-trade', async (req, res) => {
  const { lawd_cd, deal_ymd } = req.query;
  if (!lawd_cd || !deal_ymd) {
    return res.status(400).json({ error: '지역코드와 거래월을 입력해주세요.' });
  }

  const cacheKey = `${lawd_cd}|${deal_ymd}`;
  if (_tradeCache.has(cacheKey)) {
    return res.json({ ..._tradeCache.get(cacheKey), cached: true });
  }

  try {
    const first = await fetchAptPage(lawd_cd, deal_ymd, 1);
    let allItems = [...first.items];

    if (first.totalCount > PAGE_SIZE) {
      const extraPages = Math.min(Math.ceil((first.totalCount - PAGE_SIZE) / PAGE_SIZE), 9);
      // 나머지 페이지 병렬 요청
      const pageNums = Array.from({ length: extraPages }, (_, i) => i + 2);
      const pages = await Promise.all(pageNums.map(p => fetchAptPage(lawd_cd, deal_ymd, p)));
      pages.forEach(p => { allItems = allItems.concat(p.items); });
    }

    const trades = mapTrades(allItems);
    const payload = { totalCount: first.totalCount, fetched: trades.length, trades };
    _tradeCache.set(cacheKey, payload);
    res.json(payload);

  } catch (err) {
    console.error('[API Error]', err.message);

    if (err.isApiError) {
      return res.status(502).json({
        error: err.message,
        hint: 'data.go.kr에서 "국토교통부 아파트매매 실거래가 상세 자료" 서비스 신청 여부를 확인하세요.',
      });
    }
    if (err.response?.status === 400) {
      return res.status(502).json({
        error: '공공API가 요청을 거부했습니다 (400).',
        hint: 'data.go.kr 마이페이지에서 API 신청 여부를 확인하세요.',
      });
    }
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'API 응답 시간 초과. 잠시 후 재시도해주세요.' });
    }
    res.status(500).json({ error: `서버 오류: ${err.message}` });
  }
});

// ── 매매/전세 응답 메모리 캐시 ────────────────────────────────────────────────
const _tradeCache = new Map(); // 'lawdCd|dealYmd' → response payload
const _rentCache  = new Map();

// ── 아파트 전월세 (순전세) ────────────────────────────────────────────────────
const RENT_API_BASE = 'http://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent';

async function fetchRentPage(lawdCd, dealYmd, pageNo) {
  const url = `${RENT_API_BASE}?serviceKey=${SERVICE_KEY_ENC}` +
    `&LAWD_CD=${lawdCd}&DEAL_YMD=${dealYmd}&pageNo=${pageNo}&numOfRows=${PAGE_SIZE}`;
  const response = await axios.get(url, {
    timeout: 20000,
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/xml, text/xml, */*' },
  });
  const raw = response.data || '';
  if (typeof raw === 'string' && raw.trim().startsWith('[')) {
    let e; try { e = JSON.parse(raw); } catch (_) {}
    throw Object.assign(new Error(`공공API 오류: ${e?.[0]?.errMsg || raw.slice(0,200)}`), { isApiError: true });
  }
  const parser = new xml2js.Parser({ explicitArray: false, trim: true });
  const result = await parser.parseStringPromise(raw);
  const header = result?.response?.header;
  const code = String(header?.resultCode || '');
  if (code && code !== '00' && code !== '000') {
    throw Object.assign(new Error(`API 오류 [${code}]: ${header?.resultMsg}`), { isApiError: true });
  }
  const body = result?.response?.body;
  let items = body?.items?.item || [];
  if (!Array.isArray(items)) items = items ? [items] : [];
  return { totalCount: parseInt(body?.totalCount || 0, 10), items };
}

function mapRents(items) {
  return items
    .map(item => ({
      aptName:   item.aptNm       || '',
      area:      parseFloat(item.excluUseAr || '0'),
      deposit:   parseInt((item.deposit     || '0').replace(/[,\s]/g, ''), 10),
      monthly:   parseInt((item.monthlyRent || '0').replace(/[,\s]/g, ''), 10),
      dong:      item.umdNm || '',
      dealYear:  item.dealYear  || '',
      dealMonth: String(item.dealMonth || '').padStart(2, '0'),
    }))
    .filter(r => r.aptName && r.deposit > 0 && r.monthly === 0); // 순전세만
}

app.get('/api/apt-rent', async (req, res) => {
  const { lawd_cd, deal_ymd } = req.query;
  if (!lawd_cd || !deal_ymd) return res.status(400).json({ error: '파라미터 없음' });

  const cacheKey = `${lawd_cd}|${deal_ymd}`;
  if (_rentCache.has(cacheKey)) {
    return res.json({ ..._rentCache.get(cacheKey), cached: true });
  }

  try {
    const first = await fetchRentPage(lawd_cd, deal_ymd, 1);
    let allItems = [...first.items];
    if (first.totalCount > PAGE_SIZE) {
      const extra = Math.min(Math.ceil((first.totalCount - PAGE_SIZE) / PAGE_SIZE), 9);
      const pageNums = Array.from({ length: extra }, (_, i) => i + 2);
      const pages = await Promise.all(pageNums.map(p => fetchRentPage(lawd_cd, deal_ymd, p)));
      pages.forEach(p => { allItems = allItems.concat(p.items); });
    }
    const rents = mapRents(allItems);
    const payload = { totalCount: first.totalCount, fetched: rents.length, rents };
    _rentCache.set(cacheKey, payload);
    res.json(payload);
  } catch (err) {
    console.error('[Rent API Error]', err.message);
    if (err.isApiError) return res.status(502).json({ error: err.message });
    if (err.response?.status === 403 || err.response?.status === 401) {
      return res.status(502).json({
        error: '전세 API 접근 거부 (403) — data.go.kr 마이페이지에서 "국토교통부 아파트 전월세 자료" 서비스 신청을 별도로 해주세요.',
      });
    }
    if (err.response?.status === 400) {
      return res.status(502).json({
        error: '공공API 요청 거부 (400) — data.go.kr 마이페이지에서 전월세 API 신청 여부를 확인하세요.',
      });
    }
    res.status(500).json({ error: `전세 조회 오류: ${err.message}` });
  }
});

// ── 건축물대장 전유공용면적 (건축HUB 기준) ────────────────────────────────────
const BLDG_HUB_API = 'https://apis.data.go.kr/1613000/BldRgstHubService/getBrExposPubuseAreaInfo';

// bjdongCd 탐색 캐시: 'sigunguCd|bun|ji' → bjdongCd
const _bjdongCache = {};
// 단지별 areaMap 캐시: 'sigunguCd|bjdongCd|bun|ji' → { areaMap, count }
const _areaMapCache = {};

// sigunguCd + bun + ji로 건축HUB에서 bjdongCd를 자동 탐색 (배치 처리로 429 방지)
async function findBjdongCd(sigunguCd, bun, ji) {
  const cacheKey = `${sigunguCd}|${bun}|${ji}`;
  if (_bjdongCache[cacheKey]) return _bjdongCache[cacheKey];

  const candidates = [];
  for (let i = 10000; i <= 25000; i += 500) candidates.push(String(i));

  const BATCH = 5;
  for (let i = 0; i < candidates.length; i += BATCH) {
    const batch = candidates.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async bjd => {
        try {
          const url = `${BLDG_HUB_API}?serviceKey=${SERVICE_KEY_ENC}` +
            `&sigunguCd=${sigunguCd}&bjdongCd=${bjd}&platGbCd=0` +
            `&bun=${bun}&ji=${ji}&numOfRows=1&pageNo=1&_type=json`;
          const r = await axios.get(url, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
          const cnt = parseInt(r.data?.response?.body?.totalCount || 0);
          return { bjd, cnt };
        } catch { return { bjd, cnt: 0 }; }
      })
    );
    const found = results.find(r => r.cnt > 0);
    if (found) {
      _bjdongCache[cacheKey] = found.bjd;
      console.log(`[Bldg bjdong 캐시] ${cacheKey} → ${found.bjd}`);
      return found.bjd;
    }
    if (i + BATCH < candidates.length) await new Promise(r => setTimeout(r, 200));
  }

  return null;
}

// bjdongCd + bun + ji로 전유공용 면적 items 전체 조회 (페이지네이션)
async function fetchBldgItems(sigunguCd, bjdongCd, bun, ji) {
  const PAGE_SIZE = 1000;
  const baseUrl = `${BLDG_HUB_API}?serviceKey=${SERVICE_KEY_ENC}` +
    `&sigunguCd=${sigunguCd}&bjdongCd=${bjdongCd}&platGbCd=0` +
    `&bun=${bun}&ji=${ji}&numOfRows=${PAGE_SIZE}&_type=json`;

  let all = [];
  let page = 1;
  let totalCount = null;

  while (true) {
    const url = `${baseUrl}&pageNo=${page}`;
    const r = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });

    const code = String(r.data?.response?.header?.resultCode || '');
    if (code && code !== '00' && code !== '000') {
      throw Object.assign(new Error(`건축HUB API 오류[${code}]: ${r.data?.response?.header?.resultMsg}`), { isApiError: true });
    }

    if (totalCount === null) {
      totalCount = parseInt(r.data?.response?.body?.totalCount || 0);
      console.log(`[Bldg fetchItems] totalCount=${totalCount}`);
    }

    let items = r.data?.response?.body?.items?.item || [];
    if (!Array.isArray(items)) items = items ? [items] : [];
    if (items.length === 0) break;

    all = all.concat(items);
    if (all.length >= totalCount) break;
    page++;
  }

  return all;
}

// 전유(1)/주거공용(2) 면적 합산 → 전용면적별 공급면적 맵 생성
function calcAreaMap(items) {
  // 1차: 호별 전유부 용도명 수집 (공용부 매칭 기준)
  const purposeByHo = {};
  items.forEach(item => {
    if (String(item.exposPubuseGbCd) === '1') {
      const key = `${item.dongNm || ''}_${item.hoNm || ''}`;
      purposeByHo[key] = item.mainPurpsCdNm || '';
    }
  });

  const hoMap = {};
  items.forEach(item => {
    const key = `${item.dongNm || ''}_${item.hoNm || ''}`;
    if (!hoMap[key]) hoMap[key] = { exclu: 0, pub: 0 };
    const area = parseFloat(item.area || 0);
    if (String(item.exposPubuseGbCd) === '1') {
      hoMap[key].exclu += area;
    } else if (String(item.exposPubuseGbCd) === '2') {
      // 전유부와 같은 용도명(예: 아파트)의 공용만 주거공용으로 포함
      // 부대시설(주차장·관리사무소)은 기타공용이므로 제외
      if (item.mainPurpsCdNm && item.mainPurpsCdNm === purposeByHo[key]) {
        hoMap[key].pub += area;
      }
    }
  });

  // 전용면적(소수 1자리) 단위로 그룹핑 → 평균 공급면적 산출
  const groups = {};
  Object.values(hoMap).forEach(ho => {
    if (ho.exclu <= 0) return;
    const k = String(Math.round(ho.exclu * 10) / 10);
    if (!groups[k]) groups[k] = [];
    groups[k].push(ho);
  });

  const areaMap = {};
  Object.entries(groups).forEach(([k, units]) => {
    const avgExclu = units.reduce((s, u) => s + u.exclu, 0) / units.length;
    const avgPub   = units.reduce((s, u) => s + u.pub,  0) / units.length;
    areaMap[k] = {
      exclu:  Math.round(avgExclu * 100) / 100,
      pub:    Math.round(avgPub   * 100) / 100,
      supply: Math.round((avgExclu + avgPub) * 10) / 10,
    };
  });

  return areaMap;
}

app.get('/api/building-area', async (req, res) => {
  const { sigunguCd, bjdongCd: bjdParam, bun, ji } = req.query;
  if (!sigunguCd || !bun) return res.status(400).json({ error: '파라미터 부족 (sigunguCd, bun 필수)' });

  const bunPad = String(bun).padStart(4, '0');
  const jiPad  = String(ji || '0').padStart(4, '0');

  try {
    // bjdongCd가 전달되지 않으면 자동 탐색
    let bjdongCd = bjdParam || await findBjdongCd(sigunguCd, bunPad, jiPad);
    if (!bjdongCd) {
      console.log(`[Bldg API] bjdongCd 탐색 실패 - sigunguCd=${sigunguCd} bun=${bunPad}`);
      return res.json({ areaMap: {}, count: 0 });
    }

    const serverCacheKey = `${sigunguCd}|${bjdongCd}|${bunPad}|${jiPad}`;
    if (_areaMapCache[serverCacheKey]) {
      console.log(`[Bldg API 캐시 hit] ${serverCacheKey}`);
      return res.json({ ..._areaMapCache[serverCacheKey], bjdongCd, cached: true });
    }

    console.log(`[Bldg API] sigunguCd=${sigunguCd} bjdongCd=${bjdongCd} bun=${bunPad} ji=${jiPad}`);
    const items = await fetchBldgItems(sigunguCd, bjdongCd, bunPad, jiPad);
    console.log(`[Bldg API] items=${items.length}`);

    const areaMap = calcAreaMap(items);
    _areaMapCache[serverCacheKey] = { areaMap, count: items.length };
    res.json({ areaMap, count: items.length, bjdongCd });

  } catch (err) {
    console.error('[Bldg API]', err.message);
    if (err.isApiError) return res.status(502).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log('\n================================');
  console.log('  🏠 부동산 대출 분석기 시작');
  console.log(`  👉 http://localhost:${PORT}`);
  console.log('================================\n');
});
