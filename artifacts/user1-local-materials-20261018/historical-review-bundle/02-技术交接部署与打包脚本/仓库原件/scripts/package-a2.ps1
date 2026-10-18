$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$outputRoot = Join-Path $projectRoot 'submission'
New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$clientFiles = @('assets/css/styles.css','assets/js/site.js','detail.html','index.html','README.md','search.html')
$apiFiles = @('.env.example','event_db.js','package-lock.json','package.json','README.md','server.js')

function Write-SourceArchive {
    param([string]$SourceDirectory, [string]$ArchiveName, [string[]]$FileList)
    foreach ($relative in $FileList) {
        if (-not (Test-Path -LiteralPath (Join-Path $SourceDirectory $relative) -PathType Leaf)) {
            throw "Missing package input: $relative"
        }
    }
    $archivePath = Join-Path $outputRoot $ArchiveName
    $stream = [IO.File]::Open($archivePath, [IO.FileMode]::Create, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
    $zip = New-Object IO.Compression.ZipArchive($stream, [IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($relative in $FileList) {
            [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, (Join-Path $SourceDirectory $relative), $relative, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
        }
    } finally {
        $zip.Dispose()
        $stream.Dispose()
    }
    return $archivePath
}

$clientZip = Write-SourceArchive (Join-Path $projectRoot 'clientside') 'Tianyi LiA2-clientside.zip' $clientFiles
$apiZip = Write-SourceArchive (Join-Path $projectRoot 'api') 'Tianyi LiA2-api.zip' $apiFiles
$sqlCopy = Join-Path $outputRoot 'charityevents_db.sql'
Copy-Item -LiteralPath (Join-Path $projectRoot 'database/charityevents_db.sql') -Destination $sqlCopy -Force

$sourceCommit = & git -C $projectRoot rev-parse HEAD
if ($LASTEXITCODE -ne 0) { throw 'Cannot identify the source commit' }
$pendingChanges = @(& git -C $projectRoot status --porcelain)
if ($LASTEXITCODE -ne 0) { throw 'Cannot check the working tree' }
$checksums = @()
$artifacts = @()
foreach ($artifactPath in @($clientZip,$apiZip,$sqlCopy)) {
    $item = Get-Item -LiteralPath $artifactPath
    $hash = (Get-FileHash -LiteralPath $artifactPath -Algorithm SHA256).Hash.ToLowerInvariant()
    $checksums += "$hash  $($item.Name)"
    $artifacts += [ordered]@{name=$item.Name; bytes=$item.Length; sha256=$hash}
}
$sourceFiles = @()
foreach ($relative in @($clientFiles | ForEach-Object { 'clientside/' + $_ }) + @($apiFiles | ForEach-Object { 'api/' + $_ }) + @('database/charityevents_db.sql')) {
    $sourceFiles += [ordered]@{path=$relative; sha256=(Get-FileHash -LiteralPath (Join-Path $projectRoot $relative) -Algorithm SHA256).Hash.ToLowerInvariant()}
}
$manifest = [ordered]@{
    author='Tianyi Li'; email='id_09188388@foxmail.com'; repository='https://github.com/zjsjsjjdjs/prog2002-charity-events';
    sourceCommit=$sourceCommit; workingTreeClean=($pendingChanges.Count -eq 0); generatedAtUtc=[DateTime]::UtcNow.ToString('o');
    artifacts=$artifacts; sourceFiles=$sourceFiles
}
[IO.File]::WriteAllText((Join-Path $outputRoot 'build-manifest.json'), ($manifest | ConvertTo-Json -Depth 6), [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllLines((Join-Path $outputRoot 'SHA256SUMS.txt'), $checksums, [Text.UTF8Encoding]::new($false))
if ($pendingChanges.Count -gt 0) { Write-Warning 'These packages include uncommitted work. Commit the reviewed version and rerun for final delivery.' }
Write-Output "Delivery artifacts: $outputRoot"
$artifacts | ForEach-Object { [pscustomobject]$_ } | Format-Table name,bytes,sha256 -AutoSize
