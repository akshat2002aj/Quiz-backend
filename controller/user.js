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
const jwt = require("jsonwebtoken")

router.post(
  "/create-user",
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

    // user = await User.create(user);
    const activationToken = createActivationToken(user);
    const acativationUrl = `${process.env.FRONTEND_URL}/activation/${activationToken}`;
    try {
      await sendMail({
        email: user.email,
        subject: "Activate Your QuizNest Account",
        message: `<div><h3>Dear ${user.name},</h3>
        <p>Welcome to QuizNest ! We're thrilled that you've joined our community of quiz enthusiasts. To get started, you'll need to activate your account. This is a simple process; just click the link below to verify your email address and unlock all the exciting features of our platform:</p>
        <a href="${acativationUrl}">Click Here</a>
        <p>Please note that this activation link will expire in 24 hours, so make sure to complete the activation process as soon as possible.</p>
        <p>Once your account is activated, you can enjoy all the benefits of QuizNest , including quiz participation, leaderboard rankings, and personalized recommendations.<p>
        <h4>Thanks & Regards,</h4>
        <h4>Team QuizNest</h4></div>`,
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

// Create Activation Token
const createActivationToken = (user) => {
  return jwt.sign(user, process.env.ACTIVATION_SECRET, {
    expiresIn: "5m",
  });
};

// Activate User
router.post(
  "/activation",
  CatchAsyncError(async (req, res, next) => {
    try {
      const { activation_token } = req.body;

      const newUser = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET
      );

      if (!newUser) {
        return next(new ErrorHandler("Invalid Token", 400));
      }

      const { name, email, password, rollNo } = newUser;

      const userEmail = await User.findOne({ email });

      if (userEmail) {
        return next(new ErrorHandler("User already exists", 400));
      }

      const user = User.create({
        name,
        email,
        password,
        rollNo,
      });

      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// await sendMail({
//   email: user.email,
//   subject: "Welcome to QuizNest",
//   message: `Dear ${user.name},\n\n
//   We are thrilled to welcome you to QuizNest ! Your registration is now complete, and you're all set to embark on a journey of knowledge and fun.\n\n
//   Here are your login credentials:\n\n
//   \tUsername: ${user.email}\n
//   \tPassword: ${user.password}\n\n
//   We're excited to have you as a part of our community. Get ready to explore a world of quizzes and challenge your intellect. If you ever need assistance or have any questions, our support team is here to help\n\n\n
//   Thanks & Regards,\n
//   Team QuesNest`,
// });

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
