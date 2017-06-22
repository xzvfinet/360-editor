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
        key: function(req, file, cb) {
            cb(null, +Date.now() + "." + file.originalname.split('.').pop());
        }
    })
});

router.get('/', function(req, res) {
    var projectSQL = 'SELECT * FROM scene where path!=""';
    connection.query(projectSQL, function(error, info) {
        if (error) {
            res.status(500).json({
                scenes: -1,
            });
        } else {
            var temp;
            req.session.userID == null ? temp = -1 : temp = req.session;
            res.render('project', { user: temp, scenes: info });
        }
    });
});

router.get('/:id', function(req, res) {
    var id = req.params.id;
    if (id == "new") {
        if (req.session.userID == null) {
            res.redirect('/login');
        } else {
            var jsonDir = './static/json/' + req.query['type'] + '.json';
            var projectObjectString = fs.readFileSync(jsonDir, 'utf8');// json 파일 스트링 로드
            var base64data = new Buffer(projectObjectString, 'binary');

            var query1 = "insert into scene(userID, title) values(?, ?)";
            var params1 = [req.session.userID, "no title"];
            connection.query(query1, params1, function(error, info1) {
                if (error) {
                    throw error;
                } else {
                    s3.upload({
                        Bucket: 'traverser360',
                        Key: id + "/" + Date.now() + ".json",
                        Body: base64data,
                        ACL: 'public-read'
                    }, function(err, result) {
                        if (err) {
                            console.log(err);
                        } else {
                            var query2 = "update scene set path=? where idscene=?"
                            var params2 = [host + "/" + result.key, info1.insertId];
                            connection.query(query2, params2, function(error, info2) {
                                var temp = (req.session.userID == null) ? -1 : req.session;
                                if (error) {
                                    console.log("err : " + error);
                                    // res.json({user : temp, saveResult : 0});
                                } else {
                                    // res.json({user : temp, saveResult : 1});
                                    console.log(req.query['type'] + " is created");
                                    console.log(params2);
                                    res.redirect('/project/' + info1.insertId);
                                }
                            });
                        }
                    });
                }
            });
        }
    } else {
        var temp, json;
        var query = "update scene set view = view + 1 where idscene=?";
        var params = [req.params.id];
        connection.query(query, params, function(err, info) {
            if (err) {
                console.log("err : " + err);
                res.status(500);
            } else {
                var query2 = 'SELECT * FROM scene WHERE idscene=?';
                var params2 = [req.params.id];
                connection.query(query2, params, function(err, info) {
                    var key = (info[0].path).split('traverser360/')[1];
                    var params3 = { Bucket: 'traverser360', Key: key };
                    s3.getObject(params3, function(err, data) {
                        if (err) {
                            console.log(err, err.stack); // an error occurred
                        } else {
                            json = data.Body.toString();
                            var projectObject = JSON.parse(json);
                            var projectType = projectObject.projectType;
                            req.session.userID == null ? temp = -1 : temp = req.session;
                            res.render('editor', {
                                user: temp,
                                sceneID: id,
                                projectType: projectType,
                                projectObjectJson: projectObject
                            });
                        }
                        // res.end(json);
                    });
                });

            }
        });
    }
});

router.get('/load/:id', function(req, res) {
    var id = req.params.id
    var query = 'SELECT * FROM scene WHERE idscene=?';
    var json;
    connection.query(query, id, function(err, info) {
        if (err) {
            res.status(500);
        } else {
            if (info[0].path == null) {
                json = '';
                res.end(json);
            } else {
                var key = (info[0].path).split('traverser360/')[1];
                var params = { Bucket: 'traverser360', Key: key };
                s3.getObject(params, function(err, data) {
                    if (err) {
                        console.log(err, err.stack); // an error occurred
                    } else {
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
router.post('/:id/background', uploadImage.array('image_file', 1), function(req, res) {
    res.json({ result: req.files[0].location });
});

router.post('/:id/image', uploadImage.array('image_file', 1), function(req, res) {
    res.json({ result: req.files[0].location });
});

router.post('/:id/thumbnail', uploadImage.array('image_file', 1), function(req, res) {
    console.log(req);
    var id = req.params.id;
    var imageData = req.body.imageData;
    console.log('got post thumb. start uploading');
    cloudinary.uploader.upload(imageData, function(result) {
        console.log('uploaded to cloudinary');
        if (result.url) {
            var temp = (result.url).split("upload/");
            var url = temp[0] + "upload/" + temp[1];
            var q = 'update scene set thumbnail=? where idscene=?';
            var p = [url, id];
            console.log(p);
            connection.query(q, p, function(err, info) {
                if (err) {
                    console.log("err : " + err);
                } else {
                    res.json({ result: true });
                }
            })
        } else {
            console.log('Error uploading to cloudinary: ', result);
        }
    });
});

router.post('/save', function(req, res) {
    var data = req.body
    var base64data = new Buffer(data.json, 'binary');

    s3.upload({
        Bucket: 'traverser360',
        Key: data.scene + "/" + Date.now() + ".json",
        Body: base64data,
        ACL: 'public-read'
    }, function(err, result) {
        if (err) {
            console.log(err);
        } else {
            var query = "update scene set path=? where idscene=?"
            var params = [host + "/" + result.key, data.scene];
            connection.query(query, params, function(error, info) {
                var temp;
                req.session.userID == null ? temp = -1 : temp = req.session;
                if (error) {
                    console.log("err : " + error);
                    res.json({ user: temp, saveResult: 0 });
                } else {
                    res.json({ user: temp, saveResult: 1 });
                }
            });
        }
    });
});

router.post('/clear/:number', function(req, res) {
    var number = req.params.number;
    var query = "delete from scene where idscene>" + number;
    var params = [req.params.id];
    connection.query(query, params, function(err, info) {
        if (err) {
            console.log("err : " + err);
            res.status(500);
        } else {
            res.json({ result: "successful" });
        }
    });
});

function saveThumbnail(id, path) {
    var path = path;
    var id = id;
    var key = path.split('traverser360/')[1];
    var params = { Bucket: 'traverser360', Key: key };
    s3.getObject(params, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
        } else {
            var json = JSON.parse(data.Body.toString());
            var bgUrl = json.sceneryList[0].bgUrl;
            if (bgUrl != "") {
                cloudinary.uploader.upload(bgUrl, function(result) {
                    if (result.url) {
                        var temp = (result.url).split("upload/");
                        var url = temp[0] + "upload/w_540,h_350/" + temp[1];
                        var q = 'update scene set thumbnail=? where idscene=?';
                        var p = [url, id];
                        connection.query(q, p, function(err, info) {
                            if (err) {
                                console.log("err : " + err);
                            }
                        })
                    } else {
                        console.log('Error uploading to cloudinary: ', result);
                    }
                });
            }
        }
    });
}

module.exports = router;
