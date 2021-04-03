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

async function loadModel() {
	// using ResNet (new) version
	// if smaller, faster, less accurate version is required: use MobileNet version
	const net = await bodyPix.load({
		architecture: 'ResNet50',
		outputStride: 32,
		quantBytes: 2
	});
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
		flipHorizontal: true,
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
				const fgColor = {
					r: 0,
					g: 0,
					b: 0,
					a: 0,
				};
				const bgColor = {
					r: 100,
					g: 127,
					b: 127,
					a: 255,
				};
				const personPartImage = bodyPix.toMask(segmentation, fgColor, bgColor);
				bodyPixMaks = personPartImage;
			}
			else if (maskType === 'person') {
				const fgColor = {
					r: 100,
					g: 127,
					b: 127,
					a: 255,
				};
				const bgColor = {
					r: 0,
					g: 0,
					b: 0,
					a: 0,
				};
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

updateUI();
