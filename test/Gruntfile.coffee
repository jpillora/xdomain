#for running tests only!
crypto = require 'crypto'

browsers = [
    platform: "Windows 2012"
    browserName: "internet explorer"
    version: "10"
  ,
    platform: "Windows 2008"
    browserName: "internet explorer"
    version: "9"
  ,
    platform: "Windows 2003"
    browserName: "internet explorer"
    version: "8"
  ,
    browserName: 'safari'
  ,
    browserName: 'ipad'
  ,
    browserName: 'iphone'
  ,
    browserName: 'android'
  ,
    browserName: 'chrome'
  ,
    browserName: 'firefox'
]

module.exports = (grunt) ->

  grunt.loadNpmTasks 'grunt-contrib-connect'
  grunt.loadNpmTasks 'grunt-saucelabs'

  runId = process.env.TRAVIS_JOB_ID or crypto.randomBytes(4).toString('hex')

  grunt.initConfig
    # Cross-browser testing
    connect:
      server:
        options:
          keepalive: grunt.option 'keepalive'
          base: '../'
          port: 3000

    'saucelabs-mocha':
      all:
        options:
          username: process.env.SAUCELABS_USERNAME
          key: process.env.SAUCELABS_KEY
          urls: ['http://127.0.0.1:3000/test/runner.html']
          browsers: browsers
          build: runId
          testname: 'XDomain #' + runId
          concurrency: 8

  grunt.registerTask 'default', ['connect', 'saucelabs-mocha']
