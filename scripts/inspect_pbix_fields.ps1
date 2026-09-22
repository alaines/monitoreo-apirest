$layoutFile = "$env:TEMP\pbix_extracted\Report\Layout"
$bytes = [System.IO.File]::ReadAllBytes($layoutFile)
$text = [System.Text.Encoding]::Unicode.GetString($bytes)
$layout = $text | ConvertFrom-Json

# Extract specific page details for SGF-KPI and SGF-MONITOREO
$targetPages = $layout.sections | Where-Object { $_.displayName -like "*SGF*" -or $_.displayName -like "*PROTRANSITO*" -or $_.displayName -like "*MOVILIDAD*" }

foreach ($page in $targetPages) {
    Write-Host "`n======================================================="
    Write-Host "PAGE: $($page.displayName) (Name: $($page.name))"
    Write-Host "======================================================="
    foreach ($vc in $page.visualContainers) {
        $config = $vc.config | ConvertFrom-Json
        $v = $config.singleVisual
        $vType = $v.visualType
        $title = if ($v.vcObjects.title) { $v.vcObjects.title[0].properties.text.expr.Literal.Value } else { "" }
        
        # Extract projection fields / measures
        $projections = $v.projections
        $fields = @()
        if ($projections) {
            foreach ($pKey in ($projections | Get-Member -MemberType NoteProperty).Name) {
                $pItems = $projections.$pKey
                foreach ($item in $pItems) {
                    $fields += "${pKey}: $($item.queryRef)"
                }
            }
        }
        Write-Host "  Visual [$vType] Title: '$title' | Fields: $($fields -join '; ')"
    }
}
