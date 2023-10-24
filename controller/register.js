const cloudinary = require("cloudinary");
const Quiz = require("../model/quiz");
const Question = require("../model/question");
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
      quiz: req.params.id,
    });

    if (!register) {
      return next(new ErrorHandler(`User already registered`, 401));
    }

    register = await Register.create({
      user: req.user.id,
      quiz: req.params.id,
    });

    res.status(201).json({
      succes: true,
      register,
    });
  })
);

router.post(
  "/start-quiz/:id",
  isAuthenticated,
  CatchAsyncError(async (req, res, next) => {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return next(new ErrorHandler(`Quiz not found with this id`, 404));
    }

    let register = await Register.findOne({
      user: req.user.id,
      quiz: req.params.id,
    });

    if (!register) {
      return next(new ErrorHandler(`User is not registered`, 401));
    }

    if(register.testGiven){
      return next(new ErrorHandler(`Test already given`, 401));
    }

    register = await Register.findByIdAndUpdate(
      register._id,
      {
        startTime: req.body.time,
        testGiven: true
      },
      {
        new: true,
        runValidators: true,
      }
    );
    // register.save();

    if (new Date(quiz.startTime) > new Date()) {
      return next(new ErrorHandler(`Quiz not started yet`, 401));
    }

    if (new Date(quiz.endTime) < new Date()) {
      return next(new ErrorHandler(`Quiz expired`, 401));
    }

    const questions = await Question.find({
      quiz: req.params.id,
    }).select("-correctOption");

    res.status(201).json({
      succes: true,
      questions,
      startTime: register.startTime,
    });
  })
);

router.post(
  "/submit-quiz/:id",
  isAuthenticated,
  CatchAsyncError(async (req, res, next) => {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return next(new ErrorHandler(`Quiz not found with this id`, 404));
    }

    let register = await Register.findOne({
      user: req.user.id,
      quiz: req.params.id,
    });

    if (!register) {
      return next(new ErrorHandler(`User is not registered`, 401));
    }
    
    let marksScored = 0;
    let totalMarks = 0;

    let duration = +new Date(register.endTime) - +new Date(register.startTime);
    if(duration > quiz.duration * 1000 * 60){
      console.lof(duration, quiz.duration);
      return next(new ErrorHandler(`Quiz expired`, 401))
    }

    req.body.questions.map(async(i)=>{
      let question = await Question.findById(i.question);
      question.correctOption === correctOption  ? marksScored = marksScored + 1 : null;
      totalMarks = totalMarks + 1;
    })

    register = await Register.findByIdAndUpdate(
      register._id,
      {
        endTime: req.body.time,
        totalMarks,
        marksScored

      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(201).json({
      succes: true,
      register
    });
  })
);

router.get(
  "/get-registered-quiz/:id",
  isAuthenticated,
  isAdmin("admin"),
  CatchAsyncError(async (req, res, next) => {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return next(new ErrorHandler(`Quiz not found with this id`, 404));
    }

    let register = await Register.find({ quiz: req.params.id })
      .populate("user", "name email")
      .select("-answers");

    res.status(201).json({
      succes: true,
      register,
    });
  })
);

module.exports = router;
