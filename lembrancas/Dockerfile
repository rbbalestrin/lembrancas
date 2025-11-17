FROM node:20-alpine

WORKDIR /app

# Install Expo CLI globally
RUN npm install -g expo-cli@latest

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

EXPOSE 19000 19001 19002 8081

CMD ["npx", "expo", "start", "--web", "--host", "tunnel"]

