module.exports = func =>{
    return (req, res, next) =>{
        func(req,res,next).catch(next);
    }
}
//A Function is passed to 'func' and executed, then
//any errors are passed via catch to errorHandler 'next'
//Essentially try catch wrapper
//Check app.js and notice this function appearing in params