const Agenda = require("agenda");
require("dotenv").config();

// MongoDB setup for Agenda
const mongoConnectionString = process.env.MONGO_URI;
const agenda = new Agenda({ db: { address: mongoConnectionString, collection: "emailJobs" } });

module.exports=agenda