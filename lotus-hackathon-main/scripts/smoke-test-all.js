const axios = require('axios');

async function testCoordinator(url) {
	const health = await axios.get(`${url}/health`, { validateStatus: () => true });
	if (health.status !== 200) throw new Error(`Coordinator /health: ${health.status}`);

	const register = await axios.get(`${url}/register`, { validateStatus: () => true });
	if (register.status < 200 || register.status >= 300) throw new Error(`Coordinator /register: ${register.status}`);

	const ui = await axios.get(`${url}/ui-settings`, { validateStatus: () => true });
	if (ui.status !== 200) throw new Error(`Coordinator /ui-settings: ${ui.status}`);
	JSON.stringify(ui.data);
}

async function testMicroservice(name, url) {
	const health = await axios.get(`${url}/health`, { validateStatus: () => true });
	if (health.status !== 200) throw new Error(`${name} /health: ${health.status}`);

	const register = await axios.get(`${url}/register`, { validateStatus: () => true });
	if (register.status < 200 || register.status >= 300) throw new Error(`${name} /register: ${register.status}`);
}

async function main() {
	const coordinatorUrl = process.env.COORDINATOR_URL;
	const ms1Url = process.env.MS1_URL;
	const ms2Url = process.env.MS2_URL;

	let ok = true;

	if (coordinatorUrl) {
		try {
			await testCoordinator(coordinatorUrl);
			console.log('✅ Coordinator smoke tests passed');
		} catch (e) {
			console.error('❌ Coordinator smoke tests failed:', e.message);
			ok = false;
		}
	} else {
		console.log('⚠️ COORDINATOR_URL not set; skipping coordinator tests');
	}

	if (ms1Url) {
		try {
			await testMicroservice('ms1', ms1Url);
			console.log('✅ ms1 smoke tests passed');
		} catch (e) {
			console.error('❌ ms1 smoke tests failed:', e.message);
			ok = false;
		}
	}

	if (ms2Url) {
		try {
			await testMicroservice('ms2', ms2Url);
			console.log('✅ ms2 smoke tests passed');
		} catch (e) {
			console.error('❌ ms2 smoke tests failed:', e.message);
			ok = false;
		}
	}

	process.exit(ok ? 0 : 1);
}

main();


