# FROM ubuntu:24.04
FROM collabora/code:latest

WORKDIR /app
ENV LOCOREPATH=/app

RUN apt update && apt upgrade -y
RUN apt install -y \
    dialog \
    libpoco-dev \
    python3-polib \
    libcap-dev \
    npm \
    libpam-dev \
    libzstd-dev \
    wget \
    git \
    build-essential \
    libtool \
    libcap2-bin \
    python3-lxml \
    libpng-dev \
    libgif-dev \
    libcppunit-dev \
    pkg-config \
    fontconfig \
    snapd \
    chromium-browser

RUN wget https://github.com/CollaboraOnline/online/releases/download/for-code-assets/core-co-25.04-assets.tar.gz && \
    tar xvf core-co-25.04-assets.tar.gz && \
    rm core-co-25.04-assets.tar.gz

COPY . .

RUN groupadd -r -g 1001 cool && \
    useradd -m -r -u 1001 -g 1001 cool

RUN mkdir -p /home/cool/.cache/fontconfig && \
    chown -R cool:cool /home/cool

ENV HOME=/home/cool
ENV FONTCONFIG_PATH=/etc/fonts

RUN chown -R cool:cool /app

USER cool

WORKDIR /app/src/view

RUN ./autogen.sh
RUN ./configure \
    --enable-silent-rules \
    --with-lokit-path=${LOCOREPATH}/include \
    --with-lo-path=${LOCOREPATH}/instdir \
    --enable-debug \
    --enable-cypress \
    --disable-ssl

RUN make -j$(nproc)
RUN make -C browser

EXPOSE 9980

CMD exec ./coolwsd \
    --o:sys_template_path=./systemplate \
    --o:child_root_path=/app/jails \
    --o:storage.filesystem[@allow]=true \
    --o:admin_console.username=admin \
    --o:admin_console.password=admin \
    --o:logging.file[@enable]=false \
    $extra_params
