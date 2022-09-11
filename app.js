//Include Express and Stdlib utils
const express = require('express');
const app = express();
const path = require('path');
const methodOverride = require("method-override");

//Setup session for cookies and to enable flash
const session = require('express-session');
const flash = require('connect-flash');

//ejsMate for boilerplate stuff
const ejsMate = require('ejs-mate');

//Include JOI validators and custom ExpressError error class
const Joi = require('joi');
const {campgroundSchema, reviewSchema} = require('./schemas');
const ExpressError = require('./utils/ExpressError');

//Include Router files
const campgrounds = require('./routes/campgrounds');
const reviews = require('./routes/reviews');


//setup ejs & ejsMate, join views paths when called from anywhere
app.engine('ejs', ejsMate);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


//Setup static files serving and methodOverride for REST
app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname,'public')));
const sessionConfig = {
    secret: 'thisshouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000*60*60*24*7, //1 Week
        maxAge: 1000*60*60*24*7,
    }
}
app.use(session(sessionConfig));
app.use(flash());

//Setup and Connect Mongoose to db
const mongoose = require('mongoose');
const { findByIdAndUpdate } = require('./models/campground');
mongoose.connect('mongodb://localhost:27017/yelpCamp',
{useNewUrlParser: true})
.then(() =>{
    console.log("Connected.")
})
.catch((err) => {
    console.log("Failed to connect");
    console.log(err);
})
//---------------------------------------------------------
//            Real Application Start                     //
//---------------------------------------------------------
//Middleware that passes flash msg's to templates
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

//any route starting with param1 gets sent to param2
app.use('/campgrounds',campgrounds);
app.use('/campgrounds/:id/reviews',reviews);

//Placeholder home
app.get('/',(req,res)=>{
    res.render('home');
})

//For every request, for every path...Will only run if all other paths do not find a match
app.all('*', (req, res, next) =>{
    //Pass our defined ExpressError class to errorHandler
    next(new ExpressError('Page Not Found', 404));
})

//Error Handler
app.use((err, req, res, next) =>{
    //Get statusCode and message from caught error 'err'
    const {statusCode = 500} = err;
    if(!err.message) err.message = 'Oh no, something went wrong!';
    //Pass error to error.ejs to style our error message
    //Left error stacktrace in just for development.
    res.status(statusCode).render('error',{err})
})

app.listen(3000, () =>{
    console.log("Listening on Port 3000!");
})