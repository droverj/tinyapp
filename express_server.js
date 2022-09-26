// express_server.js
const express = require('express');
const app = express();
const PORT = 8080;
const cookieSession = require('cookie-session');
app.use(express.urlencoded({ extended: true }));
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const { findUserByEmail, generateRandomString, urlsForUser, findLongURL, addUser, verify } = require('./helpers');

app.set('view engine', 'ejs');
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'session',
  keys: ["some-long-secret"],
}));

const users = {
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

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "default"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "default"
  }
};

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
  const userId = req.session.userId;

  if (userId) {
    res.redirect("/urls");
  }
  const templateVars = { user: userId, userDatabase: users };
  res.render("urls_login", templateVars);
});

app.get("/urls", (req, res) => {
  const userId = req.session.userId;
  const userUrlDatabase = urlsForUser(userId, urlDatabase);

  if (!userId) {
    res.redirect("/login");
  }
  const templateVars = { urls: userUrlDatabase, user: userId, userDatabase: users };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    res.redirect("/login");
  }

  const templateVars = { user: userId, userDatabase: users };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const userId = req.session.userId;

  if (userId) {
    res.redirect("/urls");
  }

  const templateVars = { user: userId, userDatabase: users };
  res.render("urls_registration", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.session.userId;
  const id = req.params.id;
  const userUrlDatabase = urlsForUser(userId, urlDatabase);

  if (!userId) {
    return res.status(403).send('Please login to TinyApp to access this URL.');
  }

  if (!userUrlDatabase[id]) {
    return res.status(403).send('You do not own this URL.');
  }

  const templateVars = { id: id, urls: userUrlDatabase, user: userId, userDatabase: users };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const userId = req.session.userId;
  const userURLs = urlsForUser(userId, urlDatabase);
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
  const userId = findUserByEmail(email, users);
  const userEmail = users[userId];

  if (userEmail) {
    return res.status(400).send('Please use a different email address.');
  } else if (!email || !password) {
    return res.status(400).send('Please fill in the required fields.');
  } else {
    addUser(id, email, hashedPassword, users);
  }

  req.session.userId = id;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(403).send('You must be logged in to use TinyApp');
  }

  const id = generateRandomString();
  urlDatabase[id] = {};
  urlDatabase[id]["longURL"] = req.body.longURL;
  urlDatabase[id]["userID"] = userId;

  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.userId;

  if (!urlsForUser(userId, urlDatabase)) {
    return res.status(403).send('You do not own this URL.');
  }

  if (!userId) {
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
  const userId = findUserByEmail(email, users);

  if (!userId) {
    res.redirect("/register");
  }

  const hashedPassword = users[userId].password;
  if (!email || !password) {
    return res.status(400).send('Please fill in the required fields.');
  }

  if (!bcrypt.compareSync(password, hashedPassword)) {
    return res.status(403).send('User not found.');
  }

  req.session.userId = userId;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.post("/urls/:id", (req, res) => {
  const userId = req.session.userId;
  const { email, password } = users[userId];
  const verifyEmail = verify(email, password);

  if (!urlsForUser(userId, urlDatabase)) {
    return res.status(403).send('You do not own this URL.');
  }

  if (!verifyEmail) {
    return res.status(403).send('Please sign up for TinyApp to access it.');
  }

  if (!userId) {
    return res.status(403).send('You must be logged in to use TinyApp');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});