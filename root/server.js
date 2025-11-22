const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function checkService(serviceName, url) {
	try {
		const res = await axios.get(`${url}/health`, { validateStatus: () => true });
		if (res.status === 200) {
			console.log(`✅ ${serviceName} healthy at ${url}`);
			return true;
		}
		console.error(`❌ ${serviceName} /health returned ${res.status} at ${url}`);
		return false;
	} catch (e) {
		console.error(`❌ ${serviceName} check failed: ${e.message}`);
		return false;
	}
}

async function main() {
	const servicesDir = path.resolve(__dirname, '..', 'services');
	let entries = [];
	try {
		entries = fs.readdirSync(servicesDir, { withFileTypes: true })
			.filter((d) => d.isDirectory())
			.map((d) => d.name);
	} catch (e) {
		console.error('❌ Unable to scan services directory:', e.message);
		process.exit(1);
	}

	let overallOk = true;

	for (const service of entries) {
		const envVar = `${service.toUpperCase()}_URL`;
		const url = process.env[envVar];
		if (!url) {
			console.log(`⚠️ ${envVar} not set; skipping ${service}`);
			continue;
		}
		const ok = await checkService(service, url);
		if (!ok) overallOk = false;
	}

	process.exit(overallOk ? 0 : 1);
}

main();


