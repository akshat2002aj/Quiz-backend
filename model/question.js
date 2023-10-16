const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, " Please enter the Description of the Question"],
  },

  imageDescription: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  options: [
    {
      text: {
        type: String,
      },
      image: {
        public_id: {
          type: String,
        },
        url: {
          type: String,
        },
      },
    },
  ],
  correctOption: {
    type: Number,
    required: [true, "Please enter the option which is correct"],
  },
  quiz: {
    type: mongoose.Schema.ObjectId,
    ref: "Quiz",
    required: [true, "Quiz Id Needed!"],
  },
});

const Question = mongoose.model("Question", questionSchema);
module.exports = Question;
