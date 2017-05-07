var express = require('express');
var fs = require('fs');
var multer = require('multer');
var path = require('path');
var router = express.Router();

var _storage = multer.diskStorage({
    destination: function(req, file, cb){   //디렉토리 위치
        cb(null, './uploads/');
    },
    filename: function(req, file, cb){  //파일명
        cb(null, Date.now() + "." + file.originalname.split('.').pop());
    }
});
var upload = multer({ storage: _storage});

router.get('/', function(req, res){
  res.render('temp', { title: 'Express' });
})

router.post('/upload' , upload.single('image'), function (req, res) {
  console.log('upload image');
  var filename = req.file.filename;
  var path = req.file.path;

  res.render('temp', {file:path});
/*
  res.render('temp', function (error, content) {
        if (!error) {
            res.end(content);
        }
        else {
            res.writeHead(501, { 'Content-Type' : 'text/plain' });
            res.end("Error while reading a file");
        }
    });
    */
});

module.exports = router;
