// Description:
//   Variables in strings
//
// Dependencies:
//   None
//
// Configuration:
//   ALWAYS_VARIABLE - Process all output instead of modules that specificlly handle it
//
// Commands:
//   hubot create var <varname> - Create new variable
//   hubot remove var <varname> - Remove Variable
//   hubot remove var <varname>! - Remove variable - confirmed
//   hubot add value <varname> <value> - Add value to variable
//   hubot remove value <varname> <value> - Remove value from variable
//   hubot var <varname> type <var|verb|noun> - Set type of variable
//   hubot list var <varname> - List values in variable
//   hubot list vars - List all variables
//
// Author:
//   halkeye

const entries = require('object.entries');

module.exports = function Export (robot) {
  let variableRE = /(\\)?(?:\$([a-zA-Z_]\w+)|\${([a-zA-Z_]\w+)})/g;

  class Variables {
    static clearAll () {
      robot.brain.data.variables = {};
    }

    static hasVariable (key) {
      return key in robot.brain.data.variables;
    }

    static canEditVar (user, varname) {
      let variable = robot.brain.data.variables[varname];
      if (user.roles) {
        if (Array.from(user.roles).includes('edit_variables')) {
          return true;
        }
        if (Array.from(user.roles).includes(`edit_variable_${varname}`)) {
          return true;
        }
      }
      return !variable.readonly;
    }
    static replacementFunction (word, varname, user) {
      if (varname === 'who') { return [varname, user.name]; }
      // # FIXME - pretty sure this doesn't get updated when people leave rooms, it'll have wildly out of date users
      if (varname === 'someone') {
        let recentUsers = [];
        let users = robot.brain.users();
        for (let userid of Array.from(Object.keys(users))) {
          let u = users[userid];
          if (u.room === user.room) {
            recentUsers.push(user.name);
          }
        }
        return [varname, recentUsers[Math.floor(Math.random() * recentUsers.length)]];
      }
      let v = robot.brain.data.variables[varname];
      if (!v) { return word; }
      return [varname, v.values[Math.floor(Math.random() * v.values.length)]];
    }

    static process (string, user, outputHistory) {
      return string.replace(variableRE, (word, slashes, varname, quotedVarName) => {
        // if slashes/is esacped
        if (slashes) { return word; }
        let rv = this.replacementFunction(word, (varname || quotedVarName).toLowerCase(), user);
        if (rv instanceof Array) {
          if (outputHistory) {
            if (!outputHistory.vars) { outputHistory.vars = {}; }
            outputHistory.vars[rv[0]] = rv[1];
          }
          return rv[1];
        }
        return rv;
      });
    }
  }

  robot.variables = Variables;
  if (process.env.ALWAYS_VARIABLE) {
    robot.adapter._oldsend = robot.adapter.send;
    robot.adapter.send = function (envelope, ...strings) {
      return this._oldsend(envelope, strings.map(str => robot.variables.process(str, envelope.user)));
    };
  }

  // constructor
  robot.variables.clearAll();

  robot.hear(/^create var (\w+)$/, function (msg) {
    let varname = msg.match[1].toLowerCase();
    if (robot.brain.data.variables[varname]) {
      msg.reply(`Sorry, Variable of '${varname}' already exists.`);
      return;
    }
    robot.brain.data.variables[varname] = {
      readonly: false, type: 'var', values: []
    };
    return msg.reply('Okay.');
  });

  robot.hear(/^remove var (\w+)\s*(!+)?$/, function (msg) {
    let varname = msg.match[1];
    let isForced = !!msg.match[2];
    if (!robot.brain.data.variables[varname]) {
      msg.reply(`Sorry, I don't know of a variable '${varname}'.`);
      return;
    }
    if (robot.brain.data.variables[varname].values.length && !isForced) {
      msg.reply("This action cannot be undone. If you want to proceed append a '!'");
      return;
    }
    if (robot.brain.data.variables[varname].values.length) {
      msg.reply(`Okay, removed variable ${varname} with ${robot.brain.data.variables[varname].values.length} values.`);
    } else {
      msg.reply(`Okay, removed variable ${varname}.`);
    }
    return delete robot.brain.data.variables[varname];
  });

  robot.hear(/^add value (\w+) (.*)$/, function (msg) {
    let varname = msg.match[1].toLowerCase();
    let value = msg.match[2];
    let lcvalue = value.toLowerCase();

    if (!robot.brain.data.variables[varname]) {
      msg.reply(`Sorry, I don't know of a variable '${varname}'.`);
      return;
    }
    if (!robot.variables.canEditVar(msg.message.user, varname)) {
      msg.reply(`Sorry, you don't have permissions to edit '${varname}'.`);
      return;
    }
    if (value.match(variableRE)) {
      msg.reply('Sorry, no nested values please.');
      return;
    }
    for (let val of Array.from(robot.brain.data.variables[varname].values)) {
      if (val.toLowerCase() === lcvalue) {
        msg.reply('I had it that way!');
        return;
      }
    }
    robot.brain.data.variables[varname].values.push(value);
    return msg.reply('Okay.');
  });

  robot.hear(/^remove value (\w+) (.*)$/, function (msg) {
    let varname = msg.match[1].toLowerCase();
    let value = msg.match[2];
    if (!robot.brain.data.variables[varname]) {
      msg.reply(`Sorry, I don't know of a variable '${varname}'.`);
      return;
    }
    if (!robot.variables.canEditVar(msg.message.user, varname)) {
      msg.reply(`Sorry, you don't have permissions to edit '${varname}'.`);
      return;
    }
    robot.brain.data.variables[varname].values =
      robot.brain.data.variables[varname].values.filter(v => v !== value);
    return msg.reply('Okay.');
  });

  robot.hear(/^var (\w+) type (var|verb|noun)$/, function (msg) {
    let varname = msg.match[1].toLowerCase();
    if (!robot.brain.data.variables[varname]) {
      msg.reply(`Sorry, I don't know of a variable '${varname}'.`);
      return;
    }
    robot.brain.data.variables[varname].type = msg.match[2];
    return msg.reply('Okay.');
  });

  robot.hear(/^(un)?protect \$(\w+)$/, function (msg) {
    let varname = msg.match[2].toLowerCase();
    if (!robot.brain.data.variables[varname]) {
      msg.reply(`Sorry, I don't know of a variable '${varname}'.`);
      return;
    }
    if (!robot.variables.canEditVar(msg.message.user, varname)) {
      msg.reply(`Sorry, you don't have permissions to edit '${varname}'.`);
      return;
    }
    robot.brain.data.variables[varname].readonly = !(msg.match[1] === 'un');
    return msg.reply('Okay.');
  });

  robot.hear(/^list var (\w+)$/, function (msg) {
    let varname = msg.match[1].toLowerCase();
    if (!robot.brain.data.variables[varname]) {
      msg.reply(`Sorry, I don't know of a variable '${varname}'.`);
      return;
    }
    msg.reply(robot.brain.data.variables[varname].values.join(', '));
  });

  robot.hear(/^list vars$/, function (msg) {
    let ret = [];
    for (let [varname, v] of entries(robot.brain.data.variables)) {
      let type = '';
      if (v.type === 'noun') {
        type = '(n)';
      } else if (v.type === 'verb') {
        type = '(v)';
      }
      ret.push(varname + type);
    }
    return msg.reply(ret.join(', '));
  });
};
