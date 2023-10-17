const cloudinary = require("cloudinary");
const User = require("../model/user");
const { singleUploadAvatar } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const CatchAsyncError = require("../middleware/catchAsyncErrors");
const express = require("express");
const { isAdmin, isAuthenticated } = require("../middleware/auth");
const sendMail = require("../utils/SendMail");
const router = express.Router();
const sendToken = require("../utils/jwtToken");

router.post(
  "/create-user",
  isAuthenticated,
  isAdmin("admin"),
  CatchAsyncError(async (req, res, next) => {
    const { name, email, password } = req.body;
    const userEmail = await User.findOne({ email });

    if (userEmail) {
      return next(new ErrorHandler("User already exists", 400));
    }

    let user = {
      name: name,
      email: email,
      password: password,
      rollNo: email.split("@")[0],
    };

    user = await User.create(user);

    try {
      await sendMail({
        email: user.email,
        subject: "Registration Details For Treasure Hunt",
        message: `Hello ${user.name}, \n Please check your account details: \n User Name: ${user.email} \n Password: ${password}`,
      });

      res.status(201).json({
        success: true,
        message: `Please check your email:- ${user.email} to activate your account!`,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Login User
router.post(
  "/login-user",
  CatchAsyncError(async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(new ErrorHandler("Please provide the all fields!", 400));
      }

      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("User doesn't exists!", 400));
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }

      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Change Password
router.post(
  "/change-password",
  isAuthenticated,
  isAdmin("admin"),
  CatchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;

    const userEmail = await User.findOne({ email });

    if (!userEmail) {
      return next(new ErrorHandler("User doesn't exists", 400));
    }

    userEmail.password = password;
    await userEmail.save();

    try {
      await sendMail({
        email: userEmail.email,
        subject: "Registration Details For Treasure Hunt",
        message: `Hello ${userEmail.name}, \n Please check your account details: \n User Name: ${userEmail.email} \n Password: ${password}`,
      });

      res.status(201).json({
        success: true,
        message: `Please check your email:- ${userEmail.email} to activate your account!`,
        userEmail,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// load user
router.get(
  "/get-user",
  isAuthenticated,
  CatchAsyncError(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return next(new ErrorHandler("User doesn't exists", 400));
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// all user
router.get(
  "/get-all-user",
  isAuthenticated,
  isAdmin('admin'),
  CatchAsyncError(async (req, res, next) => {
    try {
      const users = await User.find();

      res.status(200).json({
        success: true,
        users,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete user
router.delete(
  "/delete-user/:id",
  isAuthenticated,
  isAdmin('admin'),
  CatchAsyncError(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);

      if(!user){
        return next(new ErrorHandler("No User Found!", 401))
      }

      const u = await User.findByIdAndDelete(req.params.id)

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// log out user
router.get(
  "/logout",
  CatchAsyncError(async (req, res, next) => {
    try {
      res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      res.status(201).json({
        success: true,
        message: "Log out successful!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
