var flipHorizontal = false;

var imageElement = document.getElementById('human');

posenet.load().then(function (net) {
	const pose = net.estimateSinglePose(imageElement, {
		flipHorizontal: true
	});
	return pose;
}).then(function (pose) {
	console.log(pose);
})
