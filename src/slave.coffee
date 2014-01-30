
masters = null
addMasters = (m) ->
  if masters is null
    masters = {}
    initSlave()
  for origin, path of m
    masters[origin] = path
  return

initSlave = ->
  listen (origin, socket) ->
    origin = "*" if origin is "null"
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

    socket.once "request", (req) ->
      log "request: #{req.method} #{req.url}"

      p = parseUrl req.url
      unless p and pathRegex.test p.path
        warn "blocked request to path: '#{p.path}' by regex: #{regex}"
        socket.close()
        return

      xhr = new XMLHttpRequest()
      xhr.open req.method, req.url

      xhr.addEventListener "*", (e) ->
        socket.emit 'xhr-event', e.type, strip e

      if xhr.upload
        xhr.upload.addEventListener "*", (e) ->
          socket.emit 'xhr-upload-event', e.type, strip e

      xhr.onabort = ->
        socket.emit 'abort'

      xhr.onreadystatechange = ->
        return unless xhr.readyState is 4
        #extract properties
        resp =
          status: xhr.status
          statusText: xhr.statusText
          data: xhr.response
          headers: xhook.headers xhr.getAllResponseHeaders()
        try resp.text = xhr.responseText
        try resp.xml = xhr.responseXML
        socket.emit 'response', resp
      
      xhr.timeout = req.timeout if req.timeout
      xhr.responseType = req.type if req.type
      for k,v of req.headers
        xhr.setRequestHeader k, v
      xhr.send req.body or null

  #ping master
  if window is window.parent
    warn "slaves must be in an iframe"
  else
    window.parent.postMessage "XDPING_#{COMPAT_VERSION}", '*'
