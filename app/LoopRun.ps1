$env:CNN_FEARANDGREEDURL="https://script.google.com/macros/s/AKfycbwbN-NBmazuxiLwnVdUYXX66FtbV2HefP5pMtnw724ekA1DlyTsltS-_rH0k5Chs_z7/exec"
$env:GSLOGGERURL="https://script.google.com/macros/s/AKfycbyw--s4_JGb6Cri38oJwuLVea0-uptuASHKrToKbQlyVdOAH--faSeY5DfLprYMYNSGZA/exec"
$counter = 0
. .\venv\Scripts\Activate.ps1
while ($true) {
    $counter++
    Write-Host "Running $counter times"
    python .\interceptor.py
}