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
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
    onlineStatus: false
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
    onlineStatus: false
  },
  addUser: function(id, email, password) {
    users[id] = {};
    users[id]["id"] = id;
    users[id]["email"] = email;
    users[id]["password"] = password;
    users[id]["onlineStatus"] = false;
  },
  verify: function(verification) {
    for (const item in users) {
      if (users[item][verification] === verification) {
        return true;
      }
    }
    return false;
  },
  changeStatus: function(checkEmail, status) {
    for (const item in users) {
      if (users[item].email === checkEmail) {
        return users[item].onlineStatus = status;
      }
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

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/login", (req, res) => {
  const templateVars = { user: req.cookies["user_id"], userDatabase: users };
  res.render("urls_login", templateVars);
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: req.cookies["user_id"], userDatabase: users };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: req.cookies["user_id"], userDatabase: users };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { user: req.cookies["user_id"], userDatabase: users };
  res.render("urls_registration", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user: req.cookies["user_id"], userDatabase: users };
  res.render("urls_show", templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = generateRandomString();

  if (!users.verify(email)) {
    users.addUser(id, email, password);
    users.changeStatus(email, true);

  } else {
    return res.status(400).send('This email address is already in use.');
  }

  if (!email || !password) {
    return res.status(400).send('Please fill in the required fields.');
  }

  res.cookie("user_id", id);
  res.cookie("email", email);
  res.redirect("/urls");
});


app.post("/urls", (req, res) => {
  const id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = generateRandomString();
  users.changeStatus(email, true);

  if (!users.verify(email)) {
    return res.status(403).send('Your credentials did not match our system.');
  } else if (!email || !password) {
    return res.status(400).send('Please fill in the required fields.');
  } else {
    if (!users.verify(password)) {
      return res.status(403).send('Incorrect credentials.');
    }
  }
  
  res.cookie("user_id", id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  const email = req.cookies.email;
  users.changeStatus(email, false);
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

