/**
 * Module dependencies.
 */
var util = require('util')
  , OAuth2Strategy = require('passport-oauth2')
  , InternalOAuthError = require('passport-oauth2').InternalOAuthError;


/**
 * `Strategy` constructor.
 *
 * The Cisco Spark authentication strategy authenticates requests by delegating to
 * Cisco Spark using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your CiscoSpark application's client id
 *   - `clientSecret`  your CiscoSpark application's client secret
 *   - `callbackURL`   URL to which CiscoSpark will redirect the user after granting authorization
 *
 * Examples:
 *
 *     passport.use(new CiscoSparkStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/spark/callback'
 *       },
 *       function(accessToken, refreshToken, profile, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = options.authorizationURL || 'https://api.ciscospark.com/v1/authorize';
  options.tokenURL = options.tokenURL || 'https://api.ciscospark.com/v1/access_token';
  // default options.scopeSeparator needs to be ' ' with Cisco Spark
  options.scopeSeparator = options.scopeSeparator || ' ';
  
  OAuth2Strategy.call(this, options, verify);
  this.name = 'cisco-spark'; 
  
  // need to set this to true so that access_token is not appended to url as query parameter
  // small f for for (careful when calling the method!!)
  this._oauth2.useAuthorizationHeaderforGET(true);
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);


/**
 * Retrieve user profile from Cisco Spark.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `cisco-spark`
 *   - `id`               the user's Cisco Spark ID
 *   - `displayName`      the user's displayName name
 *   - `emails`           the user's emails associated to Cisco Spark
 *   - `avatar`           the user's avatar (profile picture) 
 *   - `created`          date user joined Cisco Spark
 *
 * @param {String} accessToken
 * @param {Function} done
 * @api protected
 */
Strategy.prototype.userProfile = function(accessToken, done) { 
  // get user info
  this._oauth2.get('https://api.ciscospark.com/v1/people/me', accessToken, function (err, body, res) {    
    if (err) { return done(new InternalOAuthError('failed to fetch user profile', err)); }
    
    try {
      var json = JSON.parse(body);
      
      var profile = { provider: 'cisco-spark' };
      profile.id = json.id;
      profile.displayName = json.displayName;
      profile.emails = json.emails;
      profile.avatar = json.avatar;
      profile.created = json.created;
      
      profile._raw = body;
      profile._json = json;
      
      done(null, profile);
    } catch(e) {
      done(e);
    }
  });
}


/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
