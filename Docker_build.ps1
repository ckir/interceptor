$imagename = (Get-Item -Path .).BaseName
docker rm -f "$imagename-container"
docker image rm $imagename
docker build --no-cache --build-arg INITIALIZE="https://raw.githubusercontent.com/ckir/interceptor/main/Docker_bootstrap.sh" -t $imagename .