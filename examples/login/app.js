var express = require('express'),
    session = require('express-session'),
    passport = require('passport'),
      
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    logger = require('morgan');
    util = require('util'),
    CiscoSparkStrategy = require('passport-cisco-spark').Strategy;

// Client Id and Client Secret can be obtained at https://developer.ciscospark.com
var CISCO_SPARK_CLIENT_ID = "---your Cisco Spark Client Id---";
var CISCO_SPARK_CLIENT_SECRET = "---your Cisco Spark Client Secret---";

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Cisco Spark profile is
//   serialized and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done){
  done(null, obj);
});


// Use the SparkStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Spark
//   profile), and invoke a callback with a user object.
passport.use(new CiscoSparkStrategy({
    clientID: CISCO_SPARK_CLIENT_ID,
    clientSecret: CISCO_SPARK_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/spark/callback",
    scope: [
        'spark:rooms_read',
        'spark:memberships_read',
        'spark:messages_write',
        'spark:rooms_write',
        'spark:people_read',
        'spark:memberships_write'
    ]
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(accessToken);
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // To keep the example simple, the user's Cisco Spark profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Cisco Spark account with a user record in your database,
      // and return that user instead.      
      return done(null, profile);
    });
  }
));


var app = express();

// configure Express
// app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cookieParser());  
  app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
  
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.static(__dirname + '/public'));
// });


app.get('/', function(req, res) {
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

// app.get('/protected', function(req, res, next) {
//   passport.authenticate('local', function(err, user, info){
//     if (err) { return next(err) }
//     if (!user) { return res.redirect('/signin') }
//     res.redirect('/account');
//   })(req, res, next);
// });

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

// GET /auth/spark
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Cisco Spark authentication will involve
//   redirecting the user to ciscospark.com (https://api.ciscospark.com/v1/authorize).  After authorization, Cisco Spark
//   will redirect the user back to this application at /auth/spark/callback
app.get('/auth/spark',
  passport.authenticate('cisco-spark'),
  function(req, res) {
    // The request will be redirected to Cisco Spark for authentication, so this
    // function will not be called.
  });

// GET /auth/spark/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/spark/callback', 
  passport.authenticate('cisco-spark', {
    failureRedirect: '/login',
    successRedirect: '/account' 
  }));

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.listen(3000);


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}
