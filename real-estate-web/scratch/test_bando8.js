const axios = require('axios');

const SERVICE_KEY_ENC = 'pHwAwOqY5MgPmKutn6Tmyp%2FxKHQfzEzPDxc6hZIGGrInArN0o0Xe7aIgmM7zUcVmXai1BlKSZq1YJ%2FaKUJmQig%3D%3D';
const BLDG_HUB_API = 'http://apis.data.go.kr/1613000/BldRgstService/getBrExposInfo';

async function testApi() {
  const sigunguCd = '41590';
  const bun = '0745';
  const ji = '0000';

  const decodedKey = decodeURIComponent(SERVICE_KEY_ENC);

  try {
    const url = `${BLDG_HUB_API}?serviceKey=${SERVICE_KEY_ENC}&sigunguCd=${sigunguCd}&platGbCd=0&bun=${bun}&ji=${ji}&numOfRows=100&pageNo=1&_type=json`;
    console.log('Query:', url);
    const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    console.log(response.data);
  } catch(e) {
    console.log(e.response ? e.response.status : e.message);
  }
}
testApi();
