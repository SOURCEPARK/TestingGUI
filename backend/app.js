const express = require('express');
const timeRoutes = require('./routes/time');

const app = express();

app.use('/', timeRoutes);

module.exports = app;