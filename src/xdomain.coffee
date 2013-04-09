'use strict'

#plugin
class XDomain

  frames: {}

  defaults: 
    proxyPath: '/xdomain.html'

  constructor: (@ajaxOpts, xOpts = {})->
    #check ajax opts
    unless ajaxOpts
      throw "ajax options required"
    unless ajaxOpts.url
      throw "url required"

    @url = ajaxOpts.url
    m = @url.match /https?:\/\/[^\/]+/
    unless m
      throw "invalid url"
    @origin = m[0]

    console.log "origin", @origin 


    #check xdomain opts
    @opts = inherit @defaults, xOpts

    #generate id
    @id = guid()

    #check frame exists
    @checkFrame()

    @run()

    #get or create+cache frames



  checkFrame: ->
    return if @frames[@origin]
    frame = document.createElement "iframe"
    frame.id = @origin
    frame.name = @origin
    frame.src = @origin + @opts.proxyPath
    @frames[@origin] = frame
    $("body").append frame

  run: ->
    #create promise
    d = $.Deferred()

    #expose promise
    @d = d.promise()

#public methods
$.xdomain = (xOpts) ->
  $.extend XDomain::defaults, xOpts

$.xdomain.ajax = (ajaxOpts, xOpts) ->
  x = new XDomain ajaxOpts, xOpts
  x.d

#helpers
guid = -> 
  (Math.random()*Math.pow(2,32)).toString(16)

inherit = (parent, obj) ->
  F = ->
  F.prototype = parent
  $.extend true, new F(), obj