'use strict'

#variables
$window = $(window)
realAjax = $.ajax
PING = '__xdomain_PING'
PONG = '__xdomain_PONG'
origins = { masters: {}, slaves: {}}
frames  = {}

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

setupSlave = ->

  check = (masterOrigin) ->
    proxy = origins.masters[masterOrigin]
    unless proxy
      throw "Origin not allowed: " + masterOrigin
    proxy

  mOrigin = hashMatch[2]

  parentProxyPath = check mOrigin
  
  proxy = new Porthole.WindowProxy parentProxyPath
  proxy.addEventListener (event) ->

    #ping only
    if event.data is PING
      proxy.post PONG, event.origin 
      return

    #extract data
    message = getMessage event.data

    #security checks
    check event.origin
    
    #proxy ajax
    realAjax(message.payload).always ->
      args = Array.prototype.slice.call(arguments)

      m = setMessage({id: message.id,args})
      proxy.post m, event.origin









#frame
class Frame

  constructor: (@origin) ->
    return frames[@origin] if frames[@origin]

    @proxyPath = origins.slaves[origin]

    unless @proxyPath
      throw "Missing slave origin: " + @origin

    @listeners = {}

    @id = guid()
    @frame = document.createElement "iframe"
    @frame.id = @id
    @frame.name = @id
    @frame.src = @origin + @proxyPath
    frames[@origin] = @
    @ready = false

    getReady

    `undefined`




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
    #pong only
    if event.data is PONG
      frames[event.origin].ready = true
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
    @check =>
      id = guid()
      @listen id, (data) -> callback data
      @win.postMessage setMessage({id,payload}), @origin

  check: (callback) ->
    return callback() if @ready
    setTimeout =>
      @check callback
    , 500

    pingPong = =>
      if @ready
        clearInterval t
        callback()
        return
      try
        @win.postMessage PING, @origin
      catch e
        if cur++ >= max
          clearInterval t
          throw "timeout"
      `undefined`

    loadProxy = =>
      $("body").append $(@frame).hide()

      @proxy = new Porthole.WindowProxy(target+path, 'guestFrame');
      @win = @frame.contentWindow
      t = setInterval pingPong, 500

    $ loadProxy

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
  frame = new Frame origin
  
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
hashMatch = hash.match /^XDOMAIN_([A-Z]+)(=(.*))?$/

type = 'MASTER'
type = hashMatch[1] if hashMatch

console.log location.origin, type

#type setups
if type is 'RELAY'
  Porthole.WindowProxyDispatcher.start()
else if type is 'SLAVE'
  $ setupSlave
else if type is 'MASTER'
  
else
  console.warn location.origin, 'unknown type', type

  

