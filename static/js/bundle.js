(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Constants
var PRIMITIVE_DEFINITIONS = ['box', 'sphere', 'cylinder', 'plane', 'image'];
var OBJECT_DEFINITIONS = ['teleport', 'minimap'];
var OBJECT_LISTENER = 'object-listener';
var EVENT_LIST = ['teleport', 'link', 'page', 'image', 'video', 'sound', 'variable'];
var BACKGROUND_PREFIX = "../img/";
var SOUND_PREFIX = "../sound/";
var EVENT_DICTIONARY = {
    'teleport': teleportEvent,
    'link': linkEvent,
    'image': imageEvent,
    'sound': soundEvent,
    'variable': variableEvent
}
var BASE_WIDTH = 300;

var util = require('./util.js');
var nodeUtil = require('util');
var obj = require('./object.js');
var scnry = require('./scenery.js');

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
var variableEl = {};
var imageUrlInputEl;

// Aframe Dom Elements
var mainFrame;
var sceneEl = null;
var cameraEl = null;
var background = null;
var mover = null;

var miniMap = null;
var miniMapDirector = null;

// State Variables
var editorMode = true;
var currentSelectedObject = null;
var isDown = false;
var currentSelectedArrowEl = null;

window.onLoadCanvas = function(frame) {
    mainFrame = frame;

    initEditor();
    initCanvas();
}

window.setBackground = function(url) {
    scnry.Controller.getCurrentScenery().setBackgroundImageUrl(url);
}

window.saveProject = function(userID, sceneID){
  var sceneryObject = {};
  var objectsJson = obj.Controller.toJson();

  sceneryObject.bgUrl = background.getAttribute('src');
  sceneryObject.objects = objectsJson;

  saveJsontoServer(JSON.stringify(sceneryObject), userID, sceneID);
}

window.loadJson = function(json){
  var sceneryObject = JSON.parse(json);
  console.log(sceneryObject);

  loadObjectsFromJson(sceneryObject.objects);

  background.setAttribute('src', sceneryObject.bgUrl);
}

function initEditor() {
    mainCanvas = $('#main-canvas')[0];
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
            mover = null;
        }
    });
    editorToggle = $('#toggle-event');
    // Initially the editor mode is enabled.
    editorToggle.bootstrapToggle('on');
    editorMode = true;
    editorToggle.change(function() {
        editorMode = !editorMode;
        for (var i = 0; i < menuElList.length; ++i) {
            menuElList[i].style.visibility = (editorMode) ? 'visible' : 'hidden';
        }

        if (!editorMode && mover) {
            mover.parentEl.removeChild(mover);
            mover = null;
        }

        mainCanvas.style.width = (editorMode) ? '' : '100%';
        onObjectUnselect();

    });
    eventArgEl = document.getElementById('eventArg');
    loadTextEl = document.getElementById('loadInput');
    saveBtnEl = document.getElementById('saveBtn');
    saveBtnEl.addEventListener('click', function(evt) {
        var sceneriesJson = scnry.Controller.toJson();
        var objectsJson = obj.Controller.toJson();

        var saveObject = {
            'sceneriesJson': sceneriesJson,
            'objectsJson': objectsJson
        }

        loadTextEl.value = JSON.stringify(saveObject);
        saveJsontoServer(JSON.stringify(saveObject));
    });
    loadBtnEl = document.getElementById('loadBtn');
    loadBtnEl.addEventListener('click', function(evt) {
        var json = JSON.parse(loadTextEl.value);
        var sceneriesJson = json.sceneriesJson;
        var objectsJson = json.objectsJson;

        load(sceneriesJson, objectsJson);
        // loadObjectsFromJson(sceneryObject.objects);
        // background.setAttribute('src', sceneryObject.bgUrl);
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
    });

    $("#image-form").submit(function() {
        return false;
    });


    imageUrlInputEl = document.getElementById('img-url');
}

