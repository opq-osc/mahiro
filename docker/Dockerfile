
FROM nikolaik/python-nodejs:python3.11-nodejs18 as builder

RUN mkdir -p /app/server
WORKDIR /app/server

# system deps
RUN apt-get update && apt-get install gcc g++ make

# install
RUN npm install -g pnpm && \
    pnpm init && \
    pnpm add mahiro && \
    pnpm pkg set scripts.start="mahiro index.ts"

# new mahiro project
FROM node:18.16.0-slim as runner

RUN mkdir -p /app/server
WORKDIR /app/server

# copy
COPY --from=builder /app/server /app/server

# ports
# opq
EXPOSE 8096
# node
EXPOSE 8098
# python bridge
EXPOSE 8099

# run
CMD ["npm", "run", "start"]
