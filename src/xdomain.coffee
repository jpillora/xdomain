'use strict'


log = (msg) ->
  return unless console and console['log']
  console.log 'xdomain', window.location.host, ': ', msg

log "init"

#plugin
frames  = {}
proxies = {}

makeProxy = (returnProxy, remoteProxy, origin) ->
  return proxies[origin] if proxies[origin]

  frame = document.createElement "iframe"
  id = guid()
  frame.id = id
  frame.name = id
  remote = origin + remoteProxy
  #load remote proxy    and..            tell remote proxy where our local proxy is
  local = if returnProxy then window.location.origin + returnProxy else ''

  frame.src = remote + "#" + local
  frames[origin] = frame
  $("body").append frame




  proxies[origin] = proxy
  return proxy

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

    #generate id

    #check frame exists
    @proxy = makeProxy @opts.localProxy, @opts.remoteProxy, @origin
    

    @run()


    setTimeout =>
      log "fire!"
      @proxy.post "test"
    , 2000

  run: ->
    #create promise
    d = $.Deferred()

    #expose promise
    @d = d.promise()

#init methods

$(document).ready ->

  Porthole.WindowProxyDispatcher.start();

  #start listener
  hash = window.location.hash.substr 1
  return unless hash
  {origin,path} = parseUrl hash
  proxy = makeProxy null, path, origin
  proxy.addEventListener (a,b,c,d) ->
    console.log arguments

  setTimeout ->
    log "fire!"
    proxy.post "test"
  , 2000


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