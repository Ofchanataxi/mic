FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src ./src
COPY README.md ./

EXPOSE 8080

CMD ["npm", "start"]
