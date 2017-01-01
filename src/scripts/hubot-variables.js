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
    getAll () {
      return robot.brain.get('variables') || {};
    }

    get (varname) {
      varname = varname.toLowerCase();
      let variable = this.getAll()[varname];
      if (!variable) {
        throw new Error(`Sorry, I don't know of a variable '${varname}'.`);
      }
      return variable;
    }
    getForEdit (varname, user) {
      let variable = robot.variables.get(varname);
      if (!robot.variables.canEditVar(variable, user)) {
        throw new Error(`Sorry, you don't have permissions to edit '${varname}'.`);
      }
      return variable;
    }

    delete (varname) {
      let variables = this.getAll();
      delete variables[varname];
      robot.brain.set('variables', variables);
    }

    update (varname, variable) {
      let variables = this.getAll();
      variables[varname] = variable;
      robot.brain.set('variables', variables);
    }

    hasVariable (key) {
      return key in this.getAll();
    }

    canEditVar (variable, user) {
      if (user.roles) {
        if (Array.from(user.roles).includes('edit_variables')) {
          return true;
        }
        if (Array.from(user.roles).includes(`edit_variable_${variable.name}`)) {
          return true;
        }
      }
      return !variable.readonly;
    }
    replacementFunction (word, varname, user) {
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
      try {
        let v = this.get(varname);
        return [varname, v.values[Math.floor(Math.random() * v.values.length)]];
      } catch (e) {
        return word;
      }
    }

    process (string, user, outputHistory) {
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

  robot.variables = new Variables();
  if (process.env.ALWAYS_VARIABLE) {
    robot.adapter._oldsend = robot.adapter.send;
    robot.adapter.send = function (envelope, ...strings) {
      return this._oldsend(envelope, strings.map(str => robot.variables.process(str, envelope.user)));
    };
  }

  robot.respond(/create var (\w+)$/, function (msg) {
    let varname = msg.match[1].toLowerCase();
    try {
      robot.variables.get(varname);
      // if it doesn't error, it already exists
      msg.reply(`Sorry, Variable of '${varname}' already exists.`);
    } catch (e) {
      robot.variables.update(varname, {
        name: varname, readonly: false, type: 'var', values: []
      });
      msg.reply('Okay.');
    }
  });

  robot.respond(/remove var (\w+)\s*(!+)?$/, function (msg) {
    let isForced = !!msg.match[2];
    try {
      let variable = robot.variables.getForEdit(msg.match[1], msg.message.user);
      if (variable.values.length && !isForced) {
        msg.reply("This action cannot be undone. If you want to proceed append a '!'");
        return;
      }
      if (variable.values.length) {
        msg.reply(`Okay, removed variable ${variable.name} with ${variable.values.length} values.`);
      } else {
        msg.reply(`Okay, removed variable ${variable.name}.`);
      }
      robot.variables.delete(variable.name);
    } catch (e) {
      msg.reply(e.message);
    }
  });

  robot.respond(/add value (\w+) (.*)$/, function (msg) {
    let value = msg.match[2];
    let lcvalue = value.toLowerCase();

    if (value.match(variableRE)) {
      msg.reply('Sorry, no nested values please.');
      return;
    }

    try {
      let variable = robot.variables.getForEdit(msg.match[1], msg.message.user);
      for (let val of Array.from(variable.values)) {
        if (val.toLowerCase() === lcvalue) {
          msg.reply('I had it that way!');
          return;
        }
      }
      robot.variables.update(variable.name, Object.assign(variable, {
        values: variable.values.concat(value)
      }));
      msg.reply('Okay.');
    } catch (e) {
      msg.reply(e.message);
    }
  });

  robot.respond(/remove value (\w+) (.*)$/, function (msg) {
    let value = msg.match[2];
    try {
      let variable = robot.variables.getForEdit(msg.match[1], msg.message.user);
      robot.variables.update(variable.name, Object.assign(variable, {
        values: variable.values.filter(v => v !== value)
      }));
      msg.reply('Okay.');
    } catch (e) {
      msg.reply(e.message);
    }
  });

  robot.respond(/var (\w+) type (var|verb|noun)$/, function (msg) {
    try {
      let variable = robot.variables.getForEdit(msg.match[1], msg.message.user);
      robot.variables.update(variable.name, Object.assign(variable, {
        type: msg.match[2]
      }));
      msg.reply('Okay.');
    } catch (e) {
      msg.reply(e.message);
    }
  });

  robot.respond(/(un)?protect \$(\w+)$/, function (msg) {
    try {
      let variable = robot.variables.getForEdit(msg.match[2], msg.message.user);
      robot.variables.update(variable.name, Object.assign(variable, {
        readonly: !(msg.match[1] === 'un')
      }));
      msg.reply('Okay.');
    } catch (e) {
      msg.reply(e.message);
    }
  });

  robot.respond(/list var (\w+)$/, function (msg) {
    try {
      let variable = robot.variables.get(msg.match[1], msg.message.user);
      msg.reply(variable.values.join(', '));
    } catch (e) {
      msg.reply(e.message);
    }
  });

  robot.respond(/list vars$/, function (msg) {
    let ret = [];
    for (let [varname, v] of entries(robot.variables.getAll())) {
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
