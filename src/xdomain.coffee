'use strict'


slave = window.top isnt window

$window = $(window)

realAjax = $.ajax

PING = '__xdomain_PING'
PONG = '__xdomain_PONG'

origins = { masters: {}, slaves: {}}
frames  = {}

#listeners
listeners = {}
listen = (id, callback) ->
  if listeners[id]
    throw "already listening for: " + id
  listeners[id] = callback

unlisten = (id) ->
  delete listeners[id]

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

if slave
  recieveMessage = (jq) ->
    event = jq.originalEvent
    # console.log "slave", event.data
    origin = event.origin

    #ping only
    if event.data is PING
      event.source.postMessage PONG, origin 
      return

    message = getMessage event.data

    #security checks
    paths = origins.masters[origin]

    unless paths
      throw "Origin not allowed: " + origin

    if paths isnt '*'
      throw "Path checks not implemented"
    # url = parseUrl message.payload.url

    #proxy ajax
    realAjax(message.payload).always ->

      args = Array.prototype.slice.call(arguments)

      m = setMessage({id: message.id,args})
      event.source.postMessage m, event.origin

else
  recieveMessage = (jq) ->
    event = jq.originalEvent
    # console.log "master", event.data

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

#responder
$window.on 'message', recieveMessage

#frame
class Frame

  constructor: (@origin, path) ->
    return frames[@origin] if frames[@origin]
    @id = guid()
    @frame = document.createElement "iframe"
    @frame.id = @id
    @frame.name = @id
    @frame.src = @origin + path

    $ =>
      $("body").append $(@frame).hide()
      @win = @frame.contentWindow

    frames[@origin] = @
    @ready = false
    `undefined`

  send: (payload, callback) ->
    @check =>

      id = guid()

      listen id, (data) ->
        unlisten id
        callback data

      @win.postMessage setMessage({id,payload}), @origin

  check: (callback) ->
    return callback() if @ready
    cur = 0
    max = 3
    t = setInterval =>
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
    , 500

#caller
class AjaxCall

  constructor: (@origin, @url, @opts)->
    #check ajax opts
    proxyPath = origins.slaves[@origin]

    unless proxyPath
      throw "Missing slave origin: " + @origin

    #check frame exists
    @frame = new Frame @origin, proxyPath 
    
    #create promise
    @d = $.Deferred()
    @frame.send @opts, $.proxy @handleResponse, @
    @d.promise()

  handleResponse: (args) ->
    if args[1] is 'success'
      @d.resolve.apply @d, args
    else if args[1] is 'error'
      @d.reject.apply @d, args
    #unknown reponse...

#public methods
$.xdomain = (o) ->
  $.extend origins, o

$.ajax = (url, opts = {}) ->
  if typeof url is 'string'
    opts.url = url
  else
    opts = url
    url = opts.url

  throw "url required" unless url

  p = parseUrl url
  if p and p.origin
    ajax = new AjaxCall p.origin, url, opts
    return ajax.d

  return realAjax.call $, url, opts

