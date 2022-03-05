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

//get token thanhat
// const { getTokenThanhat } = require('./controllers/loginThanhat.controller')
// getTokenThanhat();
// setInterval(function() {
//     getTokenThanhat();
// }, 126000)

// define a simple route
app.get('/', (req, res) => {
    res.json({ "message": "hello world" });
});

//student routes
const studentRouter = require('./routes/student.routes')
app.use('/api/students', studentRouter);

// partent routes
const parentRouter = require('./routes/parent.routes');
app.use('/api/parents', parentRouter);

// transaction routes
const transactionRouter = require('./routes/transaction.routes');
app.use('/api/transactions', transactionRouter);

//notification routes
const notiRoute = require("./routes/notification.routes");
app.use('/api/notifications', notiRoute);

// bill routes
const billRouter = require('./routes/bill.routes');
app.use('/api/bills', billRouter);

// thanhat
const thanhatRouter = require('./routes/superadmin.routes')
app.use('/api/superadmin', thanhatRouter);

//invoice routes
const invoiceRouter = require('./routes/invoice.routes')
app.use('/api/invoices', invoiceRouter);

// paymentSDK routes
const PaymentSDKRouter = require('./routes/paymentSDK.routes');
app.use('/api/paymentSDK', PaymentSDKRouter);

// listen for requests
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});