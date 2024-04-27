import express from 'express';
import authorization from '../middlewares/authorization';
import { appStartUpdation, getAllWeek, getCurrentWeek, getWeekTasks, submitWeekTasks } from '../controllers/taskController';
import { VerifyUserOtp, loginWithGoogle, userLogin, userRegister } from '../controllers/authController';

const router= express.Router();

router.post('/auth/google',loginWithGoogle);
router.post('/auth/register',userRegister);
router.post('/auth/verify-otp',VerifyUserOtp);
router.post('/auth/login',userLogin);

router.get('/week/:email/:index',authorization,getWeekTasks);
router.post('/app-start/:email',authorization,appStartUpdation)
router.post('/week/:email/:index',authorization,submitWeekTasks);
router.post('/all-weeks/:email',authorization,getAllWeek);
router.get('/current-week/:email',authorization,getCurrentWeek);

export default router;