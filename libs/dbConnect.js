var mysql = require('mysql');

exports.dbConnect = function() {
    return connection = mysql.createConnection({
      host    :'traverser.cc7ekyqkijfd.ap-northeast-2.rds.amazonaws.com',
      port : 3306,
      user : 'admin',
      password : 'thak1234',
      database:'traverser360'
    });
};
