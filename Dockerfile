# Use the official Node.js 18 image as the base
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy the project files into the container
COPY . .

# Install dependencies
RUN npm install

# Build the Next.js app (optional, but recommended)
RUN npm run build

# Specify the command to run your app
CMD ["node", "server.js"]

# Expose the port (use the same port as in your server code)
EXPOSE 3000
