const mongoose= require("mongoose")

const quizschema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter the name of the event"],
    },
    description: {
        type: String,
        required: [true, "Please enter the description of the event"],
    },
    image: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        },
    },
   startTime: {
       type: Date,
       required: [true, "Please provide the start time!"],
   },
   endTime: {
       type: Date,
       required: [true, "Please provide the date!"],
   },
})

module.exports = mongoose.model("Quiz", quizschema)