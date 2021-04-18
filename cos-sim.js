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