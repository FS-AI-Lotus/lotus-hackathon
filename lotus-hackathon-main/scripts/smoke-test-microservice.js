const axios = require('axios');

async function main() {
	const [,, serviceName, serviceUrl] = process.argv;
	if (!serviceName || !serviceUrl) {
		console.error('Usage: node scripts/smoke-test-microservice.js <service-name> <service-url>');
		process.exit(1);
	}

	try {
		const health = await axios.get(`${serviceUrl}/health`, { validateStatus: () => true });
		if (health.status !== 200) {
			console.error(`❌ ${serviceName} /health failed: ${health.status}`);
			process.exit(1);
		}
		console.log(`✅ ${serviceName} /health passed`);

		const register = await axios.get(`${serviceUrl}/register`, { validateStatus: () => true });
		if (register.status < 200 || register.status >= 300) {
			console.error(`❌ ${serviceName} /register failed: ${register.status}`);
			process.exit(1);
		}
		console.log(`✅ ${serviceName} /register passed`);

		console.log(`🎉 ${serviceName} smoke tests passed`);
		process.exit(0);
	} catch (err) {
		console.error(`❌ ${serviceName} smoke tests crashed:`, err.message);
		process.exit(1);
	}
}

main();


