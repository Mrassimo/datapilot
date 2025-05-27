# DataPilot PowerShell Module
# Save this as DataPilot.psm1 in your PowerShell modules directory
# Or add to your PowerShell profile

$global:DataPilotPath = "C:\Users\61414\Documents\Code\datapilot"

function datapilot {
    <#
    .SYNOPSIS
    DataPilot - CSV analysis tool optimized for LLM consumption
    
    .DESCRIPTION
    Transform CSV chaos into crystal-clear insights with smart LLM-ready analysis
    
    .PARAMETER Arguments
    All arguments to pass to DataPilot
    
    .EXAMPLE
    datapilot all mydata.csv
    
    .EXAMPLE
    datapilot ui
    
    .EXAMPLE
    datapilot all "C:\My Data\sales report.csv" -o analysis.txt
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

# Create aliases for common commands
function dp { datapilot @args }
function dpui { datapilot ui }
function dpall { datapilot all @args }
function dpeda { datapilot eda @args }

# Export functions
Export-ModuleMember -Function datapilot, dp, dpui, dpall, dpeda

Write-Host "DataPilot PowerShell module loaded!" -ForegroundColor Green
Write-Host "Commands available: datapilot, dp, dpui, dpall, dpeda" -ForegroundColor Cyan
