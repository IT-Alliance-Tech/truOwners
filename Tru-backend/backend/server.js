require("dotenv").config(); 
const app = require('./app');
const http = require('http');
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.originalUrl} from ${req.ip}`);
  next();
});

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// comment added