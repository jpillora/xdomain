'use strict'

#commonjs/globally defined xhook
xhook = (@exports or @).xhook

#public methods
xdomain = (o) ->
  return unless o
  if o.masters
    masters o.masters
  if o.slaves
    slaves o.slaves
  return

xdomain.masters = masters
xdomain.slaves = slaves
xdomain.debug = false
xdomain.timeout = 15e3
CHECK_INTERVAL = 100
cookies = xdomain.cookies = 
  master: "Master-Cookie"
  slave: "Slave-Cookie"

document = window.document
location = window.location
currentOrigin = xdomain.origin = location.protocol + '//' + location.host

#helpers
guid = -> 'xdomain-'+Math.round(Math.random()*Math.pow(2,32)).toString(16)
slice = (o,n) -> Array::slice.call o,n
console = window.console || {}

#emitter stores handlers for 'warn' 'log' and 'timeout' events
emitter = null

setupEmitter = ->
  emitter = xhook.EventEmitter true
  xdomain.on = emitter.on
  xdomain.off = emitter.off
  return

setupEmitter() if xhook

#create a logger of type
logger = (type) ->
  (str) ->
    str = "xdomain (#{currentOrigin}): #{str}"
    #emit event
    emitter.fire type, str
    if type is 'log' and not xdomain.debug
      return
    #user provided log/warn functions
    if type of xdomain
      xdomain[type] str
    #fallback console
    else if type of console
      console[type] str
    #fallbackback alert
    else if type is 'warn'
      alert str
    return

log = logger 'log'
warn = logger 'warn'

#feature detect
for feature in ['postMessage','JSON']
  unless window[feature]
    warn "requires '#{feature}' and this browser does not support it"
    return

instOf = (obj, global) ->
  return false unless global of window
  return obj instanceof window[global]

#master-slave compatibility version
COMPAT_VERSION = "V1"

#absolute url parser (relative urls aren't crossdomain)
parseUrl = xdomain.parseUrl = (url) ->
  return if /^((https?:)?\/\/[^\/\?]+)(\/.*)?/.test(url)
    {origin: (if RegExp.$2 then '' else location.protocol)+RegExp.$1, path: RegExp.$3}
  else
    log "failed to parse absolute url: #{url}"
    null

toRegExp = (obj) ->
  return obj if obj instanceof RegExp
  str = obj.toString().replace(/\W/g, (str) -> "\\#{str}").replace(/\\\*/g, ".*")
  return new RegExp "^#{str}$"

#strip functions and objects from an object
strip = (src) ->
  dst = {}
  for k of src
    continue if k is "returnValue"
    v = src[k]
    if typeof v not in ["function","object"]
      dst[k] = v
  dst

#cookies helper (disabled - 3rd party cookie issue)
# cookies = (set, cookieString) ->
#   for c in cookieString.split /; /
#     document.cookie = c + (if set then "" else "; expires=Thu, 01 Jan 1970 00:00:00 GMT")
#   return


#auto init with attributes
(->
  attrs =
    debug: (value) ->
      return unless typeof value is "string"
      xdomain.debug = value isnt "false"
    slave: (value) ->
      return unless value
      p = parseUrl value
      return unless p
      s = {}
      s[p.origin] = p.path
      slaves s
    master: (value) ->
      return unless value
      if value is "*"
        p = {origin:"*",path:"*"}
      else
        p = parseUrl value
      return unless p
      m = {}
      m[p.origin] = if p.path.replace(/^\//,"") then p.path else "*"
      masters m

  for script in document.getElementsByTagName("script")
    if /xdomain/.test(script.src)
      for prefix in ['','data-']
        for k,fn of attrs
          fn script.getAttribute prefix+k
  return
)()
#init
startPostMessage()

#publicise (mini-umd)
if typeof @define is "function" and @define.amd
  define "xdomain", ["xhook"], (xh) ->
    #require defined xhook
    xhook = xh
    setupEmitter()
    return xdomain
else
  (@exports or @).xdomain = xdomain
