var objct = require('./object.js');

function Scenery(bgEl, scenery) {
    if (scenery) {
        // copy all properties of scenery to this
        for (var prop in scenery) {
            this[prop] = scenery[prop];
        }
    } else if (bgEl) {
        this.bgEl = bgEl;
        this.bgUrl = this.bgEl.getAttribute('src');
        this.objectList = [];
    } else {
        this.bgEl = null;
        this.bgUrl = "";
        this.objectList = [];
    }
    this.name = "Scene";
    this.sceneryType = "";
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
