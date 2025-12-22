import {NETLIFY_TOKEN} from '../configs/basics.ts';
import {sleep} from '../helpers/helpers.ts';

export const triggerRebuild = async (netlifySiteId: string) => {
	// POST /sites/:site_id/builds triggers a new build for a git-connected site.
	const res = await fetch(
		`https://api.netlify.com/api/v1/sites/${netlifySiteId}/builds`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${NETLIFY_TOKEN}`,
				'Content-Type': 'application/json',
			},
		}
	);

	if (!res.ok) throw new Error(await res.text());
	const build = await res.json();

	if (!build.deploy_id) {
		throw new Error('Netlify build did not return a deploy_id');
	}

	// Consumers expect an object with id = deploy_id to wait on deploy status.
	return {id: build.deploy_id};
};

const getDeployStatus = async (deployId: string) => {
	const res = await fetch(
		`https://api.netlify.com/api/v1/deploys/${deployId}`,
		{
			headers: {
				Authorization: `Bearer ${NETLIFY_TOKEN}`,
			},
		}
	);

	if (!res.ok) throw new Error(await res.text());
	return res.json();
};

export const waitForDeploy = async (deployId: string) => {
	while (true) {
		const deploy = await getDeployStatus(deployId);

		if (deploy.state === 'ready') return deploy;
		if (deploy.state === 'error') throw new Error('Deploy failed');

		await sleep(5000);
	}
};
