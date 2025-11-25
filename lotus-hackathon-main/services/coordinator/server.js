const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok', service: 'coordinator' });
});

app.get('/register', (req, res) => {
	res.status(200).json({
		status: 'registered',
		service: 'coordinator',
		version: '1.0.0'
	});
});

app.get('/ui-settings', (req, res) => {
	try {
		const configPath =
			process.env.UI_CONFIG_PATH ||
			path.resolve(__dirname, '../../ui/ui-ux-config.json');

		const fileContent = fs.readFileSync(configPath, 'utf-8');
		const json = JSON.parse(fileContent);
		res.setHeader('Content-Type', 'application/json');
		res.status(200).json(json);
	} catch (err) {
		res.status(500).json({ error: 'UI config not available' });
	}
});

app.listen(PORT, () => {
	console.log(`Coordinator listening on ${PORT}`);
});


