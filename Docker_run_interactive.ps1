$imagename = (Get-Item -Path .).BaseName
$dps = (docker ps -a -f name="$imagename-container")
$lines = $dps.Split(
    @("`r`n", "`r", "`n"), 
   [StringSplitOptions]::None)
   $lines.count
if ($lines -match "$imagename-container"){
	Write-Host "$imagename-container exists starting it"
	docker start -a -i "$imagename-container"
} else {
	Write-Host "$imagename-container does not exists starting a new one"
	docker run -it --name "$imagename-container" --sysctl net.ipv4.ip_unprivileged_port_start=0 `
	-e CNN_FEARANDGREEDURL=$env:CNN_FEARANDGREEDURL `
	-e GSLOGGERURL=$env:GSLOGGERURL `
	$imagename
}

$title    = 'Delete'
$question = 'Do you want to delete $imagename-container?'
$choices  = '&Yes', '&No'

$decision = $Host.UI.PromptForChoice($title, $question, $choices, 1)
if ($decision -eq 0) {
	docker rm "$imagename-container"
    Write-Host "$imagename-container deleted"
} else {
    Write-Host "$imagename-container NOT deleted"
}
