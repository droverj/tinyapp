const findUserByEmail = (email, database) => {
  for (const item in database) {
    if (database[item].email === email) {
      return database[item].id;
    }
  }
};

module.exports = findUserByEmail;