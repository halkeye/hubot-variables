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

module.exports = (robot) ->
  robot.adapter._oldsend = robot.adapter.send
  robot.adapter.send = (envelope, strings...) ->
    for i in [0...strings.length]
      strings[i] = strings[i].replace('$blah', 'whatever')

    @_oldsend envelope, strings


  # constructor
  robot.brain.data.variables = {}

  robot.hear /^create var (\w+)$/, (msg) ->
    varname = msg.match[0]
    if robot.brain.data.variables[varname]
      msg.reply "Sorry, I don't know of a variable '" + varname + "'."
      return
    robot.brain.data.variables[varname] = {
      readonly: 1, type: "var", values: []
    }
    msg.reply("Okay")

  robot.enter (response) ->
    # track enter
  robot.leave (response) ->
    # track leave
