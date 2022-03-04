const express = require('express');
const cors = require('cors');
const session = require('express-session');

require('dotenv').config();

// create express app
const app = express();

// Setup server port
const port = process.env.PORT;


// CORS
app.use(cors());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }))

// parse requests of content-type - application/json
app.use(express.json())

app.use(function(err, req, res, next) {
    // error handling logic
    console.error(err.stack);
    res.status(500).json({ msg: "something wrong" });

});

// partent routes
const parentRouter = require('./routes/parent.routes');
app.use('/api/parents', parentRouter);

// transaction routes
const transactionRouter = require('./routes/transaction.routes');
app.use('/api/transactions', transactionRouter);

// listen for requests
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
