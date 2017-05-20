var express = require('express');
var fs = require('fs');
var multer = require('multer');
var path = require('path');
var cloudinary = require('cloudinary');
var fileParser = require('connect-multiparty')();
var AWS = require('aws-sdk');
var multerS3 = require('multer-s3');
var connection = require('../libs/dbConnect.js').dbConnect();
var router = express.Router();

cloudinary.config({
  cloud_name: 'dfhrj45xg',
  api_key: '965633929854182',
  api_secret: 'hX3KhluDt51J760bHhWgPVMoVZU'
});

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

AWS.config.update({
    accessKeyId: "AKIAJHEDGWLON4GFJNTQ",
    secretAccessKey: "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",
    region: "ap-northeast-2",
    signatureVersion: 'v4'
});

var s3 = new AWS.S3();

var upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'traverser360',
        acl: 'public-read',
        key: function (req, file, cb) {
            cb(null, ''+Date.now());
        }
    })
});

router.get('/', function(req, res){
  var projectSQL = 'SELECT * FROM scene';
    connection.query(projectSQL, function (error, info) {
        if(error) {
            res.status(500).json({
                result: 'false',
                info: info[0]
            });
        } else {
          res.render('project', {result : info});
        }
    });
});

router.get('/:id', function(req, res){
  var id = req.params.id;
  console.log(id);
  var detailSQL = 'SELECT * FROM scene WHERE idscene=?';
  connection.query(detailSQL, id, function(err, info){
    if(err){
      res.status(500);
    }else{
      res.render('editor', {result : info});
    }
  });
});

router.get('/new', function(req, res){
  res.render('editor');
});

/*
router.post('/upload/image', fileParser, function(req, res){
  var imageFile = req.files.image_file;

   cloudinary.uploader.upload(imageFile.path, function(result){
     if (result.url) {
        console.log(result.url);
        res.json({result : result.url});
     } else {
       console.log('Error uploading to cloudinary: ',result);
     }
   });
});
*/
router.post('/new/background', upload.array('photo', 1), function(req,res){
  /*
  var imageFile = req.files.photo;
   cloudinary.uploader.upload(imageFile.path, function(result){
     if (result.url) {
        console.log(result.url);
       res.end(result.url);
     } else {
       console.log('Error uploading to cloudinary: ',result);
     }
   });*/
   res.end(req.files[0].location);
});

router.post('/new/image', upload.array('image_file', 1), function(req, res){
  res.json({result : req.files[0].location});
});


// read json file
router.get('/test', function(req, res){
  var data = fs.readFileSync('./uploads/test.json', 'utf8');
  var json = JSON.parse(data);
  for(var i=0; i<json.length; i++){
    console.log(json[i]);
    console.log(json[i].el);
  }
});


module.exports = router;
