const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for logging
app.use((req, res, next) => {
	const timestamp = new Date().toISOString();
	const clientIP = req.ip || req.connection.remoteAddress;
	const logEntry = `${timestamp} | IP: ${clientIP} | ${req.method} ${req.originalUrl} | User-Agent: ${req.get('User-Agent') || 'Unknown'}\n`;
	
	console.log(logEntry.trim());

	fs.appendFile('server.log', logEntry, (err) => {
		if (err) console.error('Ошибка записи в лог:', err);
	});
	
	next();
});

// static React files
app.use(express.static(path.join(__dirname, 'build')));

// other rquests to React
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
	console.log(`Сервер запущен на порту ${PORT}`);
	console.log(`Логи пишутся в server.log`);
});