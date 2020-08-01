// Imports the Google Cloud client library
'use strict';
const express = require('express');
const cors = require('cors');

const app = express();
const routes = require('./routes');

app.use(express.json());
app.use(cors())
app.use(routes)


app.listen(3333, () => console.log(' API APOLLO IN LOCALHOST:3333 🚀'));
