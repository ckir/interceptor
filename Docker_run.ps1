$imagename = (Get-Item -Path .).BaseName
docker run -d --name "$imagename-container" --sysctl net.ipv4.ip_unprivileged_port_start=0 `
-e FEARANDGREEDURL=$env:CNN_FEARANDGREEDURL
-e GSLOGGERURL=$env:GSLOGGERURL `
$imagename
