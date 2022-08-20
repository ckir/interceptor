$imagename = (Get-Item -Path .).BaseName
docker run -it --name "$imagename-container" --sysctl net.ipv4.ip_unprivileged_port_start=0 `
-e CNN_FEARANDGREEDURL=$env:CNN_FEARANDGREEDURL `
-e GSLOGGERURL=$env:GSLOGGERURL `
$imagename
