# https://github.com/joyzoursky/docker-python-chromedriver
FROM python:3.10
ARG INITIALIZE
RUN apt-get update && apt-get -y upgrade && apt-get install -y curl figlet apt-utils sudo && rm -rf /var/lib/apt/lists/*

# set display port to avoid crash
ENV DISPLAY=:99

# Create new user `docker` and disable 
# password and gecos for later
# --gecos explained well here:
# https://askubuntu.com/a/1195288/635348
RUN adduser --disabled-password \
--gecos '' docker

#  Add new user docker to sudo group
RUN adduser docker sudo

# Ensure sudo group users are not 
# asked for a password when using 
# sudo command by ammending sudoers file
RUN echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> \
/etc/sudoers

# now we can set USER to the 
# user we just created
USER docker
WORKDIR /home/docker

RUN curl -O ${INITIALIZE} && chmod +x Docker_bootstrap.sh

ENTRYPOINT /home/docker/Docker_bootstrap.sh