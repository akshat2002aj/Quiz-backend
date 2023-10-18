const cloudinary = require("cloudinary");
const Quiz = require("../model/quiz");
const { singleUploadAvatar } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const CatchAsyncError = require("../middleware/catchAsyncErrors");
const express = require("express");
const { isAdmin, isAuthenticated } = require("../middleware/auth");
const router = require("./quiz");
const Register = require("../model/register");

router.post(
  "/register-user-to-quiz/:id",
  isAuthenticated,
  CatchAsyncError(async (req, res, next) => {
    
    const data = await Quiz.findById(req.params.id);

    if (!data) {
      return next(new ErrorHandler(`Quiz not found with this id`, 404));
    }

    let register = await Register.find({
      user: req.user.id,
      quiz: req.params.id
    })

    if(register){
      return next(new ErrorHandler(`User already registered`, 401));
    }


    register = await Register.create({
        user: req.user.id,
        quiz: req.params.id
    })

    res.status(201).json({
        succes: true,
        register
    })
  })
);

module.exports = router;