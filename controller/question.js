const cloudinary = require("cloudinary");
const Quiz = require("../model/quiz");
const { singleUploadAvatar } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const CatchAsyncError = require("../middleware/catchAsyncErrors");
const express = require("express");
const { isAdmin, isAuthenticated } = require("../middleware/auth");
const router = require("./quiz");
const Question = require("../model/question");

router.post(
  "/create-question/:id",
  isAuthenticated,
  isAdmin("admin"),
  CatchAsyncError(async (req, res, next) => {
    const { description, imageDescription, options, correctOption } = req.body;
    
    const data = await Quiz.findById(req.params.id);

    if (!data) {
      return next(new ErrorHandler(`Quiz not found with this id`, 404));
    }

    if (imageDescription) {
      const myCloud = await cloudinary.v2.uploader.upload(imageDescription, {
        folder: "Questions",
      });
      imageDescription = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }

    for (let i = 0; i < options.size(); i++) {
      if (options[i].image) {
        const myCloud = await cloudinary.v2.uploader.upload(options[i].image, {
          folder: "Options",
        });
        options[i].image = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
    }

    const question = await Question.create({
        description,
        imageDescription,
        options,
        correctOption,
        quiz: data._id
    })

    res.status(201).json({
        succes: true,
        question
    })
  })
);
