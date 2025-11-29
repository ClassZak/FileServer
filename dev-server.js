const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const PORT = 3000;

// Устанавливаем NODE_ENV для всего процесса
process.env.NODE_ENV = 'development';

// Логирование всех запросов
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const logEntry = `${timestamp} | IP: ${clientIP} | ${req.method} ${req.originalUrl} | User-Agent: ${req.get('User-Agent') || 'Unknown'}\n`;
  
  console.log('📝', logEntry.trim());
  fs.appendFile('dev-server.log', logEntry, (err) => {
    if (err) console.error('Ошибка записи в лог:', err);
  });
  
  next();
});

// Запускаем React Dev Server в отдельном процессе
console.log('🚀 Запускаем React Dev Server...');
const reactProcess = spawn('npx', ['react-scripts', 'start'], {
  env: { ...process.env, PORT: 3001, BROWSER: 'none' },
  stdio: 'inherit'
});

// Прокси на React Dev Server
app.use('/', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  ws: true,
  logLevel: 'silent'
}));

app.listen(PORT, () => {
  console.log(`🔁 Прокси-сервер логирования запущен на http://localhost:${PORT}`);
  console.log(`⚡ React Dev Server запущен на порту 3001`);
});

// Обработка завершения процесса
process.on('SIGINT', () => {
  console.log('🛑 Останавливаем сервер...');
  reactProcess.kill();
  process.exit();
});