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
		canvas,
		srcElement,
		bodyPixMaks,
		opacity,
		maskBlurAmount,
		flipHorizontal,
	);
}

async function startVideo() {
	const mediaConstraints = {
		video: {
			width: 640,
			height: 480
		},
		audio: false
	};
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
