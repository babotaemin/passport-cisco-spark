var vows = require('vows');
var assert = require('assert');

var util = require('util');
var CiscoSparkStrategy = require('../lib/strategy');


vows.describe('CiscoSparkStrategy').addBatch({
  
  'strategy': {
    topic: function() {
      return new CiscoSparkStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});
    },
    
    'should be named cisco-spark': function (strategy) {
      assert.equal(strategy.name, 'cisco-spark');
    },
    
    'should request use of auth header for GET requests': function (strategy) {
      assert.equal(strategy._oauth2._useAuthorizationHeaderForGET, true);
    },
  },
  
  'strategy when loading user profile': {
    topic: function() {
      var strategy = new CiscoSparkStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});
      
      // mock
      strategy._oauth2.get = function(url, accessToken, callback) {
        var body = '{"id": "1574083", "displayName": "snoopdogg","avatar": "http://distillery.s3.amazonaws.com/profiles/profile_1574083_75sq_1295469061.jpg", "emails": [ "a@gmail.com", "b@gmail.com" ], "created": "2015-07-15T15:48:58.260Z" }';
        callback(null, body, undefined);
      }
      
      return strategy;
    },
    
    'when told to load user profile': {
      topic: function(strategy) {
        var self = this;
        function done(err, profile) {
          self.callback(err, profile);
        }
        
        process.nextTick(function () {
          strategy.userProfile('access-token', done);
        });
      },
      
      'should not error' : function(err, req) {
        assert.isNull(err);
      },
      'should load profile' : function(err, profile) {
        assert.equal(profile.provider, 'cisco-spark');
        assert.equal(profile.id, '1574083');
        assert.equal(profile.displayName, 'snoopdogg');
        assert.equal(profile.avatar, 'http://distillery.s3.amazonaws.com/profiles/profile_1574083_75sq_1295469061.jpg');
        assert.deepEqual(profile.emails, [ 'a@gmail.com', 'b@gmail.com' ]);
        assert.equal(profile.created, '2015-07-15T15:48:58.260Z');
      },
      'should set raw property' : function(err, profile) {
        assert.isString(profile._raw);
      },
      'should set json property' : function(err, profile) {
        assert.isObject(profile._json);
      },
    },
  },
  
  'strategy when loading user profile and encountering an error': {
    topic: function() {
      var strategy = new CiscoSparkStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});
      
      // mock
      strategy._oauth2.get = function(url, accessToken, callback) {
        callback(new Error('something-went-wrong'));
      }
      
      return strategy;
    },
    
    'when told to load user profile': {
      topic: function(strategy) {
        var self = this;
        function done(err, profile) {
          self.callback(err, profile);
        }
        
        process.nextTick(function () {
          strategy.userProfile('access-token', done);
        });
      },
      
      'should error' : function(err, req) {
        assert.isNotNull(err);
      },
      'should wrap error in InternalOAuthError' : function(err, req) {
        assert.equal(err.constructor.name, 'InternalOAuthError');
      },
      'should not load profile' : function(err, profile) {
        assert.isUndefined(profile);
      },
    },
  },
  
}).export(module);
