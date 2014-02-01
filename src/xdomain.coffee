'use strict'

currentOrigin = location.protocol + '//' + location.host

#helpers
guid = -> 'xdomain-'+Math.round(Math.random()*Math.pow(2,32)).toString(16)
slice = (o,n) -> Array::slice.call o,n

prep = (s) ->
  "xdomain (#{currentOrigin}): #{s}"

console = window.console || {}

log = (str) ->
  return unless xdomain.debug
  str = prep str
  if 'log' of console
    console.log str
  return

warn = (str) ->
  str = prep str
  if 'warn' of console
    console.warn str
  else
    alert str
  return

#feature detect
for feature in ['postMessage','JSON']
  unless window[feature]
    warn "requires '#{feature}' and this browser does not support it"
    return

instOf = (obj, global) ->
  return false unless typeof window[global] is "function"
  return obj instanceof window[global]

#master-slave compatibility version
COMPAT_VERSION = "V1"

parseUrl = (url) ->
  return if /(https?:\/\/[^\/\?]+)(\/.*)?/.test(url)
    {origin: RegExp.$1, path: RegExp.$2}
  else
    log "failed to parse url: #{url}"
    null

toRegExp = (obj) ->
  return obj if obj instanceof RegExp
  str = obj.toString().replace(/\W/g, (str) -> "\\#{str}").replace(/\\\*/g, ".+")
  return new RegExp "^#{str}$"

strip = (src) ->
  dst = {}
  for k of src
    continue if k is "returnValue"
    v = src[k]
    if typeof v not in ["function","object"]
      dst[k] = v
  dst

#public methods
xdomain = (o) ->
  return unless o
  if o.masters
    addMasters o.masters
  if o.slaves
    addSlaves o.slaves
  return

xdomain.debug = false
xdomain.masters = addMasters
xdomain.slaves = addSlaves
xdomain.parseUrl = parseUrl
xdomain.origin = currentOrigin
xdomain.timeout = 15e3
CHECK_INTERVAL = 100

#publicise
window.xdomain = xdomain

#auto init with attributes
attrs =
  slave: (value) ->
    p = parseUrl value
    return unless p
    s = {}
    s[p.origin] = p.path
    addSlaves s
  master: (value) ->
    return unless value
    m = {}
    m[value] = /./
    addMasters m
  debug: (value) ->
    return unless typeof value is "string"
    xdomain.debug = value isnt "false"

for script in document.getElementsByTagName("script")
  if /xdomain/.test(script.src)
    for prefix in ['','data-']
      for k,fn of attrs
        fn script.getAttribute prefix+k

#init
startPostMessage()

