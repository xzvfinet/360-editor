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
    if (radius == undefined) radius = 6;

    console.log(rotation);

    var theta = rotation.x;
    var pi = rotation.y + 90;

    var thetaRad = toRadians(theta);
    var piRad = toRadians(pi);

    var x = radius * Math.cos(thetaRad) * Math.cos(piRad);
    var y = radius * Math.sin(thetaRad);
    var z = -radius * Math.cos(thetaRad) * Math.sin(piRad);

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
