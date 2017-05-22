var express = require('express');
var path = require('path');
var router = express.Router();

router.get('/', function(req, res){
  res.render('index', {background: '', title : "Express" });
})

router.get('/login', function(req, res){
    res.render('login');
});

router.post('/login', function(req, res){
  var email = req.body.email;
  var pwd = req.body.pwd;

  console.log(email + ", " + pwd);
  res.render('index');
});

router.get('/signup', function(req, res){
  res.render('signup');
});

router.post('/signup', function(req, res){
  var email = req.body.email;
  var pwd = req.body.pwd;
  var cpwd = req.body.cpwd;

  console.log(email + ", " + pwd + ", " + cpwd);
  res.render('index');
});

module.exports = router;
