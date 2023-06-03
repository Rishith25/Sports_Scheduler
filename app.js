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
const flash = require("connect-flash");

app.set("views", path.join(__dirname, "views"));
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const { error } = require("console");

app.use(flash());

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

app.use(async function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

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
  // console.log("Serializing user in session", user.id);
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
  response.render("signup", {
    title: "Signup",
    csrfToken: request.csrfToken(),
  });
});

app.get("/login", async (request, response) => {
  response.render("login", {
    title: "Login",
    csrfToken: request.csrfToken(),
  });
});

app.post("/users", async (request, response) => {
  if (
    request.body.firstName.length == 0 &&
    request.body.email.length == 0 &&
    request.body.password.length == 0
  ) {
    request.flash("error", "First Name can not be Empty");
    request.flash("error", "Email can not be Empty");
    request.flash("error", "Password can not be Empty");
    return response.redirect("/signup");
  }
  if (
    request.body.firstName.length == 0 &&
    request.body.email.length == 0 &&
    request.body.password.length != 0
  ) {
    request.flash("error", "Email can not be Empty");
    request.flash("error", "First Name can not be Empty");
    return response.redirect("/signup");
  }
  if (
    request.body.firstName.length == 0 &&
    request.body.email.length != 0 &&
    request.body.password.length == 0
  ) {
    request.flash("error", "First Name can not be Empty");
    request.flash("error", "Password can not be Empty");
    return response.redirect("/signup");
  }
  if (
    request.body.firstName.length == 0 &&
    request.body.email.length != 0 &&
    request.body.password.length != 0
  ) {
    request.flash("error", "First Name can not be Empty");
    return response.redirect("/signup");
  }
  if (
    request.body.firstName.length != 0 &&
    request.body.email.length == 0 &&
    request.body.password.length == 0
  ) {
    request.flash("error", "Email can not be Empty");
    request.flash("error", "Password can not be Empty");
    return response.redirect("/signup");
  }
  if (
    request.body.firstName.length != 0 &&
    request.body.email.length == 0 &&
    request.body.password.length != 0
  ) {
    request.flash("error", "Email can not be Empty");
    return response.redirect("/signup");
  }
  if (
    request.body.firstName.length != 0 &&
    request.body.email.length != 0 &&
    request.body.password.length == 0
  ) {
    request.flash("error", "Password can not be Empty");
    return response.redirect("/signup");
  }
  //Hash password using bcrypt

  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  //Have to create the uer here
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
      role: "user",
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
    failureFlash: true,
  }),
  async (request, response) => {
    response.redirect("/home");
  }
);

