var express = require('express');
var app = express();

var session = require('express-session');
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}))
app.use(express.static('./public'));
app.set('view engine', 'ejs');
app.set('views', './views');

var server = require('http').Server(app);
// var io = require('socket.io')(server);
server.listen(8000);

var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });

var multer  = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});
var upload = multer({ storage: storage }).single('image');


const mysql = require('mysql');
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "nodejs"
});

con.connect(function(err) {
    if (err) throw err;
});

app.get('/login', function(req, res){
    if(session.id) {
        res.redirect('/');
    } else {
        res.render('login');
    }
});

app.post('/login', urlencodedParser, function(req, res){
    // res.send(req.body);
    // res.end(JSON.stringify(req.body));
    session = req.session;
    if(req.body.username == 'admin' && req.body.password == 'admin') {
        session.uid = req.body.username;
        res.redirect('/');
    }else{
        res.redirect('/login');
    }
});

app.get('/logout', function(req, res){
    req.session.destroy();
    res.redirect('/login');
});

app.get('/', function(req, res){
    // session = req.session;
    // if(session.uid) {
        con.query("SELECT * FROM video", function (err, result, fields) {
            if (err) throw err;

            res.render('home', {data:result});
        });
    // } else {
    //     res.redirect('/login');
    // }
});

app.get('/video/list', function(req, res){
    con.query("SELECT * FROM video", function (err, result, fields) {
        if (err) throw err;

        res.render('list', {data:result});
    });
});

app.get('/delete/:id', function(req, res){
    var id = req.params.id;

    con.query("DELETE FROM video WHERE id = ? ", [id], function (err, result, fields) {
        if (err) throw err;

        res.redirect('/video/list');
    });
});

app.get('/video/add', function(req, res){
    res.render('add');
});

app.post('/video/add', urlencodedParser, function(req, res){
    upload(req, res, function (err) {
        if (err) throw err;
        console.log(req.body);
        con.query("INSERT INTO video (title, link, image, content) VALUES ('"+ req.body.title +"', '"+ req.body.link +"', '"+ req.file.originalname +"', '"+ req.body.content +"')", function (err, result, fields) {
            if (err) throw err;

            res.redirect('/video/list');
        });
    })
});
