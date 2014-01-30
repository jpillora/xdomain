
masters = null
addMasters = (m) ->
  if masters is null
    masters = {}
    initSlave()
  for origin, path of m
    masters[origin] = path
  return

initSlave = ->

  proxyXhrs = {}

  proxy = (id, msg) ->



  onMessage (event) ->
    origin = if event.origin is "null" then "*" else event.origin
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
    {id,msg} = getMessage event.data

    p = parseUrl req.url
    unless p and pathRegex.test p.path
      warn "blocked request to path: '#{p.path}' by regex: #{regex}"
      return

    emit = (event, args...) ->
      frame.postMessage setMessage([id, event].concat(args)), origin

    # warn("request: #{JSON.stringify(req,null,2)}")

    proxyXhr = new XMLHttpRequest()
    proxyXhr.open req.method, req.url

    proxyXhr.onprogress = (e) ->
      emit 'download', {loaded: e.loaded, total: e.total}

    proxyXhr.upload.onprogress = (e) ->
      emit 'upload', {loaded: e.loaded, total: e.total}

    proxyXhr.onabort = ->
      emit 'abort'

    proxyXhr.onreadystatechange = ->
      return unless proxyXhr.readyState is 4
      #extract properties
      resp =
        status: proxyXhr.status
        statusText: proxyXhr.statusText
        text: proxyXhr.responseText
        headers: xhook.headers proxyXhr.getAllResponseHeaders()
      emit 'response', resp
      
    proxyXhr.timeout = req.timeout if req.timeout

    for k,v of req.headers
      proxyXhr.setRequestHeader k, v

    proxyXhr.send req.body or null

  #ping master
  if window is window.parent
    warn "slaves must be in an iframe"
  else
    window.parent.postMessage "XDPING_#{COMPAT_VERSION}", '*'