// Constants
var PRIMITIVE_DEFINITIONS = ['box', 'sphere', 'cylinder', 'plane', 'image'];
var OBJECT_DEFINITIONS = ['teleport'];

// Editor Dom Elements
var mainCanvas;
var idEl;
var shapeEl;
var positionEl;
var scaleEl;
var deleteBtn;

// Aframe Dom Elements
var mainFrame;
var scene = null;
var camera = null;

// State Variables
var editorMode = false;
var currentSelectedObject = null;
var objects = [];

window.onLoadCanvas = function(frame) {
    console.log('On load editor');

    mainFrame = frame;

    initEditor();
    initCanvas(mainFrame);
}

function initEditor() {
    idEl = document.getElementsByClassName('object-id')[0];
    shapeEl = document.getElementsByClassName('object-shape')[0];
    positionEl = document.getElementsByClassName('object-position')[0];
    scaleEl = document.getElementsByClassName('object-scale')[0];
    deleteBtn = document.getElementById('delete-btn');
    deleteBtn.addEventListener('click', function(evt) {
        console.log(this);
        if (currentSelectedObject == null)
            console.log('Not selected');
        else {
            currentSelectedObject.parentNode.removeChild(currentSelectedObject);
            console.log('removed: ' + currentSelectedObject);
        }
    });
}

function initCanvas() {
    mainCanvas = require('./canvas.js');

    scene = mainFrame.document.querySelector('a-scene');
    camera = mainFrame.document.querySelector('[camera]');
    console.log('camera');
    console.log(camera);

    mainFrame.AFRAME.registerComponent('object-listener', {
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
}

window.setUpFrame = function() {
    
    canvasFrame = window.frames['main_scene'].contentWindow;
    canvasFrame.onObjectEditor = onObjectEditor;
    canvasFrame.onObjectViewer = onObjectViewer;
}


window.isEditorMode = function() {
    return true;
}

function getShapeOfObject(object) {

}

window.createPrimitive = function(shape) {
    if (!PRIMITIVE_DEFINITIONS.includes(shape)) {
        console.log('Not valid shape:' + shape);
        return;
    }
    // console.log(mainCanvas.addEntity);
    var el = mainCanvas.addEntity(shape = shape);
    // var num = objectMap.get(shape).push(el);
    // console.log('number of ' + shape + ' is ' + num);
}

function createObject(evt, type) {
    if (!PRIMITIVE_DEFINITIONS.includes(type)) {
        console.log('Not valid shape:' + type);
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

function makeViewString(position, scale) {

    if (position != null) {
        return makeArrayAsString(Math.round(position.x * 100) / 100, Math.round(position.y * 100) / 100, Math.round(position.z * 100) / 100);
    } else if (scale != null) {
        return makeArrayAsString(scale.x, scale.y, scale.z);
    }
}

function onObjectEditor() {
    var data = this.data;
    var el = this.el;
    this.el.addEventListener('click', function(evt) {
        currentSelectedObject = this;
        shapeEl.innerHTML = this.getAttribute('geometry').primitive;
        positionEl.innerHTML = makeViewString(position = this.getAttribute('position'));
        scaleEl.innerHTML = makeViewString(scale = this.getAttribute('scale'));
    });
    this.el.addEventListener('tick', function(time, deltaTime) {
        console.log("merong");
    });
}

function onObjectViewer() {
    var data = this.data;
    var el = this.el;
    this.el.addEventListener('click', function(evt) {
        console.log('(id:' + data.id + ')clicked');
    });
}
