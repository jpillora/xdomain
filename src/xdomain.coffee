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

#master-slave compatibility version
COMPAT_VERSION = "V0"

#helpers
guid = -> 
  (Math.random()*Math.pow(2,32)).toString(16)

parseUrl = (url) ->
  if /(https?:\/\/[^\/]+)(\/.*)?/.test(url) then {origin: RegExp.$1, path: RegExp.$2} else null

toRegExp = (obj) ->
  return obj if obj instanceof RegExp
  str = obj.toString().replace(/\W/g, (str) -> "\\#{str}").replace(/\\\*/g, ".+")
  return new RegExp "^#{str}$"

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

masters = null
addMasters = (m) ->
  if masters is null
    masters = {}
    setupReceiver()
  for origin, path of m
    masters[origin] = path
  return

setupReceiver = ->
  onMessage (event) ->
    origin = if event.origin is "null" then "*" else origin
    pathRegex = null

    for master, regex of masters
      try
        masterRegex = toRegExp master
        if masterRegex.test origin
          pathRegex = toRegExp regex
          break

    unless pathRegex
      warn "blocked request from: '#{origin}'"
      return

    frame = event.source

    #extract data
    message = getMessage event.data
    req = message.msg

    p = parseUrl req.url
    unless p and pathRegex.test p.path
      warn "blocked request to path: '#{p.path}' by regex: #{regex}"
      return

    # warn("request: #{JSON.stringify(req,null,2)}")

    proxyXhr = new XMLHttpRequest()
    proxyXhr.open req.method, req.url
    proxyXhr.onreadystatechange = ->
      return unless proxyXhr.readyState is 4
      #extract properties
      resp =
        status: proxyXhr.status
        statusText: proxyXhr.statusText
        type: "" # proxyXhr.responseType (only support text)
        # data: proxyXhr.response
        text: proxyXhr.responseText
        # xml: proxyXhr.responseXML (need a json<->xml converter...)
        headers: xhook.headers proxyXhr.getAllResponseHeaders()

      frame.postMessage setMessage({id:message.id,msg:resp}), origin
    
    for k,v of req.headers
      proxyXhr.setRequestHeader k, v

    proxyXhr.send req.body or null

  #ping master
  if window is window.parent
    warn "slaves must be in an iframe"
  else
    window.parent.postMessage "XPING_#{COMPAT_VERSION}", '*'


slaves = null
addSlaves = (s) ->
  if slaves is null
    slaves = {}
    setupSender()
  for origin, path of s
    slaves[origin] = path
  return

setupSender = ->
  #pass messages to the correct frame instance
  onMessage (e) ->
    Frame::frames[e.origin]?.recieve (e)

  #hook XHR  calls
  xhook.before (request, callback) ->

    #allow unless we have a slave domain
    p = parseUrl request.url
    unless p and slaves[p.origin]
      return callback()

    if request.async is false
      warn "sync not supported"

    #check frame exists
    frame = new Frame p.origin, slaves[p.origin]
    frame.send request, callback
    return

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
    @waiters = []
    @ready = false

  post: (msg) ->
    @frame.contentWindow.postMessage msg, @origin
    return

  #sub-events with id's
  listen: (id, callback) ->
    if @listeners[id]
      throw "already listening for: " + id
    @listeners[id] = callback
    return

  unlisten: (id) ->
    delete @listeners[id]
    return

  recieve: (event) ->
    #pong only
    if /^XPING(_(V\d+))?$/.test event.data
      if RegExp.$2 isnt COMPAT_VERSION
        warn "your master is not compatible with your slave, check your xdomain.js verison"
        return
      @ready = true
      return

    message = getMessage event.data

    #response
    cb = @listeners[message.id]
    unless cb
      warn "unkown message (#{message.id})"
      return 
    @unlisten message.id
    cb message.msg
    return

  #send with id
  send: (msg, callback) ->
    @readyCheck =>
      id = guid()
      @listen id, (data) -> callback data
      @post setMessage({id,msg})
    return

  #confirm the connection to iframe
  readyCheck: (callback) ->
    return callback() if @ready
    @waiters.push callback
    return unless @waiters.length is 1
    check = =>
      if @ready
        while @waiters.length
          @waiters.shift()()
        return
      if @waits++ >= xdomain.timeout/CHECK_INTERVAL
        throw "Timeout connecting to iframe: " + @origin
      else
        setTimeout check, CHECK_INTERVAL
    check()
    return

#public methods
xdomain = (o) ->
  return unless o
  if o.masters
    addMasters o.masters
  if o.slaves
    addSlaves o.slaves
  return

xdomain.origin = currentOrigin
xdomain.timeout = 15e3
CHECK_INTERVAL = 100

#publicise
window.xdomain = xdomain

#auto init
for script in document.getElementsByTagName("script")
  if /xdomain/.test(script.src)
    for prefix in ['','data-']
      attr = script.getAttribute prefix+'slave'
      if attr
        p = parseUrl attr
        unless p
          return 
        s = {}
        s[p.origin] = p.path
        addSlaves s
        break
      attr = script.getAttribute prefix+'master'
      if attr
        m = {}
        m[attr] = /./
        addMasters m
