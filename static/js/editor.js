// Constants
var PRIMITIVE_DEFINITIONS = ['box', 'sphere', 'cylinder', 'plane', 'image'];
var OBJECT_DEFINITIONS = ['teleport'];

// Dom Elements
var mainCanvas;
var idEl;
var shapeEl;
var positionEl;
var scaleEl;

// State Variables
var cnt = 0;
var objectMap = new Map();
var shapeCount = {};

function init() {
    idEl = document.getElementsByClassName('object-id')[0];
    shapeEl = document.getElementsByClassName('object-shape')[0];
    positionEl = document.getElementsByClassName('object-position')[0];
    scaleEl = document.getElementsByClassName('object-scale')[0];
}

function setUpFrame() {
    mainCanvas = window.frames['main_scene'].contentWindow;
    mainCanvas.onObjectEditor = onObjectEditor;
    mainCanvas.onObjectViewer = onObjectViewer;
}

function isEditorMode() {
    return true;
}

function getShapeOfObject(object) {

}

function countShape(shape) {
    if (PRIMITIVE_DEFINITIONS.includes(shape)) {
        if (shapeCount[shape] == undefined) {
            shapeCount[shape] = 0;
        }
        shapeCount[shape]++;
    } else if (OBJECT_DEFINITIONS.includes(shape)) {


    } else {
        console.log("Wrong shape: " + shape);
    }
}

function createPrimitive(evt, shape) {
    if (!PRIMITIVE_DEFINITIONS.includes(shape)) {
        console.log('Not valid shape:' + shape);
        return;
    }
    mainCanvas.addEntity(shape = shape);
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
