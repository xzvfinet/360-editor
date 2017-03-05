var editorMode = false;
var scene = null;
var camera = null;

function init() {
    window.parent.setUpFrame();

    editorMode = window.parent.isEditorMode();
    scene = document.querySelector('a-scene');
    camera = document.querySelector('[camera]');

    AFRAME.registerComponent('object-listener', {
        schema: {
            id: {
                default: "shape"
            }
        },
        init: (editorMode) ? onObjectEditor : onObjectViewer,
        tick: function(time, timeDelta) {
            // console.log(time + ', ' + timeDelta);
            // console.log(camera.getAttribute('rotation'));
        }

    });

    return true;
}

function getRandomIntRange(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function getRandomHexColor() {
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

function getForwardPostion() {
    var cameraRotation = camera.getAttribute('rotation');
    var yaw = -toRadians(cameraRotation.y - 90);
    var pitch = -toRadians(cameraRotation.x);
    var radius = -6;
    var x = radius * Math.cos(yaw) * Math.cos(pitch);
    var y = radius * Math.sin(pitch);
    var z = radius * Math.sin(yaw) * Math.cos(pitch);
    return x + ' ' + y + ' ' + z;
}

function addEntity(shape, position, scale) {
    var tag = 'a-' + shape;
    var newEl = document.createElement(tag);

    position = getForwardPostion();

    newEl.setAttribute('position', position);
    if (shape == 'image') {
        newEl.setAttribute('material', 'src', "http://i.imgur.com/fHyEMsl.jpg");
        newEl.setAttribute('scale', '1 1 1');
    } else {
        newEl.setAttribute('material', 'color', getRandomHexColor());
        newEl.setAttribute('scale', scale);
    }
    newEl.setAttribute('object-listener', "id:" + shape);

    scene.appendChild(newEl);
    console.log('shape(' + shape + '), position(' + position + ') is created');
}