function initCanvas() {
    sceneEl = mainFrame.document.querySelector('a-scene');
    cameraEl = mainFrame.document.querySelector('[camera]');
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
        tick: function(time, timeDelta) {}
    });
    mainFrame.AFRAME.registerComponent('mover-listener', {
        schema: {},
        init: function() {
            var initialPos = null;
            var prevPos = null;
            var radius = 6;

            var parentObject = obj.Controller.findByEl(this.el.parentEl);

            var originalScale = this.el.getAttribute('scale');
            var parentScale = this.el.parentEl.getAttribute('scale');

            var initialScale = {
                x: originalScale.x / parentScale.x,
                y: originalScale.y / parentScale.y,
                z: 1
            };
            this.el.setAttribute('scale', initialScale);

            var factor = 2;
            var xFactor = factor / parentScale.x;
            var yFactor = factor / parentScale.y;

            this.el.addEventListener('mouseenter', function() {
                var newScale = {
                    x: originalScale.x * xFactor,
                    y: originalScale.y * yFactor,
                    z: 1
                };
                this.setAttribute('scale', newScale);
            });
            this.el.addEventListener('mouseleave', function() {
                var newScale = {
                    x: initialScale.x,
                    y: initialScale.y,
                    z: 1
                };
                this.setAttribute('scale', newScale);
                this.emit('mouseup');
            });
            this.el.addEventListener('mousedown', function(evt) {
                this.setAttribute('material', 'color', "#FFFFFF");
                cameraEl.removeAttribute('look-controls');
                isDown = true;
                currentSelectedArrowEl = this;

                var pos = cameraEl.components['mouse-cursor'].__raycaster.ray.direction;
                initialPos = { x: pos.x * radius, y: pos.y * radius, z: pos.z * radius };
                prevPos = initialPos;
            });
            this.el.addEventListener('mouseup', function(evt) {
                this.setAttribute('material', 'color', "#000000");
                cameraEl.setAttribute('look-controls', "");
                isDown = false;
                currentSelectedArrowEl = null;
            });
            this.el.addEventListener('mymousemove', function(evt) {
                if (isDown) {
                    var direction = cameraEl.components['mouse-cursor'].__raycaster.ray.direction;
                    var newPos = {
                        x: direction.x * radius,
                        y: direction.y * radius,
                        z: direction.z * radius
                    };
                    parentObject.setPosition(newPos);
                }
            });
        },
        tick: function(time, timeDelta) {
            // console.log(time + ', ' + timeDelta);
            // console.log(cameraEl.getAttribute('rotation'));
        }
    });

    mainFrame.AFRAME.registerComponent('minimap-direction', {

        init: function() {
            var mouseDown = false;
            // Mouse Events
            mainFrame.window.addEventListener('mousedown', this.onMouseDown, false);
            mainFrame.window.addEventListener('mousemove', this.onMouseMove, false);
            mainFrame.window.addEventListener('mouseup', this.releaseMouse, false);

            // Touch events
            sceneEl.addEventListener('touchstart', this.onTouchStart);
            sceneEl.addEventListener('touchmove', this.onTouchMove);
            sceneEl.addEventListener('touchend', this.onTouchEnd);
        },
        onMouseDown: function(event) {
            this.mouseDown = true;
        },
        releaseMouse: function(event) {
            this.mouseDown = false;
        },
        onMouseMove: function(event) {
            if (this.mouseDown) {
                miniMapDirector.setAttribute('rotation', { x: 0, y: 0, z: cameraEl.getAttribute('rotation').y });
            }
        }
    });

    var isMiniClick = false;
    var transparentEl;
    mainFrame.AFRAME.registerComponent('minimap-object', {
        init: function() {
            this.el.addEventListener('click', tempCameraMove);
        },
        tick: function() {
            console.log(isMiniClick);
            if (isMiniClick) {
                miniMapDirector.setAttribute('rotation', { x: 0, y: 0, z: cameraEl.getAttribute('rotation').y });
                //console.log("DO");
            }
        }
    });

    scenery = new scnry.Scenery(background);
}

function load(sceneriesJson, objectsJson) {
    loadSceneriesFromJson(sceneriesJson);
    loadObjectsFromJson(objectsJson);
}

function loadSceneriesFromJson(json) {
    var sceneries = scnry.Controller.fromJson(json);
    sceneries[0].setBgEl(background);
}

function loadObjectsFromJson(json) {
    var objects = obj.Controller.fromJson(json);
    for (var i = 0; i < objects.length; ++i) {
        var el = obj.Controller.createElFromObj(mainFrame, objects[i]);
        sceneEl.appendChild(el);
    }
}

window.create = function(type) {
    if (PRIMITIVE_DEFINITIONS.includes(type)) {
        createPrimitive(type);
    } else if (OBJECT_DEFINITIONS.includes(type)) {
        createObject(type);
    }
}

