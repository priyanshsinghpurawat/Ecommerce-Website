FROM node:24-alpine
WORKDIR /app

# Copy package.json and lock file
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Expose port (default 3000)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
