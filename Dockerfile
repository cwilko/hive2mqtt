FROM arm32v7/python:3.6-alpine

COPY qemu-arm-static /usr/bin

ENV PYTHONUNBUFFERED=1

RUN mkdir -p /usr/app
COPY . /usr/app
WORKDIR /usr/app
RUN apk add --update --no-cache g++ gcc libxslt-dev
RUN pip install -r requirements.txt

CMD ["./entrypoint.sh"]