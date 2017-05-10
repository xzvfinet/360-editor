// Constants
var PRIMITIVE_DEFINITIONS = ['box', 'sphere', 'cylinder', 'plane', 'image'];
var OBJECT_DEFINITIONS = ['teleport','minimap'];
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
var mover = null;

var miniMap = null;
var miniMapDirector = null;

// State Variables
var editorMode = true;
var currentSelectedObject = null;
var isDown = false;
var currentSelectedArrowEl = null;

var util = require('./util.js');
var nodeUtil = require('util');
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

        mainCanvas.style.width = (editorMode) ? '' : '100%';

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
    });
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
    mainFrame.AFRAME.registerComponent('minimap-direction', {

        init: function(){
            var mouseDown = false;
             // Mouse Events
            scene.addEventListener('mousedown', this.onMouseDown, false);
            scene.addEventListener('mousemove', this.onMouseMove, false);
            scene.addEventListener('mouseup', this.releaseMouse, false);

            // Touch events
            scene.addEventListener('touchstart', this.onTouchStart);
            scene.addEventListener('touchmove', this.onTouchMove);
            scene.addEventListener('touchend', this.onTouchEnd);
        },
        onMouseDown: function (event) {
            this.mouseDown = true;
        },
        releaseMouse: function (event) {
            this.mouseDown = false;
        },
        onMouseMove: function (event){
            if(this.mouseDown){
                miniMapDirector.setAttribute('rotation',{x:0,y:0,z:camera.getAttribute('rotation').y});
            }
        }
    });

    mainFrame.AFRAME.registerComponent('mover-listener', {
        schema: {},
        init: function() {
            var initialPos = null;
            var prevPos = null;
            var radius = 6;

            this.el.addEventListener('mouseenter', function() {
                var scale = this.getAttribute('scale');
                this.setAttribute('scale', { x: scale.x * 2, y: scale.y * 2, z: scale.z });
            });
            this.el.addEventListener('mouseleave', function() {
                var scale = this.getAttribute('scale');
                this.setAttribute('scale', { x: scale.x / 2, y: scale.y / 2, z: scale.z });
                this.emit('mouseup');
            });
            this.el.addEventListener('mousedown', function(evt) {
                this.setAttribute('material', 'color', "#FFFFFF");
                camera.removeAttribute('look-controls');
                isDown = true;
                currentSelectedArrowEl = this;

                var pos = camera.components['mouse-cursor'].__raycaster.ray.direction;
                initialPos = { x: pos.x * radius, y: pos.y * radius, z: pos.z * radius };
                prevPos = initialPos;
            });
            this.el.addEventListener('mouseup', function(evt) {
                this.setAttribute('material', 'color', "#000000");
                camera.setAttribute('look-controls', "");
                isDown = false;
                currentSelectedArrowEl = null;
            });
            this.el.addEventListener('mymousemove', function(evt) {
                if (isDown) {
                    var direction = camera.components['mouse-cursor'].__raycaster.ray.direction;
                    var newPos = {
                        x: direction.x * radius,
                        y: direction.y * radius,
                        z: direction.z * radius
                    };
                    this.parentEl.setAttribute('position', newPos);
                }
            });
        },
        tick: function(time, timeDelta) {
            // console.log(time + ', ' + timeDelta);
            // console.log(camera.getAttribute('rotation'));
        }
    });

    mover = mainFrame.document.getElementById('mover');
    mover.setAttribute('mover-listener', "");

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

        // append arrow element
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

function newObject(type, shape, position, rotation, scale) {
    var tag = 'a-' + shape;
    var newEl = mainFrame.document.createElement(tag);
    var newObj = new obj.Objct(newEl);

    newObj.type = type;
    newObj.shape = shape;
    position = util.getForwardPosition(camera.getAttribute('rotation'));
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

    // Make object face at camera origin by default.
    newEl.setAttribute('look-at', '#camera');

    scene.appendChild(newEl);

    setObjectOnMiniMap(position);
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

//minimap

 window.setMiniMap = function(){
     if(miniMap == null){
        miniMap = mainFrame.document.createElement('a-image');
        miniMapDirector = mainFrame.document.createElement('a-image');
        
        miniMap.setAttribute('id','minimap');
        miniMap.setAttribute('material','opacity',0);
        
        miniMapDirector.setAttribute('id','minimap-director');
        miniMapDirector.setAttribute('material','src','/static/img/Minimap_Director.png');
        miniMapDirector.setAttribute('minimap-direction',"")
        //var newObj = new obj.Objct(miniMap);

        rotation = {x:0,y:0,z:camera.getAttribute('rotation').y}
        miniMapDirector.setAttribute('rotation',rotation);
        
        position = {x:-4,y:-3.5,z:-5};
        miniMap.setAttribute('position',position);
        //newObj.setPosition(position);

        miniMap.appendChild(miniMapDirector);
        camera.appendChild(miniMap);

        var objects = obj.Controller.getObjects();
        
        for(var i = 0;i<obj.Controller.getNum();i++){
            setObjectOnMiniMap(objects[i].transform.position);
        }
     }else{
         console.log('already has minimap');
     }
}

window.setObjectOnMiniMap = function(position){
    if(miniMap != null){
        var x = position.x/10 - 2.4;
        var y = position.z/10 * -1 - 2.1;
        var newEl = mainFrame.document.createElement('a-plane');
        //var newObj = new obj.Objct(newEl);

        position = { x: x, y: y ,z: -3 };
        newEl.setAttribute('position',position);
        //newObj.setPosition(position);
        scale = { x: 0.2, y: 0.2, z: 0.2 };
        newEl.setAttribute('scale',scale);
        //newObj.setScale(scale);

        miniMap.appendChild(newEl);
    }
}

