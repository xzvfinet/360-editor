var express = require('express');
var fs = require('fs');
var connection = require('../libs/dbConnect.js').dbConnect();
var router = express.Router();

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

// read json file
router.get('/test', function(req, res){
  var data = fs.readFileSync('./uploads/test.json', 'utf8');
  var json = JSON.parse(data);
  for(var i=0; i<json.length; i++){
    console.log(json[i]);
    console.log(json[i].el);
  }
});

router.get('/:id', function(req, res){
  var id = req.params.id;
  console.log(id);
  var detailSQL = 'SELECT * FROM scene WHERE idscene=?';
  connection.query(detailSQL, id, function(err, info){
    if(err){
      res.status(500);
    }else{
      res.render('project', {result : info});
    }
  });
});

module.exports = router;
