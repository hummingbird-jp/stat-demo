function setupVideo() {
	console.log('Setting up video...');
	navigator.mediaDevices.getUserMedia({
		video: true,
		audio: false
	}).then(stream => {
		video.srcObject = stream;
		video.play();
		console.log('Video ready.');
	}).catch(e => {
		console.log(e);
	});
}

async function loadModels() {
	blazeFaceModel = await blazeface.load();
	console.log('blazeface ready.');

	emotionModel = await tf.loadLayersModel('http://127.0.0.1:5500/src/emotion_XCEPTION/model.json')
	console.log('emotion model ready.');
}

function clearBox(elementID) {
	document.getElementById(elementID).innerHTML = "";
}

function timeConvert(millisecond) {
	var seconds = Math.floor(millisecond / 1000);
	var hours = Math.floor(seconds / 3600);
	var minutes = Math.floor((seconds - hours*3600) / 60);
	return hours + "h " + minutes + 'm';
}