/* eslint-disable semi */
/* eslint-disable quotes */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const express = require("express");
var csrf = require("tiny-csrf");
const app = express();
const { Sports, Sessions, User, sessionPlayers } = require("./models");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
app.use(bodyParser.json());
const path = require("path");
const { Op } = require("sequelize");

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");

const saltRounds = 10;
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

app.use(
  session({
    secret: "my_super-secret-key-2148411464649777996311316",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid Password" });
          }
        })
        .catch((error) => {
          return done(null, false, { message: "Invalid E-mail or Password" });
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.get("/", async (request, response) => {
  response.render("index", {
    title: "Sports Scheduler",
    csrfToken: request.csrfToken(),
  });
});

app.get("/signup", (request, response) => {
  // if (request.isAuthenticated()) {
  //   return response.redirect("/todos");
  // }
  response.render("signup", {
    title: "Signup",
    csrfToken: request.csrfToken(),
  });
});

app.get("/login", async (request, response) => {
  // if (request.isAuthenticated()) {
  //   return response.redirect("/todos");
  // }
  response.render("login", {
    title: "Login",
    csrfToken: request.csrfToken(),
  });
});

app.post("/users", async (request, response) => {
  //Hash password using bcrypt
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  //Have to create the uer here
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      response.redirect("/home");
    });
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    // failureFlash: true,
  }),
  async (request, response) => {
    console.log(request.user);
    response.redirect("/home");
  }
);

app.get(
  "/home",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const loggedInUser = request.user.id;
      let user = await User.getUser(loggedInUser);
      console.log(request.user);
      const SportsList = await Sports.getSportsList();
      // console.log(SportsList)
      if (request.accepts("html")) {
        response.render("home", {
          title: "Sports Application",
          SportsList,
          csrfToken: request.csrfToken(),
        });
      } else {
        response.json({
          SportsList,
        });
      }
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get("/signout", (request, response, next) => {
  //Signout
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.get(
  "/createsport",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response, next) => {
    response.render("createsport", {
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/sports",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    // console.log("Creating a Sport", request.body)
    // Sports Adding
    try {
      const listSports = await Sports.addSport({
        sportsname: request.body.sportsname,
      });
      return response.redirect("/home");
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/sports/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    // console.log("Sports Id ",request.params);
    const sportsId = request.params.id;
    const sportsname = await Sports.getSportsTitle(sportsId);
    const sessionsList = await Sessions.upComingSessions(sportsId);
    console.log(sessionsList);
    response.render("session", {
      sessionsList,
      sportsId,
      sportsname,
      csrfToken: request.csrfToken(),
    });
    console.log("Session", sessionsList);
  }
);

app.post(
  "/sessions",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    // console.log("Creating a session", request.body)
    const sportsId = request.body.sportsId;
    // console.log("Sports Id", sportsId);
    const sessionDate = new Date(request.body.sessionDate);
    const formattedSessionDate = sessionDate.toISOString().slice(0, 16);
    try {
      const session = await Sessions.createSession({
        sessionDate: formattedSessionDate,
        sessionVenue: request.body.sessionVenue,
        sessionPlayers: request.body.sessionPlayers.split(","),
        sessionCount: request.body.sessionCount,
        sportsId: request.body.sportsId,
      });
      return response.redirect(`/sessions/${session.id}`);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/sports/:id/new-session",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sportsId = request.params.id;
    const sportsname = await Sports.getSportsTitle(sportsId);
    console.log(sportsname);
    response.render("createSession", {
      sportsId,
      sportsname,
      csrfToken: request.csrfToken(),
    });
  }
);

app.get(
  "/sessions/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sessionId = request.params.id;
    console.log(sessionId);
    const sessionDetails = await Sessions.getSessionDetails(sessionId);
    console.log(sessionDetails);
    const sportsname = await Sports.getSportsTitle(sessionDetails.sportsId);
    console.log(sportsname);
    response.render("sessionDetails", {
      sessionId,
      sessionDetails,
      sportsname,
      csrfToken: request.csrfToken(),
    });
  }
);

module.exports = app;
