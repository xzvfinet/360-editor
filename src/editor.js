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
var Project = require('./project.js').Project;
var obj = require('./object.js');
var Scenery = require('./scenery.js').Scenery;

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
var projectObject = null;
var editorMode = true;
var currentSelectedObject = null;
var isDown = false;
var currentSelectedArrowEl = null;

window.onLoadCanvas = function(frame) {
    mainFrame = frame;

    initEditor();
    initCanvas();

    newProject();
}

window.setBackground = function(url) {
    projectObject.getCurrentScenery().setBackgroundImageUrl(url);
}

window.newProject = function() {
    projectObject = new Project();
    var newScenery = new Scenery(background);
    projectObject.addScenery(newScenery);
}

window.saveProject = function(userID, sceneID) {
    saveJsontoServer(projectObject.toJson(), userID, sceneID);
}

window.loadProject = function(projectJson) {
    clearAllObject();

    var loadedProject = new Project();
    loadedProject.fromJson(projectJson);
    for (var i in loadedProject.sceneryList) {
        relateSceneryWithDomEl(loadedProject.sceneryList[i]);
        for (var j in loadedProject.sceneryList[i].objectList) {
            relateObjectWithDomEl(loadedProject.sceneryList[i].objectList[j]);
        }
    }
    projectObject = loadedProject;
    //scene number
    setSceneNumber();
    setSceneDropDown();
}

function loadAllObjectOfScene(sceneNum) {
    eraseCanvas();
    for (var j in projectObject.sceneryList[sceneNum].objectList) {
        relateObjectWithDomEl(projectObject.sceneryList[sceneNum].objectList[j]);
    }
    projectObject.changeScenery(projectObject.sceneryList[sceneNum]);
    setSceneNumber();
} 

function setSceneNumber() {
    sceneNum = $('#scene-list')[0];
    //remove all child
    while ( sceneNum.hasChildNodes() ) { sceneNum.removeChild( sceneNum.firstChild ); } 
    
    for (var i = 0; i < projectObject.getSceneryListLength(); i++) {
        if(projectObject.getCurrentIndex() == i){
            var a = document.createElement("b");
        }else{
            var a = document.createElement("a");
        }
        a.innerHTML = (i + 1);
        if (i != projectObject.getSceneryListLength() - 1)
            a.innerHTML += "-";
        sceneNum.appendChild(a);
    }
}

function setSceneDropDown(){
    sceneDropdown = $('#scene-dropdown')[0];
    while ( sceneDropdown.hasChildNodes() ) { sceneDropdown.removeChild( sceneDropdown.firstChild ); } 
    for (var i = 0; i < projectObject.getSceneryListLength(); i++) {
        var op = document.createElement("option");
        op.setAttribute("value",i);
        op.innerHTML = "페이지 "+(i+1);
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

function clearAllObject(scenery) {
    projectObject.getCurrentScenery().removeAllObject();
}

function eraseCanvas(){
    var objects = mainFrame.document.querySelectorAll(".object");
    console.log(objects);
    for(var i = 0; i< objects.length;i++){
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
        var json = projectObject.toJson();
        loadTextEl.value = json;
        // saveJsontoServer(JSON.stringify(saveObject));
    });
    loadBtnEl = document.getElementById('loadBtn');
    loadBtnEl.addEventListener('click', function(evt) {
        loadProject(loadTextEl.value);
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

    $('#scene-dropdown').change(function(){
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

window.createScene = function(){
    var newScenery = new Scenery(background);
    projectObject.addScenery(newScenery);
   
   console.log(projectObject.sceneryList);
    var op = document.createElement("option");
    var length = projectObject.getSceneryListLength();
    op.setAttribute("value",length-1);
    op.innerHTML = "페이지 "+(length);
    op.setAttribute("selected","");
    $('#scene-dropdown')[0].appendChild(op);

    projectObject.changeScenery(projectObject.sceneryList[length-1]);
    eraseCanvas();
    setSceneNumber();
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
    var selected = projectObject.getCurrentScenery().findObjectByEl(this);

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
