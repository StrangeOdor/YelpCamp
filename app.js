//Include Express and Stdlib utils
const express = require('express');
const app = express();
const path = require('path');
const methodOverride = require("method-override");

//Setup session for cookies and to enable flash
const session = require('express-session');
const flash = require('connect-flash');

//Passport for Auth
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');

//ejsMate for boilerplate stuff
const ejsMate = require('ejs-mate');

//Include JOI validators and custom ExpressError error class
const Joi = require('joi');
const {campgroundSchema, reviewSchema} = require('./schemas');
const ExpressError = require('./utils/ExpressError');

//Include Router files
const userRoutes = require('./routes/users');
const campgroundsRoutes = require('./routes/campgrounds');
const reviewsRoutes = require('./routes/reviews');


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
app.use(passport.initialize());
//Consistent login session - no need to login every time
app.use(passport.session());
//What to authenticate user against, with what strategy (can have multiple)
passport.use(new LocalStrategy(User.authenticate()));
//Get User in session
passport.serializeUser(User.serializeUser());
//Get User out of session
passport.deserializeUser(User.deserializeUser());

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
//Middleware that passes current user and flash msg's to all templates
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.get('/fakeUser', async(req, res) =>{
    const user = new User({email:'jacob@gmail.com', username: jacobbb});
    const newUser = await User.register(user, 'chicken');
    res.send(newUser);
})

//any route starting with param1 gets sent to param2
app.use('/',userRoutes);
app.use('/campgrounds',campgroundsRoutes);
app.use('/campgrounds/:id/reviews',reviewsRoutes);

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