app.get(
  "/home",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      //User Details
      const loggedInUserId = request.user.id;
      let user = await User.getUser(loggedInUserId);
      const userName = request.user.firstName + " " + request.user.lastName;

      //isAdmin
      let isAdmin = false;
      if (user.role == "admin") {
        isAdmin = true;
      }
      //User Joined Sesseions
      const sessions = await sessionPlayers.getSessionsJoined(loggedInUserId);
      // console.log("Sessions Joined", sessions);
      const listOfSessionsJoined = [];
      for (var i = 0; i < sessions.length; i++) {
        listOfSessionsJoined.push(sessions[i].sessionId);
      }
      const sessionDetails = await Sessions.getSessionsById(
        listOfSessionsJoined
      );
      // console.log(sessionDetails);
      const UserSessionsCreated = await Sessions.getSessionByUserId(
        loggedInUserId
      );

      //List Of Sports
      const SportsList = await Sports.getSportsList();
      // console.log(SportsList)
      if (request.accepts("html")) {
        response.render("home", {
          title: "Sports Scheduler",
          SportsList,
          userName,
          user,
          isAdmin,
          UserSessionsCreated,
          sessionDetails,
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
  "/reports",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const startDate = request.query.startDate;
    const toDate = request.query.toDate;
    if (startDate > toDate) {
      response.flash("error", "Start Date Should be less than To Date");
      return response.redirect("/reports");
    }

    const user = request.user;
    const userName = request.user.firstName + " " + request.user.lastName;
    const SportList = await Sports.getSportsList();
    let sessionCount = [];
    let sportsNames = [];
    let sportsIds = [];
    for (let i = 0; i < SportList.length; i++) {
      const count = await Sessions.countSessionsAll(SportList[i].id);
      sessionCount.push(count);
      sportsNames.push({
        sportsname: SportList[i].sportsname,
        sportsId: SportList[i].id,
        sessions: count,
      });
    }
    console.log(sessionCount);
    console.log(sportsNames);

    var sessionsPerSport = {};

    for (let i = 0; i < SportList.length; i++) {
      sessionsPerSport[sportsNames[i][0]] = sessionCount[i];
    }

    var list = Object.entries(sportsNames); //sessionsPerSports in array format = [['Sport Name', 'count']...]

    list.sort((first, second) => {
      return second[1].sessions - first[1].sessions;
    });
    console.log(list);

    response.render("reports", {
      title: "Sports Scheduler",
      userName,
      user,
      list,
      startDate,
      toDate,
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/reports",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const user = request.user;
      const userName = request.user.firstName + " " + request.user.lastName;
      const startDate = request.body.startDate;
      const toDate = request.body.toDate;
      if (startDate.length == 0 && toDate.length == 0) {
        request.flash("error", "Start Date and To Date Can not be empty");
        return response.redirect("/reports");
      }
      if (startDate.length != 0 && toDate.length == 0) {
        request.flash("error", "To Date Can not be empty");
        return response.redirect("/reports");
      }
      if (startDate.length == 0 && toDate.length != 0) {
        request.flash("error", "Start Date Can not be empty");
        return response.redirect("/reports");
      }
      if (startDate > toDate) {
        request.flash("error", "Start Date is greater than To Date");
        return response.redirect("/reports");
      }
      const SportList = await Sports.getSportsList();
      let sessionCount = [];
      let sportsNames = [];
      for (let i = 0; i < SportList.length; i++) {
        const count = await Sessions.countSessions(
          SportList[i].id,
          startDate,
          toDate
        );
        sessionCount.push(count);
        sportsNames.push({
          sportsname: SportList[i].sportsname,
          sportsId: SportList[i].id,
          sessions: count,
        });
      }
      console.log(sportsNames);
      var sessionsPerSport = {};

      for (let i = 0; i < SportList.length; i++) {
        sessionsPerSport[sportsNames[i][0]] = sessionCount[i];
      }

      var list = Object.entries(sportsNames); //sessionsPerSports in array format = [['Sport Name', 'count']...]

      list.sort((first, second) => {
        return second[1].sessions - first[1].sessions;
      });
      console.log(list);

      response.render("reports", {
        title: "Sports Scheduler",
        userName,
        user,
        list,
        startDate,
        toDate,
        csrfToken: request.csrfToken,
      });
    } catch (error) {
      console.log(error);
      request.flash("error", "Please Fill start Date and end Date!");
      response.redirect("/reports");
    }
  }
);

app.get(
  "/sports/:id/reportDetails//",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const userName = request.user.firstName + " " + request.user.lastName;
      const user = request.user;
      const sportsId = request.params.id;

      const sportsname = await Sports.getSportsTitle(sportsId);
      const upComingSessions = await Sessions.upComingSessions(sportsId);
      const previousSessions = await Sessions.previousSessions(sportsId);
      const cancelledSessions = await Sessions.cancelledSessions(sportsId);

      response.render("reportDetails", {
        title: "Sports Scheduler",
        user,
        userName,
        sportsId,
        sportsname,
        upComingSessions,
        previousSessions,
        cancelledSessions,
        csrfToken: request.csrfToken(),
      });
    } catch {
      console.log(error);
    }
  }
);

app.get(
  "/sports/:id/reportDetails/:startDate/:toDate",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const userName = request.user.firstName + " " + request.user.lastName;
    const user = request.user;
    const sportsId = request.params.id;
    const startDate = request.params.startDate;
    const toDate = request.params.toDate;
    const sportsname = await Sports.getSportsTitle(sportsId);
    const upComingSessions = await Sessions.SessionsByDate(
      sportsId,
      startDate,
      toDate
    );
    console.log(upComingSessions);
    const cancelledSessions = await Sessions.cancelledSessionsByDate(
      sportsId,
      startDate,
      toDate
    );

    response.render("particularSportReport", {
      title: "Sports Scheduler",
      user,
      userName,
      sportsId,
      sportsname,
      startDate,
      toDate,
      upComingSessions,
      cancelledSessions,
      csrfToken: request.csrfToken(),
    });
  }
);

