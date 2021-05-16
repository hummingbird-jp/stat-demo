// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyB1MW03acUH6ezwQyL6UqRJvsxuBz4MWbo",
    authDomain: "stat-e02c3.firebaseapp.com",
    databaseURL: "https://stat-e02c3-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "stat-e02c3",
    storageBucket: "stat-e02c3.appspot.com",
    messagingSenderId: "184126002153",
    appId: "1:184126002153:web:c396183779494a56c3b178"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
console.log("firebase initillized: ", firebaseConfig);

function pushStatus(groupId, userId, isInView, pose, emotion) {
    const timestamp = new Date().getTime();
    var statusId = 's' + timestamp;
    var ref = firebase.database().ref('status/' + groupId + '/' + statusId);
    ref.set({
        name: userId,
        isInView: isInView,
        timestamp: timestamp,
        emotion: emotion,
        pose: pose
    });
}

function pushPresentStatus(userId, isInView, pose, emotion) {
    const timestamp = new Date().getTime();
    firebase.database().ref('status-present/' + userId).set({
        isInView: isInView,
        timestamp: timestamp,
        emotion: emotion,
        pose: pose
    });
}

function isUserInView(userId) {
    let lastUpdatedTS = null;
    const now = new Date().getTime();
    var ref = firebase.database().ref('status-present/' + userId + '/timestamp');
    ref.on('value', (snapshot) => {
        lastUpdatedTS = snapshot.val();
    })
    if (now - lastUpdatedTS < 60000) {
        return true;
    }
    return false;
}

function getTeamMembersId(groupId) {
    let teamMembersId = [];
    var ref = firebase.database().ref('groups/' + groupId + '/members')
    ref.orderByValue().on("value", function (snapshot) {
        snapshot.forEach(function (data) {
            teamMembersId.push(data.key);
        });
    });
    // console.log(teamMembersId.length + ' users found in ' + groupId + ', with id: ' + teamMembersId);
    return teamMembersId;
}

function isTeamInView(groupId) {
    var teamMembersId = getTeamMembersId(groupId);
    let teamStatus = [];
    for (let i = 0; i < teamMembersId.length; i++) {
        teamStatus.push(isUserInView(teamMembersId[i]));
    }
    console.log('team status: (' + teamMembersId + ') = (' + teamStatus + ')');
    if (!teamStatus) {
        var isReady = teamStatus.reduce((sum, next) => sum && next, true);
        if (isReady) {
            alert('The team is ready!');
        }
    }
}