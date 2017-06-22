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

window.saveProject = function(userID, sceneID) {
    saveJsontoServer(projectObject.toJson(), userID, sceneID);
}

window.loadProject = function(projectJson) {
    clearAllObject();

    projectObject = new Project();
    if (!projectObject.fromJson(projectJson)) {
        var newScenery = new Scenery(background);
        projectObject.addScenery(newScenery);
        return false;
    }

    relateSceneryWithDomEl(projectObject.sceneryList[0]);
    for (var j in projectObject.sceneryList[0].objectList) {
        relateObjectWithDomEl(projectObject.sceneryList[0].objectList[j]);
    }
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
    hidden_button *= -1;

    if (editorMode) {
        document.getElementById("editor-mode").textContent = "미리보기";

    } else {
        $("#floating-panel").css("display", "none");
        sceneEl.enterVR();
        onObjectUnselect();
        document.getElementById("editor-mode").textContent = "편집하기";
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
        a.setAttribute('style', 'pointer-events: none');
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
    updateObjectNumUI();
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

    sceneEl.addEventListener('exit-vr', function() {
        switchEditorMode();
    });

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

                if (editorMode) {
                    thisObject.setMaterial({ 'opacity': '0.5' });

                    var pos = cameraEl.components['mouse-cursor'].__raycaster.ray.direction;
                    initialPos = { x: pos.x * RADIUS, y: pos.y * RADIUS, z: pos.z * RADIUS };
                    prevPos = initialPos;

                    removeAllListeners(mainFrame.window, 'mousemove');
                    addListener(mainFrame.window, 'mousemove', onObjectMove(thisObject));
                }
            });
            this.el.addEventListener('mouseup', function(evt) {
                cameraEl.setAttribute('look-controls', "");
                isDown = false;

                if (editorMode) {
                    thisObject.setMaterial({ 'opacity': '1' });
                }
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
            $("#hidenseek-clock").css("display", "");
            updateObjectNumUI();
            var bgClockEl = mainFrame.document.createElement("a-image");
            var gameSetImage = mainFrame.document.createElement("a-image");

            gameSetImage.setAttribute('id', 'game-set');
            gameSetImage.setAttribute('position', '0 0 3');
            gameSetImage.setAttribute('src', '../img/template/results_final.png');
            gameSetImage.setAttribute('scale', "2 1 1");

            var setClock = mainFrame.document.createElement("a-text");
            setClock.setAttribute('id', 'back-clock');
            setClock.setAttribute('position', '0.13 0 0');
            setClock.setAttribute('width', '4');
            setClock.setAttribute('value', 0);
            setClock.setAttribute('align', 'center');
            setClock.setAttribute('color', 'black');
            gameSetImage.appendChild(setClock);

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
                latelyCreatedObject.eventList.push({ 'tynpe': "oneClick", 'arg': "" }, { 'type': 'teleport', 'arg': nextSceneNum }, { 'type': 'addScore', 'arg': '20' });
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
                    item.eventList.forEach(function(event) {
                        if (event != null && event.type == "addScore")
                            item.setMaterial({ opacity: 0 });
                    });
                });
                time = 0;
                timerId = setInterval(function() {
                    time += 1;
                    document.getElementById('hidenseek-count').innerHTML = time;
                    mainFrame.document.getElementById('back-clock').setAttribute('value', time);
                }, 1000)
            } else {
                currentSelectedObject = null;
                clearInterval(timerId);
                document.getElementById('hidenseek-count').innerHTML = 0;
                updateObjectNumUI();
                scoreVariable = 0;
                mainFrame.document.getElementById('game-set').setAttribute('position', '0 0 3');
                objects.forEach(function(item) {
                    item.eventList.forEach(function(event) {
                        if (event != null && event.type == "addScore") {
                            item.oneClick = false;
                            item.setMaterial({ opacity: 1 });
                        }
                    });
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
                    objects[i].setMaterial({ opacity: 0 });
                    if (scoreVariable >= objects[i].eventList[0].score) {
                        console.log(objects[i].eventList[0].back_url);
                        setBackground(objects[i].eventList[0].back_url);
                        objects[i].setMaterial({ opacity: 1 });
                        break;
                    }
                }
            }
            if (editorMode) {
                scoreVariable = 0;
                scenes.forEach(function(scene) {
                    scene.objectList.forEach(function(item) {
                        if (projectObject.getCurrentScenery().sceneryType == "result") item.setMaterial({ opacity: 1 });
                        item.oneClick = false;
                    });
                });
            }
    }
}

function getTotalSpot() {
    var totalSpot = 0;
    var objects = projectObject.sceneryList[0].objectList;
    for (var i = 0; i < objects.length; i++) {
        if (objects[i].eventList[2] != null && objects[i].eventList[2].type == "addScore") {
            totalSpot++;
        }
    }
    return totalSpot;
}

function updateObjectNumUI() {
    //mainFrame.document.getElementById('object-num').setAttribute('value', "0/" + projectObject.sceneryList[0].objectList.length);

    document.getElementById("hidenseek-num").innerHTML = ("0/") + getTotalSpot();
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
    currentSelectedObject.setMaterial({src: image_url});
    util.getImageSize(image_url, function() {
        currentSelectedObject.setScale({ x: this.width / BASE_IMG_WIDTH, y: this.height / BASE_IMG_WIDTH });
    });
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
window.modifySpot = function(imgage_url,sound_url) {
    currentSelectedObject.setMaterial({src: image_url});
    currentSelectedObject.addEvent("sound",sound_url);
    util.getImageSize(image_url, function() {
        currentSelectedObject.setScale({ x: this.width / BASE_IMG_WIDTH, y: this.height / BASE_IMG_WIDTH });
    });
    latelyCreatedObject = currentSelectedObject;
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
    currentSelectedObject.setMaterial({src: image_url});
    util.getImageSize(image_url, function() {
        currentSelectedObject.setScale({ x: this.width / BASE_IMG_WIDTH, y: this.height / BASE_IMG_WIDTH });
    });
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
    console.log(currentSelectedObject);
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
            if (projectObject.getCurrentScenery().sceneryType == "result") id = "#simri-result-";
            else id = "#simri-option-";
            break;
        case "hidenseek":
            id = "#hidenseek-";
            break;
    }
    $(id+"text").val(currentSelectedObject.text);
    $(id+"score").val("");
     for(var i=0; i<currentSelectedObject.eventList.length; i++){
       if(currentSelectedObject.eventList[i].type=="addScore")
        $(id+"score").val(currentSelectedObject.eventList[i].arg);
     }

    if ($(id + "panel").css("display") == "none") {
        $(id + "panel").css("display", "");
    }

    $(id+"panel").css({ position: "fixed", top: event.clientY, left: event.clientX + 150 });
}
window.getCurrentImgUrl = function(){
    return currentSelectedObject.material.src;
}

function checkScore() {
    switch (projectObject.projectType) {
        case "hidenseek":
            document.getElementById("hidenseek-num").innerHTML = scoreVariable + "/" + getTotalSpot();
            if (scoreVariable == getTotalSpot()) {
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
    //var soundUrl = SOUND_PREFIX + arg;
    currentSelectedObject.setSoundSrc(arg);
    //soundEl.setAttribute('src',soundUrl);
    //sceneEl.appendChild(soundEl);
    //soundEl.components.sound.playSound();
}

function onVisibleEvent(arg) {
    newMaterial = { opacity: 1 }
    currentSelectedObject.setMaterial(newMaterial);
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
