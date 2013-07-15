# Description:
#   Variables in strings
#
# Dependencies:
#   None
#
# Configuration:
#   ALWAYS_VARIABLE - Process all output instead of modules that specificlly handle it
#
# Commands:
#   hubot create var <varname> - Create new variable
#   hubot remove var <varname> - Remove Variable
#   hubot remove var <varname>! - Remove variable - confirmed
#   hubot add value <varname> <value> - Add value to variable
#   hubot remove value <varname> <value> - Remove value from variable
#   hubot var <varname> type <var|verb|noun> - Set type of variable
#   hubot list var <varname> - List values in variable
#   hubot list vars - List all variables
#
# Author:
#   halkeye

'use strict'

Array::remove or= (e) -> @[t..t] = [] if (t = @indexOf(e)) > -1

module.exports = (robot) ->
  variableRE = /(\\)?(?:\$([a-zA-Z_]\w+)|\${([a-zA-Z_]\w+)})/g

  class Variables
    @can_edit_var = (user, varname) ->
      variable = robot.brain.data.variables[varname]
      if user.roles
        if "edit_variables" in user.roles
          return true
        if "edit_variable_" + varname in user.roles
          return true
      return !!variable.readonly
    @process = (string, user) ->
      return string.replace variableRE, ($0, $1, $2, $3) ->
        if $1
          return $0
        varname = $2 || $3
        if varname == "who"
          return user.name
        ## FIXME - pretty sure this doesn't get updated when people leave rooms, it'll have wildly out of date users
        if varname == "someone"
          recent_users = []
          users = robot.brain.users()
          for userid in Object.keys(users)
            u = users[userid]
            if u.room == user.room
              recent_users.push user.name
          return recent_users[Math.floor(Math.random() * recent_users.length)]
        v = robot.brain.data.variables[varname]
        if !v
          return $0
        return v.values[Math.floor(Math.random() * v.values.length)]

  robot.variables = Variables
  if process.env.ALWAYS_VARIABLE
    robot.adapter._oldsend = robot.adapter.send
    robot.adapter.send = (envelope, strings...) ->
      for i in [0...strings.length]
        strings[i] = robot.variables.process strings[i], envelope.user
      @_oldsend envelope, strings

  # constructor
  robot.brain.data.variables = {}

  robot.hear /^create var (\w+)$/, (msg) ->
    varname = msg.match[1]
    if robot.brain.data.variables[varname]
      msg.reply "Sorry, Variable of '" + varname + "' already exists."
      return
    robot.brain.data.variables[varname] = {
      readonly: true, type: "var", values: []
    }
    msg.reply "Okay."

  robot.hear /^remove var (\w+)\s*(!+)?$/, (msg) ->
    varname = msg.match[1]
    is_forced = !!msg.match[2]
    if !robot.brain.data.variables[varname]
      msg.reply "Sorry, I don't know of a variable '" + varname + "'."
      return
    if !is_forced
      msg.reply "This action cannot be undone  If you want to proceed append a '!'"
      return
    if robot.brain.data.variables[varname].values.length
      msg.reply "Okay, removed variable " + varname + " with " + robot.brain.data.variables[varname].values.length + " values"
    else
      msg.reply "Okay, removed variable " + varname
    delete robot.brain.data.variables[varname]

  robot.hear /^add value (\w+) (.*)$/, (msg) ->
    varname = msg.match[1]
    value = msg.match[2]
    lcvalue = value.toLowerCase()

    if !robot.brain.data.variables[varname]
      msg.reply "Sorry, I don't know of a variable '" + varname + "'."
      return
    if !robot.variables.can_edit_var msg.message.user, varname
      msg.reply "Sorry, you don't have permissions to edit '"+varname+"'."
      return
    if value.match(variableRE)
      msg.reply "Sorry, no nested values please."
      return
    for val in robot.brain.data.variables[varname].values
      if val.toLowerCase() is lcvalue
        msg.reply "I had it that way!"
        return
    robot.brain.data.variables[varname].values.push value
    msg.reply "Okay."

  robot.hear /^remove value (\w+) (.*)$/, (msg) ->
    varname = msg.match[1]
    value = msg.match[2]
    if !robot.brain.data.variables[varname]
      msg.reply "Sorry, I don't know of a variable '" + varname + "'."
      return
    if !robot.variables.can_edit_var msg.message.user, varname
      msg.reply "Sorry, you don't have permissions to edit '"+varname+"'."
      return
    robot.brain.data.variables[varname].values.remove value
    msg.reply "Okay."

  robot.hear /^var (\w+) type (var|verb|noun)$/, (msg) ->
    varname = msg.match[1]
    if !robot.brain.data.variables[varname]
      msg.reply "Sorry, I don't know of a variable '" + varname + "'."
      return
    robot.brain.data.variables[varname].type = msg.match[2]
    msg.reply "Okay."

  robot.hear /^list var (\w+)$/, (msg) ->
    varname = msg.match[1]
    if !robot.brain.data.variables[varname]
      msg.reply "Sorry, I don't know of a variable '" + varname + "'."
      return
    msg.reply robot.brain.data.variables[varname].values.join(', ')

  robot.hear /^(un)?protect \$(\w+)$/, (msg) ->
    varname = msg.match[2]
    if !robot.brain.data.variables[varname]
      msg.reply "Sorry, I don't know of a variable '" + varname + "'."
      return
    if !robot.variables.can_edit_var msg.message.user, varname
      msg.reply "Sorry, you don't have permissions to edit '"+varname+"'."
      return
    robot.brain.data.variables[varname].readonly = !(msg.match[1] == "un")
    msg.reply "Okay."

  robot.hear /^list vars$/, (msg) ->
    ret = []
    for varname in Object.keys(robot.brain.data.variables)
      v = robot.brain.data.variables[varname]
      type = ""
      if v.type is "noun"
        type =  "(n)"
      else if v.type is "verb"
        type =  "(v)"
      ret.push varname + type
    msg.reply ret.join(', ')

  robot.enter (response) ->
    # track enter
  robot.leave (response) ->
    # track leave
