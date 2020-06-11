"use strict";
console.log(`DB is set to: ${process.env.DB}`);
if (process.env.DB === 'mongodb') module.exports = require('./mongo');
else module.exports = require('./mysql');