app.get(
  "/createsport",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response, next) => {
    const user = request.user;
    const userName = request.user.firstName + " " + request.user.lastName;
    response.render("createsport", {
      title: "Sports Scheduler",
      userName,
      user,
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/sports",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    // console.log("Creating a Sport", request.body)
    const sportname = request.body.sportname;
    // Sports Adding
    try {
      const listSports = await Sports.addSport({
        sportsname: request.body.sportsname,
      });
      return response.redirect("/home");
    } catch (error) {
      console.log(error);
      if (error.name == "SequelizeValidationError") {
        const errMsg = error.errors.map((error) => error.message);
        errMsg.forEach((message) => {
          if (message == "Validation notEmpty on sportsname failed") {
            request.flash("error", "Sport Name cannot be empty");
          }
        });
        return response.redirect("/createsport");
      } else if (error.name == "SequelizeUniqueConstraintError") {
        const errMsg = error.errors.map((error) => error.message);
        console.log(errMsg);
        errMsg.forEach((message) => {
          if (message == "sportsname must be unique") {
            request.flash("error", "Sport already created");
          }
        });
        return response.redirect("/createSport");
      } else {
        return response.status(422).json(error);
      }
    }
  }
);

app.get(
  "/sports/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    // console.log("Sports Id ",request.params);
    const user = request.user;
    const userName = request.user.firstName + " " + request.user.lastName;
    const sportsId = request.params.id;
    const sportsname = await Sports.getSportsTitle(sportsId);
    const sessionsList = await Sessions.upComingSessions(sportsId);
    // console.log(sessionsList);
    response.render("session", {
      user,
      userName,
      title: "Sports Scheduler",
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
    // const sessionDate = new Date(request.body.sessionDate);
    // const formattedSessionDate = sessionDate.toISOString().slice(0, 16);
    const user = request.user;
    // console.log("Creator name", request.user)
    try {
      const session = await Sessions.createSession({
        sessionDate: request.body.sessionDate,
        sessionVenue: request.body.sessionVenue,
        sessionPlayers: request.body.sessionPlayers.split(","),
        sessionCount: request.body.sessionCount,
        sportsId: request.body.sportsId,
        creatorId: request.body.creatorId,
      });
      const userId = request.body.creatorId;
      const userName = request.user.firstName + " " + request.user.lastName;

      // //allow to Create
      // let allowUser = true;
      // let userJoined = null;
      // const joinedSessions = await sessionPlayers.getSessionsJoined(userId);
      // for (var i = 0; i < joinedSessions.length; i++) {
      //   userJoined = await Sessions.sessionByIdDate(
      //     joinedSessions[i].sessionId,
      //     request.body.sessionDate
      //   );
      //   if (userJoined === null) {
      //     allowUser = true;
      //   } else {
      //     allowUser = false;
      //     break;
      //   }
      // }
      // if (allowUser == false) {
      //   request.flash(
      //     "error",
      //     "User can not create this session as you are having another session scheduled at the same time"
      //   );
      //   return response.redirect(`/sports/${sportsId}`);
      // }

      const sessionId = session.id;
      sessionPlayers.joinCreator({
        userId,
        sessionId,
        userName,
      });
      return response.redirect(`/sessions/${session.id}`);
    } catch (error) {
      if (error.name == "SequelizeValidationError") {
        const errMsg = error.errors.map((error) => error.message);
        console.log("flash errors", errMsg);
        errMsg.forEach((message) => {
          if (message == "Validation notEmpty on sessionDate failed") {
            request.flash("error", "Play Date cannot be empty");
          }
          if (message == "Validation notEmpty on sessionVenue failed") {
            request.flash("error", "Venue cannot be empty");
          }
          if (message == "Validation notEmpty on sessionCount failed") {
            request.flash("error", "Number of players nedded cannot be empty");
          }
        });
        response.redirect(`/sports/${sportsId}/new-session`);
      } else {
        console.log(error);
        return response.status(422).json(error);
      }
    }
  }
);

app.get(
  "/sports/:id/new-session",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const user = request.user;
    const userName = request.user.firstName + " " + request.user.lastName;
    const sportsId = request.params.id;
    const sportsname = await Sports.getSportsTitle(sportsId);
    console.log(sportsname);
    const creatorId = request.user.id;
    response.render("createSession", {
      title: "Sports Scheduler",
      user,
      userName,
      sportsname,
      sportsId,
      creatorId,
      csrfToken: request.csrfToken(),
    });
  }
);

app.get(
  "/sports/:id/prev-sessions",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const user = request.user;
    const userName = request.user.firstName + " " + request.user.lastName;
    console.log("Previous Sessions", request.params.id);
    const sportsId = request.params.id;
    const sportsname = await Sports.getSportsTitle(sportsId);
    console.log(sportsname);
    const previousSessions = await Sessions.previousSessions(sportsId);
    response.render("previousSessions", {
      title: "Sports Scheduler",
      user,
      userName,
      previousSessions,
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
    const user = request.user;
    const sessionId = request.params.id;
    // console.log(sessionId);
    const sessionDetails = await Sessions.getSessionDetails(sessionId);
    // console.log(sessionDetails);
    const sportsname = await Sports.getSportsTitle(sessionDetails.sportsId);
    const userId = request.user.id;
    const userName = request.user.firstName + " " + request.user.lastName;

    const sessionPlayer = await sessionPlayers.getPlayersList(sessionId);
    const userPlayers = await sessionPlayers.getUserPlayer(userId, sessionId);
    // console.log(sessionPlayer)

    //IsParticipant
    const isParticipant = userPlayers.length > 0;

    //IsPrevious
    const currentDate = new Date();
    const isPrevious = sessionDetails.sessionDate < currentDate;

    //IsCreator
    const creator = await User.getCreatorName(sessionDetails.creatorId);
    let isCreator = false;
    if (userId == sessionDetails.creatorId) {
      isCreator = true;
    }

    //userWarning
    let allowUser = true;
    let userJoined = null;
    const joinedSessions = await sessionPlayers.getSessionsJoined(userId);
    for (var i = 0; i < joinedSessions.length; i++) {
      userJoined = await Sessions.sessionByIdDate(
        joinedSessions[i].sessionId,
        sessionDetails.sessionDate
      );
      if (userJoined === null) {
        allowUser = true;
      } else {
        allowUser = false;
        break;
      }
    }

    //IsFull
    const isFull = sessionDetails.sessionCount == 0;

    response.render("sessionDetails", {
      title: "Sports Scheduler",
      user,
      userName,
      userId,
      sessionId,
      sessionDetails,
      sportsname,
      sessionPlayer,
      userPlayers,
      isCreator,
      isPrevious,
      isParticipant,
      isFull,
      creator,
      userJoined,
      allowUser,
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/sessions/:id/join",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const sessionId = request.params.id;
      const session = await Sessions.getSessionDetails(sessionId);
      const userId = request.user.id;

      const isParticipant = await sessionPlayers.getUserPlayer(
        userId,
        sessionId
      );
      if (isParticipant.length > 0) {
        return response
          .status(400)
          .json({ message: "You are already a participant in this session" });
      }

      const SessionPlayersList = await sessionPlayers.getPlayersList(sessionId);
      if (session.sessionCount == 0) {
        return response
          .status(400)
          .json({ message: "This session has reached the limit" });
      } else {
        const updatePlayersCount = await Sessions.updatePlayers(
          session.sessionCount - 1,
          sessionId
        );
      }

      await sessionPlayers.joinPlayers({
        userId,
        sessionId,
        userName: request.user.firstName + " " + request.user.lastName,
      });

      return response
        .status(200)
        .json({ message: "You joined the session successfully" });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.delete(
  "/sessions/:id/leave",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sessionId = request.params.id;
    const session = await Sessions.getSessionDetails(sessionId);
    const userId = request.user.id;

    const updatePlayersCount = await Sessions.updatePlayers(
      session.sessionCount + 1,
      sessionId
    );
    console.log(updatePlayersCount);
    try {
      await sessionPlayers.leavePlayers({ userId, sessionId });
      return response
        .status(200)
        .json({ message: "You leave the session successfully" });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/sessions/:id/cancel",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const user = request.user;
    const userName = request.user.firstName + " " + request.user.lastName;
    const sessionId = request.params.id;
    response.render("cancelSession", {
      title: "Sports Scheduler",
      user,
      userName,
      sessionId,
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/sessions/:id/cancel",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const sessionId = request.params.id;
      const session = await Sessions.getSessionDetails(sessionId);

      const reason = request.body.reason;

      await Sessions.cancellationUpdate({
        reason: reason,
        sessionId,
      });
      response.redirect(`/sports/${session.sportsId}`);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.delete(
  "/sessions/:id/deleteSessionMember",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const memberId = request.body.memberId;
    const sessionId = request.params.id;
    const session = await Sessions.getSessionDetails(sessionId);
    session.sessionPlayers.splice(memberId, 1);
    try {
      const player = await Sessions.deleteSessionMember(
        session.sessionPlayers,
        sessionId
      );
      return response.json({ success: true });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.delete(
  "/sessions/:id/deleteSessionPlayer",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const userId = request.body.userId;
    const sessionId = request.params.id;
    const session = await Sessions.getSessionDetails(sessionId);
    const updatePlayersCount = await Sessions.updatePlayers(
      session.sessionCount + 1,
      sessionId
    );
    try {
      const player = await sessionPlayers.deleteSessionPlayer({
        userId,
        sessionId,
      });
      return response.json({ success: true });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/sessions/:id/editsession",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const user = request.user;
    const userName = request.user.firstName + " " + request.user.lastName;
    const sessionId = request.params.id;
    const session = await Sessions.getSessionDetails(sessionId);
    const userId = request.user.id;
    const sportsId = request.params.sportsId;
    const creatorId = request.params.creatorId;
    response.render("editSession", {
      title: "Sports Scheduler",
      user,
      userName,
      sessionId,
      session,
      sportsId,
      creatorId,
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/sessions/:id/editsession",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sportsId = request.body.sportsId;
    const sessionId = request.params.id;
    try {
      const sessionId = request.params.id;
      await Sessions.editSession({
        sessionDate: request.body.sessionDate,
        sessionVenue: request.body.sessionVenue,
        sessionPlayers: request.body.sessionPlayers.split(","),
        sessionCount: request.body.sessionCount,
        sessionId,
      });
      return response.redirect(`/sessions/${sessionId}`);
    } catch (error) {
      console.log(error);
      if (error.name == "SequelizeValidationError") {
        const errMsg = error.errors.map((error) => error.message);
        console.log("flash errors", errMsg);
        errMsg.forEach((message) => {
          if (message == "Validation notEmpty on sessionDate failed") {
            request.flash("error", "Play Date cannot be empty");
          }
          if (message == "Validation notEmpty on sessionVenue failed") {
            request.flash("error", "Venue cannot be empty");
          }
          if (message == "Validation notEmpty on sessionCount failed") {
            request.flash("error", "Number of players nedded cannot be empty");
          }
        });
        response.redirect(`/sessions/${sessionId}/editsession`);
      } else {
        console.log(error);
        return response.status(422).json(error);
      }
    }
  }
);

app.post(
  "/sports/:id/editSport",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sportsId = request.params.id;
    try {
      console.log("Editing the Sports");
      const sports = await Sports.getSports(sportsId);
      await Sports.UpdateSport({
        sportsname: request.body.sportsname,
        sportsId,
      });
      console.log("Sports Edited Successfully");
      return response.redirect(`/sports/${sportsId}`);
    } catch (error) {
      console.log(error);
      if (error.name == "SequelizeValidationError") {
        const errMsg = error.errors.map((error) => error.message);
        errMsg.forEach((message) => {
          if (message == "Validation notEmpty on sportsname failed") {
            request.flash("error", "Sport Name cannot be empty");
          }
        });
        return response.redirect(`/sports/${sportsId}/editSport`);
      } else if (error.name == "SequelizeUniqueConstraintError") {
        const errMsg = error.errors.map((error) => error.message);
        console.log(errMsg);
        errMsg.forEach((message) => {
          if (message == "sportsname must be unique") {
            request.flash("error", "Sport already created");
          }
        });
        return response.redirect(`/sports/${sportsId}/editSport`);
      } else {
        return response.status(422).json(error);
      }
    }
  }
);

app.get(
  "/sports/:id/editSport",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const user = request.user;
    const userName = request.user.firstName + " " + request.user.lastName;
    const sportsId = request.params.id;
    const sports = await Sports.getSports(sportsId);
    response.render("editSports", {
      title: "Sports Scheduler",
      user,
      userName,
      sportsId,
      sports,
      csrfToken: request.csrfToken(),
    });
  }
);

app.delete(
  "/sports/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sportsId = request.params.id;
    console.log("First deleteing the sessions with the sports id", sportsId);
    await Sessions.deleteSessions(sportsId);
    console.log("Sessions Deleted related to the sportsId", sportsId);
    await Sports.deleteSport(sportsId);
    console.log("Sport Deleted");
    return response.redirect("/home");
  }
);

app.get(
  "/user/changePassword",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const user = request.user;
    const userName = request.user.firstName + " " + request.user.lastName;
    response.render("changePassword", {
      title: "Sports Scheduler",
      user,
      userName,
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/user/changePassword",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const oldPassword = request.body.oldPassword;
    const newPassword = request.body.newPassword;
    const user = request.user;
    try {
      const oldHashedPassword = user.password;
      const validatePassword = await bcrypt.compare(
        oldPassword,
        oldHashedPassword
      );
      if (!validatePassword) {
        console.log("Password Mismatch");
        request.flash("error", "Old Password is wrong");
        return response.redirect("/user/changePassword");
      } else {
        const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);

        if (newPassword == oldPassword) {
          request.flash("error", "Old and New Passwords are same.");
          return response.redirect("/user/changePassword");
        } else {
          await User.updatePassword(newHashedPassword, user.id);
          request.flash("success", "Password changed successfully");
          response.redirect("/user/changePassword");
        }
      }
    } catch (error) {
      console.log(error);
      request.flash("error", "An error occurred while changing the password");
      return response.status(422).json(error);
    }
  }
);

module.exports = app;
