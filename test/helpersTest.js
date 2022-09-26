const { assert } = require('chai');

const { findUserByEmail } = require('../helpers');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('findUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = findUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.strictEqual(expectedUserID, user);
  });
});

describe('findUserByEmail', function() {
  it('should return undefined if passed an invalid email', function() {
    const user = findUserByEmail("user@@xample.com", testUsers);
    const expectedUserID = undefined;
    assert.strictEqual(expectedUserID, user);
  });
});