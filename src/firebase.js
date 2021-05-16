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
    let bool = null,
        timestamp = null,
        since = null;
    const now = new Date().getTime();
    var ref = firebase.database().ref('status-present/' + userId + '/timestamp');
    ref.on('value', (snapshot) => {
        timestamp = snapshot.val();
    })
    since = now - timestamp;
    bool = since < 60000
    return {
        bool,
        since
    };
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

function getUserNameById(userId) {
    var userName = null;
    firebase.database().ref('users/' + userId).on("value", (snapshot) => {
        var result = snapshot.val();
        userName = result.name;
    })
    return userName;
}

function isTeamInView(groupId) {
    var teamMembersId = getTeamMembersId(groupId);
    let teamStatus = [];
    for (let i = 0; i < teamMembersId.length; i++) {
        result = isUserInView(teamMembersId[i]);
        teamStatus.push(result.bool);
    }
    // console.log('team status: (' + teamMembersId + ') = (' + teamStatus + ')');
    if (!teamStatus) {
        var isReady = teamStatus.reduce((sum, next) => sum && next, true);
        if (isReady) {
            alert('The team is ready!');
        }
    }
}

function showTeamStatus(groupId) {
    clearBox('statusView');
    var teamMembersId = getTeamMembersId(groupId);
    if (teamMembersId[0]) {
        var tbl = document.getElementById('statusView')
        var tblBody = document.createElement("tbody");
        for (var i = 0; i < teamMembersId.length; i++) {
            var row = document.createElement("tr");

            var userName = getUserNameById(teamMembersId[i]);
            var cell = document.createElement("td");
            var cellText = document.createTextNode(userName);
            cell.appendChild(cellText);
            row.appendChild(cell);

            var statusObj = null;
            firebase.database().ref('status-present/' + teamMembersId[i]).on("value", (snapshot) => {
                statusObj = snapshot.val();
            });

            var result = isUserInView(teamMembersId[i]);
            var lastMinInView = timeConvert(result.since) + ' ago'
            if (result.bool) {
                var showContent = [lastMinInView, statusObj.emotion, statusObj.pose];
            } else {
                var showContent = [lastMinInView];
            }
            for (var j = 0; j < showContent.length; j++) {
                var cell = document.createElement("td");
                var cellText = document.createTextNode(showContent[j]);
                cell.appendChild(cellText);
                row.appendChild(cell);
            }
            tblBody.appendChild(row);
        }
        tbl.appendChild(tblBody);
        tbl.setAttribute("border", "2");
    }
}