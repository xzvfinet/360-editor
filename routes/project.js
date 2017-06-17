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
            cb(null,  + Date.now() + "." + file.originalname.split('.').pop());
        }
    })
});

router.get('/', function(req, res){
  var projectSQL = 'SELECT * FROM scene where path!=""';
    connection.query(projectSQL, function (error, info) {
        if(error) {
            res.status(500).json({
                scenes: -1,
            });
        } else {
          var temp;
          req.session.userID == null ? temp = -1 : temp = req.session;
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
      var query = "insert into scene(userID, title) values(?, ?)";
      var params = [req.session.userID, "no title"];
      connection.query(query, params, function (error, info) {
          if(error) {
            throw error;
          } else {
            res.redirect('/project/' + info.insertId);
          }
      });
    }
  }else{
    var temp, json;
    var query = "update scene set view = view + 1 where idscene=?";
    var params = [req.params.id];
    connection.query(query, params, function(err, info){
      if(err){
        console.log("err : " + err);
        res.status(500);
      }else{
        req.session.userID == null ? temp = -1 : temp = req.session;
        res.render('editor', {user : temp, sceneID : id});
      }
    });
  }
});

router.get('/load/:id', function(req, res){
  var id = req.params.id
  var query = 'SELECT * FROM scene WHERE idscene=?';
  var json;
  connection.query(query, id, function(err, info){
    if(err){
      res.status(500);
    }else{
      if(info[0].path == null){
        json = '';
        res.end(json);
      }else{
        var key = (info[0].path).split('traverser360/')[1];
        var params = {Bucket: 'traverser360', Key: key};
        s3.getObject(params, function(err, data) {
          if (err){
            console.log(err, err.stack); // an error occurred
          }else{
            json = data.Body.toString();
          }
          res.end(json);
        });
      }
    }
  });
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
router.post('/:id/background', uploadImage.array('image_file', 1), function(req,res){
   res.json({result : req.files[0].location});
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
      saveThumbnail(data.scene, host + "/" + result.key);
      var query = "update scene set path=? where idscene=?"
      var params = [host + "/" + result.key, data.scene];
      connection.query(query, params, function (error, info) {
        var temp;
        req.session.userID == null ? temp = -1 : temp = req.session;
          if(error) {
            console.log("err : " + error);
            res.json({user : temp, saveResult : 0});
          } else {
            res.json({user : temp, saveResult : 1});
          }
      });
    }
  });
});

function saveThumbnail(id, path){
  var path = path;
  var id = id;
  var key = path.split('traverser360/')[1];
  var params = {Bucket: 'traverser360', Key: key};
  s3.getObject(params, function(err, data) {
    if (err){
      console.log(err, err.stack); // an error occurred
    }else{
      var json = JSON.parse(data.Body.toString());
      var bgUrl = json.sceneryList[0].bgUrl;
      if(bgUrl != ""){
        cloudinary.uploader.upload(bgUrl, function(result){
          if (result.url) {
             var temp = (result.url).split("upload/");
             var url = temp[0] + "upload/w_540,h_350/" + temp[1];
             var q = 'update scene set thumbnail=? where idscene=?';
             var p = [url, id];
             connection.query(q, p, function(err, info){
               if(err){
                 console.log("err : " + err);
               }
             })
          } else {
            console.log('Error uploading to cloudinary: ',result);
          }
        });
      }
    }
  });
}

function getTemplateList(){
  var query = "select * from template";
  connection.query(query, function(err, info){
    if(err){
      console.log('err : ' + err);
    }else{
      res.end(JSON.stringify(info));
    }
  });
}

module.exports = router;
