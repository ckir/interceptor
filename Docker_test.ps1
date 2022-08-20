$imagename = (Get-Item -Path .).BaseName
docker run -it --rm --name haproxy-syntax-check $imagename haproxy -c -f /usr/local/etc/haproxy/haproxy.cfg