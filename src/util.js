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

function toDegree(radians) {
    return radians * (180 / Math.PI);
}

module.exports.getForwardPosition = function(rotation, radius) {
    if (radius == undefined) radius = -6;

    var yaw = -toRadians(rotation.y - 90);
    var pitch = -toRadians(rotation.x);
    var x = radius * Math.cos(yaw) * Math.cos(pitch);
    var y = radius * Math.sin(pitch);
    var z = radius * Math.sin(yaw) * Math.cos(pitch);

    return { x: x, y: y, z: z };
}

function vector2Rotation(v) {
    var radius = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
    var pitch = Math.asin(v.y/radius);
    var yaw = Math.acos(v.x/(radius*Math.cos(pitch)));

    var rotation = {};
    rotation.y = -(toDegree(yaw) + 90);
    rotation.x = -toDegree(pitch);
    rotation.z = 0;

    return rotation;
}

module.exports.calcRotationBetweenVector = function(v1, v2) {
    var r1 = vector2Rotation(v1);
    var r2 = vector2Rotation(v2);

    return {
        x: r1.x-r2.x,
        y: r1.y-r2.y,
        z: 0
    };
}

module.exports.floorTwo = function(val) {
    return Math.round(val * 100) / 100;
}

module.exports.getImageSize = function(url, callback) {
    var img = new Image();
    img.onload = callback;
    img.src = url;
}
