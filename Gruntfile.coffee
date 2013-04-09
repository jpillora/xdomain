fs = require("fs")

#global module:false
module.exports = (grunt) ->
  
  pkg = grunt.file.readJSON "package.json"

  # Project configuration.
  grunt.initConfig
    pkg: pkg

    banner: 
      "/** <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today(\"yyyy/mm/dd\") %>\n"+
      " * <%= pkg.homepage %>\n" +
      " * Copyright (c) <%= grunt.template.today(\"yyyy\") %> <%= pkg.author.name %> - MIT\n"+
      " */\n"


    coffee:
      compile:
        files:
          'dist/<%= pkg.name %>.js': 'src/<%= pkg.name %>.coffee'
          # 'test/tests/*.js': 'test/tests/*.coffee'

    concat:
      dist:
        src: [
          # "src/lib/porthole.js"
          "dist/<%= pkg.name %>.js"
        ]
        dest: "dist/<%= pkg.name %>.js"

    wrap: 
      dist: 
        src: ['dist/*.js']
        dest: '.'
        wrapper: ["<%= banner %>\n(function(window,document,undefined) {\n","\n}(window,document));"]
    
    uglify:
      options: 
        stripBanners: false
        banner: "<%= banner %>"

      dist:
        src: "dist/<%= pkg.name %>.js"
        dest: "dist/<%= pkg.name %>.min.js"

    watch:
      scripts:
        files: 'src/**/*.coffee'
        tasks: 'default'
        options:
          interval: 5000

  grunt.loadNpmTasks "grunt-contrib-coffee"
  grunt.loadNpmTasks "grunt-contrib-concat"
  grunt.loadNpmTasks "grunt-contrib-jshint"
  grunt.loadNpmTasks "grunt-contrib-watch"
  grunt.loadNpmTasks "grunt-contrib-uglify"
  grunt.loadNpmTasks "grunt-wrap"
  
  # Default task
  grunt.registerTask "default", ["coffee","concat","wrap","uglify"]


#END CONFIG

# Sample task
# fetchUrl = require("fetch").fetchUrl
# grunt.registerMultiTask "webget", "Web get stuff.", ->
#   done = @async()
#   name = @target
#   src = @data.src
#   dest = @data.dest
#   grunt.log.writeln "Web Getting: '" + name + "'"
#   fetchUrl src, (error, meta, body) ->
#     if error
#       grunt.log.writeln "Error: '" + error + "'"
#       done false
#       return
#     grunt.log.writeln "Saved: '" + src + "' as '" + dest + "'"
#     fs.writeFileSync dest, body
#     done true

# Sample task usage
# webget:
#   prompt:
#     src: "http://jpillora.github.com/jquery.prompt/dist/jquery.prompt.js"
#     dest: "src/vendor/jquery.prompt.js"
#   console:
#     src: "http://jpillora.github.com/jquery.console/jquery.console.js"
#     dest: "src/vendor/jquery.console.js"
