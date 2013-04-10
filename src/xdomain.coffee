'use strict'

log = (msg) ->
  return unless console and console['log']
  console.log 'xdomain', window.location.host, ': ', msg

log "init client"

slave = window.top isnt window

$window = $(window)

PING = '__xdomain_PING'
PONG = '__xdomain_PONG'

origins = {}
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
  # JSON.stringify
  obj

getMessage = (obj) ->
  # JSON.parse
  obj


if slave
  recieveMessage = (jq) ->
    event = jq.originalEvent
    message = getMessage event.data
    console.log "slave", message

    if message is PING
      event.source.postMessage PONG, event.origin
      return

    id = message.id
    #proxy ajax
    $.ajax(message.payload).always (data, result, xhr) ->
      #respond back
      args = {data, result}
      event.source.postMessage {id,args}, event.origin
else
  recieveMessage = (jq) ->
    event = jq.originalEvent
    message = getMessage event.data
    console.log "master", message

    if message is PONG
      frames[event.origin].ready = true
      return

    id = message.id
    #response
    callback = listeners[id]
    return unless callback
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

      @win.postMessage {id,payload}, @origin

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
        console.log e.toString()
    , 500

#caller
class AjaxCall

  frames: {}
  proxies: {}

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

    proxyPath = origins[@origin]

    unless proxyPath
      throw "missing origin: " + @origin 

    #check xdomain opts
    @opts = inherit @defaults, xOpts

    #check frame exists
    @frame = new Frame @origin, proxyPath 
    
    #create promise

    @d = $.Deferred()

    @frame.send @ajaxOpts, (result) =>
      @d.resolve result

    @d.promise()

#public methods
$.xdomain = (o) ->
  $.extend origins, o

$.xdomain.ajax = (ajaxOpts, xOpts) ->
  ajax = new AjaxCall ajaxOpts, xOpts
  ajax.d
