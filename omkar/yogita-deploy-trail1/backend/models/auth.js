import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    name: { type: String, required: true},
    email: {type: String, required: true},
    password: {type: String, required: true},
    about: {type: String},
    tags: {type: [String] },
    joinedOn: {type: Date, default: Date.now },
    plan: { type: String, default: 'FREE' }, // Add this line
    noOfQuestions: { type: Number, default: 0 }, // Add this line
})


export default mongoose.model("User", userSchema)