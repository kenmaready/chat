const express = require("express");
const path = require("path");

// create the express app:
const app = express();

// set the public folder as the root folder:
const publicPath = path.join(__dirname, "../public");
app.use(express.static(publicPath));

module.exports = app;
