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
            cb(null, file.originalname);
        }
    })
});



router.get('/', function(req, res){
  res.render('index', {background: '', title : "Express" });
})
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
router.post('/upload/background', fileParser, function(req,res){
  var imageFile = req.files.photo;

   cloudinary.uploader.upload(imageFile.path, function(result){
     if (result.url) {
        console.log(result.url);
       res.end(result.url);
     } else {
       console.log('Error uploading to cloudinary: ',result);
     }
   });
});

router.post('/upload/image', upload.array('image_file', 1), function(req, res){
  res.json({result : req.files[0].location});
});

router.get('/login', function(req, res){
  var query = 'SELECT * FROM user';

  connection.query(query, function (error, rows) {
      if(error) {
          console.log("error : " + error);
      }else{
        for(var i=0; i<rows.length; i++)
          console.log(rows[i].iduser);

        res.render('login');
      }
  });
});

module.exports = router;
