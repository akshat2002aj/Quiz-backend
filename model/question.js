const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true," Please enter the Description of the Question"],
  },

  imageDescription:{
      image: {
        public_id: {
          type: String,
        },
        url: {
          type: String,
        },
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
    required: [true,"Please enter the option which is correct"],
  },
});

const Question = mongoose.model("Question", questionSchema);
module.exports = Question;