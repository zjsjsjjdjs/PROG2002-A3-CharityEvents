param([Parameter(Mandatory=$true)][string]$ReleaseDirectory)
$ErrorActionPreference='Stop'
$repoRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$allowedRoot=[IO.Path]::GetFullPath((Join-Path $repoRoot 'submission'))+[IO.Path]::DirectorySeparatorChar
$resolved=[IO.Path]::GetFullPath($ReleaseDirectory)
if (-not $resolved.StartsWith($allowedRoot,[StringComparison]::OrdinalIgnoreCase)) { throw 'Release must be inside this repository submission directory.' }
if (-not (Test-Path -LiteralPath (Join-Path $resolved 'manifest.json'))) { throw 'Missing release manifest.' }
foreach ($package in Get-ChildItem -LiteralPath (Join-Path $resolved 'packages') -Directory) {
  $archive=Join-Path $resolved ($package.Name+'.zip')
  if (Test-Path -LiteralPath $archive) { throw "Archive already exists: $archive" }
  Compress-Archive -LiteralPath $package.FullName -DestinationPath $archive -CompressionLevel Optimal
  Get-FileHash -Algorithm SHA256 -LiteralPath $archive
}
$fullArchive=Join-Path $resolved 'complete-cpanel-release.zip'
if (Test-Path -LiteralPath $fullArchive) { throw 'Complete archive already exists.' }
# Copy only hashed runtime files; never include dependencies installed for verification.
$manifest=Get-Content -LiteralPath (Join-Path $resolved 'manifest.json') -Raw | ConvertFrom-Json
$clean=Join-Path $resolved 'clean-release'
if (Test-Path -LiteralPath $clean) { throw 'Clean release staging already exists.' }
New-Item -ItemType Directory -Path $clean | Out-Null
foreach ($entry in $manifest.files.PSObject.Properties) {
  $relative=$entry.Name
  if ($relative -match '(^|[\/])(\.env|node_modules|\.git)([\/]|$)' -or $relative -match '(^|[\/])\.\.([\/]|$)' -or [IO.Path]::IsPathRooted($relative)) { throw 'Unsafe manifest path.' }
  $source=Join-Path (Join-Path $resolved 'release') $relative
  if ((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.Value) { throw "Changed runtime file: $relative" }
  $target=Join-Path $clean $relative
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
  Copy-Item -LiteralPath $source -Destination $target
}
Compress-Archive -LiteralPath $clean -DestinationPath $fullArchive -CompressionLevel Optimal
Get-FileHash -Algorithm SHA256 -LiteralPath $fullArchive
