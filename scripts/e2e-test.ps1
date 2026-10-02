$ErrorActionPreference = 'Stop'
$base = 'http://127.0.0.1:8788'

function Body($o) { $o | ConvertTo-Json -Compress }
function Call($method, $path, $json, $token) {
  $h = @{}
  if ($token) { $h.Authorization = "Bearer $token" }
  if ($json) {
    return Invoke-RestMethod -Method $method -Uri "$base$path" -ContentType 'application/json' -Body $json -Headers $h
  }
  return Invoke-RestMethod -Method $method -Uri "$base$path" -Headers $h
}
function ExpectFail($label, [scriptblock]$sb) {
  try { & $sb; "FAIL  $label (expected failure but succeeded)" }
  catch {
    $msg = $_.ErrorDetails.Message
    if (-not $msg) { $msg = $_.Exception.Message }
    "OK    $label -> $msg"
  }
}

$CAT1 = '11111111-1111-4111-8111-111111111101'

# 1. reader registers (pending)
$r = Call Post '/api/auth/register' (Body @{username='reader1';password='reader123';displayName='Reader One';role='reader'})
"1 register reader: $($r.username) / $($r.status)"
$readerId = $r.id

# 2. cannot login before approval
ExpectFail '2 pending reader login rejected' { Call Post '/api/auth/login' (Body @{username='reader1';password='reader123'}) } | Out-Host

# 3. creator login
$c = Call Post '/api/auth/login' (Body @{username='creator';password='admin123'})
$ct = $c.token
"3 creator login OK"

# 4. creator approves reader
Call Post "/api/admin/registrations/$readerId/approve" $null $ct | Out-Null
"4 creator approved reader OK"

# 5. reader can login
$rl = Call Post '/api/auth/login' (Body @{username='reader1';password='reader123'})
"5 reader login OK / role=$($rl.user.role)"

# 6. register admin1 and admin2
$a1 = Call Post '/api/auth/register' (Body @{username='admin1';password='admin123';displayName='Admin One';role='admin'})
$a2 = Call Post '/api/auth/register' (Body @{username='admin2';password='admin123';displayName='Admin Two';role='admin'})
Call Post "/api/admin/registrations/$($a1.id)/approve" $null $ct | Out-Null
"7 creator approved admin1 OK"

# 8. admin1 login; admin1 cannot approve admin2
$al1 = Call Post '/api/auth/login' (Body @{username='admin1';password='admin123'})
$at1 = $al1.token
ExpectFail '8 admin approving another admin rejected' { Call Post "/api/admin/registrations/$($a2.id)/approve" $null $at1 } | Out-Host
Call Post "/api/admin/registrations/$($a2.id)/approve" $null $ct | Out-Null

# 9. reader cannot create article
ExpectFail '9 reader creating article rejected' { Call Post '/api/news/articles' (Body @{title='x';content='y';categoryId=$CAT1}) $rl.token } | Out-Host

# 10. admin1 creates article -> pending_approval
$art = Call Post '/api/news/articles' (Body @{title='Admin test article';summary='a summary';content='body content here';categoryId=$CAT1}) $at1
"10 admin article created status=$($art.status)"

# 11. admin draft box contains only own pending
$dbox = Call Get '/api/admin/articles/pending-approval?page=1&pageSize=20' $null $at1
"11 admin draft box total=$($dbox.total)"

# 12. creator pending queue contains it
$cqueue = Call Get '/api/admin/articles/pending-approval?page=1&pageSize=20' $null $ct
"12 creator pending queue total=$($cqueue.total)"

# 13. creator approves -> published
Call Post "/api/admin/articles/$($art.id)/approve" $null $ct | Out-Null
$pub = Call Get '/api/news/articles?page=1&pageSize=20'
$found = $pub.items | Where-Object { $_.id -eq $art.id }
if ($found) { "13 after approval: OK visible on frontend" } else { "13 after approval: FAIL not found" }

# 14. creator bans reader with custom reason
Call Post "/api/admin/users/$readerId/ban" (Body @{reason='ban test: inappropriate content'}) $ct | Out-Null
ExpectFail '14 banned reader login shows reason' { Call Post '/api/auth/login' (Body @{username='reader1';password='reader123'}) } | Out-Host

# 15. permission boundaries
$al2 = Call Post '/api/auth/login' (Body @{username='admin2';password='admin123'})
ExpectFail '15a admin banning another admin rejected' { Call Post "/api/admin/users/$($a1.id)/ban" (Body @{reason='x'}) $al2.token } | Out-Host
ExpectFail '15b banning creator rejected' { Call Post "/api/admin/users/$($c.user.id)/ban" (Body @{reason='x'}) $ct } | Out-Host

"--- flow finished ---"
