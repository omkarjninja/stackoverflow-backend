import Questions from '../models/Questions.js'
import mongoose from 'mongoose'
import User from '../models/auth.js';
//import Subscription from '../models/Subscription.js';

export const AskQuestion = async (req, res) => {
   const postQuestionData = req.body;
   const userId = req.userId;
   const user = await User.findById(userId);
 
   if (user.plan === 'FREE' && user.noOfQuestions >= 1) {
     return res.status(403).json({ message: 'You have reached your daily question limit for the free plan.' });
   } else if (user.plan === 'SILVER' && user.noOfQuestions >= 5) {
     return res.status(403).json({ message: 'You have reached your daily question limit for the silver plan.' });
   }
 
   const postQuestion = new Questions({ ...postQuestionData, userId });
   try {
     await postQuestion.save();
     user.noOfQuestions += 1;
     await user.save();
     res.status(200).json("Posted a question successfully");
   } catch (error) {
     console.log(error);
     res.status(409).json("Couldn't post a new question");
   }
 };

 
export const getAllQuestions = async (req, res) => {
     try{
          const questionList = await Questions.find()
          res.status(200).json(questionList);
     } catch (error) {
        res.status(404).json({ message: error.message });
     }
}

export const deleteQuestion = async (req, res) => {
       const { id:_id } = req.params;

       if(!mongoose.Types.ObjectId.isValid(_id)){
        return res.status(404).send('question unavilable...');
    }
       try {
          await Questions.findByIdAndRemove( _id );
          res.status(200).json({ message: "Deleted Successfully..." })
       } catch (error) {
        res.status(404).json({ message: error.message })
       }
}

export const voteQuestion = async (req, res) => {
   const { id:_id } = req.params;
   const { value, userId } = req.body;

   if(!mongoose.Types.ObjectId.isValid(_id)){
      return res.status(404).send('question unavilable...');
   }

   try {
      const question = await Questions.findById(_id)
      const upIndex = question.upVote.findIndex((id) => id === String(userId))
      const downIndex = question.downVote.findIndex((id) => id === String(userId))

      if(value === 'upVote'){
         if(downIndex !== -1){
            question.downVote = question.downVote.filter((id) => id !== String(userId))
         }
         if(upIndex === -1){
            question.upVote.push(userId)
         }else{
            question.upVote = question.upVote.filter((id) => id !== String(userId) )
         }
      }
      else  if(value === 'downVote'){
         if(upIndex !== -1){
            question.upVote = question.upVote.filter((id) => id !== String(userId))
         }
         if(downIndex === -1){
            question.downVote.push(userId)
         }else{
            question.downVote = question.downVote.filter((id) => id !== String(userId) )
         }
      }
      await Questions.findByIdAndUpdate( _id, question )
      res.status(200).json({ message: "Voted Successfully..."})
   } catch (error) {
      res.status(404).json({ message: "id not found" })
   }
}


// export const checkQuestionLimit = async (req, res) => {
//    const userId = req.userId;
 
//    try {
//      // Find the user's subscription
//      const user = await User.findById(userId).populate('subscription');
 
//      // If no subscription found, assume the user is on the FREE plan
//      const plan = user.subscription ? user.subscription.plan : USER_PLAN.FREE;
 
//      // Get the questions limit for the user's plan
//      const questionsLimit = QUESTIONS_LIMIT[plan];
 
//      // Get the count of questions asked by the user
//      const questionsAsked = await Questions.countDocuments({ userId });
 
//      const isLimitReached = questionsAsked >= questionsLimit;
 
//      res.status(200).json({ isLimitReached });
//    } catch (error) {
//      console.log(error);
//      res.status(500).json({ message: 'Something went wrong' });
//    }
//  };









