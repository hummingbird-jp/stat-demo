const videoElement = document.getElementById('video');
const canvas = document.getElementById('canvas');
const faceCanvas = document.getElementById('face_canvas');
const setupTime = 500;
const updateInterval = 1000;

/* blazeface model */
let blazeFaceModel = null;
let blazeFacePredictions = null;

/* emotion model */
let emotionModel = null;

setupVideo();
loadModel();
setTimeout('estimatePoseOnVideo(videoElement)', setupTime);
setInterval(function(){
	canvas.getContext("2d").drawImage(videoElement,0,0,1080,720);
}, updateInterval/10);
setInterval('estimatePoseOnVideo(videoElement)', updateInterval);
setInterval('drawBlaze(videoElement)', updateInterval);

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

async function loadModel() {
	blazeFaceModel  = await blazeface.load();
	console.log("blazeface ready.")

	emotionModel = await tf.loadLayersModel("http://127.0.0.1:5500/emotion_XCEPTION/model.json")
	console.log("emotion model loaded.")
}

async function estimatePoseOnVideo(videoElement) {
	const net = await posenet.load();
	const pose = await net.estimateSinglePose(videoElement, {
		flipHorizontal: false
	});

	const result = cosSim(normal, pose);
	console.log(result);
	showEstimatedKeypoints(pose);
}

function showEstimatedKeypoints(pose) {
	if (!pose) {
		console.warn("Keypoints are not estimated.");
		return;
	}
	// console.log(keypoints);
	const ctx = canvas.getContext('2d');
	for (let j = 0; j < pose.keypoints.length; j++) {
		const x = pose.keypoints[j].position.x;
		const y = pose.keypoints[j].position.y;
		ctx.fillRect(x, y, 15, 15);
	}
	ctx.beginPath();
	ctx.moveTo(pose.keypoints[9].position.x,pose.keypoints[9].position.y);
	ctx.moveTo(pose.keypoints[10].position.x,pose.keypoints[10].position.y);
	ctx.stroke();
}
