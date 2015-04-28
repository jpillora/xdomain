
#constants
XD_CHECK = "XD_CHECK"
#state
sockets = {}
jsonEncode = true

#a 'sock' is a two-way event-emitter,
#each side listens for messages with on()
#and the other side sends messages with emit()
createSocket = (id, frame) ->

  ready = false
  sock = sockets[id] = xhook.EventEmitter(true)
  sock.id = id

  sock.once 'close', ->
    sock.destroy()
    sock.close()

  pendingEmits = []
  sock.emit = ->
    args = slice arguments
    extra = if typeof args[1] is "string" then " -> #{args[1]}" else ""
    log "send socket: #{id}: #{args[0]}#{extra}"
    args.unshift id
    if ready
      emit args
    else
      pendingEmits.push args
    return
  emit = (args) ->
    #convert to string when necessary
    args = JSON.stringify args if jsonEncode
    #send!
    frame.postMessage args, "*"
    return

  sock.close = ->
    sock.emit 'close'
    log "close socket: #{id}"
    sockets[id] = null
    return

  sock.once XD_CHECK, (obj)->
    jsonEncode = typeof obj is "string"
    ready = sock.ready = true
    sock.emit 'ready'
    log "ready socket: #{id} (emit ##{pendingEmits.length} pending)"
    while pendingEmits.length
      emit pendingEmits.shift()
    return

  #start checking connectivitiy
  checks = 0
  check = =>
    # send test message NO ENCODING
    frame.postMessage [id, XD_CHECK, {}], "*"
    if ready
      return
    if checks++ >= xdomain.timeout/CHECK_INTERVAL
      warn "Timeout waiting on iframe socket"
      emitter.fire "timeout"
      sock.fire "abort" #self-emit "abort"
    else
      setTimeout check, CHECK_INTERVAL
    return
  setTimeout check

  log "new socket: #{id}"
  return sock

#cross browser event handler names
onMessage = (fn) ->
  if document.addEventListener
    window.addEventListener "message", fn
  else
    window.attachEvent "onmessage", fn

#ONE WINDOW LISTENER!
#double purpose:
#  creates new sockets by passing incoming events to the 'handler'
#  passes events to existing sockets (created by connect or by the server)
startPostMessage = -> onMessage (e) ->
  d = e.data
  #return if not a json string
  if typeof d is "string"
    #only old versions of xdomain send XPINGs...
    if /^XDPING(_(V\d+))?$/.test(d) and RegExp.$2 isnt COMPAT_VERSION
      return warn "your master is not compatible with your slave, check your xdomain.js version"
    #IE will "toString()" the array, this reverses that action
    else if /^xdomain-/.test d
      d = d.split ","
    #this browser must json encode postmessages
    else if jsonEncode
      try d = JSON.parse d
      catch
        return

  #return if not an array
  unless d instanceof Array
    return
  #return unless lead by an xdomain id
  id = d.shift()
  unless /^xdomain-/.test id
    return
  #finally, create/get socket
  sock = sockets[id]
  #closed
  if sock is null
    return
  #needs creation
  if sock is `undefined`
    #send unsolicited requests to the listening server
    return unless handleSocket
    sock = createSocket id, e.source
    handleSocket e.origin, sock

  extra = if typeof d[1] is "string" then " -> #{d[1]}" else ""
  log "receive socket: #{id}: #{d[0]}#{extra}"
  #emit data
  sock.fire.apply sock, d
  return

