param([switch]$Delete)
$ErrorActionPreference='Stop'
# Explicit regenerable targets only. Never touch project databases, model weights,
# browser profiles, personal archives, Recycle Bin, or an entire Temp directory.
$targets=@(
 'C:\Users\taldo\AppData\Local\Temp\hf-render-6G1Npj',
 'C:\Users\taldo\AppData\Local\Temp\hf-render-F0yHKW',
 'C:\Users\taldo\AppData\Local\Temp\hf-render-pzngOP',
 'C:\Users\taldo\AppData\Local\Temp\hf-render-YSXmuO',
 'C:\Users\taldo\AppData\Local\Temp\hf-render-ZNJXxt',
 'C:\Users\taldo\AppData\Local\Temp\hyperframes-extract-cache-u',
 'C:\Users\taldo\AppData\Local\Temp\remotion-v4.0.520-assets0qthjdyl16',
 'C:\Users\taldo\AppData\Local\Temp\remotion-v4.0.520-assetsbrlniiukep',
 'C:\Users\taldo\AppData\Local\Temp\remotion-v4.0.520-assetscgfdgofcrg',
 'C:\Users\taldo\AppData\Local\Temp\remotion-v4.0.520-assetsip1rd6aho8',
 'C:\Users\taldo\AppData\Local\Temp\remotion-v4.0.520-assetsm7cawahy7n',
 'C:\Users\taldo\AppData\Local\Temp\remotion-v4.0.520-assetssak9mtfr06',
 'C:\Users\taldo\AppData\Local\npm-cache\_cacache',
 'C:\Users\taldo\AppData\Local\pip\cache\http-v2',
 'C:\Users\taldo\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Local\pip\cache\http-v2',
 'C:\Users\taldo\Downloads\Obsidian-1.13.7.exe',
 'C:\Users\taldo\Downloads\OpenChatCut-Pro_0.0.1_x64-setup.exe'
)
function Assert-SafePath([string]$p,[string]$root) {
 $full=[IO.Path]::GetFullPath($p);$base=[IO.Path]::GetFullPath($root)
 if ($full -ne $base -and -not $full.StartsWith($base.TrimEnd('\')+'\',[StringComparison]::OrdinalIgnoreCase)) {throw 'Target escaped exact allowed root'}
 $item=Get-Item -LiteralPath $full -Force
 while ($null -ne $item) {
  if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {throw "Reparse point excluded: $full"}
  $item=if ($item -is [IO.DirectoryInfo]) {$item.Parent} else {$item.Directory}
 }
 return $full
}
function Get-SafeFiles([string]$p,[string]$root) {
 $null=Assert-SafePath $p $root
 $item=Get-Item -LiteralPath $p -Force
 if (-not $item.PSIsContainer) {return $item}
 foreach($child in Get-ChildItem -LiteralPath $p -Force) {
  if($child.Attributes -band [IO.FileAttributes]::ReparsePoint){continue}
  if($child.PSIsContainer){Get-SafeFiles $child.FullName $root}else{$child}
 }
}
$cutoff=(Get-Date).ToUniversalTime().AddMinutes(-30)
$files=@();$groups=@()
foreach($root in $targets){
 if(-not(Test-Path -LiteralPath $root)){continue}
 $subset=@(Get-SafeFiles $root $root | Where-Object {$_.LastWriteTimeUtc -lt $cutoff})
 $files+=@($subset | ForEach-Object {[pscustomobject]@{path=$_.FullName;root=$root;bytes=$_.Length;mtime=$_.LastWriteTimeUtc.Ticks}})
 $groups+=@{path=$root;files=$subset.Count;GB=[math]::Round(($subset|Measure-Object Length -Sum).Sum/1e9,3)}
}
$before=(Get-PSDrive C).Free
@{delete=[bool]$Delete;targets=$groups;files=$files.Count;GB=[math]::Round(($files|Measure-Object bytes -Sum).Sum/1e9,3)}|ConvertTo-Json -Depth 5
if(-not $Delete){exit}
$log='C:\Users\taldo\Downloads\videos to edit\system\projects\_frameio\cleanup-2026-10-07\disposable-deletion-log.jsonl'
$count=0;$removedBytes=0;$skipped=0
foreach($f in $files){
 try {
  $null=Assert-SafePath $f.path $f.root
  $item=Get-Item -LiteralPath $f.path -Force
  if($item.Length -ne $f.bytes -or $item.LastWriteTimeUtc.Ticks -ne $f.mtime){$skipped++;continue}
  # Single leaf removal; locked files are skipped. No recursive deletes.
  Remove-Item -LiteralPath $f.path -ErrorAction Stop
  $count++;$removedBytes+=$f.bytes
  @{at=(Get-Date).ToUniversalTime().ToString('o');path=$f.path;bytes=$f.bytes;category='regenerable-cache-or-installer'}|ConvertTo-Json -Compress|Add-Content -LiteralPath $log -Encoding utf8
 } catch {$skipped++}
}
$after=(Get-PSDrive C).Free
@{removedFiles=$count;skipped=$skipped;removedGB=[math]::Round($removedBytes/1e9,3);freeGB=[math]::Round($after/1e9,3);freeIncreaseGB=[math]::Round(($after-$before)/1e9,3)}|ConvertTo-Json -Compress
