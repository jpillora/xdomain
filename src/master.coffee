
#when you add slaves, this node
#enables master listeners

initdMaster = false
slaves = (s) ->
  unless initdMaster
    initMaster()
  for origin, path of s
    log "adding slave: #{origin}"
    slaves[origin] = path
  return

frames = {}
getFrame = (origin, proxyPath) ->
  #cache origin
  if frames[origin]
    return frames[origin]
  frame = document.createElement "iframe"
  frame.id = frame.name = guid()
  log "creating iframe #{frame.id}"
  frame.src = "#{origin}#{proxyPath}"
  frame.setAttribute 'style', 'display:none;'
  document.body.appendChild frame
  return frames[origin] = frame.contentWindow

initMaster = ->
  initdMaster = true
  convertToArrayBuffer = (args, done) ->
    [name, obj] = args
    isBlob = instOf(obj, 'Blob')
    isFile = instOf(obj, 'File')
    unless isBlob or isFile
      return 0
    reader = new FileReader()
    reader.onload = ->
      # clear value
      args[1] = null
      # formdata.append(name, value, **filename**)
      args[2] = obj.name if isFile
      done ['XD_BLOB', args, @result, obj.type]
    reader.readAsArrayBuffer obj
    return 1

  #this FormData is actually XHooks custom FormData `fd`,
  #which exposes all `entries` added, where each entry
  #is the arguments object
  convertFormData = (entries, send) ->
    #expand FileList -> [File, File, File]
    entries.forEach (args, i) ->
      [name, value] = args
      if instOf(value, 'FileList')
        entries.splice i, 1
        for file in value
          entries.splice i, 0, [name, file]
      return
    #basically: async.parallel([filter:files], send)
    c = 0
    entries.forEach (args, i) ->
      c += convertToArrayBuffer args, (newargs) ->
        entries[i] = newargs
        send() if --c is 0
        return
      return
    send() if c is 0
    return

  handleRequest = (request, socket) ->

    socket.on "xhr-event", ->
      request.xhr.dispatchEvent.apply null, arguments
    socket.on "xhr-upload-event", ->
      request.xhr.upload.dispatchEvent.apply null, arguments

    obj = strip request
    obj.headers = request.headers
    #add master cookie
    if request.withCredentials
      obj.headers[cookies.master] = document.cookie if cookies.master
      obj.slaveCookie = cookies.slave

    send = ->
      socket.emit "request", obj

    if request.body
      obj.body = request.body
      #async serialize formdata
      if instOf(obj.body, 'FormData')
        entries = obj.body.entries
        obj.body = ["XD_FD", entries]
        convertFormData entries, send
        return
    send()
    return

  #unless already set, add withCredentials to xhrs to trick jquery
  #in older browsers into thinking cors is allowed
  unless 'addWithCredentials' of xhook
    xhook.addWithCredentials = true

  #hook XHR  calls
  xhook.before (request, callback) ->
    
    #allow unless we have a slave domain
    p = parseUrl request.url

    if not p or p.origin is currentOrigin
      return callback()

    unless slaves[p.origin]
      log "no slave matching: '#{p.origin}'" if p
      return callback()
    
    log "proxying request to slave: '#{p.origin}'"

    if request.async is false
      warn "sync not supported"
      return callback()

    #get or insert frame
    frame = getFrame p.origin, slaves[p.origin]

    #connect to slave
    socket = createSocket guid(), frame

    #queue callback
    socket.on "response", (resp) ->
      callback resp
      socket.close()

    #user wants to abort
    request.xhr.addEventListener 'abort', ->
      socket.emit "abort"

    #kick off
    if socket.ready
      handleRequest(request, socket)
    else
      socket.once 'ready', ->
        handleRequest(request, socket)
    return





