# https://github.com/joyzoursky/docker-python-chromedriver
FROM python:3.10
ARG INITIALIZE
RUN apt-get update && apt-get -y upgrade && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

RUN wget -q ${INITIALIZE} -o Docker_bootstrap.sh && chmod +x Docker_bootstrap.sh && ./Docker_bootstrap.sh
# set display port to avoid crash
ENV DISPLAY=:99
