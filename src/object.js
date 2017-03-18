var objects = [];


function Objct(el) {
    this.el = el;
    this.transform = {};
    this.material = {};

    this.eventList = [];

    objects.push(this);
}

Objct.prototype.getType = function() {
    return this.el.getAttribute('geometry').primitive;
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
    var objs = objects.filter(function(obj) {
        return obj.el == el;
    });
    return objs[0];
}

module.exports = {
    Objct: Objct,
    getNum: getNum,
    remove: remove,
    getFromEl: getFromEl
};
