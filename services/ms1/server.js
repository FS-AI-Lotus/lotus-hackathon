const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const serviceName = path.basename(__dirname);

app.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok', service: serviceName });
});

app.get('/register', (req, res) => {
	res.status(200).json({
		status: 'registered',
		service: serviceName,
		version: '1.0.0'
	});
});

app.listen(PORT, () => {
	console.log(`${serviceName} listening on ${PORT}`);
});


