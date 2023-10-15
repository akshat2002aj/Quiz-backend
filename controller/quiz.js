const cloudinary = require("cloudinary");
const Quiz = require("../model/quiz");
const { singleUploadAvatar } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const CatchAsyncError = require("../middleware/catchAsyncErrors");
const express = require("express");
const { isAdmin, isAuthenticated } = require("../middleware/auth");
const sendMail = require("../utils/SendMail");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const getDataUri = require("../utils/dataUri");

const router = express.Router();

router.post(
  "/create-quiz",
  isAuthenticated,
  isAdmin("admin"),
  singleUploadAvatar,
  catchAsyncErrors(async (req, res, next) => {
    const { name, description, startTime, endTime, image } = req.body;
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

router.post(
  "/get-all-quiz",
  isAuthenticated,
  isAdmin("admin"),
  catchAsyncErrors(async (req, res, next) => {

    let quiz = await Quiz.find();

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


module.exports = router;
