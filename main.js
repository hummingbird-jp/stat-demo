const localVideo = document.getElementById('local_video');
const canvas = document.getElementById('canvas');
const maskRadioGroup = document.getElementById('mask_radio_broup');

let localStream = null;
let canvasStream = null;
let bodyPixNet = null;
let animationId = null;
let contineuAnimation = false;
let bodyPixMaks = null;
let segmentTimerId = null;
let isConnected = false;
let maskType = 'room';

// ------- bodypix -------
async function loadModel() {
	const net = await bodyPix.load(/** optional arguments, see below **/);
	bodyPixNet = net;
	console.log('bodyPix ready');
	updateUI();
}
loadModel();

function setMask(type) {
	maskType = type;
}

function updateSegment() {
	const segmeteUpdateTime = 10; // ms
	if (!bodyPixNet) {
		console.warn('bodyPix net NOT READY');
		return;
	}

	const option = {
		flipHorizontal: false,
		internalResolution: 'medium',
		segmentationThreshold: 0.7,
		maxDetections: 4,
		scoreThreshold: 0.5,
		nmsRadius: 20,
		minKeypointScore: 0.3,
		refineSteps: 10
	};

	if (maskType === 'none') {
		bodyPixMaks = null;
		if (contineuAnimation) {
			segmentTimerId = setTimeout(updateSegment, segmeteUpdateTime);
		}
		return;
	}

	bodyPixNet.segmentPerson(localVideo, option)
		.then(segmentation => {
			if (maskType === 'room') {
				const fgColor = { r: 0, g: 0, b: 0, a: 0 };
				const bgColor = { r: 127, g: 127, b: 127, a: 255 };
				const personPartImage = bodyPix.toMask(segmentation, fgColor, bgColor);
				bodyPixMaks = personPartImage;
			}
			else if (maskType === 'person') {
				const fgColor = { r: 127, g: 127, b: 127, a: 255 };
				const bgColor = { r: 0, g: 0, b: 0, a: 0 };
				const roomPartImage = bodyPix.toMask(segmentation, fgColor, bgColor);
				bodyPixMaks = roomPartImage;
			}
			else {
				bodyPixMaks = null;
			}

			if (contineuAnimation) {
				segmentTimerId = setTimeout(updateSegment, segmeteUpdateTime);
			}
		})
		.catch(err => {
			console.error('segmentPerson ERROR:', err);
		})
}

function startCanvasVideo() {
	writeCanvasString('initalizing BodyPix');
	contineuAnimation = true;
	animationId = window.requestAnimationFrame(updateCanvas);
	canvasStream = canvas.captureStream();

	updateSegment();
	updateUI();
}

function writeCanvasString(str) {
	const ctx = canvas.getContext('2d');
	ctx.font = "64px serif";
	ctx.fillText(str, 5, 100);
	console.log(str);
}

function stopCanvasVideo() {
	contineuAnimation = false;
	if (segmentTimerId) {
		clearTimeout(segmentTimerId);
		segmentTimerId = null;
	}

	if (canvasStream) {
		canvasStream.getTracks().forEach(track => {
			console.log('stop canvas track:', track);
			track.stop();
		});
		canvasStream = null;
	}

	updateUI();
}

function updateCanvas() {
	drawCanvas(localVideo);
	if (contineuAnimation) {
		animationId = window.requestAnimationFrame(updateCanvas);
	}
}

function drawCanvas(srcElement) {
	const opacity = 1.0;
	const flipHorizontal = false;
	//const maskBlurAmount = 0;
	const maskBlurAmount = 3;

	// Draw the mask image on top of the original image onto a canvas.
	// The colored part image will be drawn semi-transparent, with an opacity of
	// 0.7, allowing for the original image to be visible under.
	bodyPix.drawMask(
		canvas, srcElement, bodyPixMaks, opacity, maskBlurAmount,
		flipHorizontal
	);
}

// -------- user media -----------

async function startVideo() {
	//const mediaConstraints = {video: true, audio: true};
	//const mediaConstraints = {video: true, audio: false};
	const mediaConstraints = { video: { width: 640, height: 480 }, audio: false };
	disableElement('start_video_button');

	localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints).catch(err => {
		console.error('media ERROR:', err);
		enableElement('start_video_button');
		return;
	});

	localVideo.srcObject = localStream;
	await localVideo.play().catch(err => console.error('local play ERROR:', err));
	localVideo.volume = 0;

	startCanvasVideo();
	updateUI();
}

function stopVideo() {
	stopCanvasVideo();

	localVideo.pause();
	localVideo.srcObject = null;
	if (localStream) {
		localStream.getTracks().forEach(track => {
			console.log('stop track:', track);
			track.stop();
		});
		localStream = null;
	}

	updateUI();
}

// --- UI control ----
function updateUI() {
	if (localStream) {
		disableElement('start_video_button');

		if (isConnected) {
			disableElement('stop_video_button');
		}
		else {
			enabelElement('stop_video_button');
		}
	}
	else {
		enabelElement('start_video_button');
		disableElement('stop_video_button');
	}

	if (bodyPixNet && localStream) {
		if (isConnected) {
			disableElement('start_canvas_button');
			disableElement('stop_canvas_button');
		}
		else {
			if (canvasStream) {
				disableElement('start_canvas_button');
				enabelElement('stop_canvas_button');
			}
			else {
				enabelElement('start_canvas_button');
				disableElement('stop_canvas_button');
			}
		}
	}
	else {
		disableElement('start_canvas_button');
		disableElement('stop_canvas_button');
	}
}

function enabelElement(id) {
	const element = document.getElementById(id);
	if (element) {
		element.removeAttribute('disabled');
	}
}

function disableElement(id) {
	const element = document.getElementById(id);
	if (element) {
		element.setAttribute('disabled', '1');
	}
}

updateUI();
