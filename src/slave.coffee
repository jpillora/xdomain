
#when you add masters, this node
#enables slave listeners

initdSlave = false
masters = (m) ->
  unless initdSlave
    initSlave()
  for origin, path of m
    log "adding master: #{origin}"
    masters[origin] = path
  return

handleSocket = null
initSlave = ->
  initdSlave = true
  log "handling incoming sockets..."
  handleSocket = (origin, socket) ->
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
        warn "blocked request to path: '#{p.path}' by regex: #{pathRegex}"
        socket.close()
        return

      xhr = new XMLHttpRequest()
      xhr.open req.method, req.url

      xhr.addEventListener "*", (e) ->
        socket.emit 'xhr-event', e.type, strip e

      if xhr.upload
        xhr.upload.addEventListener "*", (e) ->
          socket.emit 'xhr-upload-event', e.type, strip e

      socket.once "abort", ->
        xhr.abort()

      xhr.onreadystatechange = ->
        return unless xhr.readyState is 4
        #extract properties
        resp =
          status: xhr.status
          statusText: xhr.statusText
          data: xhr.response
          headers: xhook.headers xhr.getAllResponseHeaders()
        try resp.text = xhr.responseText
        # XML over postMessage not supported
        # try resp.xml = xhr.responseXML
        socket.emit 'response', resp
      
      # document.cookie (Cookie header) can't be set inside an iframe
      # as many browsers have 3rd party cookies disabled. slaveCookie
      # contains the 'xdomain.cookie.slave' string set on the master.
      if req.withCredentials 
        xhr.withCredentials = true
        req.headers[req.slaveCookie] = document.cookie if req.slaveCookie

      xhr.timeout = req.timeout if req.timeout
      xhr.responseType = req.type if req.type
      for k,v of req.headers
        xhr.setRequestHeader k, v

      #deserialize FormData
      if req.body instanceof Array and req.body[0] is "XD_FD"
        fd = new xhook.FormData()

        entries = req.body[1]
        for args in entries
          #deserialize blobs from arraybuffs
          #[0:marker, 1:real-args, 2:arraybuffer, 3:type]
          if args[0] is "XD_BLOB" and args.length is 4
            blob = new Blob([args[2]], type:args[3])
            args = args[1]
            args[1] = blob
          fd.append.apply fd, args
        req.body = fd

      #fire off request
      xhr.send req.body or null

      return

    log "slave listening for requests on socket: #{socket.id}"
    return

  #ping master
  if window is window.parent
    warn "slaves must be in an iframe"
  else
    window.parent.postMessage "XDPING_#{COMPAT_VERSION}", '*'
