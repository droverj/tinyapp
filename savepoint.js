// express_server.js
const express = require('express');
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

app.set('view engine', 'ejs');
app.use(morgan('dev'));
app.use(cookieParser());

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

const findLongURL = id => {
  let longURL = '';
  for (const item in urlDatabase) {
    if (item === id) {
      longURL = urlDatabase[item].longURL;
    }
    return longURL;
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

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:id", (req, res) => {
  const longURL = findLongURL(req.params.id);
  if (!longURL) {
    return res.status(400).send('Invalid short URL ID');
  }
  res.redirect(longURL);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/login", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  }
  const templateVars = { user: req.cookies["user_id"], userDatabase: users };
  res.render("urls_login", templateVars);
});

app.get("/urls", (req, res) => {
    if (!req.cookies["user_id"]) {
    res.redirect("/login");
  }
  const templateVars = { urls: urlDatabase, user: req.cookies["user_id"], userDatabase: users };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
  }
  const templateVars = { user: req.cookies["user_id"], userDatabase: users };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  }
  const templateVars = { user: req.cookies["user_id"], userDatabase: users };
  res.render("urls_registration", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, urls: urlDatabase, user: req.cookies["user_id"], userDatabase: users };
  res.render("urls_show", templateVars);
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const id = generateRandomString();

  const usersArray = Object.values(users);
  usersArray.find((user) => {
    if (user.email === email) {
      return res.status(400).send('Please use a different email address.');
    } else {
      users.addUser(id, email, password);
    }
  });

  if (!email || !password) {
    return res.status(400).send('Please fill in the required fields.');
  }

  res.cookie("user_id", id);
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  // const userId = req.cookies["user_id"];
  // if (!userId) {
  //   return res.status(403).send('You must be logged in to use TinyApp');
  // }

  const id = generateRandomString();
  urlDatabase[id] = {};
  urlDatabase[id]["longURL"] = req.body.longURL;
  urlDatabase[id]["userID"] = userId;

  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  let user;

  if (!email || !password) {
    return res.status(400).send('Please fill in the required fields.');
  } else if (!users.verify(email, password)) {
    return res.status(403).send('User not found.');
  } else {
    user = users.verify(email, password).id;
    console.log(user);
  }
  res.cookie("user_id", user);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});