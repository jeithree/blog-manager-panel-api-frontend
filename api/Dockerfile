FROM node:22-alpine

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci --silent

# Copy source
COPY . ./

# Generate Prisma client
RUN npx prisma generate --schema=./prisma/schema.prisma

EXPOSE 3000

CMD ["npm", "run", "start"]
