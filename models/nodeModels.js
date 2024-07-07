const mongoose = require("mongoose");

const notesSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please Enter Note Name"],
        trim: true
    },
    slug: {
        type: String,
        lowercase: true,
    },
    domain: {
        type: mongoose.ObjectId,
        required: [true, "Please Enter Note Domain Nmae"],
        ref: "Domain"
    },
    author: {
        type: String,
        required: [true, "Please Enter Note Author Nmae"],
    },
    description: {
        type: String,
        required: [true, "Please Enter Note Description"]
    },
    rating: {
        type: Number,
        default: 0
    },
    image: {
        type: String
    },
    thenote: {
        type: String
    },


}, { timestamps: true })
module.exports = mongoose.model("Notes", notesSchema);