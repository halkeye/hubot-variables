# Description:
#   None
#
# Dependencies:
#
# Configuration:
#
# Commands:
#   hubot create var <varname>
#   hubot remove var <varname>
#   hubot remove var <varname>!
#   hubot add value <varname> <value>
#   hubot remove value <varname> <value>
#   hubot var <varname> type <var|verb|noun>
#   hubot list var <varname>
#   hubot list vars
#
# Author:
#   Gavin Mogan <gavin@kodekoan.com>

'use strict'

Array::remove or= (e) -> @[t..t] = [] if (t = @indexOf(e)) > -1

module.exports = (robot) ->
  variableRE = /(\\)?(?:\$([a-zA-Z_]\w+)|\${([a-zA-Z_]\w+)})/g
  can_edit_var = (user, varname) ->
    variable = robot.brain.data.variables[varname]
    if user.roles
      if "edit_variables" in user.roles
        return true
      if "edit_variable_" + varname in user.roles
        return true
    return !!variable.readonly

  robot.adapter._oldsend = robot.adapter.send
  robot.adapter.send = (envelope, strings...) ->
    for i in [0...strings.length]
      strings[i] = strings[i].replace variableRE, ($0, $1, $2, $3) ->
        if $1
          return $0
        varname = $2 || $3
        if !robot.brain.data.variables[varname]
          return $0
        index = robot.brain.data.variables.values[Math.floor(Math.random() * robot.brain.data.variables.values.length)]
        return robot.brain.data.variables[varname].values[index]

    @_oldsend envelope, strings


  # constructor
  robot.brain.data.variables = {}

  robot.respond /^create var (\w+)$/, (msg) ->
    varname = msg.match[1]
    if robot.brain.data.variables[varname]
      msg.reply "Sorry, Variable of '" + varname + "' already exists."
      return
    robot.brain.data.variables[varname] = {
      readonly: true, type: "var", values: []
    }
    msg.reply "Okay."

  robot.respond /^remove var (\w+)\s*(!+)?$/, (msg) ->
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

  robot.respond /^add value (\w+) (.*)$/, (msg) ->
    varname = msg.match[1]
    value = msg.match[2]
    lcvalue = value.toLowerCase()

    if !robot.brain.data.variables[varname]
      msg.reply "Sorry, I don't know of a variable '" + varname + "'."
      return
    if !can_edit_var msg.message.user, varname
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

  robot.respond /^remove value (\w+) (.*)$/, (msg) ->
    varname = msg.match[1]
    value = msg.match[2]
    if !robot.brain.data.variables[varname]
      msg.reply "Sorry, I don't know of a variable '" + varname + "'."
      return
    if !can_edit_var msg.message.user, varname
      msg.reply "Sorry, you don't have permissions to edit '"+varname+"'."
      return
    robot.brain.data.variables[varname].values.remove value
    msg.reply "Okay."

  robot.respond /^var (\w+) type (var|verb|noun)$/, (msg) ->
    varname = msg.match[1]
    if !robot.brain.data.variables[varname]
      msg.reply "Sorry, I don't know of a variable '" + varname + "'."
      return
    robot.brain.data.variables[varname].type = msg.match[2]
    msg.reply "Okay."

  robot.respond /^list var (\w+)$/, (msg) ->
    varname = msg.match[1]
    if !robot.brain.data.variables[varname]
      msg.reply "Sorry, I don't know of a variable '" + varname + "'."
      return
    msg.reply robot.brain.data.variables[varname].values.join(', ')

  robot.respond /^list vars$/, (msg) ->
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
