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

    this.sceneryList[currentIndex].bgEl = bgEl;
}

Project.prototype.getCurrentScenery = function() {
    return this.sceneryList[currentIndex];
}
Project.prototype.getCurrentIndex = function() {
    return currentIndex;
}
Project.prototype.getSceneryListLength = function(){
    return this.sceneryList.length;
}
Project.prototype.toJson = function() {
    var saveForm = { title: this.title , projectType: this.projectType};
    saveForm.sceneryList = [];
    for (var i in this.sceneryList) {
        var scenery = this.sceneryList[i];
        saveForm.sceneryList.push(scenery.getSaveForm());
    }
    return JSON.stringify(saveForm);
}

Project.prototype.fromJson = function(json) {
    var saveForm = JSON.parse(json);
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
