Add-Type -AssemblyName System.Drawing
$levels=Get-Content src/level-layouts.json -Raw | ConvertFrom-Json
$bitmap=New-Object System.Drawing.Bitmap 1500,930
$g=[System.Drawing.Graphics]::FromImage($bitmap)
$g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::White)
$pen=New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(16,25,67)),2
$font=New-Object System.Drawing.Font 'Arial',11
for($i=0;$i -lt 15;$i++) {
 $ox=($i%5)*300; $oy=[math]::Floor($i/5)*310
 $g.DrawString("LEVEL $($i+1) - $($levels[$i].shape)",$font,[System.Drawing.Brushes]::Black,$ox+16,$oy+10)
 for($x=0;$x -lt 21;$x++){for($y=0;$y -lt 21;$y++){$g.FillEllipse([System.Drawing.Brushes]::LightGray,$ox+22+$x*12,$oy+40+$y*12,1.8,1.8)}}
 foreach($a in $levels[$i].arrows){
  for($j=1;$j -lt $a.path.Count;$j++){$p=$a.path[$j-1];$q=$a.path[$j];$g.DrawLine($pen,($ox+23+$p.x*12),($oy+41+$p.y*12),($ox+23+$q.x*12),($oy+41+$q.y*12))}
  $q=$a.path[-1];$x=$ox+23+$q.x*12;$y=$oy+41+$q.y*12
  $dx=0;$dy=0;switch($a.dir){U{$dy=-1} D{$dy=1} L{$dx=-1} R{$dx=1}}
  $g.DrawLine($pen,$x,$y,($x-$dx*4-$dy*3),($y-$dy*4+$dx*3));$g.DrawLine($pen,$x,$y,($x-$dx*4+$dy*3),($y-$dy*4-$dx*3))
 }
}
$bitmap.Save((Join-Path (Get-Location) 'tests/level-preview.png'))
$g.Dispose();$bitmap.Dispose()
