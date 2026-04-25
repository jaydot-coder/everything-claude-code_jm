const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const path = require('path');

const app = express();
const PORT = 3000;

const SERVICE_KEY_ENC = 'pHwAwOqY5MgPmKutn6Tmyp%2FxKHQfzEzPDxc6hZIGGrInArN0o0Xe7aIgmM7zUcVmXai1BlKSZq1YJ%2FaKUJmQig%3D%3D';
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
    }))
    .filter(t => t.aptName && t.dealAmount > 0 && !t.cancelled);
}

app.get('/api/apt-trade', async (req, res) => {
  const { lawd_cd, deal_ymd } = req.query;
  if (!lawd_cd || !deal_ymd) {
    return res.status(400).json({ error: '지역코드와 거래월을 입력해주세요.' });
  }

  try {
    const first = await fetchAptPage(lawd_cd, deal_ymd, 1);
    let allItems = [...first.items];

    if (first.totalCount > PAGE_SIZE) {
      const extraPages = Math.min(Math.ceil((first.totalCount - PAGE_SIZE) / PAGE_SIZE), 9);
      for (let p = 2; p <= extraPages + 1; p++) {
        const page = await fetchAptPage(lawd_cd, deal_ymd, p);
        allItems = allItems.concat(page.items);
      }
    }

    const trades = mapTrades(allItems);
    res.json({ totalCount: first.totalCount, fetched: trades.length, trades });

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

app.listen(PORT, () => {
  console.log('\n================================');
  console.log('  🏠 부동산 대출 분석기 시작');
  console.log(`  👉 http://localhost:${PORT}`);
  console.log('================================\n');
});
