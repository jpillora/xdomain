'use strict'

#variables
$window = $(window)
realAjax = $.ajax
PING = '__xdomain_PING'
PONG = '__xdomain_PONG'
origins = { masters: {}, slaves: {}}

#missing origin
unless location.origin
  location.origin = location.protocol + '//' + location.host

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

#message helpers
setMessage = (obj) ->
  JSON.stringify obj

getMessage = (obj) ->
  JSON.parse obj

setupSlave = (masterOrigin) ->

  parentProxyPath = origins.masters[masterOrigin]
  unless parentProxyPath
    throw "Origin not allowed: " + masterOrigin

  proxySrc = masterOrigin+parentProxyPath

  proxy = new Porthole.WindowProxy proxySrc
  proxy.addEventListener (event) ->

    #ping only
    if event.data is PING
      proxy.post PONG, masterOrigin
      return

    #extract data
    message = getMessage event.data

    #security checks
    throw "Origin mismatch" if event.origin isnt masterOrigin
    
    #proxy ajax
    realAjax(message.payload).always ->
      args = Array.prototype.slice.call(arguments)

      m = setMessage({id: message.id,args})
      proxy.post m, event.origin

  window["windowProxy#{guid()}"] = proxy

#frame
class Frame

  frames: {}

  constructor: (@origin) ->
    #cache origin
    return @frames[@origin] if @frames[@origin]
    @frames[@origin] = @

    @proxyPath = origins.slaves[origin]

    unless @proxyPath
      throw "Missing slave origin: " + @origin

    @listeners = {}

    id = guid()
    @frame = document.createElement "iframe"
    @frame.id = @frame.name = id

    proxySrc = @origin + @proxyPath
    @frame.src = proxySrc + '#'+encodeURIComponent 'XDOMAIN_SLAVE.'+location.origin
    @pingPong.attempts = 0
    @ready = @domReady = false

    $ =>
      $("body").append $(@frame).hide()
      @proxy = new Porthole.WindowProxy proxySrc, id
      @proxy.addEventListener $.proxy @recieve, @
      window["windowProxy#{id}"] = @proxy

  #sub-events with id's
  listen: (id, callback) ->
    if @listeners[id]
      throw "already listening for: " + id
    @listeners[id] = callback

  unlisten: (id) ->
    delete @listeners[id]

  recieve: (event) ->
    #pong only
    if event.data is PONG
      @ready = true
      return

    message = getMessage event.data

    #response
    cb = @listeners[message.id]
    unless cb
      console.warn "missing id", message.id
      return 
    @unlisten message.id
    cb message.args

  #send with id
  send: (payload, callback) ->
    @pingPong =>
      id = guid()
      @listen id, (data) -> 
        callback data
      @proxy.post setMessage({id,payload}), @origin

  pingPong: (callback) ->
    if @ready
      callback()
      return

    if @proxy
      @proxy.post PING, @origin
    if @pingPong.attempts++ >= 10
      throw "Timeout connecting to iframe: " + @origin

    setTimeout =>
      @pingPong callback
    , 500

#public methods
$.xdomain = (o) ->
  $.extend origins, o

$.ajax = (url, opts = {}) ->
  #check ajax opts
  if typeof url is 'string'
    opts.url = url
  else
    opts = url
    url = opts.url

  throw "url required" unless url

  p = parseUrl url
  # $.ajax if origin not listed
  unless p and origins.slaves[p.origin]
    return realAjax.call $, url, opts

  #check frame exists
  frame = new Frame p.origin
  
  #create promise
  d = $.Deferred()

  d.done opts.success if typeof opts.success is 'function'
  d.fail opts.error if typeof opts.error is 'function'
  d.always opts.complete if typeof opts.complete is 'function'

  frame.send opts, (args) ->
    if args[1] is 'success'
      d.resolve.apply d, args
    else if args[1] is 'error'
      d.reject.apply d, args

  d.promise()
  
#type check and setup
hash = decodeURIComponent location.hash.substr 1
hashMatch = hash.match /^XDOMAIN_([A-Z]+)\.#?(.*)?/

#type setups
if hashMatch and hashMatch[1] is 'SLAVE'
  $ -> setupSlave hashMatch[2]

#relay
$ -> Porthole.WindowProxyDispatcher.start()
