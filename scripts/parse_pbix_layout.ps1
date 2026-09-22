$layoutFile = "$env:TEMP\pbix_extracted\Report\Layout"
$bytes = [System.IO.File]::ReadAllBytes($layoutFile)
# Try UTF-16LE, if starts with FF FE or null bytes, otherwise UTF-8
$text = ""
if ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xFE) {
    $text = [System.Text.Encoding]::Unicode.GetString($bytes)
} elseif ($bytes[1] -eq 0x00) {
    $text = [System.Text.Encoding]::Unicode.GetString($bytes)
} else {
    $text = [System.Text.Encoding]::UTF8.GetString($bytes)
}

$layout = $text | ConvertFrom-Json

Write-Host "=== PBIX REPORT OVERVIEW ==="
Write-Host "Total Sections (Pages): $($layout.sections.Count)"
foreach ($sec in $layout.sections) {
    Write-Host "`n----------------------------------------"
    Write-Host "Page Name: $($sec.name)"
    Write-Host "Page Display Name: $($sec.displayName)"
    Write-Host "Visuals Count: $($sec.visualContainers.Count)"
    
    foreach ($vc in $sec.visualContainers) {
        $config = $vc.config | ConvertFrom-Json
        $visualType = $config.singleVisual.visualType
        $title = ""
        if ($config.singleVisual.vcObjects.title) {
            $title = $config.singleVisual.vcObjects.title[0].properties.text.expr.Literal.Value
        }
        $projections = $config.singleVisual.projections
        Write-Host "  - Visual: [$visualType] Title: '$title'"
    }
}
