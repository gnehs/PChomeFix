FROM node:18-alpine

ENV TZ=Asia/Taipei
ENV NODE_ENV=production
# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
# set locale to zh_TW.UTF-8
ENV LANG=zh_TW.UTF-8
ENV LANGUAGE=zh_TW.UTF-8
ENV LC_ALL=zh_TW.UTF-8
ENV LC_TIME=zh_TW.UTF-8

# set time zone to Taipei
RUN apk add -U tzdata
RUN cp /usr/share/zoneinfo/Asia/Taipei /etc/localtime
RUN echo $TZ > /etc/timezone
RUN apk del tzdata

# install dependencies
RUN apk update
WORKDIR /app

# Install puppeteer dependencies
RUN apk add --no-cache chromium font-noto-cjk font-noto-emoji

COPY ./package.json ./
COPY ./package-lock.json ./
RUN npm i

# build
COPY . /app

EXPOSE 3000

# run app
CMD ["node", "index.js"]

