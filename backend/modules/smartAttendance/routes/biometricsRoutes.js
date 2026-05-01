// routes/biometrics.route.js
import express from "express";
import { 
    generateRegistration, verifyRegistration, 
    generateAuth, verifyAuth 
} from "../controllers/biometricsController.js";
import { verifyToken } from "../../../middleware/verifyToken.js";

const router = express.Router();

router.get("/register/generate", verifyToken, generateRegistration);
router.post("/register/verify", verifyToken, verifyRegistration);

router.get("/auth/generate", verifyToken, generateAuth);
router.post("/auth/verify", verifyToken, verifyAuth);

export default router;