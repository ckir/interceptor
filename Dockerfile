# https://github.com/joyzoursky/docker-python-chromedriver
FROM python:3.10

RUN apt-get update && apt-get upgrade && apt-get install -y \
    curl \
 && rm -rf /var/lib/apt/lists/*```

RUN wget -q https://raw.githubusercontent.com/ckir/interceptor/main/Docker_bootstrap.sh -o Docker_bootstrap.sh
RUN chmod +x Docker_bootstrap.sh

ENTRYPOINT ./Docker_bootstrap.sh
