FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install curl, python3, gcc/g++, openjdk, and nodejs
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    python3 \
    build-essential \
    g++ \
    openjdk-17-jdk-headless \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY server.js ./

# Create unprivileged user
RUN useradd -u 1001 -m sandboxuser
RUN chown -R sandboxuser:sandboxuser /app
USER sandboxuser

EXPOSE 2000
CMD ["node", "server.js"]
