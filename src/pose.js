let SECONDS_YOU_STAYED_IN_VIEW = 0;

async function estimatePoseOnVideo(videoElement) {
	const net = await posenet.load();
	const pose = await net.estimateSinglePose(videoElement, {
		flipHorizontal: false
	});

	const similarityToNormal = cosSim(normal, pose);
	const similarityToThinking = cosSim(thinking, pose);

	const result = similarityToNormal > similarityToThinking ? 'normal 🧑‍💻' : 'thinking 🤔'

	console.log(result);
	showEstimatedKeypoints(pose);
}

function showEstimatedKeypoints(pose) {
	const black = '\u001b[30m';
	const red = '\u001b[31m';
	const green = '\u001b[32m';
	const yellow = '\u001b[33m';
	const blue = '\u001b[34m';
	const magenta = '\u001b[35m';
	const cyan = '\u001b[36m';
	const white = '\u001b[37m';

	const reset = '\u001b[0m';

	if (!pose) {
		console.warn('Keypoints are not estimated.');
		return;
	} else if (pose.score < 0.3) {
		console.warn(`${red}I can\'t find you 😵 ${reset}`);
		SECONDS_YOU_STAYED_IN_VIEW = 0;
		console.log(`${red}SECONDS_YOU_STAYED_IN_VIEW has been reset.${reset}`);
		return;
	} else {
		console.log(`${green}I found you! 🥳 ${reset}`);
		SECONDS_YOU_STAYED_IN_VIEW++;
		console.log(`SECONDS_YOU_STAYED_IN_VIEW: ${SECONDS_YOU_STAYED_IN_VIEW}`);
	}

	const ctx = canvas.getContext('2d');
	for (let j = 0; j < pose.keypoints.length; j++) {
		const x = pose.keypoints[j].position.x;
		const y = pose.keypoints[j].position.y;

		ctx.fillStyle = 'red'
		ctx.fillRect(x, y, 10, 10);
	}

	for (let i = 0; i < pose.keypoints.length; i++) {
		let xStart, yStart, xEnd, yEnd;

		ctx.strokeStyle = 'green';
		ctx.lineWidth = 3;

		switch (i) {
			case 0:
				xStart = pose.keypoints[i].position.x;
				yStart = pose.keypoints[i].position.y;
				xEnd = (pose.keypoints[5].position.x + pose.keypoints[6].position.x) / 2;
				yEnd = (pose.keypoints[5].position.y + pose.keypoints[6].position.y) / 2;
				break;
			case 5:
			case 6:
			case 7:
			case 8:
				xStart = pose.keypoints[i].position.x;
				yStart = pose.keypoints[i].position.y;
				xEnd = pose.keypoints[i + 2].position.x;
				yEnd = pose.keypoints[i + 2].position.y;
				break;
			default:
				xStart = pose.keypoints[5].position.x;
				yStart = pose.keypoints[5].position.y;
				xEnd = pose.keypoints[6].position.x;
				yEnd = pose.keypoints[6].position.y;
				break;
		}
		ctx.beginPath();
		ctx.moveTo(xStart, yStart);
		ctx.lineTo(xEnd, yEnd);
		ctx.stroke();
	}
}

function getVecFromPose(pose, vecSize) {
	let vec = new Array;
	let xBase;
	let yBase;

	xBase = pose.keypoints[0].position.x;
	yBase = pose.keypoints[0].position.y;
	for (let i = 0; i < vecSize; i++) {
		if (i < 17) {
			vec[i] = pose.keypoints[i].position.x - xBase;
		} else {
			vec[i] = pose.keypoints[i - 17].position.y - yBase;
		}
	}
	// 11 (leftHip) 以降は無視
	for (let i = 11; i < 17; i++) {
		vec[i] = 0; // 下半身のx座標
		vec[i + vecSize / 2] = 0; // 下半身のy座標
	}
	return vec;
}

function normalizeVec(vec, vecSize) {
	let normalizedVec = 0.0;

	for (let i = 0; i < vecSize; i++) {
		normalizedVec += vec[i] * vec[i];
	}
	return Math.sqrt(normalizedVec);
}

function cosSim(pose1, pose2) {
	const vecSize = 34;
	const vec1 = getVecFromPose(pose1, vecSize);
	const vec2 = getVecFromPose(pose2, vecSize);

	return nj.dot(vec1, vec2).selection.data[0] / (normalizeVec(vec1, vecSize) * normalizeVec(vec2, vecSize));
}
