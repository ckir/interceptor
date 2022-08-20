me="$(basename "$(test -L "$0" && readlink "$0" || echo "$0")")"
figlet -c -k Running $me

# install google chrome
figlet -c -k Installing Chrome
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
apt-get -y update
apt-get install -y google-chrome-stable
rm -rf /var/lib/apt/lists/*

# install python requirements
figlet -c -k Installing Python
pip install --upgrade pip
pip install selenium webdriver-manager

# install nodejs 
figlet -c -k Installing Nodejs
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
nvm install node

# Install application
figlet -c -k Installing application
mkdir /app
cd /app
# get HTTPWatchdog.js
curl -O https://raw.githubusercontent.com/ckir/httpwatchdog/main/HTTPWatchdog.js
curl -O https://raw.githubusercontent.com/ckir/httpwatchdog/main/HTTPWatchdog_loop_run.sh
chmod +x HTTPWatchdog_loop_run.sh
./HTTPWatchdog_loop_run.sh &
echo "HTTPWatchdog_loop_run.sh started at port ${PORT:-9999}"
figlet -c -k Started HTTPWatchdog

# get Interceptor
curl -O https://raw.githubusercontent.com/ckir/interceptor/main/app/interceptor.py
curl -O https://raw.githubusercontent.com/ckir/interceptor/main/app/interceptor.js
figlet -c -k Starting Interceptor
while true
do
   python ./interceptor.py
   [ $? -eq 100 ] && break
   sleep 1
done






