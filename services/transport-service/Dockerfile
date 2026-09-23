FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 5005
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD node -e "require('http').get('http://localhost:5005/health', r => { if (r.statusCode !== 200) process.exit(1) })"
CMD ["npm", "start"]
