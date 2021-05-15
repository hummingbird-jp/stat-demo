const USER_NAME = 'rsuda';
let SECONDS_YOU_STAYED_IN_VIEW = 0;
// async functionにPromise以外を返させる方法がわからなかったので、計算結果をとりあえずここに入れておく
let EMOTION = '-';

async function estimatePoseOnVideo(videoElement) {
	const poseNet = await posenet.load();
	const pose = await poseNet.estimateSinglePose(videoElement, { flipHorizontal: false });
	const similarityToNormal = cosSim(normal, pose);
	const similarityToThinking = cosSim(thinking, pose);
	const result = similarityToNormal > similarityToThinking ? 'normal 🧑‍💻' : 'thinking 🤔'
	const userName = USER_NAME;
	const isInView = judgeIsInView(pose);
	const red = '\u001b[31m';
	const green = '\u001b[32m';
	const resetColor = '\u001b[0m';

	if (!isInView) {
		console.log(`${red}I can\'t find you 😵 ${resetColor}`);
		SECONDS_YOU_STAYED_IN_VIEW = 0;
		console.log(`$SECONDS_YOU_STAYED_IN_VIEW has been reset.`);
	} else {
		console.log(`${green}I found you! 🥳 ${resetColor}`);
		SECONDS_YOU_STAYED_IN_VIEW++;
		console.log(`SECONDS_YOU_STAYED_IN_VIEW: ${SECONDS_YOU_STAYED_IN_VIEW}`);

		console.log(result);
		//drawSkeltonOnCanvas(pose);
		drawBlaze(videoElement);
		console.log(`emotion in estimatePoseOnVideo(): ${EMOTION}`);
	}
	// sendHttpReq(userName, isInView, result, EMOTION);
	if (SECONDS_YOU_STAYED_IN_VIEW > 10) {
		writeStatusData(userName,isInView,result,EMOTION);
		SECONDS_YOU_STAYED_IN_VIEW = 0;
		console.log(`SECONDS_YOU_STAYED_IN_VIEW has been reset.`);
	}
	isTeamInView('stat-dev');
}

function writeStatusData(userId, isInView, pose, emotion) {
	const timestamp = new Date().getTime();
	console.log(timestamp);
	firebase.database().ref('status-present/' + userId).set({
		timestamp: timestamp,
		isInView: isInView,
		emotion: emotion,
		pose: pose
	});
}

function isUserInView(userId) {
	let lastUpdatedTS = null;
	const now = new Date().getTime();
	var ref = firebase.database().ref('status-present/' + userId + '/timestamp');
	ref.on('value', (snapshot) => {
		lastUpdatedTS = snapshot.val();
	})
	if (now - lastUpdatedTS < 60000){
		return true;
	}
	return false;
}

function getTeamMembersId(groupName) {
	let teamMembersId = [];
	var ref = firebase.database().ref('groups/'+groupName+'/members')
	ref.orderByValue().on("value", function(snapshot) {
		snapshot.forEach(function(data) {
			teamMembersId.push(data.key);
		});
	});
	// console.log(teamMembersId.length + ' users found in ' + groupName + ', with id: ' + teamMembersId);
	return teamMembersId;
}

function isTeamInView(groupName) {
	var teamMembersId = getTeamMembersId(groupName);
	let teamStatus = [];
	for (let i = 0; i < teamMembersId.length; i++) {
		teamStatus.push(isUserInView(teamMembersId[i]));
	}
	console.log('team status: (' + teamMembersId + ') = (' + teamStatus + ')');
	if (!teamStatus){
		var isReady = teamStatus.reduce((sum, next) => sum && next, true);
		if (isReady) {
			alert('The team is ready!');
		}
	}
}

function drawSkeltonOnCanvas(pose) {
	const ctx = canvas.getContext('2d');

	/* 各keypointに赤い四角を描画する */
	for (let j = 0; j < pose.keypoints.length; j++) {
		const x = pose.keypoints[j].position.x;
		const y = pose.keypoints[j].position.y;

		ctx.fillStyle = 'red'
		ctx.fillRect(x, y, 10, 10);
	}

	/* 上半身のkeypointsを緑の線でつなぐ */
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

function judgeIsInView(pose) {
	/* 全体のscoreが0.3未満＝画面内にいない */
	if (pose.score < 0.3) {
		return false;
	} else {
		return true;
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

	for (let i = 0; i < vecSize; i++) { normalizedVec += vec[i] * vec[i]; }

	return Math.sqrt(normalizedVec);
}

function cosSim(pose1, pose2) {
	const vecSize = 34;
	const vec1 = getVecFromPose(pose1, vecSize);
	const vec2 = getVecFromPose(pose2, vecSize);

	return nj.dot(vec1, vec2).selection.data[0] / (normalizeVec(vec1, vecSize) * normalizeVec(vec2, vecSize));
}
