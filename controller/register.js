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
const sendMail = require("../utils/SendMail");

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

    function formatDate(date) {
      const formattedDate = new Intl.DateTimeFormat("en-US", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata"
      }).format(new Date(date));
  
      return formattedDate;
    }  
    
    try {
      await sendMail({
        email: req.user.email,
        subject: `Confirmation: Registration for ${data.name}`,
        message: `<div><h3>Dear ${req.user.name},</h3>
        <p>Congratulations! You have successfully registered for the quiz, <b>${data.name}</b> on QuizNest . We're excited to have you participate in this event.
        </p>
        <p>Here are the details for the quiz:<br>
        <b>Quiz Title: </b>${data.name}<br>
        <b>Start Date and Time: </b>${formatDate(data.startTime)}<br>
        <b>End Date and Time: </b>${formatDate(data.endTime)}<br>
        <b>Duration: </b>${data.duration} minutes
        </p>
        <p>Please make sure to be ready at least 15 minutes before the quiz begins. Don't forget to bring your enthusiasm and competitive spirit!<p>
        <h4>Thanks & Regards,</h4>
        <h4>Team QuizNest</h4></div>`,
      });

    res.status(201).json({
      succes: true,
      register,
    });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
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

    if (register.testStatus !== "Registered") {
      return next(new ErrorHandler(`Test already given`, 401));
    }

    register = await Register.findByIdAndUpdate(
      register._id,
      {
        startTime: new Date(),
        testStatus: "Processing",
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

    if (register.endTime) {
      return next(new ErrorHandler(`Test Submitted already`, 401));
    }

    let marksScored = 0;
    let totalMarks = 0;

    let duration = +new Date(register.endTime) - +new Date(register.startTime);
    console.log(duration, ((quiz.duration * 1000 * 60 )+ (10 * 1000)))
    if (duration > ((quiz.duration * 1000 * 60 )+ (10 * 1000))) {
      return next(new ErrorHandler(`Quiz expired`, 401));
    }

    const data = await Promise.all(
      req.body.questions.map(async (i) => {
        let question = await Question.findById(i.question);
        question.correctOption === i.correctOption
          ? (marksScored = marksScored + 1)
          : null;
      })
    );

    totalMarks = await Question.count({
      quiz: req.params.id,
    });

    register = await Register.findByIdAndUpdate(
      register._id,
      {
        endTime: req.body.time,
        totalMarks: totalMarks,
        marksScored: marksScored,
        testStatus: "Submitted",
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(201).json({
      succes: true,
      register,
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
