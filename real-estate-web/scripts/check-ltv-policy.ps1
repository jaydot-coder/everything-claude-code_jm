# check-ltv-policy.ps1
# 매월 1일 실행 — 주담대 LTV 정책 최신화
# Windows 작업 스케줄러 등록 방법:
#   PowerShell 관리자 권한으로:
#   .\scripts\register-ltv-scheduler.ps1

$ProjectDir = "C:\jm_first_coding\claudecode_jm\real-estate-web"
$ClaudeCli  = "C:\Users\jamin\.local\bin\claude.exe"
$LogFile    = "$ProjectDir\scripts\ltv-policy-update.log"

$Prompt = @'
매월 1일 주담대 LTV 정책 자동 점검 및 업데이트 태스크.

대상 파일: C:\jm_first_coding\claudecode_jm\real-estate-web\public\app.js

## 작업 순서

### 1단계: 공식 출처에서 최신 정책 확인

아래 신뢰할 수 있는 공식 기관 출처만 사용 (WebSearch 활용):
- 금융위원회 보도자료 (fsc.go.kr) — LTV/DSR 규제 변경
- 국토교통부 보도자료 (molit.go.kr) — 규제지역 지정·해제
- 금융감독원 보도자료 (fss.or.kr) — 금융 규제 현황
- 주택금융공사 (hf.go.kr) — 생애최초 특례 한도

WebSearch 검색어:
1. "투기과열지구 지정 해제 최신 site:fsc.go.kr OR site:molit.go.kr"
2. "주택담보대출 LTV 한도 수도권 최신 site:fsc.go.kr OR site:fss.or.kr"
3. "토지거래허가구역 지정 최신 site:molit.go.kr"

### 2단계: 확인 항목

1. 투기과열지구 목록 — 서울 전역 유지? 경기 12곳(과천·광명·성남3·수원3·안양동안·용인수지·의왕·하남) 유지?
2. LTV 수치 — 투기과열 40% / 기타수도권 무주택 70% / 비수도권 70%(생애최초 80%) 변경?
3. 금액 한도 — 투기과열 15억이하 6억/15~25억 4억/25억↑ 2억, 기타수도권 6억 변경?
4. 토지거래허가구역 — 강남·서초·송파·용산·성동·광진 외 추가·해제?

### 3단계: app.js 수정

변경사항이 있으면 아래 항목 직접 수정:
- SEOUL_CODES, METRO_STRONG_ZONE, TOJI_ZONE Set
- getLtvPolicy(), getLoanAmountCap() 내 수치
- 상단 주석 기준일: // ── LTV 정책 (YYYY.MM.DD 기준)

변경 없으면: "✅ [날짜] 정책 점검 완료 — 변경 없음. 현행 유지." 출력.

## 규칙
- 공식 기관 원문만 근거로 사용. 뉴스 단독 수정 금지.
- 정책 원문 URL 반드시 포함.
- 확인 불가 항목은 수정 금지, "확인 필요" 표시.
'@

$Date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "[$Date] LTV 정책 점검 시작..." -ForegroundColor Cyan

Add-Content -Path $LogFile -Value "`n===== [$Date] 정책 점검 실행 =====" -Encoding utf8

# Claude CLI 실행 (--print: 비대화형 모드)
& $ClaudeCli --print $Prompt 2>&1 | Tee-Object -Append -FilePath $LogFile

$Date2 = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $LogFile -Value "===== [$Date2] 완료 =====" -Encoding utf8
Write-Host "[$Date2] 완료. 로그: $LogFile" -ForegroundColor Green
