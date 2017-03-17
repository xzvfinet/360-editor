(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Constants
var PRIMITIVE_DEFINITIONS = ['box', 'sphere', 'cylinder', 'plane', 'image'];
var OBJECT_DEFINITIONS = ['teleport'];

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
    console.log('Called from onload of canvas.html');

    mainFrame = frame;

    initEditor();
    initCanvas();
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
}

function initCanvas() {
    scene = mainFrame.document.querySelector('a-scene');
    camera = mainFrame.document.querySelector('[camera]');

    mainFrame.AFRAME.registerComponent('object-listener', {
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

window.create = function(type) {
    if (PRIMITIVE_DEFINITIONS.includes(type)) {
        createPrimitive(type);
    } else if (OBJECT_DEFINITIONS.includes(type)) {
        createObject(type);
    }
}

function createPrimitive(shape) {
    if (!PRIMITIVE_DEFINITIONS.includes(shape)) {
        console.log('Not valid shape:' + shape);
        return;
    }
    var el = addEntity(shape);
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

function onObjectSelect() {
    if (editorMode) {
        currentSelectedObject = obj.getFromEl(this);
        shapeEl.innerHTML = this.getAttribute('geometry').primitive;
        var position = this.getAttribute('position');
        positionEl.innerHTML = makeArrayAsString(
            util.floorTwo(position.x),
            util.floorTwo(position.y),
            util.floorTwo(position.z));
        var rotation = this.getAttribute('rotation');
        rotationEl.innerHTML = makeArrayAsString(
            util.floorTwo(rotation.x),
            util.floorTwo(rotation.y));
        scale = this.getAttribute('scale');
        scaleEl.innerHTML = makeArrayAsString(scale.x, scale.y, scale.z);
    } else {
        console.log('id:' + this.id + ' is clicked');
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

    var position = util.getForwardPostion(camera.getAttribute('rotation'));
    newObj.setPosition(position);
    var rotation = camera.getAttribute('rotation');
    newObj.setRotation(rotation);

    if (shape == 'image') {
        newEl.setAttribute('material', 'src', "http://i.imgur.com/fHyEMsl.jpg");
        newObj.setScale('1 1 1');
        newEl.setAttribute('scale', '1 1 1');
    } else {
        newEl.setAttribute('material', 'color', util.getRandomHexColor());
        newObj.setScale(scale);
    }
    newEl.setAttribute('object-listener', "id:" + shape);

    scene.appendChild(newEl);
    console.log(tag + ' shape(' + shape + '), position(' + position + ') is created');

    return newEl;
}

},{"./object.js":2,"./util.js":3}],2:[function(require,module,exports){
var objects = [];


function Objct(el) {
    this.el = el;
    this.transform = {};
    this.material = {};

    objects.push(this);
}

Objct.prototype.setPosition = function(newPosition) {
    this.el.setAttribute('position', newPosition);
    this.transform.position = newPosition;
}

Objct.prototype.setRotation = function(newRotation) {
    this.el.setAttribute('rotation', newRotation);
    this.transform.rotation = newRotation;
}

Objct.prototype.setScale = function(newScale) {
    this.el.setAttribute('scale', newScale);
    this.transform.scale = newScale;
}

function getNum() {
    return objects.length;
}

function remove(obj) {
    console.log('trying remove:' + obj);
    if (obj.el) {
        obj.el.parentElement.removeChild(obj.el);
        console.log('removed');
    }
}

function getFromEl(el) {
    console.log("el: " + el);
    var objs = objects.filter(function(obj) {
        console.log("obj.el: " + obj.el);
        return obj.el == el;
    });
    console.log("obj length: " + objs.length);
    return objs[0];
}

module.exports = {
    Objct: Objct,
    getNum: getNum,
    remove: remove,
    getFromEl: getFromEl
};

},{}],3:[function(require,module,exports){
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
    return x + ' ' + y + ' ' + z;
}

module.exports.floorTwo = function(val) {
    return Math.round(val * 100) / 100;
}

},{}]},{},[1]);
