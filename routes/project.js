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

AWS.config.update({
    accessKeyId: "AKIAJHEDGWLON4GFJNTQ",
    secretAccessKey: "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",
    region: "ap-northeast-2",
    signatureVersion: 'v4'
});

var s3 = new AWS.S3();
var host = "https://s3.ap-northeast-2.amazonaws.com/traverser360";

var uploadImage = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'traverser360',
        acl: 'public-read',
        key: function (req, file, cb) {
            cb(null,  + "/" + Date.now() + "." + file.originalname.split('.').pop());
        }
    })
});

router.get('/', function(req, res){
  var projectSQL = 'SELECT * FROM scene';
    connection.query(projectSQL, function (error, info) {
        if(error) {
            res.status(500).json({
                scenes: -1,
            });
        } else {
          var temp;
          req.session.userID == null ? temp = -1 : temp = req.session;
          console.log("user : " + temp + ", scenes : " + info);
          res.render('project', {user : temp, scenes : info });
        }
    });
});

router.get('/:id', function(req, res){
  var id = req.params.id;
  if(id == "new"){
    if(req.session.userID==null){
      res.redirect('/login');
    }else{
      var query = "insert into scene(userID, title, thumbnail) values(?, ?, ?)";
      var params = [1, "no title", host + "/default.jpg"];
      connection.query(query, params, function (error, info) {
          if(error) {
            throw error;
          } else {
            console.log("insert " + info.insertId);
            res.redirect('/project/' + info.insertId);
          }
      });
    }
  }else{
    var query = 'SELECT * FROM scene WHERE idscene=?';
    connection.query(query, id, function(err, info){
      if(err){
        res.status(500);
      }else{
        var temp;
        req.session.userID == null ? temp = -1 : temp = req.session;
        res.render('editor', {user : temp, scene : info[0]});
      }
    });
  }
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

router.post('/:id/background', uploadImage.array('photo', 1), function(req,res){
   res.end(req.files[0].location);
});

router.post('/:id/image', uploadImage.array('image_file', 1), function(req, res){
  res.json({result : req.files[0].location});
});

router.post('/save', function(req, res){
  var data = req.body
  var base64data = new Buffer(data.json, 'binary');

  s3.upload({
    Bucket: 'traverser360',
    Key: data.scene + "/" + Date.now() + ".json",
    Body: base64data,
    ACL: 'public-read'
  }, function (err, result) {
    if(err){
      console.log(err);
    }else{
      var query = "update scene set path=? where idscene=?"
      var params = [host + "/" + result.key, data.scene];
      connection.query(query, params, function (error, info) {
        var temp;
        req.session.userID == null ? temp = -1 : temp = req.session;
          if(error) {
            console.log("err : " + error);
            res.json({user : temp, saveResult : 0});
          } else {
            console.log("save success : " + info[0]);
            res.json({user : temp, saveResult : 1});
          }
      });
    }
  });
});

router.get('/load', function(req, res){
  var data = fs.readFileSync('./uploads/test.json', 'utf8');
  var json = JSON.parse(data);
  for(var i=0; i<json.length; i++){
    console.log(json[i]);
    console.log(json[i].el);
  }
});


module.exports = router;
