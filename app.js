const express = require('express');
const app = express();
const methodOverride = require("method-override");
const ejsMate = require('ejs-mate');
const Joi = require('joi');
const {campgroundSchema, reviewSchema} = require('./schemas');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const Review = require('./models/review');
app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));

const Campground = require('./models/campground');


const path = require('path');
app.engine('ejs', ejsMate);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
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

const validateCampground = (req, res, next) =>{
    //Create a Joi Schema to validate any campgrounds in req
    const {error} = campgroundSchema.validate(req.body);
    if(error){
        //Build ExpressError message by mapping each message 
        // for each 'el' in details, then join with a ','
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    }
    next();
}

const validateReview = (req, res, next) =>{
    //Create a Joi Schema to validate any campgrounds in req
    const {error} = reviewSchema.validate(req.body);
    if(error){
        //Build ExpressError message by mapping each message 
        // for each 'el' in details, then join with a ','
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    }
    next();
}

app.get('/',(req,res)=>{
    res.render('home');
})
app.get('/campgrounds', catchAsync(async(req,res)=>{
   const campgrounds = await Campground.find({});
    res.render('campgrounds/index', {campgrounds});
}))

app.get('/campgrounds/new',(req,res)=>{
    res.render('campgrounds/new');
})
app.post('/campgrounds',validateCampground, catchAsync(async(req,res)=>{
    //if(!req.body.campground) throw new ExpressError('Invalid Campground Data', 400);
    const campground = new Campground(req.body.campground);
    await campground.save();
    res.redirect(302, `/campgrounds/${campground._id}`);
}))
app.get('/campgrounds/:id',catchAsync(async(req, res) =>{
    const {id} = req.params;
    const campground = await Campground.findById(id).populate('reviews');
    res.render('campgrounds/show', {campground});
}))

app.get('/campgrounds/:id/edit',catchAsync(async (req,res)=>{
    const {id} = req.params;
    const campground = await Campground.findById(id);
    res.render('campgrounds/edit',{campground});
}))
app.put('/campgrounds/:id',validateCampground, catchAsync(async (req,res)=>{
    const {id} = req.params;
    await Campground.findByIdAndUpdate(id, {...req.body.campground});
    res.redirect(302,`/campgrounds/${id}`);
}))

app.delete('/campgrounds/:id',catchAsync(async(req,res)=>{
    const {id} = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect('/campgrounds');
}))

app.post('/campgrounds/:id/reviews',validateReview,catchAsync(async(req, res) => {
    const campground = await Campground.findById(req.params.id);
    //Remember that the name of the inputs is review[attribute], so
    //it will be parsed under the key'review' below. We did the same w/ campground
    const review = new Review(req.body.review);
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
}))

app.delete('/campgrounds/:id/reviews/:reviewId', catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/campgrounds/${id}`);
}))

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
    //Note that we left error stacktrace in just for development.
    res.status(statusCode).render('error',{err})
})

app.listen(3000, () =>{
    console.log("Listening on Port 3000!");
})