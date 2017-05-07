var express = require('express');
var upload = require('./routes/upload')
var bodyParser = require('body-parser');
var path = require('path');
var app = express();

app.use(express.static('./'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use('/', upload);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.listen(8000);

module.exports = app;
