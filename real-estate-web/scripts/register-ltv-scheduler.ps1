# register-ltv-scheduler.ps1
# Windows 작업 스케줄러에 월 1일 LTV 정책 자동 업데이트 등록
# 실행: PowerShell 관리자 권한으로 .\scripts\register-ltv-scheduler.ps1

$TaskName   = "RealEstate_LTV_PolicyUpdate"
$ScriptPath = "C:\jm_first_coding\claudecode_jm\real-estate-web\scripts\check-ltv-policy.ps1"
$RunTime    = "09:07"  # 매월 1일 오전 9시 7분

# 기존 작업 있으면 제거
if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "기존 작업 제거됨." -ForegroundColor Yellow
}

$Action  = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NonInteractive -ExecutionPolicy Bypass -File `"$ScriptPath`""

# 매월 1일 오전 9시 7분
$Trigger = New-ScheduledTaskTrigger -Monthly -DaysOfMonth 1 -At $RunTime

$Settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable

$Principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType InteractiveToken `
    -RunLevel Limited

Register-ScheduledTask `
    -TaskName  $TaskName `
    -Action    $Action `
    -Trigger   $Trigger `
    -Settings  $Settings `
    -Principal $Principal `
    -Description "매월 1일: 주담대 LTV 정책 최신화 (금융위·국토부 공식 출처)" `
    -Force

Write-Host ""
Write-Host "✅ 작업 스케줄러 등록 완료!" -ForegroundColor Green
Write-Host "   작업명  : $TaskName" -ForegroundColor Cyan
Write-Host "   실행시각: 매월 1일 $RunTime" -ForegroundColor Cyan
Write-Host "   스크립트: $ScriptPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "확인: Get-ScheduledTask -TaskName '$TaskName' | Format-List"
Write-Host "수동실행: Start-ScheduledTask -TaskName '$TaskName'"
