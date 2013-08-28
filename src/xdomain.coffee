'use strict'

currentOrigin = location.protocol + '//' + location.host

warn = (str) ->
  str = "xdomain (#{currentOrigin}): #{str}"
  if console['warn']
    console.warn str
  else
    alert str

#feature detect
for feature in ['postMessage','JSON']
  unless window[feature]
    warn "requires '#{feature}' and this browser does not support it"
    return

#variables
PING = 'XPING'

#helpers
guid = -> 
  (Math.random()*Math.pow(2,32)).toString(16)

parseUrl = (url) ->
  if /(https?:\/\/[^\/]+)(\/.*)?/.test(url) then {origin: RegExp.$1, path: RegExp.$2} else null

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
    origin = event.origin

    regex = masters[origin] or masters['*']
    #ignore non-whitelisted domains
    unless regex
      warn "blocked request from: '#{origin}'"
      return

    frame = event.source

    #extract data
    message = getMessage event.data
    req = message.req

    if regex and regex.test and req
      p = parseUrl req.url
      if not regex.test p.path
        warn "blocked request to path: '#{p.path}' by regex: #{regex}"
        return

    # warn("request: #{JSON.stringify(req,null,2)}")

    proxyXhr = new XMLHttpRequest();
    proxyXhr.open(req.method, req.url);
    proxyXhr.onreadystatechange = ->
      return unless proxyXhr.readyState is 4
      #extract properties
      res = { props: {} }
      for p in xhook.PROPS by -1
        res.props[p] = proxyXhr[p]
      #and response headers
      res.responseHeaders = xhook.headers proxyXhr.getAllResponseHeaders()
      m = setMessage {id: message.id, res}
      frame.postMessage m, origin
    for k,v of req.requestHeaders
      proxyXhr.setRequestHeader k, v
    proxyXhr.send();

  #ping master
  window.parent.postMessage PING, '*'

setupMaster = (slaves) ->
  #pass messages to the correct frame instance
  onMessage (e) ->
    Frame::frames[e.origin]?.recieve (e)

  #hook XHR  calls
  xhook (xhr) ->

    xhr.onCall 'open', (args) ->
      #allow unless we have a slave domain
      p = parseUrl args[1]
      unless p and slaves[p.origin]
        return

      if args[2] is false
        warn "sync not supported" 
      #trigger openned 
      setTimeout -> xhr.set 'readyState', 1
      return false

    xhr.onCall 'send', ->
      #allow unless we have a slave domain
      p = parseUrl xhr.url
      unless p and slaves[p.origin]
        return

      #check frame exists
      frame = new Frame p.origin, slaves[p.origin]
      
      frame.send xhr.serialize(), (res) ->
        # warn("response: #{JSON.stringify(res,null,2)}")
        xhr.deserialize(res)

      #cancel original call
      return false

  

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
    @frame.setAttribute 'style', 'display:none;'

    document.body.appendChild @frame

    @waits = 0
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
    if event.data is PING
      @ready = true
      return

    message = getMessage event.data

    #response
    cb = @listeners[message.id]
    unless cb
      warn "unkown message (#{message.id})"
      return 
    @unlisten message.id
    cb message.res

  #send with id
  send: (req, callback) ->
    @readyCheck =>
      id = guid()
      @listen id, (data) -> callback data
      @post setMessage({id,req})

  #confirm the connection to iframe
  readyCheck: (callback) ->
    if @ready is true
      return callback()

    if @waits++ >= 100 # 10.0 seconds
      throw "Timeout connecting to iframe: " + @origin

    setTimeout =>
      @readyCheck callback
    , 100

#public methods
window.xdomain = (o) ->
  return unless o
  if o.masters
    setupSlave o.masters
  if o.slaves
    setupMaster o.slaves

xdomain.origin = currentOrigin

#auto init
for script in document.getElementsByTagName("script")
  if /xdomain/.test(script.src)
    if script.hasAttribute 'slave'
      p = parseUrl script.getAttribute 'slave'
      return unless p
      slaves = {}
      slaves[p.origin] = p.path
      xdomain { slaves }
    if script.hasAttribute 'master'
      p = parseUrl script.getAttribute 'master'
      return unless p
      masters = {}
      masters[p.origin] = /./
      xdomain { masters }
