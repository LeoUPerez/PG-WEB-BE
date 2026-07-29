# ─────────────────────────────────────────
#  ElectroStock-BE — Development image
#  Node.js 20 LTS + nodemon hot-reload
# ─────────────────────────────────────────
FROM node:20-alpine

# Install nodemon globally so it's available as a binary
RUN npm install -g nodemon

WORKDIR /app

# Copy dependency manifests first to leverage Docker layer cache
COPY package*.json ./

# Install all dependencies (including devDependencies for nodemon)
RUN npm install

# Copy the rest of the source code
# (in dev the entire project is mounted as a volume — this is the fallback)
COPY . .

EXPOSE 3000

# Start with nodemon so any file change inside /app restarts the server
CMD ["nodemon", "src/server.js"]
