param([string]$NodeExe = 'node')
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
Push-Location $taskRoot
try {
    $taskStatus = git status --porcelain
    if ($LASTEXITCODE -ne 0) { throw 'Cannot read repository status.' }
    if ($taskStatus) { throw 'Commit or preserve pending changes before packaging an exact source revision.' }
    $taskCommit = (git rev-parse HEAD).Trim()
    $taskVersion = & $NodeExe -p 'process.versions.node'
    if ($LASTEXITCODE -ne 0) { throw 'Use a Node runtime supported by angular/package.json.' }
    $env:NG_CLI_ANALYTICS = 'false'
    Push-Location angular
    try {
        & $NodeExe node_modules/@angular/cli/bin/ng.js build public
        if ($LASTEXITCODE -ne 0) { throw 'Public production build failed.' }
    } finally { Pop-Location }
    $taskOutput = Join-Path $taskRoot ('submission/user1-local-delivery-' + $taskCommit.Substring(0,7) + '-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
    New-Item -ItemType Directory -Path $taskOutput | Out-Null
    $taskStage = Join-Path $taskOutput 'public-root'
    New-Item -ItemType Directory -Path $taskStage | Out-Null
    Get-ChildItem -LiteralPath (Join-Path $taskRoot 'angular/dist/public/browser') -Force | Copy-Item -Destination $taskStage -Recurse
    $taskLicense = Join-Path $taskRoot 'angular/dist/public/3rdpartylicenses.txt'
    if (Test-Path -LiteralPath $taskLicense) { Copy-Item -LiteralPath $taskLicense -Destination $taskStage }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $taskDeployZip = Join-Path $taskOutput 'user1-public-built.zip'
    [IO.Compression.ZipFile]::CreateFromDirectory($taskStage, $taskDeployZip)
    $taskSourceZip = Join-Path $taskOutput 'A3-complete-source.zip'
    git -c core.autocrlf=false archive --format=zip --prefix=PROG2002-A3/ "--output=$taskSourceZip" $taskCommit
    if ($LASTEXITCODE -ne 0) { throw 'Source archive failed.' }
    $taskApiZip = Join-Path $taskOutput 'A3-api-database-source.zip'
    git -c core.autocrlf=false archive --format=zip "--output=$taskApiZip" $taskCommit api database
    if ($LASTEXITCODE -ne 0) { throw 'API/database archive failed.' }
    $taskFiles = @(Get-ChildItem -LiteralPath $taskStage -File -Recurse | ForEach-Object {
        [pscustomobject]@{ path=$_.FullName.Substring($taskStage.Length+1).Replace('\','/'); bytes=$_.Length; sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash }
    })
    $taskArchives = @($taskDeployZip,$taskSourceZip,$taskApiZip | ForEach-Object {
        [pscustomobject]@{name=[IO.Path]::GetFileName($_);sha256=(Get-FileHash -LiteralPath $_ -Algorithm SHA256).Hash;bytes=(Get-Item -LiteralPath $_).Length}
    })
    [pscustomobject]@{ sourceCommit=$taskCommit;branch=(git branch --show-current);builtAtUtc=[DateTime]::UtcNow.ToString('o');node=$taskVersion;publicBaseHref='/';apiBase='/api';uploaded=$false;deployed=$false;archives=$taskArchives;publicFiles=$taskFiles } |
        ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $taskOutput 'manifest.json') -Encoding utf8
    Copy-Item -LiteralPath (Join-Path $taskRoot 'docs/user1-angular-handoff.md') -Destination $taskOutput
    Write-Output "Local delivery: $taskOutput"
} finally { Pop-Location }
