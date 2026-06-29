FROM node:20-alpine
WORKDIR /app

# Copy package.json and lock file
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose port (default 5000)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
