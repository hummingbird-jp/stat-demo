const videoElement = document.getElementById('video');
const setupTime = 500;
const updateInterval = 1000;

setupVideo();
setTimeout('estimatePoseOnVideo(videoElement)', setupTime);
setInterval('estimatePoseOnVideo(videoElement)', updateInterval);

function setupVideo() {
	console.log('Setting up posenet...');
	navigator.mediaDevices.getUserMedia({
		video: true,
		audio: false
	}).then(stream => {
		video.srcObject = stream;
		video.play();
	}).catch(e => {
		console.log(e);
	});
}

async function estimatePoseOnVideo(videoElement) {
	const net = await posenet.load();
	const pose = await net.estimateSinglePose(videoElement, {
		flipHorizontal: false
	});

	const result = cosSim(normal, pose);
	console.log(result);
	//showEstimatedKeypoints(pose.keypoints);
}

function showEstimatedKeypoints(keypoints) {
	if (!keypoints) {
		console.warn("Keypoints are not estimated.");
		return;
	}
	console.log(keypoints);
}
