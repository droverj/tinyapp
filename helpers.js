const findUserByEmail = (email, database) => {
  for (const item in database) {
    if (database[item].email === email) {
      return database[item].id;
    }
  }
};

const generateRandomString = () => {
  let result = '';
  const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.random() * characters.length);
  }
  return result;
};

const urlsForUser = (id, database) => {
  let userURLs = {};
  for (const item in database) {
    if (database[item].userID === id) {
      userURLs[item] = {};
      userURLs[item]["longURL"] = database[item].longURL;
      userURLs[item]["userID"] = database[item].userID;
    }
  }
  return userURLs;
};

const addUser = (id, email, password, userDatabase) => {
  userDatabase[id] = {};
  userDatabase[id]["id"] = id;
  userDatabase[id]["email"] = email;
  userDatabase[id]["password"] = password;
};

const verify = (email, password) => {
  const usersArray = Object.values(users);

  const user = usersArray.find((user) => {
    return user.email === email && user.password === password;
  });
  return user;
};

module.exports = {
  findUserByEmail,
  generateRandomString,
  urlsForUser,
  findLongURL,
  addUser,
  verify
};
