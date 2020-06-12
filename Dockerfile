FROM node:12.18-alpine
LABEL maintainer="hello@vizzuality.com"

ENV NAME i2i-api
ENV USER i2i

RUN apk update && apk upgrade && \
    apk add --no-cache --update \
    bash python

RUN addgroup $USER && adduser -s /bin/bash -D -G $USER $USER

RUN npm install -g grunt-cli bunyan sequelize-cli

RUN mkdir -p /opt/$NAME
COPY package.json /opt/$NAME/package.json
RUN cd /opt/$NAME && npm install

COPY entrypoint.sh /opt/$NAME/entrypoint.sh
COPY config /opt/$NAME/config

WORKDIR /opt/$NAME

COPY ./app /opt/$NAME/app
RUN chown $USER:$USER /opt/$NAME

# Tell Docker we are going to use this ports
EXPOSE 3000
USER $USER

ENTRYPOINT ["./entrypoint.sh"]
