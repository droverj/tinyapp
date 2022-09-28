// express_server.js
const { findUserByEmail, generateRandomString, urlsForUser, addUser } = require('./helpers');
const { users, urlDatabase } = require('./databases');
const express = require('express');
const cookieSession = require('cookie-session');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080;

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'session',
  keys: ["some-long-secret"],
}));

app.get("/", (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

app.get("/register", (req, res) => {
  const { userId } = req.session;
  const templateVars = { user: userId, userDatabase: users };

  if (userId) {
    return res.redirect("/urls");
  }

  res.render("urls_registration", templateVars);
});

app.get("/login", (req, res) => {
  const { userId } = req.session;
  const templateVars = { user: userId, userDatabase: users };

  if (userId) {
    return res.redirect("/urls");
  }

  res.render("urls_login", templateVars);
});

app.get("/urls", (req, res) => {
  const { userId } = req.session;
  const userUrlDatabase = urlsForUser(userId, urlDatabase);
  const templateVars = { urls: userUrlDatabase, user: userId, userDatabase: users };

  if (!userId) {
    return res.redirect("/login");
  }

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const { userId } = req.session;
  const templateVars = { user: userId, userDatabase: users };

  if (!userId) {
    return res.status(404).send('Please <a href="/login"> login </a> to create a short URL.');
  }

  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const { userId } = req.session;
  const { id } = req.params;
  const userUrlDatabase = urlsForUser(userId, urlDatabase);
  const templateVars = { id: id, urls: userUrlDatabase, user: userId, userDatabase: users };

  if (!userId) {
    return res.status(403).send('Please <a href="/login"> login </a> to use TinyApp');
  }
  if (!urlDatabase[id]) {
    return res.status(404).send('This short URL is invalid. <a href="/urls/"> Return </a> to your URLs.');
  }
  if (!userUrlDatabase[id] && userId) {
    return res.status(403).send('You do not own this URL. Go <a href="/urls/new"> here </a> to create your own link.');
  }

  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const { userId } = req.session;
  const { id } = req.params;

  if (!urlDatabase[id] && userId) {
    return res.status(404).send('Invalid short URL ID. Go <a href="/urls/new"> here </a> to create a new link. Go <a href="/urls"> here </a> to return to your URLs.');
  }

  if (!urlDatabase[id] && !userId) {
    return res.status(404).send('Invalid short URL ID. Please <a href="/login"> login </a> to create a new link.');
  }

  const longURL = urlDatabase[id].longURL;
  res.redirect(longURL);
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  const verifyUser = findUserByEmail(email, users);

  if (verifyUser) {
    return res.status(400).send('Please <a href="/register"> try again </a> with a different email address.');
  } else if (!email || !password) {
    return res.status(400).send('Please fill in all the required fields and <a href="/register"> try again</a>.');
  } else {
    addUser(id, email, hashedPassword, users);
    req.session.userId = id;
  }
  
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const userId = findUserByEmail(email, users);

  if (!email || !password) {
    return res.status(400).send('Please fill in the required fields.');
  }

  if (!userId) {
    return res.status(403).send('Please <a href="/register"> Sign Up </a> to use TinyApp');
  }

  const hashedPassword = users[userId].password;

  if (!bcrypt.compareSync(password, hashedPassword)) {
    return res.status(403).send('User not found.');
  }

  req.session.userId = userId;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const { userId } = req.session;

  if (!userId) {
    return res.status(403).send('Please <a href="/login"> login </a> to use TinyApp');
  }

  const id = generateRandomString();
  urlDatabase[id] = {};
  urlDatabase[id]["longURL"] = req.body.longURL;
  urlDatabase[id]["userID"] = userId;

  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const { userId } = req.session;
  const { id } = req.params;
  const verifyOwnership = urlDatabase[id].userID;

  if (verifyOwnership !== userId) {
    return res.status(403).send('You do not own this URL.\n');
  }

  if (!userId) {
    return res.status(403).send('Please login to use TinyApp');
  }

  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.post("/urls/:id", (req, res) => {
  const { userId } = req.session;
  const { id } = req.params;
  const { longURL } = req.body;
  const verifyOwnership = urlDatabase[id].userID;

  if (!userId) {
    return res.status(403).send('Please login to use TinyApp\n');
  }

  if (verifyOwnership !== userId) {
    return res.status(403).send('You do not own this URL and therefore may not edit it.\n');
  }

  urlDatabase[id].longURL = longURL;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});