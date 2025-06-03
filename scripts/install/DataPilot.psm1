# DataPilot PowerShell Module v2.0
# AI-Companion Statistical Computation Engine
# Save this as DataPilot.psm1 in your PowerShell modules directory

$global:DataPilotPath = "DATAPILOT_PATH_PLACEHOLDER"

function datapilot {
    <#
    .SYNOPSIS
    DataPilot 2.0 - AI-Companion Statistical Computation Engine
    
    .DESCRIPTION
    Pure statistical computation optimized for AI interpretation.
    "DataPilot does the math, AI does the meaning"
    
    .PARAMETER Arguments
    All arguments to pass to DataPilot
    
    .EXAMPLE
    datapilot run mydata.csv
    # Statistical analysis with 60+ tests
    
    .EXAMPLE
    datapilot vis mydata.csv
    # 29 advanced visualization recommendations
    
    .EXAMPLE
    datapilot all mydata.csv
    # Complete analysis (run + vis)
    #>
    
    param(
        [Parameter(ValueFromRemainingArguments=$true)]
        [string[]]$Arguments
    )
    
    # Check if DataPilot exists
    if (-not (Test-Path "$global:DataPilotPath\dist\datapilot.js")) {
        Write-Error "DataPilot not found at $global:DataPilotPath"
        Write-Host "Please update the DataPilotPath variable"
        return
    }
    
    # Run DataPilot
    & node "$global:DataPilotPath\dist\datapilot.js" $Arguments
}

# Create aliases for 3-command structure
function dp { datapilot @args }
function dprun { datapilot run @args }
function dpvis { datapilot vis @args }
function dpall { datapilot all @args }

# Export functions
Export-ModuleMember -Function datapilot, dp, dprun, dpvis, dpall

Write-Host "🤖 DataPilot 2.0 PowerShell module loaded!" -ForegroundColor Green
Write-Host "📊 AI-Companion Statistical Engine Ready" -ForegroundColor Cyan
Write-Host "Commands: datapilot, dp, dprun, dpvis, dpall" -ForegroundColor Yellow
