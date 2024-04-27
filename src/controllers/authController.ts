import { Request, Response } from 'express';
import { db } from '../db/dbConfig';
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import axios from "axios";
import { createHash } from 'crypto';
import nodemailer from 'nodemailer';

dotenv.config();

interface WeekData {
    done: boolean;
    done_time: string;
}

async function generateMailOtp(email:string,otp:string){
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        auth: {
          user: `${process.env.EMAIL_ADDRESS}`,
          pass: `${process.env.EMAIL_PASSWORD}`
        }
      });

      const mailOptions = {
        from: `"T-OASIS OFFICIAL" <${process.env.EMAIL_ADDRESS}>`,
        to: `${email}`,
        subject: 'OTP Verification',
        text: `Your OTP for verification is: ${otp}`
      };

      await transporter.verify();

    const response = await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log("sendmail error", err);
          reject(err);
        } else {
          console.log("Mail sent successfully", info);
        }
      });
    });

    return response;
}


function hashOTP(otp:any) {
    const hash = createHash('sha256'); // You can choose other hash algorithms like sha512
    hash.update(otp);
    return hash.digest('hex');
  }

function generateOTP() {
    // Generate a random 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
  
    return otp.toString(); // Convert OTP to string
  }

  function verifyOTP(hashedOTP:any, newOTP:any) {
    const hashedNewOTP = hashOTP(newOTP);
    return hashedOTP === hashedNewOTP;
  }

function generateJWT(email:string){
    const jwtsecret = process.env.JWT_SECRET || 'default_secret';
            console.log(jwtsecret)
            const token = jwt.sign({ email }, jwtsecret, {
                expiresIn: "5d"
            });
            return token;
}

async function generateWeekDoc(email:string,name:string){
    const weekCollection = db.collection("week");
                const querySnapshot = await weekCollection.get();

                const weekData: any = {}; 
                querySnapshot.forEach((doc: any) => {
                    const weekId = doc.id;
                    weekData[weekId] = {
                        tasks: doc.data(),
                        week: {
                            completed: false,
                            completion_time: null
                        }
                    };
                });

                console.log(weekData);

                const userDocument = db.collection("users").doc(email);
                await userDocument.set({
                    email: email,
                    name: name,
                    start_time: null,
                    end_time: null,
                    weeks: weekData,
                    current_week: null
                });

}

export const loginWithGoogle = async (req: Request, res: Response) => {
    try {
        const { code } = req.body;
        console.log(code)

        const payload = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${code}`);
        console.log("payload", payload.data);

        if (payload.data?.email_verified) {
            const email = payload.data?.email;
            const name = payload.data?.name;

            const token = generateJWT(email);

            const userRef = db.collection("users").doc(email);
            let userData;
            const docSnapshot = await userRef.get();
            if (docSnapshot.exists) {
                userData = docSnapshot.data();
                console.log("hello", userData?.current_week);
                const currentWeek = userData?.current_week;
                return res.json({
                    token,
                    user: { email, name, currentWeek },
                })
            } else {

                generateWeekDoc(email,name);

                console.log("User document successfully created");
                const currentWeek = null

                return res.json({
                    token,
                    user: { email, name, currentWeek },

                });
            }
        } else {
            return res.status(400).json({
                error: "Google login failed. Try again"
            });
        }
    } catch (error: any) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
};

export const userLogin = async (req: Request, res: Response) => {
    const { email } = req.body;
    const token = generateJWT(email);

    const userRef = db.collection("users").doc(email);
    let userData;

    try {
        const docSnapshot = await userRef.get();
        if (docSnapshot.exists) {
            userData = docSnapshot.data();
            const currentWeek = userData?.current_week;
            const name = userData?.name;
            return res.json({
                token,
                user: { email, name, currentWeek },
            });
        } else {
            console.log("user does not exist");
            return res.json({
                message: "User does not exist"
            });
        }
    } catch (error) {
        console.error("Error in userLogin:", error);
        return res.status(500).send('Internal server error');
    }
};


export const userRegister = async (req: Request, res: Response) => {
    const { email, name } = req.body;
    const token = generateJWT(email);

    const userRef = db.collection("users").doc(email);
    const docSnapshot = await userRef.get();
    
    try {
        if (docSnapshot.exists) {
            return res.json({
                message: "User already exists, please proceed to login."
            });
        } else {
            const otp = generateOTP();
            console.log("Generated OTP:", otp);
            const hashedOtp = hashOTP(otp);
            await generateMailOtp(email, otp);

            return res.json({
                hashedOtp
            });
        }
    } catch (error) {
        console.error("Error in userRegister:", error);
        return res.status(500).send('Internal server error');
    }
};


export const VerifyUserOtp = async (req: Request, res: Response) => {
    const { name, email, hashedOtp, newOtp } = req.body;
    
    try {
        const verifyOtp = verifyOTP(hashedOtp, newOtp);
        if (verifyOtp) {
            const token = generateJWT(email);
            await generateWeekDoc(email, name);

            console.log("User document successfully created");
            const currentWeek = null;

            return res.json({
                token,
                user: { email, name, currentWeek }
            });
        } else {
            return res.json({
                message: "OTP verification failed"
            });
        }
    } catch (error) {
        console.error("Error in VerifyUserOtp:", error);
        return res.status(500).send('Internal server error');
    }
};

