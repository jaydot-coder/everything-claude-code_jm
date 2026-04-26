const axios = require('axios');
const xml2js = require('xml2js');

const SERVICE_KEY_ENC = 'pHwAwOqY5MgPmKutn6Tmyp%2FxKHQfzEzPDxc6hZIGGrInArN0o0Xe7aIgmM7zUcVmXai1BlKSZq1YJ%2FaKUJmQig%3D%3D';
const API_BASE = 'http://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade';

async function testTradeApi() {
  const lawdCd = '41597'; // 화성시 (동탄2신도시)
  const dealYmd = '202401';
  const url = `${API_BASE}?serviceKey=${SERVICE_KEY_ENC}&LAWD_CD=${lawdCd}&DEAL_YMD=${dealYmd}&pageNo=1&numOfRows=1000`;

  console.log('Testing Trade API URL:', url);

  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/xml, text/xml, */*' },
    });

    const raw = response.data || '';
    const parser = new xml2js.Parser({ explicitArray: false, trim: true });
    const result = await parser.parseStringPromise(raw);
    const body = result?.response?.body;
    let items = body?.items?.item || [];
    if (!Array.isArray(items)) items = items ? [items] : [];

    console.log('Result Count:', items.length);
    if (items.length > 0) {
      console.log('Sample Data (first 10):', items.slice(0, 10).map(i => ({ apt: i.aptNm, dong: i.umdNm, jibun: i.jibun, sgg: i.sggCd, umd: i.umdCd, area: i.excluUseAr })));
    }
  } catch (err) {
    console.error('Trade API Test Failed:', err.message);
  }
}

testTradeApi();
