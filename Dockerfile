# https://github.com/joyzoursky/docker-python-chromedriver
FROM python:3.10
ARG INITIALIZE
RUN apt-get update && apt-get -y upgrade && apt-get install -y curl figlet jq && rm -rf /var/lib/apt/lists/*

# set display port to avoid crash
ENV DISPLAY=:99
RUN curl -O ${INITIALIZE} && chmod +x Docker_bootstrap.sh

ENTRYPOINT /Docker_bootstrap.sh