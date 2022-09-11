const express = require('express');
const router = express.Router({mergeParams: true});
//The mergeParams option allows req.params to be pushed
//Through from app.js to our router, in this case reviews.js

const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');

const Review = require('../models/review');
const Campground = require('../models/campground');

const {reviewSchema} = require('../schemas');


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

router.post('/',validateReview,catchAsync(async(req, res) => {
    const campground = await Campground.findById(req.params.id);
    //Remember that the name of the inputs is review[attribute], so
    //it will be parsed under the key'review' below. We did the same w/ campground
    const review = new Review(req.body.review);
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    req.flash('success', 'Created new review!');
    res.redirect(`/campgrounds/${campground._id}`);
}))

router.delete('/:reviewId', catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted review');
    res.redirect(`/campgrounds/${id}`);
}))

module.exports = router;