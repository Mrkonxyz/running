# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code and build the application
COPY . .
RUN npm run build

# Production stage using Nginx to serve static files
FROM nginx:alpine

# Copy built files from the build stage to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy default nginx configuration if routing fallback is needed in the future
# (Uncomment and create nginx.conf if you add client-side routing like react-router)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
