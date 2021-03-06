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
        this.text = "";
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
    for (var key in newMaterial) {
        this.material[key] = newMaterial[key];
        this.el.setAttribute(key, newMaterial[key]);
    }
}

Objct.prototype.drawText = function(frame, text) {
    this.text = text;
    var newEl = frame.document.createElement("a-text");
    newEl.setAttribute('value', text);
    this.el.appendChild(newEl);
}

Objct.prototype.setFadeInOutAni = function(frame) {
    var fadeIn = frame.document.createElement("a-animation");
    var fadeOut = frame.document.createElement("a-animation");
    fadeIn.setAttribute("attribute", "material.color");
    fadeOut.setAttribute("attribute", "material.color");

    fadeIn.setAttribute("begin", "fade-in");
    fadeOut.setAttribute("begin", "fade-out");

    fadeIn.setAttribute("from", "black");
    fadeOut.setAttribute("from", "white");

    fadeIn.setAttribute("to", "white");
    fadeOut.setAttribute("to", "black");

    fadeIn.setAttribute("dur", "2000");
    fadeOut.setAttribute("dur", "2000");

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
Objct.prototype.modifyEvent = function(eventType, eventAgrs) {
    for (var i = 0; i < this.eventList.length; i++) {
        if (this.eventList[i].type == eventType) {
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

Controller.prototype.createElFromObj = function(frame, obj, THREE) {
    var newEl = frame.document.createElement("a-" + obj.shape);
    obj.el = newEl;
    obj.setPosition(obj.transform.position);
    obj.setRotation(obj.transform.rotation);
    obj.setScale(obj.transform.scale);
    obj.setMaterial(obj.material);
    if (obj.material['src']) {
        this.loadFromUrl(newEl, obj.material['src'], THREE);
    }
    obj.setClickListener(obj.clickListener);
    obj.setLookAt(obj.lookat);
    obj.setFadeInOutAni(frame);
    newEl.setAttribute("class", "object");

    return newEl;
}

Controller.prototype.loadFromUrl = function(el, url, THREE) {
    console.log('load objectimage: ' + url);
    var texture;
    var imageElement = document.createElement('img');
    imageElement.setAttribute('crossOrigin', 'anonymous');
    imageElement.onload = function(e) {
        texture = new THREE.Texture(this);
        texture.needsUpdate = true;

        el.components.material.material.map = texture;
        el.components.material.material.needsUpdate = true;
    };
    imageElement.src = url;
}

module.exports = {
    Objct: Objct,
    Controller: new Controller()
};
