const CLASSES = ({ 0: '😠 angry', 1: '😬 disgust', 2: '😨 fear', 3: '😄 happy', 4: '😢 sad', 5: '😮 surprise', 6: '😐 neutral' })
const COLORS = ({ 0: 'red', 1: 'green', 2: 'purple', 3: 'yellow', 4: 'blue', 5: 'skyblue', 6: 'white' })

async function drawBlaze(srcElement) {
	const ctx = canvas.getContext('2d');
	const returnTensors = false;
	const flipHorizontal = false;
	const annotateBoxes = true;
	const predictions = await blazeFaceModel.estimateFaces(
		srcElement,
		returnTensors,
		flipHorizontal,
		annotateBoxes
	);

	if (predictions.length > 0) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		for (let i = 0; i < predictions.length; i++) {
			if (returnTensors) {
				predictions[i].topLeft = predictions[i].topLeft.arraySync();
				predictions[i].bottomRight = predictions[i].bottomRight.arraySync();
				if (annotateBoxes) {
					predictions[i].landmarks = predictions[i].landmarks.arraySync();
				}
			}

			ctx.drawImage(srcElement, 0, 0, 1080, 720)

			const start = predictions[i].topLeft;
			const end = predictions[i].bottomRight;
			const size = [end[0] - start[0], end[1] - start[1]];

			//if (annotateBoxes) { const landmarks = predictions[i].landmarks; }

			//var faceCtx = canvas.getContext('2d');
			//var adjust = 1 // 1080 / localVideo.width; // originalVideoWidth / video.width
			//faceCtx.drawImage(
			//	srcElement, start[0] * adjust, start[1] * adjust, size[0] * adjust, size[1] * adjust, 0, 0, 100, 100
			//);

			tensor_image = preprocessImage(canvas);

			let emotion_prediction = await emotionModel.predict(tensor_image).data();
			let results = Array.from(emotion_prediction)
				.map(function (p, i) {
					return {
						probability: p,
						className: CLASSES[i],
						classNumber: i
					};
				}).sort(function (a, b) {
					return b.probability - a.probability;
				}).slice(0, 6);
			console.log(results[0].className, results[0].probability);
			// async functionにPromise以外を返させる方法がわからなかったので、計算結果をとりあえずここに入れておく
			EMOTION = results[0].className;
		}
	}
}

//-----------------------
// TensorFlow.js method
// image to tensor
//-----------------------

function preprocessImage(image) {
	const channels = 1;
	// let tensor = tf.fromPixels(image, channels).resizeNearestNeighbor([64,64]).toFloat();
	let tensor = tf.browser.fromPixels(image, channels).resizeNearestNeighbor([64, 64]).toFloat();
	// console.log("tensor:",tensor);
	let offset = tf.scalar(255);
	return tensor.div(offset).expandDims();
};
