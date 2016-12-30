/* eslint-env mocha */
process.env.EXPRESS_PORT = process.env.PORT = 0;

const Helper = require('hubot-test-helper');
// helper loads all scripts passed a directory
const helper = new Helper('../scripts');

describe('hubot-variables', function () {
  beforeEach(function () {
    this.room = helper.createRoom();
    this.room.robot.variables.clearAll();
  });
  afterEach(function () { this.room.destroy(); });

  describe('process string', function () {
    beforeEach(function () {
      this.room.robot.brain.data.variables = {
        robins: { readonly: false, type: 'var', values: [ 'Dick Grayson' ] },
        villains: { readonly: false, type: 'var', values: [ 'Killer Croc', 'Black Mask', 'Clayface', 'Poison Ivy', 'Penguin' ] },
        weapons: { readonly: false, type: 'var', values: [ 'Grappling Gun', 'Batarang', 'Explosive Gel', 'Shark Spray' ] },
        digit: { readonly: false, type: 'var', values: [ '1', '2', '3', '4', '5', '6', '7', '8', '9', '0' ] },
        batmans: { readonly: false, type: 'var', values: [ 'Bruce Wayne' ] },
        butlers: { readonly: false, type: 'var', values: [ 'Alfred Pennyworth' ] }
      };
    });
    it('no history', function () {
      this.room.robot.variables.process('Robin is $robins', this.room.user)
        .should.eql('Robin is Dick Grayson');
    });
    it('nonexistent single variable', function () {
      const history = {};
      this.room.robot.variables.process('I am a $developer', this.room.user, history)
        .should.eql('I am a $developer');
      history.should.eql({ });
    });
    it('single variable', function () {
      const history = {};
      this.room.robot.variables.process('Robin is $robins', this.room.user, history)
        .should.eql('Robin is Dick Grayson');
      history.should.eql({ vars: { robins: 'Dick Grayson' } });
    });
    it('single quoted variable', function () {
      const history = {};
      this.room.robot.variables.process('Robin is ${robins}', this.room.user, history) // eslint-disable-line no-template-curly-in-string
        .should.eql('Robin is Dick Grayson');
      history.should.eql({ vars: { robins: 'Dick Grayson' } });
    });
    it('dont process escaped variable - quoted', function () {
      const history = {};
      this.room.robot.variables.process('Robin is \\${robins}', this.room.user, history) // eslint-disable-line no-template-curly-in-string
        .should.eql('Robin is \\${robins}'); // eslint-disable-line no-template-curly-in-string
      history.should.eql({ });
    });
    it('dont process escaped variable - quoted', function () {
      const history = {};
      this.room.robot.variables.process('Robin is \\$robins', this.room.user, history)
        .should.eql('Robin is \\$robins');
      history.should.eql({ });
    });
    it('dual same variable', function () {
      const history = {};
      this.room.robot.variables.process('Robin is $robins $robins', this.room.user, history)
        .should.eql('Robin is Dick Grayson Dick Grayson');
      history.should.eql({ vars: { robins: 'Dick Grayson' } });
    });
    it('triple different variable', function () {
      const history = {};
      this.room.robot.variables.process('$batmans has a sidekick named $robins and a helper called $butlers', this.room.user, history)
        .should.eql('Bruce Wayne has a sidekick named Dick Grayson and a helper called Alfred Pennyworth');
      history.should.eql({ vars: { robins: 'Dick Grayson', batmans: 'Bruce Wayne', butlers: 'Alfred Pennyworth' } });
    });
    it('quad different variable', function () {
      const history = {};
      this.room.robot.variables.process('$batmans has a sidekick named $robins and a helper called $butlers and fights $villains', this.room.user, history)
        .should.containEql('Bruce Wayne has a sidekick named Dick Grayson and a helper called Alfred Pennyworth and fights');
      history.vars.should.have.property('robins', 'Dick Grayson');
      history.vars.should.have.property('batmans', 'Bruce Wayne');
      history.vars.should.have.property('butlers', 'Alfred Pennyworth');
      history.vars.should.have.property('villains');
    });
  });

  describe('create var robins', function () {
    it('basic create', function () {
      return Promise.resolve()
        .then(() => this.room.user.say('halkeye', 'create var robins'))
        .then(() => {
          this.room.messages.slice(-1).should.eql([ [ 'hubot', '@halkeye Okay.' ] ]);
          this.room.robot.variables.hasVariable('robins').should.be.true;
          this.room.robot.brain.data.variables.should.eql({
            robins: {
              readonly: false,
              type: 'var',
              values: [ ]
            }
          });
        });
    });
    it('existing variable create', function () {
      return Promise.resolve()
        .then(() => this.room.user.say('halkeye', 'create var robins'))
        .then(() => this.room.user.say('halkeye', 'create var robins'))
        .then(() => {
          this.room.messages.slice(-1).should.eql([ [ 'hubot', "@halkeye Sorry, Variable of 'robins' already exists." ] ]);
          this.room.robot.variables.hasVariable('robins').should.be.true;
          this.room.robot.brain.data.variables.should.eql({
            robins: {
              readonly: false,
              type: 'var',
              values: [ ]
            }
          });
        });
    });
    it('existing variable create different case', function () {
      return Promise.resolve()
        .then(() => this.room.user.say('halkeye', 'create var robins'))
        .then(() => this.room.user.say('halkeye', 'create var ROBINS'))
        .then(() => {
          this.room.messages.slice(-1).should.eql([ [ 'hubot', "@halkeye Sorry, Variable of 'robins' already exists." ] ]);
          this.room.robot.variables.hasVariable('robins').should.be.true;
          this.room.robot.brain.data.variables.should.eql({
            robins: {
              readonly: false,
              type: 'var',
              values: [ ]
            }
          });
        });
    });
  });
  describe('remove var robins', function () {
    it('non existing var', function () {
      return Promise.resolve()
        .then(() => this.room.user.say('halkeye', 'remove var robins'))
        .then(() => {
          this.room.messages.slice(-1).should.eql([
            [ 'hubot', "@halkeye Sorry, I don't know of a variable 'robins'." ]
          ]);
          this.room.robot.variables.hasVariable('robins').should.be.true;
          this.room.robot.brain.data.variables.should.eql({});
        });
    });
    it('basic remove', function () {
      return Promise.resolve()
        .then(() => this.room.user.say('halkeye', 'create var robins'))
        .then(() => this.room.user.say('halkeye', 'remove var robins'))
        .then(() => {
          this.room.messages.slice(-1).should.eql([
            [ 'hubot', '@halkeye Okay, removed variable robins.' ]
          ]);
          this.room.robot.variables.hasVariable('robins').should.be.true;
          this.room.robot.brain.data.variables.should.eql({});
        });
    });
    it('remove fail if values', function () {
      return Promise.resolve()
        .then(() => this.room.user.say('halkeye', 'create var robins'))
        .then(() => this.room.user.say('halkeye', 'add value robins Dick Grayson'))
        .then(() => this.room.user.say('halkeye', 'remove var robins'))
        .then(() => {
          this.room.messages.slice(-1).should.eql([
            [ 'hubot', "@halkeye This action cannot be undone. If you want to proceed append a '!'" ]
          ]);
          this.room.robot.variables.hasVariable('robins').should.be.true;
          this.room.robot.brain.data.variables.should.eql({
            robins: {
              readonly: false,
              type: 'var',
              values: [ 'Dick Grayson' ]
            }
          });
        });
    });
    it('remove success if values and force', function () {
      return Promise.resolve()
        .then(() => this.room.user.say('halkeye', 'create var robins'))
        .then(() => this.room.user.say('halkeye', 'add value robins Dick Grayson'))
        .then(() => this.room.user.say('halkeye', 'remove var robins!'))
        .then(() => {
          this.room.messages.slice(-1).should.eql([
            [ 'hubot', '@halkeye Okay, removed variable robins with 1 values.' ]
          ]);
          this.room.robot.variables.hasVariable('robins').should.be.true;
          this.room.robot.brain.data.variables.should.eql({});
        });
    });
    it('remove success if values and force', function () {
      return Promise.resolve()
        .then(() => this.room.user.say('halkeye', 'create var robins'))
        .then(() => this.room.user.say('halkeye', 'add value robins Dick Grayson'))
        .then(() => this.room.user.say('halkeye', 'add value robins Tim Drake'))
        .then(() => this.room.user.say('halkeye', 'remove var robins!'))
        .then(() => {
          this.room.messages.slice(-1).should.eql([
            [ 'hubot', '@halkeye Okay, removed variable robins with 2 values.' ]
          ]);
          this.room.robot.variables.hasVariable('robins').should.be.true;
          this.room.robot.brain.data.variables.should.eql({});
        });
    });
  });

  describe('add value robins', function () {
    beforeEach(function () {
      return this.room.user.say('halkeye', 'create var robins').then(
        () => this.room.user.say('halkeye', 'add value robins Dick Grayson')
      );
    });

    it('responds with the right values', function () {
      this.room.messages.should.eql([
        [ 'halkeye', 'create var robins' ],
        [ 'hubot', '@halkeye Okay.' ],
        [ 'halkeye', 'add value robins Dick Grayson' ],
        [ 'hubot', '@halkeye Okay.' ]
      ]);
    });
    it('has variable robins', function () {
      this.room.robot.variables.hasVariable('robins');
      this.room.robot.brain.data.variables.should.eql({
        robins: {
          readonly: false,
          type: 'var',
          values: [ 'Dick Grayson' ]
        }
      });
    });
  });
  describe('protect var', function () {
    describe('existing variable', function () {
      beforeEach(function () {
        return Promise.resolve()
          .then(() => this.room.user.say('halkeye', 'create var robins'))
          .then(() => this.room.user.say('halkeye', 'protect $robins'));
      });

      it('responds with the right values', function () {
        this.room.messages.slice(-2).should.eql([
          [ 'halkeye', 'protect $robins' ],
          [ 'hubot', '@halkeye Okay.' ]
        ]);
        this.room.robot.brain.data.variables.should.eql({ robins: { readonly: true, type: 'var', values: [ ] } });
      });
    });
    describe('nonexisting variable', function () {
      beforeEach(function () {
        return Promise.resolve()
          .then(() => this.room.user.say('halkeye', 'protect $robins'));
      });

      it('responds with the right values', function () {
        this.room.messages.slice(-2).should.eql([
          [ 'halkeye', 'protect $robins' ],
          [ 'hubot', "@halkeye Sorry, I don't know of a variable 'robins'." ]
        ]);
      });
    });
    describe('already protected', function () {
      beforeEach(function () {
        return Promise.resolve()
          .then(() => this.room.user.say('halkeye', 'create var robins'))
          .then(() => this.room.user.say('halkeye', 'protect $robins'))
          .then(() => this.room.user.say('halkeye', 'protect $robins'));
      });

      it('responds with the right values', function () {
        this.room.messages.slice(-2).should.eql([
          [ 'halkeye', 'protect $robins' ],
          [ 'hubot', "@halkeye Sorry, you don't have permissions to edit 'robins'." ]
        ]);
        this.room.robot.brain.data.variables.should.eql({ robins: { readonly: true, type: 'var', values: [ ] } });
      });
    });
  });

  describe('unprotect var', function () {
    describe('existing variable', function () {
      beforeEach(function () {
        return Promise.resolve()
          .then(() => this.room.user.say('halkeye', 'create var robins'))
          .then(() => this.room.user.say('halkeye', 'unprotect $robins'));
      });

      it('responds with the right values', function () {
        this.room.messages.slice(-2).should.eql([
          [ 'halkeye', 'unprotect $robins' ],
          [ 'hubot', '@halkeye Okay.' ]
        ]);
        this.room.robot.brain.data.variables.should.eql({ robins: { readonly: false, type: 'var', values: [ ] } });
      });
    });
    describe('nonexisting variable', function () {
      beforeEach(function () {
        return Promise.resolve()
          .then(() => this.room.user.say('halkeye', 'unprotect $robins'));
      });

      it('responds with the right values', function () {
        this.room.messages.slice(-2).should.eql([
          [ 'halkeye', 'unprotect $robins' ],
          [ 'hubot', "@halkeye Sorry, I don't know of a variable 'robins'." ]
        ]);
      });
    });
    describe('already unprotected', function () {
      beforeEach(function () {
        return Promise.resolve()
          .then(() => this.room.user.say('halkeye', 'create var robins'))
          .then(() => this.room.user.say('halkeye', 'unprotect $robins'))
          .then(() => this.room.user.say('halkeye', 'unprotect $robins'));
      });

      it('responds with the right values', function () {
        this.room.messages.slice(-2).should.eql([
          [ 'halkeye', 'unprotect $robins' ],
          [ 'hubot', '@halkeye Okay.' ]
        ]);
        this.room.robot.brain.data.variables.should.eql({ robins: { readonly: false, type: 'var', values: [ ] } });
      });
    });
  });
  describe('add value', function () {
    it('missing value', function () {
      return Promise.resolve()
        .then(() => this.room.user.say('halkeye', 'add value robins Bruce Wayne'))
        .then(() => {
          this.room.messages.slice(-1).should.eql([
            [ 'hubot', "@halkeye Sorry, I don't know of a variable 'robins'." ]
          ]);
          this.room.robot.brain.data.variables.should.not.have.property('robins');
        });
    });
    it('nested variables', function () {
      return Promise.resolve()
        .then(() => this.room.user.say('halkeye', 'create var robins'))
        .then(() => this.room.user.say('halkeye', 'add value robins $nightwings'))
        .then(() => {
          this.room.messages.slice(-1).should.eql([
            [ 'hubot', '@halkeye Sorry, no nested values please.' ]
          ]);
          this.room.robot.brain.data.variables.should.eql({
            robins: {
              readonly: false,
              type: 'var',
              values: [ ]
            }
          });
        });
    });
    it('add single value', function () {
      return Promise.resolve()
        .then(() => this.room.user.say('halkeye', 'create var robins'))
        .then(() => this.room.user.say('halkeye', 'var robins type noun'))
        .then(() => this.room.user.say('halkeye', 'add value robins Dick Grayson'))
        .then(() => {
          this.room.messages.slice(-1).should.eql([
            [ 'hubot', '@halkeye Okay.' ]
          ]);
          this.room.robot.brain.data.variables.should.eql({
            robins: {
              readonly: false,
              type: 'noun',
              values: [ 'Dick Grayson' ]
            }
          });
        });
    });
    it('duplicated variable (lowercase)', function () {
      return Promise.resolve()
        .then(() => this.room.user.say('halkeye', 'create var robins'))
        .then(() => this.room.user.say('halkeye', 'var robins type noun'))
        .then(() => this.room.user.say('halkeye', 'add value robins Dick Grayson'))
        .then(() => this.room.user.say('halkeye', 'add value robins dick grayson'))
        .then(() => {
          this.room.messages.slice(-1).should.eql([
            [ 'hubot', '@halkeye I had it that way!' ]
          ]);
          this.room.robot.brain.data.variables.should.eql({
            robins: {
              readonly: false,
              type: 'noun',
              values: [ 'Dick Grayson' ]
            }
          });
        });
    });
    it('error on protected variable', function () {
      return Promise.resolve()
        .then(() => this.room.user.say('halkeye', 'create var robins'))
        .then(() => this.room.user.say('halkeye', 'var robins type noun'))
        .then(() => this.room.user.say('halkeye', 'protect $robins'))
        .then(() => this.room.user.say('halkeye', 'add value robins Tim Drake'))
        .then(() => {
          this.room.messages.slice(-1).should.eql([
            [ 'hubot', "@halkeye Sorry, you don't have permissions to edit 'robins'." ]
          ]);
          this.room.robot.brain.data.variables.should.eql({
            robins: {
              readonly: true,
              type: 'noun',
              values: [ ]
            }
          });
        });
    });
  });
  describe('remove value', function () {
    it('missing value', function () {
      return Promise.resolve()
        .then(() => this.room.user.say('halkeye', 'remove value robins Bruce Wayne'))
        .then(() => {
          this.room.messages.slice(-1).should.eql([
            [ 'hubot', "@halkeye Sorry, I don't know of a variable 'robins'." ]
          ]);
          this.room.robot.brain.data.variables.should.not.have.property('robins');
        });
    });
    it('remove single value', function () {
      return Promise.resolve()
        .then(() => this.room.user.say('halkeye', 'create var robins'))
        .then(() => this.room.user.say('halkeye', 'var robins type noun'))
        .then(() => this.room.user.say('halkeye', 'add value robins Bruce Wayne'))
        .then(() => this.room.user.say('halkeye', 'remove value robins Bruce Wayne'))
        .then(() => {
          this.room.messages.slice(-1).should.eql([
            [ 'hubot', '@halkeye Okay.' ]
          ]);
          this.room.robot.brain.data.variables.should.eql({
            robins: {
              readonly: false,
              type: 'noun',
              values: [ ]
            }
          });
        });
    });
    it('error on protected variable', function () {
      return Promise.resolve()
        .then(() => this.room.user.say('halkeye', 'create var robins'))
        .then(() => this.room.user.say('halkeye', 'var robins type noun'))
        .then(() => this.room.user.say('halkeye', 'add value robins Tim Drake'))
        .then(() => this.room.user.say('halkeye', 'protect $robins'))
        .then(() => this.room.user.say('halkeye', 'remove value robins Bruce Wayne'))
        .then(() => {
          this.room.messages.slice(-1).should.eql([
            [ 'hubot', "@halkeye Sorry, you don't have permissions to edit 'robins'." ]
          ]);
          this.room.robot.brain.data.variables.should.eql({
            robins: {
              readonly: true,
              type: 'noun',
              values: [ 'Tim Drake' ]
            }
          });
        });
    });
  });
  describe('list var', function () {
    it('missing value', function () {
      return Promise.resolve()
        .then(() => this.room.user.say('halkeye', 'list var robins'))
        .then(() => {
          this.room.messages.slice(-2).should.eql([
            [ 'halkeye', 'list var robins' ],
            [ 'hubot', "@halkeye Sorry, I don't know of a variable 'robins'." ]
          ]);
        });
    });
    it('lists single value', function () {
      return Promise.resolve()
        .then(() => this.room.user.say('halkeye', 'create var robins'))
        .then(() => this.room.user.say('halkeye', 'var robins type noun'))
        .then(() => this.room.user.say('halkeye', 'add value robins Dick Grayson'))
        .then(() => this.room.user.say('halkeye', 'list var robins'))
        .then(() => {
          this.room.messages.slice(-2).should.eql([
            [ 'halkeye', 'list var robins' ],
            [ 'hubot', '@halkeye Dick Grayson' ]
          ]);
          this.room.robot.brain.data.variables.should.eql({
            robins: {
              readonly: false,
              type: 'noun',
              values: [ 'Dick Grayson' ]
            }
          });
        });
    });
    it('lists multiple values', function () {
      return Promise.resolve()
        .then(() => this.room.user.say('halkeye', 'create var robins'))
        .then(() => this.room.user.say('halkeye', 'var robins type noun'))
        .then(() => this.room.user.say('halkeye', 'add value robins Dick Grayson'))
        .then(() => this.room.user.say('halkeye', 'add value robins Jason Todd'))
        .then(() => this.room.user.say('halkeye', 'add value robins Tim Drake'))
        .then(() => this.room.user.say('halkeye', 'add value robins Stephanie Brown'))
        .then(() => this.room.user.say('halkeye', 'add value robins Damian Wayne'))
        .then(() => this.room.user.say('halkeye', 'list var robins'))
        .then(() => {
          this.room.messages.slice(-2).should.eql([
            [ 'halkeye', 'list var robins' ],
            [ 'hubot', '@halkeye Dick Grayson, Jason Todd, Tim Drake, Stephanie Brown, Damian Wayne' ]
          ]);
          this.room.robot.brain.data.variables.should.eql({
            robins: {
              readonly: false,
              type: 'noun',
              values: [
                'Dick Grayson',
                'Jason Todd',
                'Tim Drake',
                'Stephanie Brown',
                'Damian Wayne'
              ]
            }
          });
        });
    });
  });

  describe('list vars/set vars', function () {
    beforeEach(function () {
      return Promise.resolve()
        .then(() => this.room.user.say('halkeye', 'create var robins'))
        .then(() => this.room.user.say('halkeye', 'var robins type noun'))
        .then(() => this.room.user.say('halkeye', 'add value robins Dick Grayson'))
        .then(() => this.room.user.say('halkeye', 'create var actions'))
        .then(() => this.room.user.say('halkeye', 'var actions type verb'))
        .then(() => this.room.user.say('halkeye', 'add value actions chop'))
        .then(() => this.room.user.say('halkeye', 'create var digit'))
        .then(() => this.room.user.say('halkeye', 'add value digit 1'))
        .then(() => this.room.user.say('halkeye', 'var totally_unknown type verb'))
        .then(() => this.room.user.say('halkeye', 'list vars'));
    });

    it('responds with the right values', function () {
      this.room.messages.slice(-3).should.eql([
        [ 'hubot', "@halkeye Sorry, I don't know of a variable 'totally_unknown'." ],
        [ 'halkeye', 'list vars' ],
        [ 'hubot', '@halkeye robins(n), actions(v), digit' ]
      ]);
      this.room.robot.brain.data.variables.should.eql({
        robins: { readonly: false, type: 'noun', values: [ 'Dick Grayson' ] },
        actions: { readonly: false, type: 'verb', values: [ 'chop' ] },
        digit: { readonly: false, type: 'var', values: [ '1' ] }
      });
    });
  });
});

