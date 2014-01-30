
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
  frame.id = frame.name = 'xdomain-'+guid()
  frame.src = origin + proxyPath
  frame.setAttribute 'style', 'display:none;'
  document.body.appendChild frame
  return frames[origin] = frame.contentWindow

initMaster = ->
  #hook XHR  calls
  xhook.before (request, callback) ->

    #allow unless we have a slave domain
    p = parseUrl request.url
    unless p and slaves[p.origin]
      log "no slave matching: '#{p.origin}'"
      return callback()
    log "proxying request slave: '#{p.origin}'"

    if request.async is false
      warn "sync not supported"
      return callback()

    #get or insert frame
    frame = getFrame p.origin, slaves[p.origin]

    c = connect frame

    c.on "response", (resp) ->
      callback resp
      c.close()

    #client abort
    request.on 'abort', ->
      c.emit "abort"
    #server abort
    c.on "abort", ->
      c.close()

    c.on "xhr-event", (args) ->
      request.fire.apply null, args

    c.emit "request", request
    return

