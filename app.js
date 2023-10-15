const express = require('express');
const ErrorHandler = require('./middleware/error');
const app = express();
const cookieParser = require("cookie-parser")
const bodyParser = require("body-parser")
const cors = require('cors');
const User = require('./controller/user')
const Quiz = require('./controller/quiz')

// config
if(process.env.NODE_ENV !== "PRODUCTION"){
    require("dotenv").config({
        path:"backend/config/.env"
    })
}
app.use(cors({ origin: true, credentials: true }));
// app.use(cors({
//     origin: 'http://localhost:3000',
//     credentials: true
// }));
// app.options('*', cors({
//     origin: 'http://localhost:3000',
//     credentials: true
// }))
app.use(express.json({limit: '50mb'}));
app.use(cookieParser());
// app.use(express.);
app.use(bodyParser.urlencoded({extended: true, limit: "50mb"}));

// import routes
app.use('/api/v1/user', User);
app.use('/api/v1/quiz', Quiz);


// It's for errorHandling
app.use(ErrorHandler);

module.exports = app;
