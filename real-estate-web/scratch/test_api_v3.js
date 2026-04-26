const axios = require('axios');
const xml2js = require('xml2js');

const SERVICE_KEY_ENC = 'pHwAwOqY5MgPmKutn6Tmyp%2FxKHQfzEzPDxc6hZIGGrInArN0o0Xe7aIgmM7zUcVmXai1BlKSZq1YJ%2FaKUJmQig%3D%3D';
const SERVICE_KEY_DEC = decodeURIComponent(SERVICE_KEY_ENC);
const BLDG_EXPOS_API = 'http://apis.data.go.kr/1613000/BldRgstService/getBrExposInfo';

async function testApi(key, label) {
  const sigunguCd = '11680'; // 강남구
  const bun = '0670';
  const ji = '0000';

  const url = `${BLDG_EXPOS_API}?serviceKey=${key}` +
    `&sigunguCd=${sigunguCd}&platGbCd=0` +
    `&bun=${bun}&ji=${ji}&numOfRows=10&pageNo=1`;

  console.log(`--- Testing with ${label} ---`);
  // console.log('URL:', url);

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/xml, text/xml, */*' },
    });

    const raw = response.data || '';
    if (typeof raw === 'string' && raw.includes('<resultCode>000</resultCode>')) {
      console.log('SUCCESS: API responded with 000');
      return true;
    } else {
      console.log('API Response (first 100):', raw.slice(0, 100).replace(/\n/g, ' '));
      return false;
    }
  } catch (err) {
    console.log(`FAILED: ${err.message}`);
    return false;
  }
}

async function runTests() {
  await testApi(SERVICE_KEY_ENC, 'Encoded Key');
  await testApi(SERVICE_KEY_DEC, 'Decoded Key');
}

runTests();
