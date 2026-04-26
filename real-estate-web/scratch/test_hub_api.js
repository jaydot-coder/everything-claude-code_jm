const axios = require('axios');

const SERVICE_KEY_ENC = 'pHwAwOqY5MgPmKutn6Tmyp%2FxKHQfzEzPDxc6hZIGGrInArN0o0Xe7aIgmM7zUcVmXai1BlKSZq1YJ%2FaKUJmQig%3D%3D';
const BLDG_HUB_API = 'http://apis.data.go.kr/1613000/BldRgstHubService/getBrExposInfo';

async function testHubApi() {
  const sigunguCd = '41590'; // 화성시
  // 동탄은 신도시 개발로 인해 관련 주소에 여러 변형이 있을 수 있습니다.
  // 예를 들어 41590 26200 동탄동 등. 
  // 여기서는 오산동 코드를 시도하거나 생략하여 검색해봅니다.
  // 12900은 오산동 법정동 코드.
  const bjdongCd = '12900'; 
  const bun = '0973';
  const ji = '0000';

  const decodedKey = decodeURIComponent(SERVICE_KEY_ENC);

  console.log(`Testing with Decoded Key...`);
  
  // 1. Using axios params object to let axios handle URL encoding correctly
  try {
    const response = await axios.get(BLDG_HUB_API, {
      params: {
        serviceKey: decodedKey,
        sigunguCd: sigunguCd,
        bjdongCd: bjdongCd,
        platGbCd: '0',
        bun: bun,
        ji: ji,
        numOfRows: 100,
        pageNo: 1
      },
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    console.log('Result Data Type:', typeof response.data);
    const dataStr = typeof response.data === 'object' ? JSON.stringify(response.data) : response.data;
    console.log('Response excerpt:', dataStr.substring(0, 300));
    
    if (response.data && response.data.body) {
         console.log('Total count:', response.data.body.totalCount);
         const items = response.data.body.items?.item || [];
         console.log(`Found ${items.length} items`);
         if (items.length > 0) {
             console.log('Sample item:', items[0].dongNm, items[0].hoNm, items[0].area, items[0].exposPubuseGbCd);
         }
    }
  } catch(e) {
    console.error(`Error:`, e.message);
  }
}

testHubApi();
