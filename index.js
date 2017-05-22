var express = require('express');
var main = require('./routes/main')
var project = require('./routes/project');
var bodyParser = require('body-parser');
var path = require('path');
var app = express();

app.use(express.static('./'));
app.use(express.static(path.join(__dirname, 'upload')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.listen(8000);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/', main);
app.use('/project', project);

module.exports = app;
