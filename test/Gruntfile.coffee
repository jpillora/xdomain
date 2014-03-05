#for running tests only!

crypto = require 'crypto'

module.exports = (grunt) ->

  grunt.loadNpmTasks 'grunt-contrib-connect'
  grunt.loadNpmTasks 'grunt-saucelabs'

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
          username: 'jpillora-xdomain'
          key: '245c03d5-d041-446d-b7b9-d7b2a9a08890'
          urls: ['http://127.0.0.1:3000/test/runner.html']
          browsers: [
            browserName: 'googlechrome'
          ,
            browserName: 'firefox'
          ,
            browserName: 'safari'
            version: '6'
          ,
            browserName: 'safari'
            version: '5'
          ,
            browserName: 'opera'
            version: '12'
          ,
            browserName: 'internet explorer'
            version: '10'
          ,
            browserName: 'internet explorer'
            version: '9'
          ,
            browserName: 'internet explorer'
            version: '8'
          ]
          build: process.env.TRAVIS_JOB_ID or crypto.randomBytes(4).toString('hex')
          testname: 'XDomain Cross Browser Tests'
          concurrency: 8

  grunt.registerTask 'default', ['connect', 'saucelabs-mocha']