// express_server.js
const { findUserByEmail, generateRandomString, urlsForUser, addUser, verify } = require('./helpers');
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

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

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
    return res.redirect("/login");
  }

  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const { userId } = req.session;
  const { id } = req.params;
  const userUrlDatabase = urlsForUser(userId, urlDatabase);
  const templateVars = { id: id, urls: userUrlDatabase, user: userId, userDatabase: users };

  if (!userId) {
    return res.status(403).send('Please login to TinyApp to access this URL.');
  }

  if (!userUrlDatabase[id]) {
    return res.status(403).send('You do not own this URL.');
  }

  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const { id } = req.params;
  const { longURL } = urlDatabase[id]

  if (!longURL) {
    return res.status(400).send('Invalid short URL ID');
  }

  res.redirect(longURL);
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  const verifyUser = findUserByEmail(email, users);

  if (verifyUser) {
    return res.status(400).send('Please use a different email address.');
  } else if (!email || !password) {
    return res.status(400).send('Please fill in the required fields.');
  } else {
    addUser(id, email, hashedPassword, users);
    req.session.userId = id;
  }

  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const { userId } = req.session;

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