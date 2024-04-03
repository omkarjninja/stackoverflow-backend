import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import bodyParser from 'body-parser';
import OpenAI from "openai"
import Razorpay from "razorpay"
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Filter from 'bad-words';


import userRoutes from './routes/users.js';
import questionRoutes from './routes/Questions.js';
import answerRoutes from './routes/Answers.js';
import User from './models/auth.js';





const app = express();

dotenv.config();
app.use(express.json({ limit: '30mb', extended: true }));
app.use(express.urlencoded({ limit: '30mb', extended: true }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(cors());
app.use(bodyParser.json());


app.get('/', (req, res) => {
  res.send('This is a stack overflow clone API');
});


app.use('/user', userRoutes);
app.use('/questions', questionRoutes);
app.use('/api', questionRoutes);
app.use('/answer', answerRoutes);




const PORT = process.env.PORT || 5000;

const DATABASE_URL = process.env.CONNECTION_URL;

mongoose
  .connect(DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    await User.updateMany({}, { $set: { plan: 'FREE', noOfQuestions: 0 } });
    app.listen(PORT, () => console.log(`server running on port ${PORT}`));
  })
  .catch((err) => console.log(err.message));



  

  const sharedContentSchema = new mongoose.Schema({
    text: String,
    image: String,
    video: String,
    audio: String, 
  pdf: String, 
  });
  
  const SharedContent = mongoose.model('SharedContent', sharedContentSchema);

  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  const uploadDir = path.join(__dirname, 'uploads');
const imageUploadDir = path.join(uploadDir, 'image');
const videoUploadDir = path.join(uploadDir, 'video');
const audioUploadDir = path.join(uploadDir, 'audio');
const pdfUploadDir = path.join(uploadDir, 'pdf');

// Create the uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Create the image upload directory if it doesn't exist
if (!fs.existsSync(imageUploadDir)) {
  fs.mkdirSync(imageUploadDir);
}

// Create the video upload directory if it doesn't exist
if (!fs.existsSync(videoUploadDir)) {
  fs.mkdirSync(videoUploadDir);
}

// Create the audio upload directory if it doesn't exist
if (!fs.existsSync(audioUploadDir)) {
  fs.mkdirSync(audioUploadDir);
}

// Create the PDF upload directory if it doesn't exist
if (!fs.existsSync(pdfUploadDir)) {
  fs.mkdirSync(pdfUploadDir);
}

  
  // Set up Multer for file uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, 'uploads', file.fieldname);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const extension = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    },
  });
  
  const upload = multer({ storage });
  
  // Serve static files (images and videos)
  app.use('/uploads/images', express.static(imageUploadDir));
app.use('/uploads/videos', express.static(videoUploadDir));
app.use('/uploads/audios', express.static(audioUploadDir));
app.use('/uploads/pdfs', express.static(pdfUploadDir));
  
  // Share content
  app.post('/api/share', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }, { name: 'audio', maxCount: 1 }, 
  { name: 'pdf', maxCount: 1 }]), async (req, res) => {
    const { text } = req.body;
    const image = req.files?.image?.[0]?.filename;
    const video = req.files?.video?.[0]?.filename;
    const audio = req.files?.audio?.[0]?.filename; 
  const pdf = req.files?.pdf?.[0]?.filename; 

  // Create a new instance of the Filter class
  const filter = new Filter();
  // Add offensive words you want to filter
  filter.addWords('Fuck', 'Chutiya', 'Dyke', 'Shit', 'Cunt', 'Bugger', 'Dick' , 'Bollocks', 'Bitch','Piss off','Son of a bitch','Asshole',
  'Bullshit','Hell', 'Piss','Bastard','Damn','Talking shit','Motherfucker','Bloody','Feck','Harami','Kutta','Suar ki aulad','Napoonsak',
  'Raand','Bhenchod','Madarchod','Madarjaat','Bhosdike','Sabka Bhosda','Tera Bhosda','Mera Bhosda','Haramkhor','Gaandu','Hijade','Maa ka bhosda','Teri Maa ki chuth');

   // Clean the text only if it's not empty or null
   const cleanedText = text ? filter.clean(text) : text;

  

    const sharedContent = new SharedContent({ text: cleanedText, image, video, audio, pdf });
    await sharedContent.save();
  
    res.json(sharedContent);
  });
  
  // Get shared content
  app.get('/api/content', async (req, res) => {
    try {
      const sharedContent = await SharedContent.find();
      res.json(sharedContent);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });





// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_SECRET_KEY,
});

