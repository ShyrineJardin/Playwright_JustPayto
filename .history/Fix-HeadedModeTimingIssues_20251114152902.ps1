#!/usr/bin/env powershell
# Fix-HeadedModeTimingIssues.ps1
# This script helps identify and fix timing issues in other test files

Write-Host "🔍 Scanning for Headed Mode Timing Issues..." -ForegroundColor Cyan
Write-Host ""

$testDirectory = "$PSScriptRoot/e2e_tests"
$paymentTests = Get-ChildItem -Path $testDirectory -Filter "*payment.spec.js" -Recurse

$testsNeedingFix = @()
$testsAlreadyFixed = @()

foreach ($test in $paymentTests) {
    $content = Get-Content $test.FullName -Raw
    
    # Check for error message checks without waits
    $pattern = 'await page\.(getByRole|getByText|locator|locator.*click)\([^)]+\)\.[^;]*;\s*const \w+Error = \(await page'
    
    if ($content -match $pattern) {
        # Check if it already has waitForTimeout before the error check
        if ($content -match 'await page\.waitForTimeout\(\d+\);\s*const \w+Error = \(await page') {
            $testsAlreadyFixed += $test.FullName
            Write-Host "✅ $($test.FullName) - Already has timing fixes" -ForegroundColor Green
        } else {
            $testsNeedingFix += $test.FullName
            Write-Host "⚠️  $($test.FullName) - Needs timing fixes" -ForegroundColor Yellow
        }
    } else {
        Write-Host "ℹ️  $($test.FullName) - No obvious patterns found" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Already Fixed: $($testsAlreadyFixed.Count)"
Write-Host "⚠️  Need Fixes: $($testsNeedingFix.Count)"
Write-Host "ℹ️  Total Test Files: $($paymentTests.Count)"

if ($testsNeedingFix.Count -gt 0) {
    Write-Host ""
    Write-Host "📋 FILES NEEDING FIXES:" -ForegroundColor Yellow
    foreach ($test in $testsNeedingFix) {
        Write-Host "  • $test" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "💡 FIX PATTERN:" -ForegroundColor Cyan
    Write-Host "  Look for: await page.<action>();`n            const <name>Error = (await page..."
    Write-Host "  Replace with: await page.<action>();`n               await page.waitForTimeout(500);`n               const <name>Error = (await page..."
}

if ($testsAlreadyFixed.Count -gt 0) {
    Write-Host ""
    Write-Host "✅ ALREADY FIXED:" -ForegroundColor Green
    foreach ($test in $testsAlreadyFixed) {
        Write-Host "  • $test" -ForegroundColor Green
    }
}
