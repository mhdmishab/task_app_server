import { Request, Response } from 'express';
import { db } from '../db/dbConfig';
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import axios from "axios";
dotenv.config();


interface WeekData {

    done: boolean;
    done_time: string;
}

export const appStartUpdation = async (req: Request, res: Response) => {
    try {
        const { email } = req.params;
        const { startTime } = req.body;

        const userDocument = db.collection("users").doc(email);
        await userDocument.update({
            start_time: startTime,
            current_week: 1
        });

        return res.json({
            success: true,
            current_week: 1
        });
    } catch (error) {
        console.error("Error in appStartUpdation:", error);
        return res.status(500).send('Internal server error');
    }
};



export const getWeekTasks = (req: Request, res: Response) => {
    const { email, index } = req.params;

    const userDocument = db.collection("users").doc(email);

    userDocument.get().then((docSnapshot: any) => {
        if (docSnapshot.exists) {
            const userData = docSnapshot.data();
            if (userData && userData.weeks) {
                const weekData = userData.weeks[index.toString()]; 
                if (weekData) {
                    console.log("Week at index", index, ":", weekData);
                    return res.json({
                        success: true,
                        weekData
                    });
                } else {
                    console.log("Week data not found for the specified index");
                    return res.status(404).send("Week data not found for the specified index");
                }
            } else {
                console.log("Weeks data not found for the user");
                return res.status(404).send("Weeks data not found for the user");
            }
        } else {
            console.log("User document does not exist");
            return res.status(404).send("User document does not exist");
        }
    }).catch((error: Error) => {
        console.error("Error getting user document:", error);
        return res.status(500).send("Error getting user document");
    });
};


export const submitWeekTasks = (req: Request, res: Response) => {
    let { email, index } = req.params;
    let { updatedTasks, weekEndTime } = req.body;

    if (weekEndTime === undefined) {
        return res.status(400).json({ error: "weekEndTime is required" });
    }

    const updatedWeek = { completed: true, completion_time: weekEndTime };

    console.log(updatedTasks);
    console.log(email, index);

    const userDocument = db.collection("users").doc(email);

    userDocument.get().then((docSnapshot: any) => {
        if (docSnapshot.exists) {
            const userData = docSnapshot.data();
            if (userData && userData.weeks) {
                const weeksData = userData.weeks;
                const weekToUpdate = weeksData[index.toString()];

                console.log("Week to update:", weekToUpdate);

                weekToUpdate.week = updatedWeek;

                const tasksToUpdate: { [key: string]: { done: boolean; done_time: String | null } } = updatedTasks;

                for (const taskKey in tasksToUpdate) {
                   
                    if (tasksToUpdate.hasOwnProperty(taskKey)) {
                      
                        const weekTasks = weekToUpdate.tasks;
                        if (weekTasks && weekTasks.hasOwnProperty(taskKey)) {
                          
                            weekTasks[taskKey] = tasksToUpdate[taskKey];
                        }
                    }
                }

                userDocument.update({
                    weeks: weeksData,
                    current_week: parseInt(index) + 1
                }).then(() => {
                    let currentWeek=parseInt(index) + 1;
                    console.log("week completed successfully");
                    res.json({
                        message: "week completed successfully",
                        currentWeek
                    });
                }).catch((error: Error) => {
                    console.error("Error updating tasks:", error);
                    res.status(500).send("Error updating tasks");
                });
            } else {
                console.log("Weeks data not found for the user");
                res.status(404).send("Weeks data not found for the user");
            }
        } else {
            console.log("User document does not exist");
            res.status(404).send("User document does not exist");
        }
    }).catch((error: Error) => {
        console.error("Error getting user document:", error);
        res.status(500).send("Error getting user document");
    });
};


export const getAllWeek=(req:Request,res:Response)=>{

    let {email,index} = req.params;
    console.log(email,index)
    

    const userDocument = db.collection("users").doc(email);

    userDocument.get().then((docSnapshot: any) => {
        if (docSnapshot.exists) {
            const userData = docSnapshot.data();
            if (userData && userData.weeks) {
             
                const weekData = userData.weeks;
                if (weekData) {
                    console.log("Week at index", index, ":", weekData);
                    res.json({
                        success:true,
                        weekData
                    })
                }
            } else {
                console.log("Weeks data not found for the user");
                res.status(404).send("Weeks data not found for the user");
            }
        } else {
            console.log("User document does not exist");
            res.status(404).send("User document does not exist");
        }
    }).catch((error: Error) => {
        console.error("Error getting user document:", error);
        res.status(500).send("Error getting user document");
    });

}


export const getCurrentWeek = (req: Request, res: Response) => {
    const { email } = req.params;

    const userDocument = db.collection("users").doc(email);
    userDocument.get()
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                if (userData && userData.current_week) {
                    const currentWeek = userData.current_week;
                    const startTime = userData.start_time;
                    res.status(200).json({ currentWeek,startTime });
                } else {
                    res.status(404).json({ error: "Current week not found for the user" });
                }
            } else {
                res.status(404).json({ error: "User document not found" });
            }
        })
        .catch((error) => {
            console.error('Error fetching user document:', error);
            res.status(500).json({ error: "Internal server error" });
        });
};





