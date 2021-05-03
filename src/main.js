// なぜかグローバル変数じゃないと動かないが、原因不明
const videoElement = document.getElementById('video');

main();

function main() {
	setupVideo();
	loadModels();

	const canvas = document.getElementById('canvas');
	const updateInterval = 5000;
	const showRawVideo = () => { canvas.getContext("2d").drawImage(videoElement, 0, 0, 1080, 720) };
	const execPoseNet = () => { estimatePoseOnVideo(videoElement) };
	const execEmotionRecognition = () => { drawBlaze(videoElement) };

	setInterval(showRawVideo, 1000 / 30); // 30fpsで元動画を表示
	setInterval(execPoseNet, updateInterval);
	setInterval(execEmotionRecognition, updateInterval);
}
