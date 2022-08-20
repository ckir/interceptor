#!/bin/bash
pip install --upgrade pip
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
apt-get -y update
apt-get install -y google-chrome-stable

# Install nvm
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
nvm install node

# Set a trap for SIGINT and SIGTERM signals
trap script_exit SIGTERM SIGINT

function script_exit() {
 
  echo "Task completed"
}
 
#Initialize counter variable, i
i=1
 
#declare infinite for loop
for(;;)
do
  #Print message with counter i
  echo “running the loop for $i times”
  #Increment the counter by one
  ((i++))
  sleep 1
done