const axios = require('axios');
const xml2js = require('xml2js');

const SERVICE_KEY_ENC = 'pHwAwOqY5MgPmKutn6Tmyp%2FxKHQfzEzPDxc6hZIGGrInArN0o0Xe7aIgmM7zUcVmXai1BlKSZq1YJ%2FaKUJmQig%3D%3D';
const BLDG_EXPOS_API = 'https://apis.data.go.kr/1613000/BldRgstService/getBrExposInfo';

async function testApi() {
  const sigunguCd = '11680'; // 강남구
  const bun = '0670';
  const ji = '0000';

  const url = `${BLDG_EXPOS_API}?serviceKey=${SERVICE_KEY_ENC}` +
    `&sigunguCd=${sigunguCd}&platGbCd=0` +
    `&bun=${bun}&ji=${ji}&numOfRows=10&pageNo=1`;

  console.log('Testing URL:', url);

  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/xml, text/xml, */*' },
    });

    const raw = response.data || '';
    console.log('Raw response length:', raw.length);
    console.log('First 200 chars:', raw.slice(0, 200));

    const parser = new xml2js.Parser({ explicitArray: false, trim: true });
    const result = await parser.parseStringPromise(raw);
    const header = result?.response?.header;
    const code = String(header?.resultCode || '');

    console.log('Result Code:', code);
    console.log('Result Msg:', header?.resultMsg);

    if (code === '00' || code === '000') {
      const body = result?.response?.body;
      const count = body?.totalCount;
      console.log('Total Count:', count);
      if (count > 0) {
        console.log('First item successfully fetched!');
      } else {
        console.log('API call succeeded but no data found for this specific address.');
      }
    } else {
      console.error('API Error Response');
    }
  } catch (err) {
    console.error('Test Failed:', err.message);
  }
}

testApi();
