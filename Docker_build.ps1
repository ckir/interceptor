$imagename = (Get-Item -Path .).BaseName
docker rm -f "$imagename-container"
docker image rm $imagename
docker build -t $imagename .