'use strict'

log = (str) ->
  return if window.console is `undefined`
  console.log "xdomain (#{location.protocol + '//' + location.host}): #{str}"

#feature detect
for feature in ['postMessage','JSON']
  unless window[feature]
    log "requires '#{feature}' and this browser does not support it"
    return

#variables
$window = $(window)
realAjax = $.ajax
PING = '__xdomain_PING'
PONG = '__xdomain_PONG'

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
onMessage = (fn) ->
  if document.addEventListener
    window.addEventListener "message", fn
  else
    window.attachEvent "onmessage", fn

setMessage = (obj) ->
  JSON.stringify obj

getMessage = (str) ->
  JSON.parse str

setupSlave = (masters) ->
  onMessage (event) ->
    regex = masters[event.origin]
    #ignore non-whitelisted domains
    unless regex
      log "blocked request from: '#{event.origin}'"
      return

    #ping only
    if event.data is PING
      event.source.postMessage PONG, event.origin
      return

    #extract data
    message = getMessage event.data

    if regex.test
      p = parseUrl message.payload?.url
      if p and not regex.test p.path
        log "blocked request to path: '#{p.path}' by regex: #{regex}"
        return
    
    #proxy ajax
    realAjax(message.payload).always ->
      args = Array.prototype.slice.call(arguments)

      m = setMessage({id: message.id,args})
      event.source.postMessage m, event.origin

setupMaster = (slaves) ->
  #pass messages to the correct frame instance
  onMessage (e) ->
    frame = Frame::frames[event.origin]
    if frame
      frame.recieve (e)

  #monkey patch $.ajax
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
    unless p and slaves[p.origin]
      return realAjax.call $, url, opts

    #check frame exists
    frame = new Frame p.origin, slaves[p.origin]
    
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

#frame
class Frame

  frames: {}

  constructor: (@origin, @proxyPath) ->
    #cache origin
    return @frames[@origin] if @frames[@origin]

    @frames[@origin] = @
    @listeners = {}

    @frame = document.createElement "iframe"
    @frame.id = @frame.name = 'xdomain-'+guid()
    @frame.src = @origin + @proxyPath
    $ => $("body").append $(@frame).hide()

    @pingPong.attempts = 0
    @ready = false

  post: (msg) ->
    @frame.contentWindow.postMessage msg, @origin

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
      @listen id, (data) -> callback data
      @post setMessage({id,payload})

  #confirm the connection to iframe
  pingPong: (callback) ->
    if @ready is true
      return callback()
    #ping frame
    try
      @post PING
    catch e

    if @pingPong.attempts++ >= 10
      throw "Timeout connecting to iframe: " + @origin
    setTimeout =>
      @pingPong callback
    , 500

#public methods
$.xdomain = (o) ->
  return unless o
  if o.masters
    setupSlave o.masters
  if o.slaves
    setupMaster o.slaves