// Global variable to hold the conversation history
let conversationHistory = [{ role: 'system', content: 'You are a helpful assistant.' }];

app.post('/ask', async (req, res) => {
  const userMessage = req.body.message;

  // Update conversation history with the user's message
  conversationHistory.push({ role: 'user', content: userMessage });

  try {
    // Request a completion from OpenAI based on the updated conversation history
    const completion = await openai.chat.completions.create({
      messages: conversationHistory,
      model: 'gpt-3.5-turbo',
    });

    // Extract the response
    const botResponse = completion.choices[0].message.content;

    // Update conversation history with the assistant's response
    conversationHistory.push({ role: 'assistant', content: botResponse });

    // Send the assistant's response back to the client
    res.json({ message: botResponse });
  } catch (error) {
    console.error('Error calling OpenAI: ', error);
    res.status(500).send('Error generating response from OpenAI');
  }
});










const USER_PLAN = {
  FREE: 'FREE',
  SILVER: 'SILVER',
  GOLD: 'GOLD'
};

const QUESTIONS_LIMIT = {
  [USER_PLAN.FREE]: 1,
  [USER_PLAN.SILVER]: 5,
  [USER_PLAN.GOLD]: Infinity
};

const PLAN_PRICE = {
  [USER_PLAN.SILVER]: 100, // 100 INR
  [USER_PLAN.GOLD]: 1000// 1000 INR
};



app.post("/order", async (req, res) => {
  try {
    const { plan } = req.body;
    const amount = PLAN_PRICE[plan];

    if (!amount) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_API_KEY,
      key_secret: process.env.RAZORPAY_API_SECRET,
    });

    const options = {
      amount: amount * 100, // Amount in paise
      currency: "INR",
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).send("Error");
    }

    res.json({ order, plan });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
});

app.post("/order/validate", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    const sha = crypto.createHmac("sha256", process.env.RAZORPAY_API_SECRET);
    sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = sha.digest("hex");

    if (digest !== razorpay_signature) {
      return res.status(400).json({ msg: "Transaction is not legit!" });
    }

    res.json({
      msg: "success",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/user/updatePlan', async (req, res) => {
  const { userId, plan } = req.body;
  try {
    const user = await User.findById(userId);
    user.plan = plan;
    user.noOfQuestions = 0;
    await user.save();
    res.status(200).json({ message: 'Plan updated successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Failed to update the plan' });
  }
});









// Generate a random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

// Store the OTP and email in memory (replace with a database in production)
let otp = null;
let email = null;

// Nodemailer setup for sending OTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ghatageyogita2002@gmail.com',
    pass: process.env.EMAIL_PASSWORD
  }
});

// Route for sending OTP
app.post('/sendOTP', (req, res) => {
  const { emailAddress } = req.body;
  otp = generateOTP();
  email = emailAddress;

  const mailOptions = {
    from: 'ghatageyogita2002@gmail.com',
    to: emailAddress,
    subject: 'OTP for Chatbot Access',
    text: `Your OTP is: ${otp}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).send('Error sending OTP');
    } else {
      console.log('OTP sent: ', info.response);
      res.status(200).send('OTP sent successfully');
    }
  });
});

// Route for verifying OTP
app.post('/verifyOTP', (req, res) => {
  const { enteredOTP } = req.body;
  if (enteredOTP == otp) {
    res.status(200).send('OTP verified successfully');
  } else {
    res.status(400).send('Invalid OTP');
  }
});

