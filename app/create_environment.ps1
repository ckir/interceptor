$FolderName = ".\venv\"
if (Test-Path $FolderName) {
 
    Write-Host "Folder Exists"
    Remove-Item $FolderName -Force -Recurse
}
else
{
    Write-Host "Folder Doesn't Exists"
}

python -m venv venv

Set-ExecutionPolicy Unrestricted
. .\venv\Scripts\Activate.ps1
pip install webdriver-manager selenium
deactivate