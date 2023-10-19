const mongoose = require("mongoose");

const registerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "user",
    required: [true, "User Id Needed!"],
  },
  quiz: {
    type: mongoose.Schema.ObjectId,
    ref: "Quiz",
    required: [true, "Quiz Id Needed!"],
  },
  totalMarks: {
    type: Number,
    default: 0,
  },
  marksScored: {
    type: Number,
    default: 0,
  },
  timeTaken: {
    type: Date,
  },
  testGiven:{
    type: Boolean,
    default: false
  },
  answers:[
    {
      quiz:{
        type: mongoose.Schema.ObjectId,
        ref: "Quiz",
      },
      choosedOption:{
        type: Number,
      }
    }
  ]
});

module.exports = mongoose.model("Register", registerSchema);
