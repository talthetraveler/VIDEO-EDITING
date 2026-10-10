param(
  [ValidateSet('Report','Recycle','Permanent')][string]$Mode='Report'
)
# Only checksum-verified individual files. No recursion, globs, or cloud writes.
$ErrorActionPreference='Stop'
$cleanupRoot='C:\Users\taldo\Downloads\videos to edit\system\projects\_frameio\cleanup-2026-10-07'
$proof=Get-Content -LiteralPath (Join-Path $cleanupRoot 'deletion-ready.json') -Raw | ConvertFrom-Json
$inventory=Get-Content -LiteralPath (Join-Path $cleanupRoot 'local-inventory.json') -Raw | ConvertFrom-Json
if ($proof.processed -ne $proof.total) { throw 'Verification is not complete; no deletion permitted.' }
$proofUtc=if ($proof.at -is [DateTime]) { $proof.at.ToUniversalTime() } else { [DateTimeOffset]::Parse([string]$proof.at).UtcDateTime }
if (((Get-Date).ToUniversalTime()-$proofUtc).TotalMinutes -gt 30) { throw 'Verification is stale. Refresh live checks before deleting.' }
$allowedRoots=@($inventory.roots | ForEach-Object { [IO.Path]::GetFullPath($_).TrimEnd('\')+'\' })
$targets=@()
foreach ($f in $proof.verified) {
  $full=[IO.Path]::GetFullPath([string]$f.path)
  if (-not ($allowedRoots | Where-Object { $full.StartsWith($_,[StringComparison]::OrdinalIgnoreCase) })) { throw "Out-of-scope path: $full" }
  if ($full -match '\\(OneDrive[^\\]*|iCloud[^\\]*|Dropbox)(\\|$)') { throw "Cloud-synced target excluded: $full" }
  if ($f.sha256 -notmatch '^[a-f0-9]{64}$' -or -not $f.cloud.id) { throw 'Missing content proof.' }
  if (-not $f.cloudVerifiedAt) { throw 'Missing refreshed cloud proof.' }
  if (-not (Test-Path -LiteralPath $full -PathType Leaf)) { continue }
  $item=Get-Item -LiteralPath $full
  if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Reparse-point target excluded: $full" }
  $parent=$item.Directory
  while ($null -ne $parent) {
    if ($parent.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Reparse-point ancestor excluded: $full" }
    $parent=$parent.Parent
  }
  if ($item.Length -ne $f.bytes) { throw "Size changed: $full" }
  $targets+=@{path=$full;bytes=$f.bytes;sha256=$f.sha256;cloudId=$f.cloud.id;cloudVariant=$f.cloud.kind}
}
$logicalBytes=($targets | Measure-Object -Property bytes -Sum).Sum
Write-Output (ConvertTo-Json @{mode=$Mode;verifiedFiles=$targets.Count;logicalGB=[Math]::Round($logicalBytes/1e9,2);deletionStarted=$false} -Compress)
if ($Mode -eq 'Report') { exit 0 }
if ($Mode -eq 'Recycle') { Add-Type -AssemblyName Microsoft.VisualBasic }
$log=Join-Path $cleanupRoot 'deletion-log.jsonl'
$removed=0;$removedBytes=0
foreach ($f in $targets) {
  # Recheck exact content immediately before removal, rather than trust a name.
  $hash=Get-FileHash -LiteralPath $f.path -Algorithm SHA256
  if ($hash.Hash.ToLowerInvariant() -ne $f.sha256) { throw "Content changed; stopped before deletion: $($f.path)" }
  if ($Mode -eq 'Permanent') {
    Remove-Item -LiteralPath $f.path -ErrorAction Stop
  } else {
    [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($f.path,[Microsoft.VisualBasic.FileIO.UIOption]::OnlyErrorDialogs,[Microsoft.VisualBasic.FileIO.RecycleOption]::SendToRecycleBin,[Microsoft.VisualBasic.FileIO.UICancelOption]::ThrowException)
  }
  if (Test-Path -LiteralPath $f.path) { throw "Removal did not complete: $($f.path)" }
  $removed++;$removedBytes+=$f.bytes
  @{at=(Get-Date).ToUniversalTime().ToString('o');path=$f.path;bytes=$f.bytes;cloudId=$f.cloudId;cloudVariant=$f.cloudVariant;sha256=$f.sha256;mode=$Mode} | ConvertTo-Json -Compress | Add-Content -LiteralPath $log -Encoding utf8
  if ($removed % 25 -eq 0) { Write-Output (ConvertTo-Json @{removed=$removed;logicalGB=[Math]::Round($removedBytes/1e9,2)} -Compress) }
}
Write-Output (ConvertTo-Json @{complete=$true;removed=$removed;logicalGB=[Math]::Round($removedBytes/1e9,2);mode=$Mode;FrameIoModified=$false} -Compress)
