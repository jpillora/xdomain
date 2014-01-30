
#cross browser event handler names
onMessage = (fn) ->
  if document.addEventListener
    window.addEventListener "message", fn
  else
    window.attachEvent "onmessage", fn
offMessage = (fn) ->
  if document.removeEventListener
    window.removeEventListener "message", fn
  else
    window.dettachEvent "onmessage", fn

server = null
sockets = {}

XD_ENCODE = true
XD_OBJ_TEST = {XD_OBJ:true}

#ONE WINDOW LISTENER!
#double purpose:
#  creates new sockets by passing events to the server handler
#  passes events to existing sockets (created by connect or by the server)
onMessage (e) ->
  d = e.data
  switch typeof d
    when "string"
      try
        d = JSON.parse d
      catch
        return #return if not a json string
    when "object"
      e.source.postMessage XD_OBJ_TEST, "*" if XD_ENCODE
      XD_ENCODE = false
      return if d.XD_OBJ

  #return if not an array
  unless d instanceof Array
    return
  #return unless lead by an xdomain id
  id = d.shift()
  unless /^xdomain-/.test id
    return

  #finally, create/get socket
  sock = sockets[id]
  unless sock
    #send unsolicited requests to the listening server
    return unless server
    sock = server.handle(id, e.source)
  #emit data
  sock.fire.apply sock, d





  # waits = 0
  # waiters = []
  # ready = false

  #confirm the connection to iframe
  readyCheck: (callback) ->
    return callback() if ready
    waiters.push callback
    return unless waiters.length is 1

    check()
    return




createSocket = (id, frame) ->

  waits = 0
  ready = false
  pendingEmits = []
  sock = sockets[id] = xhook.EventEmitter(true)
  
  check = =>
    # send test message
    frame.postMessage XD_OBJ_TEST

    if waits++ >= xdomain.timeout/CHECK_INTERVAL
      throw "Timeout waiting on iframe socket"
    else
      setTimeout check, CHECK_INTERVAL
  check()

  sock.once 'xd_ready', ->
    sock.destroy()
    sock.close()

  sock.once 'close', ->
    sock.destroy()
    sock.close()

  sock.emit = ->
    args = slice arguments
    args.unshift id




    #convert to string when necessary
    args = JSON.stringify args if XD_ENCODE
    frame.postMessage args, "*"
  sock.close = ->
    delete sockets[id]
  sock

#connect to frame
connect = (target) ->
  s = new Socket(guid(), target)
  return s
#listen on frame
listen = (handler) ->
  server = (e, id) ->
    s = new Socket(id, e.source)
    handler e, s
    return s
  return



