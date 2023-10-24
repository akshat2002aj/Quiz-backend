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
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
  testStatus:{
    type: String,
    default: "Registered",
    enum: ["Registered", "Processing", "Submitted"]
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
