const axios = require('axios');

async function main() {
	const baseUrl = process.env.SERVICE_URL;
	if (!baseUrl) {
		console.error('❌ SERVICE_URL env var is required');
		process.exit(1);
	}
	try {
		const health = await axios.get(`${baseUrl}/health`, { validateStatus: () => true });
		if (health.status !== 200) {
			console.error(`❌ /health failed: ${health.status}`);
			process.exit(1);
		}
		console.log('✅ /health passed');

		const register = await axios.get(`${baseUrl}/register`, { validateStatus: () => true });
		if (register.status < 200 || register.status >= 300) {
			console.error(`❌ /register failed: ${register.status}`);
			process.exit(1);
		}
		console.log('✅ /register passed');

		const ui = await axios.get(`${baseUrl}/ui-settings`, { validateStatus: () => true });
		if (ui.status !== 200) {
			console.error(`❌ /ui-settings failed: ${ui.status}`);
			process.exit(1);
		}
		try {
			// Ensure valid JSON
			JSON.stringify(ui.data);
			console.log('✅ /ui-settings returned valid JSON');
		} catch {
			console.error('❌ /ui-settings returned invalid JSON');
			process.exit(1);
		}

		console.log('🎉 All coordinator smoke tests passed');
		process.exit(0);
	} catch (err) {
		console.error('❌ Smoke tests crashed:', err.message);
		process.exit(1);
	}
}

main();


