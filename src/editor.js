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
var mover = null;

var miniMap = null;
var miniMapDirector = null;

// State Variables
var projectObject = null;
var editorMode = true;
var currentSelectedObject = null;
var latelyCreatedObject = null;
var isDown = false;
var currentSelectedArrowEl = null;
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
            $.getJSON("../static/json/simri.json",function(data){
                tempJson = data;
                loadProject(JSON.stringify(tempJson));
            });
            break;
        case 'hidenseek':
            $.getJSON("../static/json/hidenseek.json",function(data){
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
    document.getElementById("editor-mode").textContent = "미리보기";
    if (!editorMode) {
        if (mover) {
            mover.parentEl.removeChild(mover);
            mover = null;
        }
        document.getElementById("editor-mode").textContent = "편집하기";
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

    console.log(projectObject);
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
    mover = null;
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
    mover = null;
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
        //console.log(projectObject.getCurrentIndex());
        //console.log($(this).val());
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

            var parentObject = projectObject.getCurrentScenery().findObjectByEl(this.el.parentEl);

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
                $(".object-panel").css("display", "none");
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
}

function initTemplate() {
    switch (projectObject.projectType) {
        case "hidenseek":
            updateObjectNumUI();
            var bgClockEl = mainFrame.document.createElement("a-image");
            var gameSetImage = mainFrame.document.createElement("a-image");
            gameSetImage.setAttribute('id', 'game-set');
            gameSetImage.setAttribute('position', '0 0 3');
            gameSetImage.setAttribute('src', '../img/template/results_final.jpg');
            gameSetImage.setAttribute('scale',"2 1 1");

            var setClock = mainFrame.document.createElement("a-text");
            setClock.setAttribute('id','back-clock');
            setClock.setAttribute('position','0.13 0 0');
            setClock.setAttribute('width','4');
            setClock.setAttribute('value', 0);
            setClock.setAttribute('align', 'center');
            setClock.setAttribute('color', 'black');
            gameSetImage.appendChild(setClock);

            cameraEl.appendChild(gameSetImage)
            /*var newEl = mainFrame.document.createElement("a-text");
            

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
            
            

           
            cameraEl.appendChild(newEl);
            cameraEl.appendChild(clockEl);;*/
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
                    item.eventList.forEach(function(event){
                        if(event != null && event.type == "addScore")
                            item.addMaterial({ opacity: 0 });
                    });
                });
                time = 0;
                timerId = setInterval(function() {
                    time += 1;
                    document.getElementById('hidenseek-count').innerHTML = time;
                    mainFrame.document.getElementById('back-clock').setAttribute('value', time);
                }, 1000)
            } else {
                clearInterval(timerId);
                document.getElementById('hidenseek-count').innerHTML = 0;
                updateObjectNumUI();
                scoreVariable = 0;
                mainFrame.document.getElementById('game-set').setAttribute('position', '0 0 3');
                objects.forEach(function(item) {
                    item.eventList.forEach(function(event){
                        if(event != null &&event.type == "addScore")
                            item.addMaterial({ opacity: 1 });
                            item.oneClick = false;
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
                for (var i=0;i<objects.length;i++){
                     objects[i].addMaterial({ opacity: 0 });
                }
                for (var i=0;i<objects.length;i++) {
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
                         if (projectObject.getCurrentScenery().sceneryType == "result")item.addMaterial({ opacity: 1 });
                        item.oneClick = false;
                    });
                });
            }
    }
}
function getTotalSpot(){
    var totalSpot = 0;
    var objects = projectObject.sceneryList[0].objectList;
    for(var i=0;i<objects.length;i++){
        if(objects[i].eventList[2] != null && objects[i].eventList[2].type=="addScore"){
            totalSpot++;
        }
    }
    return totalSpot;
}
function updateObjectNumUI() {
    //mainFrame.document.getElementById('object-num').setAttribute('value', "0/" + projectObject.sceneryList[0].objectList.length);
    
    document.getElementById("hidenseek-num").innerHTML = ("0/")+getTotalSpot();
}

window.createScene = function() {
    var newScenery = new Scenery(background);
    projectObject.addScenery(newScenery);

    updateSceneDropDown();

    projectObject.changeScenery(projectObject.sceneryList.length-1);

    eraseCanvas();
    updateSceneNumberList();
}
window.createOption = function() {
    var obj = createImage('https://traverser360.s3.ap-northeast-2.amazonaws.com/1497782502160.png');
    obj.addEvent('teleport', projectObject.getCurrentIndex() + 1);
    obj.addEvent('oneClick',"");
    obj.addEvent('addScore',"1");
    console.log(obj);
}

window.modifyOption = function(text,image_url,score){
    //currentSelectedObject.drawText(mainFrame,text);
    currentSelectedObject.material.src = image_url;
    currentSelectedObject.el.setAttribute("src",image_url);
    util.getImageSize(image_url, function() {
        currentSelectedObject.setScale({ x: this.width / BASE_IMG_WIDTH, y: this.height / BASE_IMG_WIDTH });
    });
    currentSelectedObject.modifyEvent("addScore",score);
}

window.createSpot = function() {
    var obj = createImage('https://traverser360.s3.ap-northeast-2.amazonaws.com/1497977716404.png');
    obj.addEvent('onVisible',"");
    obj.addEvent('oneClick',"");
    obj.addEvent('addScore',"1");
    updateObjectNumUI();
    console.log(obj);
}
window.modifySpot = function(imgage_url) {
    currentSelectedObject.material.src = image_url;
    currentSelectedObject.el.setAttribute("src",image_url);
    util.getImageSize(image_url, function() {
        currentSelectedObject.setScale({ x: this.width / BASE_IMG_WIDTH, y: this.height / BASE_IMG_WIDTH });
    });
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

window.modifyResult = function(text,image_url,score,background_url){
    currentSelectedObject.material.src = image_url;
    currentSelectedObject.el.setAttribute("src",image_url);
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

    if (editorMode && currentSelectedObject == selected) {
        return;
    }

    currentSelectedObject = selected;

    if (editorMode) {

        var position = currentSelectedObject.transform.position;
        var rotation = currentSelectedObject.transform.rotation;
        scale = currentSelectedObject.transform.scale;

        // append mover element
        mover = newMover();
        this.appendChild(mover);
        openObjectPropertyPanel(event.detail.mouseEvent);
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
    switch(projectObject.projectType){
        case "simri":if(projectObject.getCurrentScenery().sceneryType == "result") id = "#simri-result-panel";
                    else id = "#simri-option-panel";
                    break;
        case "hidenseek" :id ="#hidenseek-panel";break;
    }
    if ($(id).css("display") == "none") {
        $(id).css("display", "");
    }
    $(id).css({ position: "fixed", top: event.clientY, left: event.clientX+150 });
}

function checkScore() {
    switch (projectObject.projectType) {
        case "hidenseek":
            document.getElementById("hidenseek-num").innerHTML= scoreVariable + "/" + getTotalSpot();
            if (scoreVariable == getTotalSpot()) {
                mainFrame.document.getElementById('game-set').setAttribute('position', '0 0 -1');
                clearInterval(timerId);
            }
    }
}

function onObjectUnselect() {
    currentSelectedObject = null;
    if (mover)
        mover.parentEl.removeChild(mover);
    mover = null;
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
