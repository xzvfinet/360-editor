function getRandomIntRange(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

module.exports.getRandomHexColor = function() {
    var color = "#";
    for (var i = 0; i < 6; ++i) {
        var randomCode1 = getRandomIntRange("A".charCodeAt(0), "F".charCodeAt(0));
        var randomCode2 = getRandomIntRange("0".charCodeAt(0), "9".charCodeAt(0));
        var randomSelect = getRandomIntRange(0, 1);
        color += String.fromCharCode((randomSelect) ? randomCode1 : randomCode2);
    }
    return color;
}

function toRadians(angle) {
    return angle * (Math.PI / 180);
}

function toAngle(radians) {
    return radians * (180 / Math.PI);
}

module.exports.getForwardPostion = function(rotation) {
    var cameraRotation = rotation;
    var yaw = -toRadians(cameraRotation.y - 90);
    var pitch = -toRadians(cameraRotation.x);
    var radius = -6;
    var x = radius * Math.cos(yaw) * Math.cos(pitch);
    var y = radius * Math.sin(pitch);
    var z = radius * Math.sin(yaw) * Math.cos(pitch);

    return { x: x, y: y, z: z };
}

module.exports.floorTwo = function(val) {
    return Math.round(val * 100) / 100;
}

module.exports.getImageSize = function(url, callback) {
    var img = new Image();
    img.onload = callback;
    img.src = url;
}
