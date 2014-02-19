slaves = null
addSlaves = (s) ->
  if slaves is null
    slaves = {}
    initMaster()
  for origin, path of s
    slaves[origin] = path
  return

frames = {}
getFrame = (origin, proxyPath) ->
  #cache origin
  if frames[origin]
    return frames[origin]
  frame = document.createElement "iframe"
  frame.id = frame.name = guid()
  frame.src = origin + proxyPath
  frame.setAttribute 'style', 'display:none;'
  document.body.appendChild frame
  return frames[origin] = frame.contentWindow

initMaster = ->

  #hook XHR  calls
  xhook.before (request, callback) ->

    #allow unless we have a slave domain
    p = parseUrl request.url
    unless p 
      log "URL not matching an external HTTP request..ignored"
      return callback()
    unless slaves[p.origin]
      log "no slave matching: '#{p.origin}'" if p
      return callback()
    log "proxying request slave: '#{p.origin}'"

    if request.async is false
      warn "sync not supported"
      return callback()

    #get or insert frame
    frame = getFrame p.origin, slaves[p.origin]

    socket = connect frame

    socket.on "response", (resp) ->
      callback resp
      socket.close()

    #user wants to abort
    request.xhr.addEventListener 'abort', ->
      socket.emit "abort"

    socket.on "xhr-event", ->
      request.xhr.dispatchEvent.apply null, arguments
    socket.on "xhr-upload-event", ->
      request.xhr.upload.dispatchEvent.apply null, arguments

    obj = strip request
    obj.headers = request.headers

    if instOf(request.body, 'FormData')
      obj.body = ["XD_FD",request.body.entries]

    if instOf(request.body, 'Uint8Array')
      obj.body = request.body

    socket.emit "request", obj
    return


