# Description:
#   None
#
# Dependencies:
#
# Configuration:
#
# Commands:
#   None
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

  robot.hear /^create var (\w+)$/, (msg) ->
    varname = msg.match[1]
    if robot.brain.data.variables[varname]
      msg.reply "Sorry, Variable of '" + varname + "' already exists."
      return
    robot.brain.data.variables[varname] = {
      readonly: true, type: "var", values: []
    }
    msg.reply "Okay."

  robot.hear /^add value (\w+) (.*)$/, (msg) ->
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

  robot.hear /^remove value (\w+) (.*)$/, (msg) ->
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

  robot.hear /^list var (\w+)$/, (msg) ->
    varname = msg.match[1]
    if !robot.brain.data.variables[varname]
      msg.reply "Sorry, I don't know of a variable '" + varname + "'."
      return
    msg.reply robot.brain.data.variables[varname].values.join(', ')

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
