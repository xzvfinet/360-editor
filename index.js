var express = require('express');
var main = require('./routes/main')
var bodyParser = require('body-parser');
var path = require('path');
var app = express();

app.use(express.static('./'));
app.use(express.static(path.join(__dirname, 'upload')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.listen(8000);

app.use('/', main);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

module.exports = app;
