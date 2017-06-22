(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Constants
var PRIMITIVE_DEFINITIONS = ['box', 'sphere', 'cylinder', 'plane', 'image'];
var OBJECT_DEFINITIONS = ['teleport', 'minimap'];
var OBJECT_LISTENER = 'object-listener';
var EVENT_LIST = ['teleport', 'link', 'page', 'image', 'video', 'sound', 'addScore', 'onVisible', 'oneClick'];
var BACKGROUND_PREFIX = "../img/";
var SOUND_PREFIX = "../sound/";
var EVENT_DICTIONARY = {
    'teleport': teleportEvent,
    'link': linkEvent,
    'image': imageEvent,
    'sound': soundEvent,
    'addScore': addScoreEvent,
    'onVisible': onVisibleEvent,
    'oneClick': oneClickEvent
}
var BASE_IMG_WIDTH = 200;
var RADIUS = 6;


var util = require('./util.js');
var nodeUtil = require('util');
var Project = require('./project.js').Project;
var obj = require('./object.js');
var Scenery = require('./scenery.js').Scenery;

// Editor Dom Elements
var mainCanvas;
var menuElList;
var variableEl = {};
var imageUrlInputEl;

// Aframe Dom Elements
var mainFrame;
var sceneEl = null;
var cameraEl = null;
var background = null;

var miniMap = null;
var miniMapDirector = null;

// State Variables
var projectObject = null;
var editorMode = true;
var currentSelectedObject = null;
var latelyCreatedObject = null;
var isDown = false;
var scoreVariable = 0;

window.onLoadCanvas = function(frame) {
    mainFrame = frame;

    initEditor();
    initCanvas();
}

window.setBackground = function(url) {
    projectObject.getCurrentScenery().setBackgroundImageUrl(url);
}

window.getBackgroundUrl = function() {
    return projectObject.getCurrentScenery().bgUrl;
}

function newProject(type) {
    var tempJson;
    switch (type) {
        case 'free':
            var newScenery = new Scenery(background);
            projectObject.addScenery(newScenery);
            break;
        case 'simri':
            $.getJSON("../static/json/simri.json", function(data) {
                tempJson = data;
                loadProject(JSON.stringify(tempJson));
            });
            break;
        case 'hidenseek':
            $.getJSON("../static/json/hidenseek.json", function(data) {
                tempJson = data;
                loadProject(JSON.stringify(tempJson));
            });
            break;
    }

    //updateSceneNumberList();
    //updateSceneDropDown();
}

window.saveProject = function(userID, sceneID) {
    saveJsontoServer(projectObject.toJson(), userID, sceneID);
}

window.loadProject = function(projectJson) {
    clearAllObject();

    var loadedProject = new Project();
    if (!loadedProject.fromJson(projectJson)) {
        newProject(loadedProject.projectType);
        return false;
    }
    relateSceneryWithDomEl(loadedProject.sceneryList[0]);
    for (var j in loadedProject.sceneryList[0].objectList) {
        relateObjectWithDomEl(loadedProject.sceneryList[0].objectList[j]);
    }
    projectObject = loadedProject;
    //scene number
    updateSceneNumberList();
    updateSceneDropDown();

    initTemplate();
    return true;
}

window.loadAllObjectOfScene = function(sceneNum) {

    $(".object-panel").css("display", "none");
    eraseCanvas();
    for (var j in projectObject.sceneryList[sceneNum].objectList) {
        relateObjectWithDomEl(projectObject.sceneryList[sceneNum].objectList[j]);
    }
    projectObject.changeScenery(projectObject.sceneryList[sceneNum]);
    updateSceneNumberList();
}

var hidden_button = 150;
window.switchEditorMode = function() {
    editorMode = !editorMode;
    $("#floating-panel").css("display", "none");
    hidden_button *= -1;
    if (!editorMode) {
        onObjectUnselect();
    }
    templateFunc();
    $('#floating-button').animate({
        left: "+=" + hidden_button
    }, 1000, function() {

    });
}

function updateSceneNumberList() {
    sceneNum = $('#scene-list')[0];
    //remove all child
    while (sceneNum.hasChildNodes()) { sceneNum.removeChild(sceneNum.firstChild); }

    for (var i = 0; i < projectObject.getSceneryListLength(); i++) {
        if (projectObject.getCurrentIndex() == i) {
            var a = document.createElement("b");
        } else {
            var a = document.createElement("a");
        }
        a.innerHTML = (i + 1);
        if (i != projectObject.getSceneryListLength() - 1)
            a.innerHTML += "-";
        sceneNum.appendChild(a);
    }
}

function updateSceneDropDown() {
    sceneDropdown = $('#scene-dropdown')[0];
    while (sceneDropdown.hasChildNodes()) { sceneDropdown.removeChild(sceneDropdown.firstChild); }

    for (var i = 0; i < projectObject.getSceneryListLength(); i++) {
        var sceneName = projectObject.sceneryList[i].name;
        var op = document.createElement("li");
        var a = document.createElement("a");
        op.appendChild(a);
        a.setAttribute("onclick", "loadAllObjectOfScene(" + i + ")");
        a.innerHTML = sceneName + (i + 1);
        sceneDropdown.appendChild(op);
    }
}

function relateSceneryWithDomEl(scenery) {
    scenery.setBgEl(background);
}

function relateObjectWithDomEl(object) {
    var newEl = obj.Controller.createElFromObj(mainFrame, object);
    sceneEl.appendChild(newEl)
}

window.removeSelectedObject = function() {
    projectObject.getCurrentScenery().removeObject(currentSelectedObject);
    currentSelectedObject = null;
    $(".object-panel").css("display", "none");
}

function clearAllObject(scenery) {
    if (projectObject) {
        projectObject.getCurrentScenery().removeAllObject();
    }
}

function eraseCanvas() {
    currentSelectedObject = null;
    var objects = mainFrame.document.querySelectorAll(".object");
    for (var i = 0; i < objects.length; i++) {
        objects[i].parentNode.removeChild(objects[i]);
    }
}

function saveJsontoServer(json, userID, sceneID) {
    $.ajax({
        url: '/project/save',
        method: 'post',
        data: {
            user: userID,
            json: json,
            scene: sceneID
        },
        success: function(data) {
            alert("Save success");
        },
        error: function(err) {
            alert("Save fail." + err.toString());
        }
    });
}

function initEditor() {
    mainCanvas = $('#main-canvas')[0];
    menuElList = document.getElementsByClassName('well');

    $("#image-form").submit(function() {
        return false;
    });

    $('#scene-dropdown').change(function() {
        loadAllObjectOfScene($(this).val());
    });
    imageUrlInputEl = document.getElementById('img-url');
}

function initCanvas() {
    sceneEl = mainFrame.document.querySelector('a-scene');
    cameraEl = mainFrame.document.querySelector('[camera]');
    background = mainFrame.document.querySelector('a-sky');


    // background listener
    mainFrame.AFRAME.registerComponent("background-listener", {
        init: function() {
            this.el.addEventListener('click', function() {
                onObjectUnselect();
            });
        }

    });
    background.setAttribute('background-listener', "");
    background.setAttribute('material', 'side', 'double');

    mainFrame.AFRAME.registerComponent(OBJECT_LISTENER, {
        schema: {
            id: {
                default: "shape"
            }
        },
        init: function() {
            var initialPos = null;
            var prevPos = null;

            var thisObject = projectObject.getCurrentScenery().findObjectByEl(this.el);

            var originalScale = this.el.getAttribute('scale');
            var parentScale = this.el.parentEl.getAttribute('scale');

            this.el.addEventListener('click', onObjectSelect);
            this.el.addEventListener('mousedown', function(evt) {
                cameraEl.removeAttribute('look-controls');
                isDown = true;
                thisObject.setMaterial({ 'opacity': '0.5' });

                var pos = cameraEl.components['mouse-cursor'].__raycaster.ray.direction;
                initialPos = { x: pos.x * RADIUS, y: pos.y * RADIUS, z: pos.z * RADIUS };
                prevPos = initialPos;

                removeAllListeners(mainFrame.window, 'mousemove');
                addListener(mainFrame.window, 'mousemove', onObjectMove(thisObject));
            });
            this.el.addEventListener('mouseup', function(evt) {
                thisObject.setMaterial({ 'opacity': '1' });
                cameraEl.setAttribute('look-controls', "");
                isDown = false;
            });
        },
        tick: function(time, timeDelta) {}
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
}

function onObjectMove(parentObject) {
    return function(evt) {
        if (isDown) {
            var direction = cameraEl.components['mouse-cursor'].__raycaster.ray.direction;
            var newPos = {
                x: direction.x * RADIUS,
                y: direction.y * RADIUS,
                z: direction.z * RADIUS
            };
            parentObject.setPosition(newPos);
        }
    };
}

var _eventHandlers = {}; // somewhere global

function addListener(node, event, handler, capture) {
    if (!(node in _eventHandlers)) {
        // _eventHandlers stores references to nodes
        _eventHandlers[node] = {};
    }
    if (!(event in _eventHandlers[node])) {
        // each entry contains another entry for each event type
        _eventHandlers[node][event] = [];
    }
    // capture reference
    _eventHandlers[node][event].push([handler, capture]);
    node.addEventListener(event, handler, capture);
}

function removeAllListeners(node, event) {
    if (node in _eventHandlers) {
        var handlers = _eventHandlers[node];
        if (event in handlers) {
            var eventHandlers = handlers[event];
            for (var i = eventHandlers.length; i--;) {
                var handler = eventHandlers[i];
                node.removeEventListener(event, handler[0], handler[1]);
            }
        }
    }
}

function initTemplate() {
    switch (projectObject.projectType) {
        case "hidenseek":
            var newEl = mainFrame.document.createElement("a-text");
            var clockEl = mainFrame.document.createElement("a-text");
            var bgClockEl = mainFrame.document.createElement("a-image");
            var gameSetImage = mainFrame.document.createElement("a-image");

            var position = { x: 8.2, y: 3.15, z: -5 };
            newEl.setAttribute('id', 'object-num');
            newEl.setAttribute('position', position);
            newEl.setAttribute('value', "0/" + projectObject.sceneryList[0].objectList.length);
            newEl.setAttribute('color', 'black');
            newEl.setAttribute('align', 'center');
            newEl.setAttribute('width', '10');

            clockEl.setAttribute('id', 'clock');
            position = { x: 8.1, y: 3.65, z: -5 };
            clockEl.setAttribute('position', position);
            clockEl.setAttribute('value', time);
            clockEl.setAttribute('color', 'black');
            clockEl.setAttribute('align', 'center');
            clockEl.setAttribute('width', '10');

            gameSetImage.setAttribute('id', 'game-set');
            gameSetImage.setAttribute('position', '0 0 3');
            gameSetImage.setAttribute('src', '../img/template/results_final.jpg');
            gameSetImage.setAttribute('scale', "2 1 1");
            var setClock = clockEl.cloneNode(true);
            setClock.setAttribute('id', 'back-clock');
            setClock.setAttribute('position', '0.13 0 0');
            setClock.setAttribute('width', '4');
            gameSetImage.appendChild(setClock);

            bgClockEl.setAttribute('src', '../img/template/icon_time_final.png')
            bgClockEl.setAttribute('position', '8 3.5 -5');
            bgClockEl.setAttribute('scale', '2.5 2.5 0');

            cameraEl.appendChild(bgClockEl);
            cameraEl.appendChild(newEl);
            cameraEl.appendChild(clockEl);
            cameraEl.appendChild(gameSetImage);
    }
}

function createTemplateObject() {
    switch (projectObject.projectType) {
        case "hidenseek":
            newObject('primitive', 'image');
            latelyCreatedObject.eventList.push({ 'type': "oneClick", 'arg': "" }, { 'type': 'onVisible', 'arg': "" }, { 'type': 'addScore', 'arg': '1' });
            updateObjectNumUI();
            break;
        case "simri":
            if (projectObject.getCurrentScenery.sceneryType != "reulst-scenery") {
                var nextSceneNum = projectObject.getCurrentIndex() + 2
                latelyCreatedObject.eventList.push({ 'type': "oneClick", 'arg': "" }, { 'type': 'teleport', 'arg': nextSceneNum }, { 'type': 'addScore', 'arg': '20' });
                //latelyCreatedObject.el.setAttribute('src',"https://traverser360.s3.ap-northeast-2.amazonaws.com/1497782502160.png");
            }
    }
}

var time = 0;
var timerId = 0;

function templateFunc() {
    switch (projectObject.projectType) {
        case "hidenseek":
            var objects = projectObject.sceneryList[0].objectList;
            if (!editorMode) {
                objects.forEach(function(item) {
                    item.addMaterial({ opacity: 0 });
                });
                time = 0;
                timerId = setInterval(function() {
                    time += 1;
                    mainFrame.document.getElementById('clock').setAttribute('value', time);
                    mainFrame.document.getElementById('back-clock').setAttribute('value', time);
                }, 1000)
            } else {
                clearInterval(timerId);
                mainFrame.document.getElementById('clock').setAttribute('value', 0);
                mainFrame.document.getElementById('game-set').setAttribute('position', '0 0 3');
                updateObjectNumUI();
                scoreVariable = 0;
                objects.forEach(function(item) {
                    item.addMaterial({ opacity: 1 });

                    item.oneClick = false;
                });
            }
            break;
        case "simri":
            var scenes = projectObject.sceneryList;
            if (projectObject.getCurrentScenery().sceneryType == "result") {
                console.log("sdddd");

                var objects = projectObject.getCurrentScenery().objectList;
                console.log(objects);

                objects.sort(function(a, b) {
                    return b.eventList[0].score - a.eventList[0].score;
                })
                for (var i = 0; i < objects.length; i++) {
                    console.log(objects[i].eventList[0]);
                    objects[i].addMaterial({ opacity: 0 });
                    if (scoreVariable >= objects[i].eventList[0].score) {
                        console.log(objects[i].eventList[0].back_url);
                        setBackground(objects[i].eventList[0].back_url);
                        objects[i].addMaterial({ opacity: 1 });
                        break;
                    }
                }
            }
            if (editorMode) {
                scoreVariable = 0;
                scenes.forEach(function(scene) {
                    scene.objectList.forEach(function(item) {
                        item.oneClick = false;
                    });
                });
            }
    }
}

function updateObjectNumUI() {
    mainFrame.document.getElementById('object-num').setAttribute('value', "0/" + projectObject.sceneryList[0].objectList.length);
}

window.createScene = function() {
    var newScenery = new Scenery(background);
    projectObject.addScenery(newScenery);

    updateSceneDropDown();

    projectObject.changeScenery(projectObject.sceneryList.length - 1);

    eraseCanvas();
    updateSceneNumberList();
}
window.createOption = function() {
    var obj = createImage('https://traverser360.s3.ap-northeast-2.amazonaws.com/1497782502160.png');
    obj.addEvent('teleport', projectObject.getCurrentIndex() + 1);
    obj.addEvent('oneClick', "");
    obj.addEvent('addScore', "1");
    console.log(obj);
}

window.modifyOption = function(text, image_url, score) {
    //currentSelectedObject.drawText(mainFrame,text);
    currentSelectedObject.material.src = image_url;
    currentSelectedObject.el.setAttribute("src", image_url);
    currentSelectedObject.modifyEvent("addScore", score);
}

window.createSpot = function() {
    var obj = createImage('https://traverser360.s3.ap-northeast-2.amazonaws.com/1497977716404.png');
    obj.addEvent('onVisible', "");
    obj.addEvent('oneClick', "");
    obj.addEvent('addScore', "1");
    updateObjectNumUI();
    console.log(obj);
}
window.modifySpot = function(imgage_url) {
    currentSelectedObject.material.src = image_url;
    currentSelectedObject.el.setAttribute("src", image_url);
}

window.createLatelyObject = function() {
    if (latelyCreatedObject) {
        var newEl = mainFrame.document.createElement('a-image');
        var newObj = new obj.Objct(newEl, latelyCreatedObject);
        projectObject.getCurrentScenery().addObject(newObj);

        position = util.getForwardPosition(cameraEl.getAttribute('rotation'));
        newObj.setPosition(position);
        rotation = cameraEl.getAttribute('rotation');
        newObj.setRotation(rotation);
        newObj.setScale(newObj.transform.scale);
        newObj.setFadeInOutAni(mainFrame);
        newObj.setClickListener(OBJECT_LISTENER);
        newObj.setLookAt('#camera');

        newEl.setAttribute('src', newObj.material.src);
        newEl.setAttribute('class', 'object');

        sceneEl.appendChild(newEl);
        updateObjectNumUI();
    } else {
        console.log("no lately created object");
    }
}

window.modifyResult = function(text, image_url, score, background_url) {
    currentSelectedObject.material.src = image_url;
    currentSelectedObject.el.setAttribute("src", image_url);
    var result = {
        obj: currentSelectedObject,
        back_url: background_url,
        score: score,
    }
}

window.create = function(type) {
    if (PRIMITIVE_DEFINITIONS.includes(type)) {
        createPrimitive(type);
    } else if (OBJECT_DEFINITIONS.includes(type)) {
        createObject(type);
    }
}

window.createImage = function(src) {
    imageUrlInputEl.value = src;
    return newObject('primitive', 'image');
}

function createPrimitive(shape) {
    if (!PRIMITIVE_DEFINITIONS.includes(shape)) {
        console.log('Not valid shape:' + shape);
        return;
    }
    return newObject('primitive', shape);
}

function createObject(type) {
    if (!OBJECT_DEFINITIONS.includes(type)) {
        console.log('Not valid type:' + type);
        return;
    }
    return newObject(type, 'plane');
}

function onObjectSelect(event) {
    var selected = projectObject.getCurrentScenery().findObjectByEl(this);

    onObjectUnselect();

    currentSelectedObject = selected;

    if (editorMode) {
        var position = currentSelectedObject.transform.position;
        var rotation = currentSelectedObject.transform.rotation;
        scale = currentSelectedObject.transform.scale;
        currentSelectedObject.setMaterial({ 'opacity': 0.5 });

        openObjectPropertyPanel(event.detail.mouseEvent, "#simri-option-panel");
    } else {
        // Execute events assigned to object.
        if (!currentSelectedObject.oneClick) {
            for (var i = 0; i < currentSelectedObject.eventList.length; ++i) {
                var event = currentSelectedObject.eventList[i];
                var eventType = event['type'];
                var func = EVENT_DICTIONARY[eventType];
                var arg = event['arg'];
                func(arg);
            }
            checkScore();
        }
    }
}

function openObjectPropertyPanel(event) {
    console.log(projectObject.projectType);
    switch (projectObject.projectType) {
        case "simri":
            if (projectObject.getCurrentScenery().sceneryType == "result") id = "#simri-result-panel";
            else id = "#simri-option-panel";
            break;
        case "hidenseek":
            id = "#hidenseek-panel";
            break;
    }
    if ($(id).css("display") == "none") {
        $(id).css("display", "");
    }
    $(id).css({ position: "fixed", top: event.clientY, left: event.clientX + 150 });
}

function checkScore() {
    switch (projectObject.projectType) {
        case "hidenseek":
            mainFrame.document.getElementById("object-num").setAttribute('value', scoreVariable + "/" + projectObject.sceneryList[0].objectList.length);
            if (scoreVariable == projectObject.sceneryList[0].objectList.length) {
                mainFrame.document.getElementById('game-set').setAttribute('position', '0 0 -1');
                clearInterval(timerId);
            }
    }
}

function onObjectUnselect() {
    if (!currentSelectedObject) return;

    currentSelectedObject.setMaterial({ 'opacity': '1' });
    currentSelectedObject = null;
    $(".object-panel").css("display", "none");
}

window.toggleEditorMode = function() {
    editorMode = !editorMode;
    if (editorMode) {
        console.log("Editor Mode");
    } else {
        console.log("Preview Mode")
    }
}

function newObject(type, shape, url, position, rotation, scale) {
    var tag = 'a-' + shape;
    var newEl = mainFrame.document.createElement(tag);
    var newObj = new obj.Objct(newEl);
    projectObject.getCurrentScenery().addObject(newObj);

    newObj.type = type;
    newObj.shape = shape;
    position = util.getForwardPosition(cameraEl.getAttribute('rotation'));
    newObj.setPosition(position);
    rotation = cameraEl.getAttribute('rotation');
    newObj.setRotation(rotation);
    scale = { x: 1, y: 1, z: 1 };
    newObj.setScale(scale);

    if (shape == 'image') {
        if (url == null) {
            var url = imageUrlInputEl.value;
        }
        util.getImageSize(url, function() {
            newObj.setScale({ x: this.width / BASE_IMG_WIDTH, y: this.height / BASE_IMG_WIDTH });
        });
        newObj.setMaterial({ 'src': url });
    } else {
        newObj.setMaterial({ 'color': util.getRandomHexColor() });
    }
    newObj.setClickListener(OBJECT_LISTENER);

    newObj.eventList = [];

    // Make object face at camera origin by default.
    newObj.setLookAt('#camera');
    newObj.setFadeInOutAni(mainFrame);
    newEl.setAttribute("class", "object");

    sceneEl.appendChild(newEl);

    latelyCreatedObject = newObj;
    //createTemplateObject();

    setObjectOnMiniMap(position);

    return newObj;
}

function fadeInOutAll(fade) {
    var objects = mainFrame.document.querySelectorAll(".object");
    mainFrame.document.querySelector('#background').emit(fade);
    for (var i = 0; i < objects.length; i++) {
        objects[i].emit(fade);
    }
}

function teleportEvent(arg) {
    fadeInOutAll('fade-out');
    setTimeout(function() {
        eraseCanvas();
        console.log('teleport! to:' + arg);

        loadAllObjectOfScene(arg);
        templateFunc();

        fadeInOutAll('fade-in');
    }, 2000);
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

function onVisibleEvent(arg) {
    newMaterial = { opacity: 1 }
    currentSelectedObject.addMaterial(newMaterial);
}

function oneClickEvent(arg) {
    currentSelectedObject.oneClick = true;
}

function addScoreEvent(arg) {
    scoreVariable += Number(arg);
    console.log("Score" + scoreVariable);
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

        var objectList = obj.Controller.getObjects();

        for (var i = 0; i < obj.Controller.getNum(); i++) {
            setObjectOnMiniMap(objectList[i].transform.position);
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

},{"./object.js":2,"./project.js":3,"./scenery.js":4,"./util.js":5,"util":9}],2:[function(require,module,exports){
function Objct(el, obj) {
    if (obj) {
        // copy all properties of obj to this
        for (var prop in obj) {
            this[prop] = obj[prop];
            this.el = el;
        }
    } else {
        this.el = el;
        this.type = "";
        this.shape = "";
        this.text ="";
        this.transform = {};
        this.material = {};

        this.clickListener = "";
        this.eventList = [];

        this.lookat = "";
        this.oneClick = false;

    }
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
Objct.prototype.addMaterial = function(newMaterial){
    for(var key in newMaterial){
        this.material[key] = newMaterial[key];
        this.el.setAttribute(key, newMaterial[key]);
    }
}

Objct.prototype.drawText = function(frame,text){
    this.text = text;
    var newEl = frame.document.createElement("a-text");
    newEl.setAttribute('value',text);
    this.el.appendChild(newEl);
}

Objct.prototype.setFadeInOutAni = function(frame){
    var fadeIn = frame.document.createElement("a-animation" );
    var fadeOut = frame.document.createElement("a-animation" );
    fadeIn.setAttribute("attribute","material.color");
    fadeOut.setAttribute("attribute","material.color");
    
    fadeIn.setAttribute("begin","fade-in");
    fadeOut.setAttribute("begin","fade-out");

    fadeIn.setAttribute("from","black");
    fadeOut.setAttribute("from","white");

    fadeIn.setAttribute("to","white");
    fadeOut.setAttribute("to","black");

    fadeIn.setAttribute("dur","2000");
    fadeOut.setAttribute("dur","2000");

    this.el.appendChild(fadeIn);
    this.el.appendChild(fadeOut);
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
    var saveForm = {};
    for (var prop in this) {
        saveForm[prop] = this[prop];
    }
    saveForm.el = null;
    return saveForm;
}

Objct.prototype.setLookAt = function(target) {
    if (this.el)
        this.el.setAttribute('look-at', target);
    this.lookat = target;
}

Objct.prototype.addEvent = function(eventType, eventArgs) {
    this.eventList.push({ 'type': eventType, 'arg': eventArgs });
}
Objct.prototype.modifyEvent = function(eventType, eventAgrs){
    for(var i = 0;i<this.eventList.length;i++){
        if(this.eventList[i].type == eventType){
            this.eventList[i].arg = eventAgrs;
            return true;
        }
    }
    return false;
}

Objct.prototype.toJson = function() {
    return JSON.stringify(this.getSaveForm());
}

Objct.prototype.fromJson = function(json) {
    var object = JSON.parse(json);
    Objct.call(this, null, object);
    return this;
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
    for (var i = 0; i < objectList.length; ++i) {
        saveObjects.push(objectList[i].getSaveForm());
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
    obj.setFadeInOutAni(frame);
    newEl.setAttribute("class","object");

    return newEl;
}

module.exports = {
    Objct: Objct,
    Controller: new Controller()
};

},{}],3:[function(require,module,exports){
var currentIndex = 0;
var Scenery = require('./scenery').Scenery;
var Objct = require('./object.js').Objct;

function Project() {
    this.title = "";
    this.projectType = "";
    this.sceneryList = [];
}

// Scenery
Project.prototype.setTitle = function(newTitle) {
    this.title = newTitle;
}

Project.prototype.addScenery = function(scenery) {
    this.sceneryList.push(scenery)
}

Project.prototype.removeScenery = function(scenery) {
    var index = sceneryList.indexOf(scenery);
    if (index > -1) {
        sceneryList.splice(index, 1);
    }
}

Project.prototype.changeScenery = function(scenery) {
    var bgEl = this.sceneryList[currentIndex].bgEl;
    this.sceneryList[currentIndex].bgEl = null;

    if (typeof scenery == 'object') {
        for (var i = this.sceneryList.length - 1; i >= 0; i--) {
            if (this.sceneryList[i] == scenery) {
                currentIndex = i;
                break;
            }
        }
    } else if (typeof scenery == 'number') {
        currentIndex = scenery;
    }

    this.sceneryList[currentIndex].setBgEl(bgEl);
}

Project.prototype.getCurrentScenery = function() {
    return this.sceneryList[currentIndex];
}
Project.prototype.getCurrentIndex = function() {
    return currentIndex;
}
Project.prototype.getSceneryListLength = function() {
    return this.sceneryList.length;
}
Project.prototype.toJson = function() {
    var saveForm = { title: this.title };
    saveForm.projectType = this.projectType;
    saveForm.sceneryList = [];
    for (var i in this.sceneryList) {
        var scenery = this.sceneryList[i];
        saveForm.sceneryList.push(scenery.getSaveForm());
    }
    return JSON.stringify(saveForm);
}

Project.prototype.fromJson = function(json) {
    var saveForm = JSON.parse(json);
    this.projectType = saveForm.projectType;
    if (saveForm.sceneryList == undefined) {
        return undefined;
    }
    this.title = saveForm.title;
    for (var i in saveForm.sceneryList) {
        var sceneryObject = new Scenery(null, saveForm.sceneryList[i]);
        this.sceneryList.push(sceneryObject);
        for (var j in sceneryObject.objectList) {
            var objct = new Objct(null, sceneryObject.objectList[j]);
            sceneryObject.objectList[j] = objct;
        }
    }
    return this;
}

module.exports = {
    Project: Project
};

},{"./object.js":2,"./scenery":4}],4:[function(require,module,exports){
var objct = require('./object.js');

function Scenery(bgEl, scenery) {
    if (scenery) {
        // copy all properties of scenery to this
        for (var prop in scenery) {
            this[prop] = scenery[prop];
        }
    } else {
        this.name = "Scene";
        this.sceneryType = "";
        this.objectList = [];
        if (bgEl) {
            this.bgEl = bgEl;
            this.bgUrl = this.bgEl.getAttribute('src');
        } else {
            this.bgEl = null;
            this.bgUrl = "";
        }
    }
}

Scenery.prototype.setBackgroundImageUrl = function(url) {
    this.bgUrl = url;
    this.bgEl.setAttribute('src', this.bgUrl);
}

Scenery.prototype.setBgEl = function(bgEl) {
    this.bgEl = bgEl;
    bgEl.setAttribute('src', this.bgUrl);
}

Scenery.prototype.addObject = function(object) {
    this.objectList.push(object)
}

Scenery.prototype.removeObject = function(object) {
    var index = objectList.indexOf(object);
    if (index > -1) {
        objectList.splice(index, 1);
    }
}

Scenery.prototype.findObjectByEl = function(el) {
    var objs = this.objectList.filter(function(obj) {
        return obj.el == el;
    });
    return objs[0];
}

Scenery.prototype.removeAllObject = function() {
    for (var i in this.objectList) {
        if (this.objectList[i].el) {
            this.objectList[i].el.parentElement.removeChild(this.objectList[i].el);
        }
    }

    this.objectList = [];
}

Scenery.prototype.removeObject = function(obj) {
    if (obj.el) {
        obj.el.parentElement.removeChild(obj.el);
    }

    // remove object from list
    var index = this.objectList.indexOf(obj);
    if (index > -1) {
        this.objectList.splice(index, 1);
    }
}

Scenery.prototype.getSaveForm = function() {
    var saveForm = {};
    saveForm.bgUrl = this.bgUrl;
    saveForm.name = this.name;
    saveForm.sceneryType = this.sceneryType;
    saveForm.objectList = [];
    for (var i in this.objectList) {
        var object = this.objectList[i];
        saveForm.objectList.push(object.getSaveForm());
    }
    return saveForm;
}

Scenery.prototype.toJson = function() {
    return JSON.stringify(this.getSaveForm());
}

Scenery.prototype.fromJson = function(json) {
    var scenery = JSON.parse(json);
    Scenery.call(this, null, scenery);
    return this;
}

module.exports = {
    Scenery: Scenery
};

},{"./object.js":2}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],9:[function(require,module,exports){
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
},{"./support/isBuffer":8,"_process":6,"inherits":7}]},{},[1]);
