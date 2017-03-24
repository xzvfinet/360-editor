var objects = [];

function Objct(el, obj) {
    this.el = el;
    this.type = "";
    this.shape = "";
    this.transform = {};
    this.material = {};

    this.clickListener = "";
    this.eventList = [];

    // copy all properties of obj to this
    for (var prop in obj) {
        this[prop] = obj[prop];
    }

    objects.push(this);
}

Objct.prototype.getShape = function() {
    if (this.el)
        return this.el.getAttribute('geometry').primitive;
    else
        return this.shape;
}

Objct.prototype.setPosition = function(newPosition) {
    if (this.el)
        this.el.setAttribute('position', newPosition);
    this.transform.position = newPosition;
}

Objct.prototype.setRotation = function(newRotation) {
    if (this.el)
        this.el.setAttribute('rotation', newRotation);
    this.transform.rotation = newRotation;
}

Objct.prototype.setScale = function(newScale) {
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

function Controller() {}

Controller.prototype.objectsFromJson = function(json) {
    var loadedObjects;
    loadedObjects = JSON.parse(json);
    // console.log(loadedObjects);
    var loadedObjectsWithPrototype = [];
    for (var i = 0; i < loadedObjects.length; ++i) {
        var newObj = new Objct(null, loadedObjects[i]);
        // console.log(loadedObjects[i]);
        // console.log(newObj);
        loadedObjectsWithPrototype.push(newObj);
    }
    return loadedObjectsWithPrototype;
}

Controller.prototype.objectsToJson = function() {
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

    return newEl;
}

Controller.prototype.getNum = function() {
    return objects.length;
}

Controller.prototype.remove = function(obj) {
    if (obj.el) {
        obj.el.parentElement.removeChild(obj.el);
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
