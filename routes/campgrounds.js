const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const Campground = require('../models/campground');
const {campgroundSchema, reviewSchema} = require('../schemas');
const { isLoggedIn } = require('../utils/isLoggedIn');

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

router.get('/', catchAsync(async(req,res)=>{
   const campgrounds = await Campground.find({});
    res.render('campgrounds/index', {campgrounds});
}))
router.get('/new',isLoggedIn, (req,res)=>{
    res.render('campgrounds/new');
})
router.post('/',isLoggedIn, validateCampground, catchAsync(async(req,res)=>{
    //if(!req.body.campground) throw new ExpressError('Invalid Campground Data', 400);
    const campground = new Campground(req.body.campground);
    await campground.save();
    req.flash('success', 'Successfully made a new campground!');
    res.redirect(302, `/campgrounds/${campground._id}`);
}))
router.get('/:id',catchAsync(async(req, res) =>{
    const {id} = req.params;
    const campground = await Campground.findById(id).populate('reviews');
    if(!campground){
        req.flash('error', 'Could not find that campground');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', {campground});
}))
router.get('/:id/edit',isLoggedIn, catchAsync(async (req,res)=>{
    const {id} = req.params;
    const campground = await Campground.findById(id);
    if(!campground){
        req.flash('error', 'Could not find that campground');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit',{campground});
}))
router.put('/:id',isLoggedIn, validateCampground, catchAsync(async (req,res)=>{
    const {id} = req.params;
    await Campground.findByIdAndUpdate(id, {...req.body.campground});
    req.flash('success', 'Successfully updated a campground!');
    res.redirect(302,`/campgrounds/${id}`);
}))
router.delete('/:id',isLoggedIn, catchAsync(async(req,res)=>{
    const {id} = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted campground');
    res.redirect('/campgrounds');
}))

module.exports = router;