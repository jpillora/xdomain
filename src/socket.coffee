
#cross browser event handler names
onMessage = (fn) ->
  if document.addEventListener
    window.addEventListener "message", fn
  else
    window.attachEvent "onmessage", fn

handler = null
sockets = {}
jsonEncode = true
#constants
XD_CHECK = "XD_CHECK"
XD_OBJ_TEST = {XD_OBJ:true, XD_UNDEF: `undefined` }

#ONE WINDOW LISTENER!
#double purpose:
#  creates new sockets by passing incoming events to the 'handler'
#  passes events to existing sockets (created by connect or by the server)
onMessage (e) ->
  d = e.data
  #return if not a json string
  if typeof d is "string"
    if /^XPING_/.test d
      return warn "your master is not compatible with your slave, check your xdomain.js verison"
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
  if sock is `undefined`
    #send unsolicited requests to the listening server
    return unless handler
    sock = createSocket id, e.source
    handler e.origin, sock
  #emit data
  sock.fire.apply sock, d

createSocket = (id, frame) ->

  ready = false
  sock = sockets[id] = xhook.EventEmitter(true)

  sock.once 'close', ->
    sock.destroy()
    sock.close()

  pendingEmits = []
  sock.emit = ->
    args = slice arguments
    args.unshift id

    #convert to string when necessary
    args = JSON.stringify args if jsonEncode

    if ready
      emit args
    else
      pendingEmits.push args
    return

  emit = (args) ->
    frame.postMessage args, "*"

  sock.close = ->
    sock.emit 'close'
    log "close socket: #{id}"
    sockets[id] = null

  sock.once XD_CHECK, (obj)->
    return unless obj.XD_OBJ
    #obj has XD_UNDEF when direct objects are supported
    jsonEncode = 'XD_UNDEF' not of obj
    ready = true
    while pendingEmits.length
      emit pendingEmits.shift()

  #start checking connectivitiy
  checks = 0
  check = =>
    # send test message
    emit [id, XD_CHECK, XD_OBJ_TEST]
    if ready
      return
    if checks++ >= xdomain.timeout/CHECK_INTERVAL
      throw "Timeout waiting on iframe socket"
    else
      setTimeout check, CHECK_INTERVAL
  check()

  log "new socket: #{id}"
  sock

#connect to frame
connect = (target) ->
  s = createSocket guid(), target
  return s
#listen on frame
listen = (h) ->
  handler = h
  return



