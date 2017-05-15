var express = require('express');
var fs = require('fs');
var multer = require('multer');
var path = require('path');
var router = express.Router();

var _storage = multer.diskStorage({
    destination: function(req, file, cb){   //디렉토리 위치
        cb(null, './uploads');
    },
    filename: function(req, file, cb){  //파일명
        cb(null, Date.now() + "." + file.originalname.split('.').pop());
    }
});

var uploadImage = multer({ storage: _storage}).single('image_file');
var uploadBackground = multer({ storage: _storage}).single('photo');

router.get('/', function(req, res){
  res.render('index', {background: '', title : "Express" });
})

router.post('/upload/image', function(req, res){
  uploadImage(req,res,function(err) {
    //var path = req.file.path;
    var filename = req.file.filename;
    if(err){
      console.log('err : ' + err);
    }else {
      res.json({result : "/uploads/" + filename});
    }
  });
});

router.post('/upload/background', function(req,res){
  uploadBackground(req,res,function(err) {
    if(err){
      console.log('err : ' + err);
    }else {
      var filename = '/uploads/' + req.file.filename;
      console.log(filename);
      //res.render('index', {background : filename});
      res.end(filename);
    }
  });
});

module.exports = router;
