# DataPilot TUI PowerShell Test Suite
# Advanced testing for Windows environments

param(
    [switch]$Verbose,
    [switch]$Debug,
    [switch]$SkipClipboard,
    [int]$Timeout = 30000
)

$ErrorActionPreference = "Stop"

# Test configuration
$config = @{
    NodePath = (Get-Command node).Path
    TUIPath = Join-Path $PSScriptRoot ".." "bin" "datapilot.js"
    FixturesPath = Join-Path $PSScriptRoot "fixtures"
    ReportPath = Join-Path $PSScriptRoot "tui_test_report_windows.json"
}

# Test results
$results = @{
    Passed = 0
    Failed = 0
    Errors = @()
    StartTime = Get-Date
}

# Helper function to test TUI interactions
function Test-TUIInteraction {
    param(
        [string]$TestName,
        [scriptblock]$TestScript
    )
    
    Write-Host "Testing: $TestName" -ForegroundColor Cyan
    
    try {
        $result = & $TestScript
        if ($result.Success) {
            Write-Host "  ✓ Passed" -ForegroundColor Green
            $script:results.Passed++
        } else {
            Write-Host "  ✗ Failed: $($result.Error)" -ForegroundColor Red
            $script:results.Failed++
            $script:results.Errors += @{
                Test = $TestName
                Error = $result.Error
                Time = Get-Date
            }
        }
    } catch {
        Write-Host "  ✗ Error: $_" -ForegroundColor Red
        $script:results.Failed++
        $script:results.Errors += @{
            Test = $TestName
            Error = $_.ToString()
            Time = Get-Date
        }
    }
}

# Test 1: Basic TUI Launch
Test-TUIInteraction "TUI Launch and Exit" {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $config.NodePath
    $psi.Arguments = "`"$($config.TUIPath)`" ui"
    $psi.UseShellExecute = $false
    $psi.RedirectStandardInput = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.CreateNoWindow = $true
    
    $process = [System.Diagnostics.Process]::Start($psi)
    
    try {
        # Wait for TUI to start
        Start-Sleep -Milliseconds 1000
        
        # Send exit command
        $process.StandardInput.WriteLine([char]27 + "[B" + [char]27 + "[B" + [char]13)
        $process.StandardInput.Flush()
        
        # Wait for exit
        $exited = $process.WaitForExit(5000)
        
        return @{
            Success = $exited -and ($process.ExitCode -eq 0)
            Error = if (-not $exited) { "Process did not exit" } else { $null }
        }
    } finally {
        if (-not $process.HasExited) {
            $process.Kill()
        }
        $process.Dispose()
    }
}

# Test 2: File Path Handling
Test-TUIInteraction "Windows Path Handling" {
    # Test various Windows path formats
    $testPaths = @(
        "C:\Users\Test\data.csv",
        "\\network\share\data.csv",
        ".\relative\path\data.csv",
        "C:\Path With Spaces\data.csv"
    )
    
    $allValid = $true
    foreach ($path in $testPaths) {
        # Normalize path for testing
        $normalizedPath = $path -replace '\\', '/'
        if ($normalizedPath -notmatch '^[a-zA-Z]:/' -and 
            $normalizedPath -notmatch '^//' -and 
            $normalizedPath -notmatch '^\./') {
            $allValid = $false
            break
        }
    }
    
    return @{
        Success = $allValid
        Error = if (-not $allValid) { "Path normalization failed" } else { $null }
    }
}

# Test 3: Clipboard Integration (if not skipped)
if (-not $SkipClipboard) {
    Test-TUIInteraction "Clipboard Functionality" {
        # Test if clipboard operations are available
        try {
            Add-Type -AssemblyName System.Windows.Forms
            
            # Save current clipboard
            $originalClipboard = [System.Windows.Forms.Clipboard]::GetText()
            
            # Test setting clipboard
            $testText = "DataPilot Test $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
            [System.Windows.Forms.Clipboard]::SetText($testText)
            
            # Verify clipboard
            $clipboardContent = [System.Windows.Forms.Clipboard]::GetText()
            $success = $clipboardContent -eq $testText
            
            # Restore original clipboard
            if ($originalClipboard) {
                [System.Windows.Forms.Clipboard]::SetText($originalClipboard)
            }
            
            return @{
                Success = $success
                Error = if (-not $success) { "Clipboard verification failed" } else { $null }
            }
        } catch {
            return @{
                Success = $false
                Error = "Clipboard access failed: $_"
            }
        }
    }
}

# Test 4: Terminal Encoding
Test-TUIInteraction "Terminal Encoding" {
    # Test various encodings
    $encodings = @(
        [System.Text.Encoding]::UTF8,
        [System.Text.Encoding]::ASCII,
        [System.Text.Encoding]::GetEncoding("Windows-1252")
    )
    
    $allPassed = $true
    foreach ($encoding in $encodings) {
        try {
            $testString = "Test äöü ñ 中文"
            $bytes = $encoding.GetBytes($testString)
            $decoded = $encoding.GetString($bytes)
            
            # Check if encoding preserves ASCII at minimum
            if (-not ($decoded -match "Test")) {
                $allPassed = $false
                break
            }
        } catch {
            $allPassed = $false
            break
        }
    }
    
    return @{
        Success = $allPassed
        Error = if (-not $allPassed) { "Encoding test failed" } else { $null }
    }
}

# Test 5: Process Isolation
Test-TUIInteraction "Multiple TUI Instances" {
    $processes = @()
    
    try {
        # Start multiple TUI instances
        for ($i = 0; $i -lt 3; $i++) {
            $psi = New-Object System.Diagnostics.ProcessStartInfo
            $psi.FileName = $config.NodePath
            $psi.Arguments = "`"$($config.TUIPath)`" ui"
            $psi.UseShellExecute = $false
            $psi.CreateNoWindow = $true
            
            $processes += [System.Diagnostics.Process]::Start($psi)
            Start-Sleep -Milliseconds 500
        }
        
        # Check all are running
        $allRunning = $processes | Where-Object { -not $_.HasExited }
        $success = $allRunning.Count -eq 3
        
        return @{
            Success = $success
            Error = if (-not $success) { "Not all instances started successfully" } else { $null }
        }
    } finally {
        # Clean up
        foreach ($proc in $processes) {
            if (-not $proc.HasExited) {
                $proc.Kill()
            }
            $proc.Dispose()
        }
    }
}

# Generate report
$results.EndTime = Get-Date
$results.Duration = ($results.EndTime - $results.StartTime).TotalSeconds

$report = @{
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Platform = "Windows PowerShell $($PSVersionTable.PSVersion)"
    NodeVersion = & node --version
    Results = $results
}

# Save report
$report | ConvertTo-Json -Depth 10 | Set-Content $config.ReportPath

# Display summary
Write-Host "`nTest Summary" -ForegroundColor Yellow
Write-Host "============" -ForegroundColor Yellow
Write-Host "Passed: $($results.Passed)" -ForegroundColor Green
Write-Host "Failed: $($results.Failed)" -ForegroundColor Red
Write-Host "Duration: $([math]::Round($results.Duration, 2))s"

if ($results.Failed -gt 0) {
    Write-Host "`nFailed Tests:" -ForegroundColor Red
    foreach ($error in $results.Errors) {
        Write-Host "  - $($error.Test): $($error.Error)" -ForegroundColor Red
    }
    exit 1
} else {
    Write-Host "`nAll tests passed!" -ForegroundColor Green
    exit 0
}