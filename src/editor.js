// Constants
var PRIMITIVE_DEFINITIONS = ['box', 'sphere', 'cylinder', 'plane', 'image'];
var OBJECT_DEFINITIONS = ['teleport'];
var OBJECT_LISTENER = 'object-listener';
var EVENT_LIST = ['teleport', 'link', 'page', 'image', 'video'];

// Editor Dom Elements
var mainCanvas;
var idEl;
var shapeEl;
var positionEl;
var rotationEl;
var scaleEl;
var deleteBtn;
var editorToggle;

// Aframe Dom Elements
var mainFrame;
var scene = null;
var camera = null;

// State Variables
var editorMode = true;
var currentSelectedObject = null;

var util = require('./util.js');
var obj = require('./object.js');

window.onLoadCanvas = function(frame) {
    mainFrame = frame;

    initEditor();
    initCanvas();
}

window.create = function(type) {
    if (PRIMITIVE_DEFINITIONS.includes(type)) {
        createPrimitive(type);
    } else if (OBJECT_DEFINITIONS.includes(type)) {
        createObject(type);
    }
}

function initEditor() {
    idEl = document.getElementsByClassName('object-id')[0];
    shapeEl = document.getElementsByClassName('object-shape')[0];
    positionEl = document.getElementsByClassName('object-position')[0];
    rotationEl = document.getElementsByClassName('object-rotation')[0];
    scaleEl = document.getElementsByClassName('object-scale')[0];
    deleteBtn = document.getElementById('delete-btn');
    deleteBtn.addEventListener('click', function(evt) {
        if (currentSelectedObject == null)
            console.log('Not selected');
        else {
            obj.remove(currentSelectedObject);
        }
    });
    editorToggle = $('#toggle-event');
    // Initially the editor mode is enabled.
    editorToggle.bootstrapToggle('on');
    editorMode = true;
    editorToggle.change(function() {
        editorMode = !editorMode;
    });

    for (var i = 0; i < EVENT_LIST.length; ++i) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.appendChild(document.createTextNode(EVENT_LIST[i]));
        a.setAttribute('href', '#');
        li.appendChild(a);
        $(".dropdown-menu")[0].appendChild(li);
    }

    $(".dropdown-menu").on("click", "li", function(event) {
        if (currentSelectedObject != null) {
            var eventName = this.children[0].innerHTML;
            var func = getEventFunction(eventName);
            currentSelectedObject.eventList.push(func);
        }
    })
}

function initCanvas() {
    scene = mainFrame.document.querySelector('a-scene');
    camera = mainFrame.document.querySelector('[camera]');

    mainFrame.AFRAME.registerComponent(OBJECT_LISTENER, {
        schema: {
            id: {
                default: "shape"
            }
        },
        init: function() {
            this.el.addEventListener('click', onObjectSelect);
        },
        tick: function(time, timeDelta) {
            // console.log(time + ', ' + timeDelta);
            // console.log(camera.getAttribute('rotation'));
        }
    });
}

function createPrimitive(shape) {
    if (!PRIMITIVE_DEFINITIONS.includes(shape)) {
        console.log('Not valid shape:' + shape);
        return;
    }
    addEntity(shape);
}

function createObject(evt, type) {
    if (!PRIMITIVE_DEFINITIONS.includes(type)) {
        console.log('Not valid type:' + type);
        return;
    }
}

function makeArrayAsString() {
    var result = "";
    for (var i = 0; i < arguments.length - 1; ++i) {
        result += arguments[i] + ", ";
    }
    result += arguments[arguments.length - 1];
    return result;
}

function onObjectSelect() {
    currentSelectedObject = obj.getFromEl(this);
    if (editorMode) {
        shapeEl.innerHTML = currentSelectedObject.getType();
        var position = currentSelectedObject.transform.position;
        positionEl.innerHTML = makeArrayAsString(
            util.floorTwo(position.x),
            util.floorTwo(position.y),
            util.floorTwo(position.z));
        var rotation = currentSelectedObject.transform.rotation;
        rotationEl.innerHTML = makeArrayAsString(
            util.floorTwo(rotation.x),
            util.floorTwo(rotation.y));
        scale = currentSelectedObject.transform.scale;
        scaleEl.innerHTML = makeArrayAsString(scale.x, scale.y, scale.z);
    } else {
        // Execute events assigned to object.
        for (var i = 0; i < currentSelectedObject.eventList.length; ++i) {
            currentSelectedObject.eventList[i]();
        }
    }
}

function onObjectUnselect() {
    currentSelectedObject = null;
    shapeEl.innerHTML = "";
    positionEl.innerHTML = "";
    rotationEl.innerHTML = "";
    scaleEl.innerHTML = "";
}

function addEntity(shape, position, rotation, scale) {
    var tag = 'a-' + shape;
    var newEl = mainFrame.document.createElement(tag);
    var newObj = new obj.Objct(newEl);

    position = util.getForwardPostion(camera.getAttribute('rotation'));
    newObj.setPosition(position);
    rotation = camera.getAttribute('rotation');
    newObj.setRotation(rotation);
    scale = { x: 1, y: 1, z: 1 };
    newObj.setScale(scale);

    if (shape == 'image') {
        util.getImageSize("http://i.imgur.com/fHyEMsl.jpg", function() {
            newObj.setScale({ x: 1, y: this.height / this.width });
        });
        newEl.setAttribute('material', 'src', "http://i.imgur.com/fHyEMsl.jpg");
    } else {
        newEl.setAttribute('material', 'color', util.getRandomHexColor());
    }
    newEl.setAttribute(OBJECT_LISTENER, "");

    scene.appendChild(newEl);
    console.log(tag + ' shape(' + shape + '), position(' + position + ') is created');
}

function getEventFunction(eventName) {
    if (eventName == 'teleport') {
        return function() {
            console.log('teleport!');
        }
    }
}
