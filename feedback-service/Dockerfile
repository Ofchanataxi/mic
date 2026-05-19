FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
COPY README.md ./
EXPOSE 3004
CMD ["npm", "start"]
