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
window.onload = function () {
	Notification.requestPermission();
}
setTimeout('estimatePoseOnVideo(videoElement)', setupTime);
setInterval(function () {
	canvas.getContext("2d").drawImage(videoElement, 0, 0, 1080, 720);
}, updateInterval / 10);
setInterval('estimatePoseOnVideo(videoElement)', updateInterval);
setInterval('drawBlaze(videoElement)', updateInterval);

function setupVideo() {
	console.log('Setting up video...');
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
	blazeFaceModel = await blazeface.load();
	console.log("blazeface ready.")

	emotionModel = await tf.loadLayersModel("http://127.0.0.1:5500/src/emotion_XCEPTION/model.json")
	console.log("emotion model loaded.")
}
