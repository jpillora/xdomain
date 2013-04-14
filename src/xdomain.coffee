'use strict'

#variables
$window = $(window)
realAjax = $.ajax
PING = '__xdomain_PING'
PONG = '__xdomain_PONG'
RELAY = '#XDOMAIN_RELAY.'
origins = { masters: {}, slaves: {}}

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

  check = ->
    p = origins.masters[masterOrigin]
    unless p
      throw "Origin not allowed: " + masterOrigin
    p

  parentProxyPath = check()

  proxySrc = masterOrigin+parentProxyPath + RELAY

  console.log location.origin, proxySrc

  proxy = new Porthole.WindowProxy proxySrc
  proxy.addEventListener (event) ->

    console.log location.origin, 'recieve', event.data

    #ping only
    if event.data is PING
      proxy.post PONG
      console.log location.origin, 'PONG'
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

  console.log location.origin, 'SLAVE SETUP'
  window.PROXY = proxy

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

    console.log location.origin, type, proxySrc

    $ =>
      @domReady = true
      console.log location.origin, type, 'dom ready'
      $("body").append $(@frame).hide()
      @proxy = new Porthole.WindowProxy proxySrc + RELAY, id
      @proxy.addEventListener $.proxy @recieve, @

  #sub-events with id's
  listen: (id, callback) ->
    if @listeners[id]
      throw "already listening for: " + id
    @listeners[id] = =>
      @unlisten id
      callback()

  unlisten: (id) ->
    delete @listeners[id]

  recieve: (event) ->
    console.log location.origin, 'recieve', event.data
    #pong only
    if event.data is PONG
      @ready = true
      return

    message = getMessage event.data
    #response
    callback = listeners[message.id]
    unless callback
      console.warn "missing id", message.id
      return 
    callback message.args

  #send with id
  send: (payload, callback) ->
    console.log location.origin, 'send', payload
    @pingPong =>
      id = guid()
      @listen id, (data) -> callback data
      @proxy.post setMessage({id,payload}), @origin

  pingPong: (callback) ->
    if @ready
      callback()
      return

    if @proxy
      @proxy.post PING
    if @pingPong.attempts++ >= 3
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
  throw "url invalid" unless p

  # $.ajax if origin not listed
  unless origins.slaves[p.origin]
    return realAjax.call $, url, opts

  #check frame exists
  frame = new Frame p.origin
  
  #create promise
  d = $.Deferred()

  frame.send opts, (args) ->
    if args[1] is 'success'
      d.resolve.apply d, args
    else if args[1] is 'error'
      d.reject.apply d, args

  d.promise()

#type check and setup
hash = decodeURIComponent location.hash.substr 1
hashMatch = hash.match /^XDOMAIN_([A-Z]+)\.#?(.*)?/

type = 'MASTER'
if hashMatch
  type = hashMatch[1]

#type setups
if type is 'RELAY'
  location.hash = hashMatch[2] if hashMatch[2]
  Porthole.WindowProxyDispatcher.start()
else if type is 'SLAVE'
  $ -> setupSlave hashMatch[2]
else if type is 'MASTER'
else
  console.warn location.origin, 'unknown type', type

  
console.log '>>>>', location.origin, hash, location.hash, type
window.Frame = Frame

