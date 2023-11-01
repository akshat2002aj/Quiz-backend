const cloudinary = require("cloudinary");
const Quiz = require("../model/quiz");
const Question = require("../model/question")
const { singleUploadAvatar } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const express = require("express");
const { isAdmin, isAuthenticated } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Register = require('../model/register')

const router = express.Router();

router.post(
  "/create-quiz",
  isAuthenticated,
  isAdmin("admin"),
  singleUploadAvatar,
  catchAsyncErrors(async (req, res, next) => {
    const { name, description, startTime, endTime, image, duration } = req.body;
    console.log(req.body);
    // const file = getDataUri(req.file);

    const myCloud = await cloudinary.v2.uploader.upload(image, {
      folder: "Quiz",
    });

    let quiz = {
      name,
      description,
      startTime,
      endTime,
      duration,
      image: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
    };

    quiz = await Quiz.create(quiz);

    res.status(201).json({
      success: true,
      quiz,
    });
  })
);

router.get(
  "/get-all-quiz",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    let quiz;
    if(req.user.role === 'admin'){
      quiz = await Quiz.find();

    }else{
      quiz = await Quiz.find({
        published: true
      })
    }

    res.status(201).json({
      success: true,
      quiz,
    });
  })
);

router.delete(
  "/delete-quiz/:id",
  isAuthenticated,
  isAdmin("admin"),
  catchAsyncErrors(async (req, res, next) => {
    const quiz = await Quiz.findById(req.params.id)

    if (!quiz) {
      return next(new ErrorHandler(`Quiz not found with this id`, 404));
    }

    await quiz.remove();
    res.status(201).json({
      success: true,
      quiz:{},
    });
  })
);

router.get(
  "/get-quiz/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {

    let quiz  = await Quiz.findById(req.params.id);

    if (!quiz) {
      return next(new ErrorHandler(`Quiz not found with this id`, 404));
    }

    let questions  = await Question.find({
      quiz: req.params.id
    })

    let registrations = await Register.find({quiz: req.params.id})
    let registered;
    let testGiven;
    let testExit;
    if(req.user.role === 'user'){
      let register= await Register.findOne({
        quiz: req.params.id,
        user: req.user.id
      })
  
      if(!register){
        registered = false
      }else{
        registered = true
        // console.log(registered)
        if(register.testStatus === "Submitted"){
          testGiven = true
        }
        else{
          testGiven = false
          if(registered.testStatus === "Processing"){
            testExit = true;
          }else{
            testExit = false;
          }
        }
      }
    }

    if(req.user.role === 'admin'){
      quiz = await Quiz.findById(req.params.id);
      if(quiz){
        quiz= {
          ...quiz._doc,
          questions: questions.length,
          registrations: registrations.length
        }
      }
    }else{
      quiz = await Quiz.find({
        published: true,
        _id: req.params.id
      })
      if(quiz.length >0){
        quiz = {
          ...quiz[0]._doc,
          questions: questions.length,
          registrations: registrations.length,
          registered,
          testGiven,
          testExit,
        }
      }
    }
    res.status(201).json({
      success: true,
      quiz,
    });
  })
);

router.put(
  "/update-quiz/:id",
  isAuthenticated,
  isAdmin("admin"),
  singleUploadAvatar,
  catchAsyncErrors(async (req, res, next) => {
    const data = await Quiz.findById(req.params.id);

    if (!data) {
      return next(new ErrorHandler(`Quiz not found with this id`, 404));
    }
    // if (req.file) {
      // const file = getDataUri(req.file);

      const myCloud = await cloudinary.v2.uploader.upload(req.body.image, {
        folder: "Quiz",
      });

      req.body.image = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    // }

    let quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(201).json({
      success: true,
      quiz,
    });
  })
);

router.put(
  "/publish/:id",
  isAuthenticated,
  isAdmin("admin"),
  catchAsyncErrors(async (req, res, next) => {

    const data = await Quiz.findById(req.params.id);

    if (!data) {
      return next(new ErrorHandler(`Quiz not found with this id`, 404));
    }

    data.published = !data.published;
    data.save();
    res.status(201).json({
      success: true,
      data,
    });
  })
);


module.exports = router;
