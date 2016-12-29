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

  describe('create var robins', function () {
    beforeEach(function () { return this.room.user.say('halkeye', 'create var robins'); });

    it('responds with the right values', function () {
      this.room.messages.should.eql([
        [ 'halkeye', 'create var robins' ],
        [ 'hubot', '@halkeye Okay.' ],
      ]);
    });
    it('has variable robins', function () {
      this.room.robot.variables.hasVariable('robins');
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
        [ 'hubot', '@halkeye Okay.' ],
      ]);
    });
    it('has variable robins', function () {
      this.room.robot.variables.hasVariable('robins');
    });
  });

  describe('list vars', function () {
    beforeEach(function () {
      return this.room.user.say('halkeye', 'create var robins')
        .then(() => this.room.user.say('halkeye', 'add value robins Dick Grayson'))
        .then(() => this.room.user.say('halkeye', 'list vars'));
    });

    it('responds with the right values', function () {
      this.room.messages.should.eql([
        [ 'halkeye', 'create var robins' ],
        [ 'hubot', '@halkeye Okay.' ],
        [ 'halkeye', 'add value robins Dick Grayson' ],
        [ 'hubot', '@halkeye Okay.' ],
        [ 'halkeye', 'list vars' ],
        [ 'hubot', '@halkeye robins' ]
      ]);
    });
  });
});

