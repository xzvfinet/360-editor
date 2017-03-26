// Constants
var PRIMITIVE_DEFINITIONS = ['box', 'sphere', 'cylinder', 'plane', 'image'];
var OBJECT_DEFINITIONS = ['teleport'];
var OBJECT_LISTENER = 'object-listener';
var EVENT_LIST = ['teleport', 'link', 'page', 'image', 'video'];
var BACKGROUND_PREFIX = "../img/";
var EVENT_DICTIONARY = {
    'teleport': teleportEvent
}
var TEST_JSON = '[{"el":null,"type":"primitive","shape":"box","transform":{"position":{"x":-3.6739403974420594e-16,"y":0,"z":-6},"rotation":{"x":0,"y":0,"z":0},"scale":{"x":1,"y":1,"z":1}},"material":{"color":"#257654"},"clickListener":"object-listener","eventList":[]},{"el":null,"type":"primitive","shape":"sphere","transform":{"position":{"x":-1.3275046384397702,"y":-1.2272767136552951,"z":-5.721147026867983},"rotation":{"x":-11.802930579694959,"y":13.06343772898277,"z":0},"scale":{"x":1,"y":1,"z":1}},"material":{"color":"#013882"},"clickListener":"object-listener","eventList":[]},{"el":null,"type":"primitive","shape":"cylinder","transform":{"position":{"x":0.9465000710454844,"y":-1.989605502556811,"z":-5.580824989166615},"rotation":{"x":-19.365973475421832,"y":-9.625690958197833,"z":0},"scale":{"x":1,"y":1,"z":1}},"material":{"color":"#404134"},"clickListener":"object-listener","eventList":[]}]';


// Editor Dom Elements
var mainCanvas;
var menuElList;
var idEl;
var shapeEl;
var positionEl;
var rotationEl;
var scaleEl;
var deleteBtn;
var editorToggle;
var eventArgEl;
var loadTextEl;
var saveBtnEl;
var loadBtnEl;

// Aframe Dom Elements
var mainFrame;
var scene = null;
var camera = null;
var background = null;

// State Variables
var editorMode = true;
var currentSelectedObject = null;

var util = require('./util.js');
var nodeUtil = require('util');
var obj = require('./object.js');

window.onLoadCanvas = function(frame) {
    mainFrame = frame;

    initEditor();
    initCanvas();

    var boxEl = mainFrame.document.getElementById('testbox');
    var left = mainFrame.document.getElementById('left');
    var right = mainFrame.document.getElementById('right');
    var top = mainFrame.document.getElementById('top');
    var bottom = mainFrame.document.getElementById('bottom');
    var els = [left, right, top, bottom];
    for (var i = 0; i < els.length; ++i) {
        els[i].setAttribute('mover-listener', "");
        els[i].addEventListener('mouseenter', function() {
            var scale = this.getAttribute('scale');
            this.setAttribute('scale', { x: scale.x * 2, y: scale.y * 2, z: scale.z });
        });
        els[i].addEventListener('mouseleave', function() {
            var scale = this.getAttribute('scale');
            this.setAttribute('scale', { x: scale.x * 0.5, y: scale.y * 0.5, z: scale.z });
        });
        els[i].addEventListener('mousedown', function(evt) {
            console.log('down');
        });
    }

    // boxEl.addEventListener('mouseenter', function() {
    //     boxEl.setAttribute('scale', { x: 2, y: 2, z: 2 });
    // });
    // boxEl.addEventListener('mouseleave', function() {
    //     boxEl.setAttribute('scale', { x: 1, y: 1, z: 1 });
    // });
}

window.create = function(type) {
    if (PRIMITIVE_DEFINITIONS.includes(type)) {
        createPrimitive(type);
    } else if (OBJECT_DEFINITIONS.includes(type)) {
        createObject(type);
    }
}

window.onMouseMove = function(evt) {
    console.log(evt.clientX + ", " + evt.clientY);
}

function initEditor() {
    menuElList = document.getElementsByClassName('well');
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
            obj.Controller.remove(currentSelectedObject);
        }
    });
    editorToggle = $('#toggle-event');
    // Initially the editor mode is enabled.
    editorToggle.bootstrapToggle('on');
    editorMode = true;
    editorToggle.change(function() {
        editorMode = !editorMode;
        for (var i = 0; i < menuElList.length; ++i){
            menuElList[i].style.visibility = (editorMode) ? 'visible' : 'hidden';
        }
    });
    eventArgEl = document.getElementById('eventArg');
    loadTextEl = document.getElementById('loadInput');
    loadTextEl.value = TEST_JSON;
    saveBtnEl = document.getElementById('saveBtn');
    saveBtnEl.addEventListener('click', function(evt) {
        var json = obj.Controller.objectsToJson();
        loadTextEl.value = json;
    });
    loadBtnEl = document.getElementById('loadBtn');
    loadBtnEl.addEventListener('click', function(evt) {
        loadObjectsFromJson(loadTextEl.value);
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
            currentSelectedObject.eventList = [];
            currentSelectedObject.eventList.push({ 'type': eventName, 'arg': eventArgEl.value });
            // currentSelectedObject.eventList.push([eventName, eventArgEl.value]);
        }
    })
}

function initCanvas() {
    scene = mainFrame.document.querySelector('a-scene');
    camera = mainFrame.document.querySelector('[camera]');
    background = mainFrame.document.querySelector('a-sky');

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

function loadRoom(data) {
    var bgSrc = data.bgSrc;
    var objects = data.objects;
}

function createPrimitive(shape) {
    if (!PRIMITIVE_DEFINITIONS.includes(shape)) {
        console.log('Not valid shape:' + shape);
        return;
    }
    newObject('primitive', shape);
}

function createObject(type) {
    if (!OBJECT_DEFINITIONS.includes(type)) {
        console.log('Not valid type:' + type);
        return;
    }
    newObject(type, 'plane');
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
    currentSelectedObject = obj.Controller.findByEl(this);
    if (editorMode) {
        shapeEl.innerHTML = currentSelectedObject.getShape();
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
            var event = currentSelectedObject.eventList[i];
            var eventType = event['type'];
            var func = EVENT_DICTIONARY[eventType];
            var arg = event['arg'];
            func(arg);
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

function newObject(type, shape, position, rotation, scale) {
    var tag = 'a-' + shape;
    var newEl = mainFrame.document.createElement(tag);
    var newObj = new obj.Objct(newEl);

    newObj.type = type;
    newObj.shape = shape;
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
        newObj.setMaterial({ 'src': "http://i.imgur.com/fHyEMsl.jpg" });
    } else {
        newObj.setMaterial({ 'color': util.getRandomHexColor() });
    }
    newObj.setClickListener(OBJECT_LISTENER);

    newObj.eventList = [];
    newObj.eventList.push({ 'type': type, 'arg': 'bg1.jpg' });

    scene.appendChild(newEl);
}

function teleportEvent(arg) {
    console.log('teleport! to:' + arg);
    var imageUrl = BACKGROUND_PREFIX + arg;
    background.setAttribute('src', imageUrl);
}

function loadObjectsFromJson(json) {
    var objects = obj.Controller.objectsFromJson(json);
    for (var i = 0; i < objects.length; ++i) {
        var el = obj.Controller.createElFromObj(mainFrame, objects[i]);
        scene.appendChild(el);
    }
}
