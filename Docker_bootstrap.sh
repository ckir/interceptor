me="$(basename "$(test -L "$0" && readlink "$0" || echo "$0")")"
figlet -c -k Running $me

mkdir /app
cd /app

# Start server asap because Heroku will destroy the dyno
# install nodejs 
figlet -c -k Installing Nodejs
curl -sS -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
nvm install node

# Install HTTPWatchdog
figlet -c -k Installing HTTPWatchdog
curl -sS -O https://raw.githubusercontent.com/ckir/httpwatchdog/main/HTTPWatchdog.js
curl -sS -O https://raw.githubusercontent.com/ckir/httpwatchdog/main/HTTPWatchdog_loop_run.sh
chmod +x HTTPWatchdog_loop_run.sh
./HTTPWatchdog_loop_run.sh &
echo "HTTPWatchdog_loop_run.sh started at port ${PORT:-9999}"

# install python requirements
figlet -c -k Installing Python
pip install --upgrade pip
pip install selenium webdriver-manager

# Install pyGSLogger
figlet -c -k Installing pyGSLogger
curl -sS -O https://raw.githubusercontent.com/ckir/interceptor/main/pyGSLogger.py
chmod +x pyGSLogger.py
./pyGSLogger.py --appname=${me} --loglevel=10 --lognotify=0 --logmessage="${me} Started"

# install google chrome
figlet -c -k Installing Chrome
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
apt-get -qq -y update> /dev/null
apt-get -qq install -y google-chrome-stable > /dev/null
rm -rf /var/lib/apt/lists/*

# get Interceptor
figlet -c -k Installing Interceptor
curl -sS -O https://raw.githubusercontent.com/ckir/interceptor/main/app/interceptor.py
curl -sS -O https://raw.githubusercontent.com/ckir/interceptor/main/app/interceptor.js

COUNTER=1
while true
do
   printf "Running Interceptor for %d time(s)\n" $COUNTER
   python ./interceptor.py
   [ $? -eq 100 ] && break
   sleep 1
   (( COUNTER++ ))
done
./pyGSLogger.py --appname=${me} --loglevel=50 --lognotify=1 --logmessage="Interceptor exited status 100. Review NOW"