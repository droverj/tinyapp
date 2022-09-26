// express_server.js
const express = require('express');
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require('cookie-session');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');

app.set('view engine', 'ejs');
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'session',
  keys: ["some-long-secret"],

  // Cookie Options
  // maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

const users = {
  addUser: function(id, email, password) {
    users[id] = {};
    users[id]["id"] = id;
    users[id]["email"] = email;
    users[id]["password"] = password;
  },
  verify: function(email, password) {
    const usersArray = Object.values(users);

    const user = usersArray.find((user) => {
      return user.email === email && user.password === password;
    });
    return user;
  },
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
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

const urlDatabase = {
  "b2xVn2": {
    longURL:  "http://www.lighthouselabs.ca",
    userID:   "default"
  },
  "9sm5xK": {
    longURL:  "http://www.google.com",
    userID:   "default"
  }
};

const urlsForUser = id => {
  let userURLs = {};
  for (const item in urlDatabase) {
    if (urlDatabase[item].userID === "default") {
      userURLs[item] = {};
      userURLs[item]["longURL"] = urlDatabase[item].longURL;
      userURLs[item]["userID"] = urlDatabase[item].userID;
    }
    if (urlDatabase[item].userID === id) {
      userURLs[item] = {};
      userURLs[item]["longURL"] = urlDatabase[item].longURL;
      userURLs[item]["userID"] = urlDatabase[item].userID;
    }
  }
  return userURLs;
};

const findUser = (email, database) => {
  for (const item in database) {
    if (database[item].email === email) {
      return database[item].id;
    }
  }
};

const findLongURL = (id, userURLs) => {
  let longURL = '';
  for (const item in userURLs) {
    if (item === id) {
      longURL = userURLs[item].longURL;
    }
  }
  return longURL;
};

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/login", (req, res) => {
  const user_id = req.session.user_id;

  if (user_id) {
    res.redirect("/urls");
  }
  const templateVars = { user: user_id, userDatabase: users };
  res.render("urls_login", templateVars);
});

app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  console.log(user_id);
  const userUrlDatabase = urlsForUser(user_id);
  
  if (!user_id) {
    res.redirect("/login");
  }
  const templateVars = { urls: userUrlDatabase, user: user_id, userDatabase: users };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;

  if (!user_id) {
    res.redirect("/login");
  }
  const templateVars = { user: user_id, userDatabase: users };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const { user_id } = req.session;

  if (user_id) {
    res.redirect("/urls");
  }
  const templateVars = { user: user_id, userDatabase: users };
  res.render("urls_registration", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const user_id = req.session.user_id;
  const id = req.params.id;
  const userUrlDatabase = urlsForUser(user_id);
  
  if (!user_id) {
    return res.status(403).send('Please login to TinyApp to access this URL.');
  }

  if (!userUrlDatabase[id]) {
    return res.status(403).send('You do not own this URL.');
  }
  
  const templateVars = { id: id, urls: userUrlDatabase, user: user_id, userDatabase: users };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const user_id = req.session.user_id;
  const userURLs = urlsForUser(user_id);
  const longURL = findLongURL(req.params.id, userURLs);

  if (!longURL) {
    return res.status(400).send('Invalid short URL ID');
  }
  res.redirect(longURL);
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user_id = findUser(email, users);
  const userEmail = users[user_id];

  if (userEmail) {
    return res.status(400).send('Please use a different email address.');
  } else if (!email || !password) {
    return res.status(400).send('Please fill in the required fields.');
  } else {
    users.addUser(id, email, hashedPassword);
  }

  req.session.user_id = id;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const user_id = req.session.user_id;

  if (!user_id) {
    return res.status(403).send('You must be logged in to use TinyApp');
  }

  const id = generateRandomString();
  urlDatabase[id] = {};
  urlDatabase[id]["longURL"] = req.body.longURL;
  urlDatabase[id]["userID"] = user_id;

  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const user_id = req.session.user_id;

  if (!urlsForUser(user_id)) {
    return res.status(403).send('You do not own this URL.');
  }

  if (!user_id) {
    return res.status(403).send('You must be logged in to use TinyApp');
  }

  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user_id = findUser(email, users);
  
  if (!user_id) {
    res.redirect("/register");
  }
  
  const hashedPassword = users[user_id].password;
  if (!email || !password) {
    return res.status(400).send('Please fill in the required fields.');
  }

  if (!bcrypt.compareSync(password, hashedPassword)) {
    return res.status(403).send('User not found.');
  } 

  req.session.user_id = user_id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.post("/urls/:id", (req, res) => {
  const user_id = req.session.user_id;
  const { email, password } = users[user_id];
  const verifyEmail = verify(email, password);

  if (!urlsForUser(user_id)) {
    return res.status(403).send('You do not own this URL.');
  }

  if (!verifyEmail) {
    return res.status(403).send('Please sign up for TinyApp to access it.');
  }

  if (!user_id) {
    return res.status(403).send('You must be logged in to use TinyApp');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

