Add-Type -AssemblyName System.Drawing
$panels=Get-Content tests/mobile-render-preview.json -Raw | ConvertFrom-Json
$bitmap=New-Object System.Drawing.Bitmap 1472,390
$g=[System.Drawing.Graphics]::FromImage($bitmap);$g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::AntiAlias;$g.Clear([System.Drawing.Color]::White)
$pen=New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(16,25,67)),2.8
$pen.StartCap=[System.Drawing.Drawing2D.LineCap]::Round;$pen.EndCap=[System.Drawing.Drawing2D.LineCap]::Round;$pen.LineJoin=[System.Drawing.Drawing2D.LineJoin]::Round
$brush=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(16,25,67));$font=New-Object System.Drawing.Font 'Arial',11
for($i=0;$i -lt 4;$i++){
 $ox=20+$i*368;$oy=42
 $g.DrawString("LEVEL $($panels[$i].level) - 328px board",$font,$brush,$ox,12)
 for($x=0;$x -lt 328;$x+=18){for($y=0;$y -lt 328;$y+=18){$g.FillEllipse([System.Drawing.Brushes]::LightGray,($ox+$x),($oy+$y),1.5,1.5)}}
 foreach($arrow in $panels[$i].arrows){
  for($j=1;$j -lt $arrow.path.Count;$j++){$a=$arrow.path[$j-1];$b=$arrow.path[$j];$g.DrawLine($pen,[single]($ox+$a.x),[single]($oy+$a.y),[single]($ox+$b.x),[single]($oy+$b.y))}
  $vertices=@();foreach($point in $arrow.head.Split(' ')){$xy=$point.Split(',');$vertices+=New-Object System.Drawing.PointF ([single]($ox+[double]$xy[0])),([single]($oy+[double]$xy[1]))};$g.FillPolygon($brush,[System.Drawing.PointF[]]$vertices)
 }
}
$bitmap.Save((Join-Path (Get-Location) 'tests/mobile-render-preview.png'));$g.Dispose();$bitmap.Dispose()
