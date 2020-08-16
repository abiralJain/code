const express = require('express');
const router = express.Router();
const multer = require('multer')
const UserModel = require('./users');
const passport = require('passport');
const localStrategy = require('passport-local')
const postModel = require('./post')

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/Uploads')
  },
  filename: function (req, file, cb) {
    var date = new Date();
    var filename = date.getTime() + file.originalname;
    cb(null, filename)
  }
})
 
var upload = multer({ storage: storage })

passport.use(new localStrategy(UserModel.authenticate()));

router.get('/', function(req, res, next) {
  if(req.isAuthenticated()){
    postModel.findRandom({}, {}, {limit: 3, populate: 'author'}, function(err, results){
      if(!err){
        res.render('index', {title: 'Bloggy', loggedIn: true, results: results });
      }
    });
  } 
  else {
    postModel.findRandom({}, {}, {limit: 3, populate: 'author'}, function(err, results){
      if(!err){
        res.render('index', {title: 'Bloggy', loggedIn: false, results: results });
      }
    })
  }
});



router.get('/login', function(req, res){
  res.render('login');
})

router.get('/register', function(req, res){
  res.render('register');
})

router.get('/blogs', function(req, res){
  postModel.find()
  .then(function(posts){
    res.send(posts);
  })
})

router.get('/recent/post', function(req, res){
  postModel.find()
  .then(function(Allposts){
    var data = Allposts.reverse();
    var results = data.slice(0,3);
    res.render('index', {title: 'Bloggy', loggedIn: false, results: results });
  })
})

router.get('/like/:id', isLoggedIn, function(req, res){
  UserModel.findOne({username: req.params.username})
  .then(function(loggedInUser){
    postModel.findOne({_id: req.params.id})
    .then(function(postFound){
      postFound.like.push(loggedInUser);
      postFound.save()
      .then(function(){
        req.flash('info', 'Like Added !')
        res.redirect('/')
      })
    })
  })
})

router.get('/profile', isLoggedIn,function(req, res){
  UserModel.findOne({username: req.session.passport.user})
  .populate('posts')
  .exec(function(err, data){
    res.render('profile', {details: data});
  })
})

router.get('/update', isLoggedIn,function(req, res){
  UserModel.findOne({username: req.session.passport.user})
  .then(function(foundUser){
    res.render('update', {details: foundUser})
  })
})

router.post('/update', function(req, res){
  UserModel.findOneAndUpdate({username: req.session.passport.user}, {
    name: req.body.name,
    username: req.body.username,
    email: req.body.email
  },{new: true})
  .then(function(UpdatedUser){
    res.redirect('/profile');
  })
})

router.post('/postblog', function(req, res){
  UserModel.findOne({username: req.session.passport.user})
  .then(function(foundUser){
    postModel.create({
      author: foundUser._id,
      post: req.body.post
    })
    .then(function(createdPost){
      foundUser.posts.push(createdPost);
      foundUser.save()
      .then(function(){
        res.redirect('/profile');
      })
    })
  })
})

router.post('/upload', upload.single('image'),function(req, res){
  UserModel.findOne({username: req.session.passport.user})
  .then(function(foundUser){
    foundUser.profileImage = `./images/Uploads/${req.file.filename}`
    foundUser.save()
    .then(function(){
      req.flash('status', 'Image Succesfully Uploaded !')
      res.redirect('/profile');
    })
  })
})

router.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
  failureRedirect: '/'
}),function(req, res){
})

router.post('/register', function(req, res){
  var userData = new UserModel({
    name: req.body.name,
    username: req.body.username,
    email: req.body.email
  })
  UserModel.register(userData, req.body.password)
    .then(function(registeredUser){
      passport.authenticate('local')(req, res, function(){
        res.redirect('/profile');
      })
    })
})

router.get('/logout', function(req, res){
  req.logOut();
  res.redirect('/');
})

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  } 
  else{
    req.flash('error', 'You need to login First !');
    res.redirect('/login');
  }
}

module.exports = router;
