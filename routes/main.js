var express = require('express');
var path = require('path');
var connection = require('../libs/dbConnect.js').dbConnect();
var router = express.Router();

router.get('/', function(req, res){
  if(req.session.userID==null){
    res.render('index', {user : -1, title : "Traverser360" });
  }else {
    res.render('index', {user : req.session, title : "Traverser360" });
  }
})

router.get('/login', function(req, res){
    res.render('login', {login : 0, user : -1});
});

router.get('/logout', function(req, res){
  req.session.destroy();
  res.redirect('/');
});

router.post('/login', function(req, res){
  var email = req.body.email;
  var pwd = req.body.pwd;
  var query = "select * from user where email=?";

  connection.query(query, email, function (error, info) {
      if(error) {
        console.log("error : " + error);
          res.render('login', {login : -1, user : -1});
      } else {
        if(info[0]==null){
          res.render('login', {login : -1, user : -1});
        }else{
          if(pwd==info[0].password){
            req.session.userID = info[0].iduser;
            req.session.name = (info[0].email).split("@")[0];
            res.render('index', {user : req.session});
          }else{
            res.render('login', {login : -1, user : -1});
          }
        }
      }
  });
});

router.get('/signup', function(req, res){
  res.render('signup', {user : -1});
});

router.post('/signup', function(req, res){
  var email = req.body.email;
  var pwd = req.body.pwd;
  var cpwd = req.body.cpwd;

  console.log(email + ", " + pwd + ", " + cpwd);
  res.render('index');
});

module.exports = router;
