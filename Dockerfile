FROM arm32v7/python:alpine

COPY qemu-arm-static /usr/bin

ENV PYTHONUNBUFFERED=1

RUN mkdir -p /usr/app
COPY . /usr/app
WORKDIR /usr/app
RUN apk add --update --no-cache --virtual .build-deps g++ gcc libxml2-dev libxslt-dev python-dev && \
    apk add --no-cache libxslt && \
    pip install --no-cache-dir lxml>=3.5.0 && \
    apk del .build-deps
RUN pip install -r requirements.txt

CMD ["./entrypoint.sh"]