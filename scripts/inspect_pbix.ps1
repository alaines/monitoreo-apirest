Add-Type -AssemblyName System.IO.Compression.FileSystem
$pbixPath = "archive/GMU - Reportes .pbix"
$outDir = "$env:TEMP\pbix_extracted"
if (Test-Path $outDir) { Remove-Item $outDir -Recurse -Force }
New-Item -ItemType Directory -Path $outDir | Out-Null

$zip = [System.IO.Compression.ZipFile]::OpenRead($pbixPath)
foreach ($entry in $zip.Entries) {
    Write-Host "$($entry.FullName) ($($entry.Length) bytes)"
    if ($entry.FullName -eq "Report/Layout" -or $entry.FullName -eq "DataModelSchema" -or $entry.FullName -like "*.json" -or $entry.FullName -eq "DiagramState" -or $entry.FullName -eq "Connections") {
        $targetPath = Join-Path $outDir ($entry.FullName -replace '/', '\')
        $targetDir = Split-Path $targetPath -Parent
        if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $targetPath, $true)
    }
}
$zip.Dispose()
Write-Host "Extracted key metadata to $outDir"
