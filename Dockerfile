FROM node

RUN yarn global add serve

ADD . /app
WORKDIR /app

EXPOSE 5000

CMD ["serve", "-l", "tcp://0.0.0.0:5000"]
