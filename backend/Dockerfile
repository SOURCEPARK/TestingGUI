FROM node:18

WORKDIR /app

RUN apt-get update && apt-get install -y netcat-openbsd

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=8080

EXPOSE 8080

CMD ["./start.sh"]

