'use strict'

log = (msg) ->
  return unless console and console['log']
  console.log 'xdomain', window.location.host, ': ', msg

log "init client"

#plugin
windows  = {}

makeIFrame = (origin, remoteProxy, returnProxy) ->
  return windows[origin] if windows[origin]

  frame = document.createElement "iframe"
  id = guid()
  frame.id = id
  frame.name = id
  remote = origin + remoteProxy
  frame.src = remote
  
  win = frame.contentWindow
  $("body").append frame

  windows[origin] = win
  return win

#responder
$(window).on 'message', (event) ->
  xdomain = event.data
  id = xdomain.id
  req = $.ajax xdomain.ajax
  req.always ->
    result =
      id: id
      args: arguments
    event.source.postMessage(result, e.origin);

#caller
class AjaxCall

  frames: {}
  proxies: {}

  defaults:
    localProxy: '/xdomain/example/proxy.html'
    remoteProxy: '/xdomain/example/proxy.html'

  constructor: (@ajaxOpts, xOpts = {})->
    #check ajax opts
    unless ajaxOpts
      throw "ajax options required"
    unless ajaxOpts.url
      throw "url required"

    @url = ajaxOpts.url
    { @origin } = parseUrl @url
    unless @origin
      throw "invalid url"

    #check xdomain opts
    @opts = inherit @defaults, xOpts

    #check frame exists
    @proxy = makeIFrame @opts.localProxy, @opts.remoteProxy, @origin
    
    #create promise
    d = $.Deferred()

    id = guid()

    #fire
    t = setInterval ->
      try 
        @proxy.postMessage {
          id: id
          ajax: @ajaxOpts
        }
      catch e
        return
      clearInterval t
    , 50


    gotResult = (e) ->
      log "got result"
      d.resolve()
      $(window).off 'message', gotResult

    #wait for response
    $(window).on 'message', gotResult

    #expose promise
    @d = d.promise()


#public methods
$.xdomain = (xOpts) ->
  $.extend AjaxCall::defaults, xOpts

$.xdomain.ajax = (ajaxOpts, xOpts) ->
  x = new AjaxCall ajaxOpts, xOpts
  x.d

#helpers
guid = -> 
  (Math.random()*Math.pow(2,32)).toString(16)

parseUrl = (url) ->
  m = url.match /(https?:\/\/[^\/]+)(\/.*)/
  m and { origin: m[1], path: m[2] }

inherit = (parent, obj) ->
  F = ->
  F.prototype = parent
  $.extend true, new F(), obj