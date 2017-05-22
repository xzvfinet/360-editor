var currentIndex = 0;
var sceneries = [];

function Scenery(bgEl, scenery) {
    if (scenery) {
        // copy all properties of scenery to this
        for (var prop in scenery) {
            this[prop] = scenery[prop];
        }
    } else {
        this.bgEl = bgEl;
        this.bgUrl = this.bgEl.getAttribute('src');
    }

    sceneries.push(this);
}

Scenery.prototype.setBackgroundImageUrl = function(url) {
    this.bgUrl = url;
    this.bgEl.setAttribute('src', this.bgUrl);
}

Scenery.prototype.setBgEl = function(bgEl) {
    this.bgEl = bgEl;
    bgEl.setAttribute('src', this.bgUrl);
}

Scenery.prototype.getSaveForm = function() {
    var tmp = this.bgEl;
    this.bgEl = null;
    var copyScenery = JSON.parse(JSON.stringify(this));
    this.bgEl = tmp;
    return copyScenery;
}

function Controller() {}

Controller.prototype.addScenery = function(scenery) {
    sceneries.push(scenery);
}

Controller.prototype.changeScenery = function(scenery) {
    var bgEl = sceneries[currentIndex].bgEl;
    sceneries[currentIndex].bgEl = null;

    if (typeof scenery == 'object') {
        for (var i = sceneries.length - 1; i >= 0; i--) {
            if (sceneries[i] == scenery) {
                currentIndex = i;
                break;
            }
        }
    } else if (typeof scenery == 'number') {
        currentIndex = number;
    }

    sceneries[currentIndex].bgEl = bgEl;
}

Controller.prototype.getCurrentScenery = function() {
    return sceneries[currentIndex];
}

Controller.prototype.sceneriesToJson = function() {
    var saveSceneries = [];
    for (var i = 0; i < sceneries.length; ++i) {
        saveSceneries.push(sceneries[i].getSaveForm());
    }
    var json = JSON.stringify(saveSceneries);
    return json;
}

Controller.prototype.sceneriesFromJson = function(json) {
    var loadedSceneries;
    loadedSceneries = JSON.parse(json);
    var loadedSceneriesWithPrototype = [];
    for (var i = 0; i < loadedSceneries.length; ++i) {
        var newScenery = new Scenery(null, loadedSceneries[i]);
        loadedSceneriesWithPrototype.push(newScenery);
    }
    return loadedSceneriesWithPrototype;
}

module.exports = {
    Scenery: Scenery,
    Controller: new Controller()
};