window.createImage = function(type, src) {
    newObject('primitive', type, src);
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

function onObjectSelect() {
    var selected = obj.Controller.findByEl(this);

    if (editorMode && currentSelectedObject == selected) {
        return;
    }

    currentSelectedObject = selected;

    if (editorMode) {
        shapeEl.innerHTML = currentSelectedObject.getShape();
        var position = currentSelectedObject.transform.position;
        positionEl.innerHTML = util.makeArrayAsString(
            util.floorTwo(position.x),
            util.floorTwo(position.y),
            util.floorTwo(position.z));
        var rotation = currentSelectedObject.transform.rotation;
        rotationEl.innerHTML = util.makeArrayAsString(
            util.floorTwo(rotation.x),
            util.floorTwo(rotation.y));
        scale = currentSelectedObject.transform.scale;
        scaleEl.innerHTML = util.makeArrayAsString(scale.x, scale.y, scale.z);

        // append mover element
        mover = newMover();
        this.appendChild(mover);
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

function newMover() {
    if (mover)
        mover.parentEl.removeChild(mover);
    var newMover;
    newMover = mainFrame.document.createElement('a-plane');
    newMover.setAttribute('position', { x: 0, y: 0, z: 5 });
    newMover.setAttribute('scale', { x: 0.1, y: 0.1, z: 1 });
    newMover.setAttribute('material', "color:#000000");
    newMover.setAttribute('mover-listener', "");

    return newMover;
}

function newObject(type, shape, position, rotation, scale) {
    var tag = 'a-' + shape;
    var newEl = mainFrame.document.createElement(tag);
    var newObj = new obj.Objct(newEl);

    newObj.type = type;
    newObj.shape = shape;
    position = util.getForwardPosition(cameraEl.getAttribute('rotation'));
    newObj.setPosition(position);
    rotation = cameraEl.getAttribute('rotation');
    newObj.setRotation(rotation);
    scale = { x: 1, y: 1, z: 1 };
    newObj.setScale(scale);

    if (shape == 'image') {
        var url = imageUrlInputEl.value;
        util.getImageSize(url, function() {
            newObj.setScale({ x: this.width / BASE_WIDTH, y: this.height / BASE_WIDTH });
        });
        newObj.setMaterial({ 'src': url });
    } else {
        newObj.setMaterial({ 'color': util.getRandomHexColor() });
    }
    newObj.setClickListener(OBJECT_LISTENER);

    newObj.eventList = [];
    newObj.eventList.push({ 'type': type, 'arg': 'bg1.jpg' });

    // Make object face at camera origin by default.
    newObj.setLookAt('#camera');

    sceneEl.appendChild(newEl);

    setObjectOnMiniMap(position);
}

function teleportEvent(arg) {
    console.log('teleport! to:' + arg);
    var imageUrl = BACKGROUND_PREFIX + arg;
    background.setAttribute('src', imageUrl);
}

function linkEvent(arg) {
    console.log('link! to:' + arg);
    window.open("http://" + arg, 'newWindow');
}

function imageEvent(arg) {
    console.log('image popup! to:' + arg);
    var imageEl = mainFrame.document.createElement('a-image');
    cameraEl.appendChild(imageEl);
    imageEl.setAttribute('id', 'popup');
    imageEl.setAttribute('geometry', {
        primitive: 'plane',
        height: 1.2,
        width: 2
    });
    imageEl.setAttribute('material', 'src', BACKGROUND_PREFIX + arg);
    imageEl.setAttribute('position', { x: 0, y: 0, z: -1 });
}

function soundEvent(arg) {
    console.log('sound played :' + arg);
    //var soundEl = mainFrame.document.createElement('a-sound');
    var soundUrl = SOUND_PREFIX + arg;
    currentSelectedObject.setSoundSrc(soundUrl);
    //soundEl.setAttribute('src',soundUrl);
    //sceneEl.appendChild(soundEl);
    //soundEl.components.sound.playSound();
}

function variableEvent(arg) {
    var str = arg.split(' ');
    if (str[1] == '=') {
        variableEl[str[0]] = Number(str[2]);
    } else if (str[1] == '+') {
        variableEl[str[0]] += Number(str[2]);
    } else if (str[1] == '-') {
        variableEl[str[0]] -= Number(str[2]);
    } else if (str[1] == '*') {
        variableEl[str[0]] *= Number(str[2]);
    } else if (str[1] == '/') {
        variableEl[str[0]] /= Number(str[2]);
    }
    console.log(str[0] + "=" + variableEl[str[0]]);
}

function loadObjectsFromJson(json) {
    var objects = obj.Controller.fromJson(json);
    for (var i = 0; i < objects.length; ++i) {
        var el = obj.Controller.createElFromObj(mainFrame, objects[i]);
        sceneEl.appendChild(el);
    }
}

function saveJsontoServer(json, userID, sceneID){
  $.ajax({
    url : '/project/save',
    method : 'post',
    data : {
        user : userID,
        json : json,
        scene : sceneID
    },
    success : function (data) {
      alert("Save success");
    },
    error : function (err) {
      alert("Save fail." + err.toString());
    }
  });
}

//minimap
window.setMiniMap = function() {
    if (miniMap == null) {
        miniMap = mainFrame.document.createElement('a-image');
        miniMapDirector = mainFrame.document.createElement('a-image');

        miniMap.setAttribute('id', 'minimap');
        miniMap.setAttribute('material', 'opacity', 0);

        miniMapDirector.setAttribute('id', 'minimap-director');
        miniMapDirector.setAttribute('material', 'src', '/static/img/Minimap_Director.png');
        miniMapDirector.setAttribute('minimap-direction', "")

        rotation = { x: 0, y: 0, z: cameraEl.getAttribute('rotation').y }
        miniMapDirector.setAttribute('rotation', rotation);

        position = { x: -4, y: -3.5, z: -5 };
        miniMap.setAttribute('position', position);

        //newObj.setPosition(position);

        miniMap.appendChild(miniMapDirector);
        cameraEl.appendChild(miniMap);

        var objects = obj.Controller.getObjects();

        for (var i = 0; i < obj.Controller.getNum(); i++) {
            setObjectOnMiniMap(objects[i].transform.position);
        }
    } else {
        console.log('already has minimap');
    }
}

window.setObjectOnMiniMap = function(position) {
    if (miniMap != null) {
        var x = position.x / 10 + 0.8;
        var y = position.z / -10 + 0.8;
        var newEl = mainFrame.document.createElement('a-plane');
        newEl.setAttribute('realPos', position.x + " " + position.y + " " + position.z);

        position = { x: x, y: y, z: 1 };
        newEl.setAttribute('position', position);

        position = { x: x, y: y, z: 1 };
        newEl.setAttribute('position', position);
        //newObj.setPosition(position);
        size = 0.2
        scale = { x: size, y: size, z: size };
        newEl.setAttribute('scale', scale);
        newEl.setAttribute('minimap-object', "");
        //newObj.setScale(scale);

        miniMap.appendChild(newEl);
    }
}

},{"./object.js":2,"./scenery.js":3,"./util.js":4,"util":8}],2:[function(require,module,exports){
var objects = [];

function Objct(el, obj) {
    if (obj) {
        // copy all properties of obj to this
        for (var prop in obj) {
            this[prop] = obj[prop];
        }
    } else {
        this.el = el;
        this.type = "";
        this.shape = "";
        this.transform = {};
        this.material = {};

        this.clickListener = "";
        this.eventList = [];

        this.lookat = "";
    }

    objects.push(this);
}

Objct.prototype.getShape = function() {
    if (this.el)
        return this.el.getAttribute('geometry').primitive;
    else
        return this.shape;
}

Objct.prototype.setPosition = function(newX, newY, newZ) {
    var newPos = newX;
    if (typeof newPos == "number") {
        newPos = { x: newX, y: newY, z: newZ };
    }
    if (this.el)
        this.el.setAttribute('position', newPos);
    this.transform.position = newPos;
}

Objct.prototype.setRotation = function(newRotation) {
    if (this.el)
        this.el.setAttribute('rotation', newRotation);
    this.transform.rotation = newRotation;
}

Objct.prototype.setScale = function(newX, newY, newZ) {
    var newScale = newX;
    if (typeof newScale == "number") {
        newScale = { x: newX, y: newY, z: newZ };
    }
    if (this.el)
        this.el.setAttribute('scale', newScale);
    this.transform.scale = newScale;
}

Objct.prototype.setMaterial = function(newMaterial) {
    this.material = newMaterial;
    for (var key in newMaterial) {
        this.el.setAttribute(key, newMaterial[key]);
    }
}

Objct.prototype.setSoundSrc = function(soundUrl) {
    sound = {
        src: soundUrl,
        on: 'click'
    }
    this.el.setAttribute('sound', sound);
}

Objct.prototype.setClickListener = function(listener) {
    if (this.el)
        this.el.setAttribute(listener, "");
    this.clickListener = listener;
}

Objct.prototype.toObj = function() {
    return null;
}

Objct.prototype.getSaveForm = function() {
    var tmp = this.el;
    this.el = null;
    var copyObj = JSON.parse(JSON.stringify(this));
    this.el = tmp;
    return copyObj;
}

Objct.prototype.setLookAt = function(target) {
    if (this.el)
        this.el.setAttribute('look-at', target);
    this.lookat = target;
}

Objct.prototype.addEvent = function(eventType, eventArgs) {
    this.eventList.push({ 'type': eventType, 'arg': eventArgs });
}

function Controller() {}

Controller.prototype.createObject = function(el) {
    return new Objct(el);
}

Controller.prototype.fromJson = function(json) {
    var loadedObjects;
    loadedObjects = JSON.parse(json);
    var loadedObjectsWithPrototype = [];
    for (var i = 0; i < loadedObjects.length; ++i) {
        var newObj = new Objct(null, loadedObjects[i]);
        loadedObjectsWithPrototype.push(newObj);
    }
    return loadedObjectsWithPrototype;
}

Controller.prototype.toJson = function() {
    var saveObjects = [];
    for (var i = 0; i < objects.length; ++i) {
        saveObjects.push(objects[i].getSaveForm());
    }
    var json = JSON.stringify(saveObjects);
    return json;
}

Controller.prototype.createElFromObj = function(frame, obj) {
    var newEl = frame.document.createElement("a-" + obj.shape);
    obj.el = newEl;
    obj.setPosition(obj.transform.position);
    obj.setRotation(obj.transform.rotation);
    obj.setScale(obj.transform.scale);
    obj.setMaterial(obj.material);
    obj.setClickListener(obj.clickListener);
    obj.setLookAt(obj.lookat);

    return newEl;
}

Controller.prototype.getNum = function() {
    return objects.length;
}

Controller.prototype.getObjects = function() {
    return objects;
}

Controller.prototype.remove = function(obj) {
    if (obj.el) {
        obj.el.parentElement.removeChild(obj.el);
    }

    // remove object from list
    var index = objects.indexOf(obj);
    if (index > -1) {
        objects.splice(index, 1);
    }
}

Controller.prototype.findByEl = function(el) {
    var objs = objects.filter(function(obj) {
        return obj.el == el;
    });
    return objs[0];
}

module.exports = {
    Objct: Objct,
    Controller: new Controller()
};

},{}],3:[function(require,module,exports){
var currentIndex = 0;
var sceneries = [];

function Scenery(bgEl, scenery) {
    if (scenery) {
        // copy all properties of scenery to this
        for (var prop in scenery) {
            this[prop] = scenery[prop];
        }
    } else {
        this.bgEl = bgEl;
        this.bgUrl = this.bgEl.getAttribute('src');
    }

    sceneries.push(this);
}

Scenery.prototype.setBackgroundImageUrl = function(url) {
    this.bgUrl = url;
    this.bgEl.setAttribute('src', this.bgUrl);
}

Scenery.prototype.setBgEl = function(bgEl) {
    this.bgEl = bgEl;
    bgEl.setAttribute('src', this.bgUrl);
}

Scenery.prototype.getSaveForm = function() {
    var tmp = this.bgEl;
    this.bgEl = null;
    var copyScenery = JSON.parse(JSON.stringify(this));
    this.bgEl = tmp;
    return copyScenery;
}

function Controller() {}

Controller.prototype.addScenery = function(scenery) {
    sceneries.push(scenery);
}

Controller.prototype.changeScenery = function(scenery) {
    var bgEl = sceneries[currentIndex].bgEl;
    sceneries[currentIndex].bgEl = null;

    if (typeof scenery == 'object') {
        for (var i = sceneries.length - 1; i >= 0; i--) {
            if (sceneries[i] == scenery) {
                currentIndex = i;
                break;
            }
        }
    } else if (typeof scenery == 'number') {
        currentIndex = number;
    }

    sceneries[currentIndex].bgEl = bgEl;
}

Controller.prototype.getCurrentScenery = function() {
    return sceneries[currentIndex];
}

Controller.prototype.toJson = function() {
    var saveSceneries = [];
    for (var i = 0; i < sceneries.length; ++i) {
        saveSceneries.push(sceneries[i].getSaveForm());
    }
    var json = JSON.stringify(saveSceneries);
    return json;
}

Controller.prototype.fromJson = function(json) {
    var loadedSceneries;
    loadedSceneries = JSON.parse(json);
    var loadedSceneriesWithPrototype = [];
    for (var i = 0; i < loadedSceneries.length; ++i) {
        var newScenery = new Scenery(null, loadedSceneries[i]);
        loadedSceneriesWithPrototype.push(newScenery);
    }
    return loadedSceneriesWithPrototype;
}

module.exports = {
    Scenery: Scenery,
    Controller: new Controller()
};

},{}],4:[function(require,module,exports){
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

module.exports.makeArrayAsString = function() {
    var result = "";
    for (var i = 0; i < arguments.length - 1; ++i) {
        result += arguments[i] + ", ";
    }
    result += arguments[arguments.length - 1];
    return result;
}

},{}],5:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],6:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],7:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],8:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":7,"_process":5,"inherits":6}]},{},[1]);
