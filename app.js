/* eslint-disable semi */
/* eslint-disable quotes */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();
const { Sports, Sessions } = require("./models");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
const path = require("path");
const { Op } = require("sequelize");

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));

app.get("/", async (request, response) => {
  try {
    const SportsList = await Sports.getSportsList();
    // console.log(SportsList)
    if (request.accepts("html")) {
      response.render("index", {
        title: "Sports Application",
        SportsList,
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
});

app.get("/createsport", async (request, response, next) => {
  response.render("createsport");
});

app.post("/sports", async (request, response) => {
  // console.log("Creating a Sport", request.body)
  // Sports Adding
  try {
    const listSports = await Sports.addSport({
      sportsname: request.body.sportsname,
    });
    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/sports/:id", async function (request, response) {
  // console.log("Sports Id ",request.params);
  const sportsId = request.params.id;
  const sportsname = await Sports.getSportsTitle(sportsId);
  const sessionsList = await Sessions.upComingSessions(sportsId);
  console.log(sessionsList);
  response.render("session", {
    sessionsList,
    sportsId,
    sportsname,
  });
  console.log("Session", sessionsList);
});
app.post("/sessions", async (request, response) => {
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
});

app.get("/sports/:id/new-session", async (request, response) => {
  const sportsId = request.params.id;
  const sportsname = await Sports.getSportsTitle(sportsId);
  console.log(sportsname);
  response.render("createSession", {
    sportsId,
    sportsname,
  });
});

app.get("/sessions/:id", async (request, response) => {
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
  });
});

module.exports = app;
