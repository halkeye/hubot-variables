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

    it('has variable robins', function () {
      this.room.robot.variables.hasVariable('robins');
    });
  });
});

