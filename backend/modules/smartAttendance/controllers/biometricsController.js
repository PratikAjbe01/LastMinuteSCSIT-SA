import { 
    generateAuthenticationOptions, 
    verifyAuthenticationResponse,
    generateRegistrationOptions,
    verifyRegistrationResponse 
} from '@simplewebauthn/server';
import { User } from '../../../models/user.model.js';

// ⚠️ CHANGE THESE IN PRODUCTION
const rpID = process.env.NODE_ENV === 'production' ? 'last-minute-scsit.vercel.app' : 'localhost';
const expectedOrigin = process.env.NODE_ENV === 'production' ? 'https://last-minute-scsit.vercel.app' : 'http://localhost:5173';

// ── 1. SETUP FINGERPRINT (Registration) ───────────────────────────────────
export const generateRegistration = async (req, res) => {
    try {
        const user = await User.findById(req.userId || req.user?._id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        
        // v10 requires userID to be a strict Uint8Array
        const userID = new Uint8Array(Buffer.from(user._id.toString()));
        
        const options = await generateRegistrationOptions({
            rpName: 'LastMinute SCSIT',
            rpID,
            userID: userID,
            userName: user.email,
            authenticatorSelection: {
                authenticatorAttachment: 'platform', // Forces device biometrics
                userVerification: 'required',
            },
        });

        // Store challenge to verify against in the next step
        user.currentChallenge = options.challenge;
        await user.save();

        res.status(200).json(options);
    } catch (error) {
        console.error("Registration Gen Error:", error);
        res.status(500).json({ success: false, message: "Internal server error generating registration" });
    }
};

export const verifyRegistration = async (req, res) => {
    try {
        const user = await User.findById(req.userId || req.user?._id);
        const expectedChallenge = user.currentChallenge;

        if (!expectedChallenge) {
            return res.status(400).json({ success: false, message: "Registration session expired. Please try again." });
        }

        const verification = await verifyRegistrationResponse({
            response: req.body,
            expectedChallenge,
            expectedOrigin,
            expectedRPID: rpID,
        });

        if (verification.verified) {
            // v10 structured the credential inside registrationInfo
            const { credential } = verification.registrationInfo;
            
            user.passkeys.push({
                credentialID: credential.id, // Base64url string in v10
                credentialPublicKey: Buffer.from(credential.publicKey), // Save as buffer
                counter: credential.counter || 0,
                transports: credential.transports || [],
            });
            user.currentChallenge = undefined; // Wipe challenge
            await user.save();

            return res.status(200).json({ success: true, message: "Biometrics registered successfully" });
        } else {
            return res.status(400).json({ success: false, message: "Biometric signature invalid." });
        }
    } catch (error) {
        console.error("Registration Verify Error:", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

// ── 2. VERIFY FINGERPRINT (Authentication) ────────────────────────────────
export const generateAuth = async (req, res) => {
    try {
        const user = await User.findById(req.userId || req.user?._id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // Edge Case: If user has no registered fingerprints
        if (!user.passkeys || user.passkeys.length === 0) {
            return res.status(400).json({ success: false, message: "NO_PASSKEYS" });
        }

        const options = await generateAuthenticationOptions({
            rpID,
            allowCredentials: user.passkeys.map(key => ({
                id: key.credentialID, // Base64url string
                type: 'public-key',
                transports: key.transports || [],
            })),
            userVerification: 'required',
        });

        user.currentChallenge = options.challenge;
        await user.save();

        res.status(200).json(options);
    } catch (error) {
        console.error("Auth Gen Error:", error);
        res.status(500).json({ success: false, message: "Internal server error generating authentication" });
    }
};

export const verifyAuth = async (req, res) => {
    try {
        const user = await User.findById(req.userId || req.user?._id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const expectedChallenge = user.currentChallenge;
        if (!expectedChallenge) {
            return res.status(400).json({ success: false, message: "Auth session expired. Please try again." });
        }

        const body = req.body;
        if (!body || !body.id) {
            return res.status(400).json({ success: false, message: "Invalid payload from device." });
        }

        // Find the specific fingerprint the user just used
        const passkey = user.passkeys.find(k => k.credentialID === body.id);
        if (!passkey) {
            return res.status(400).json({ success: false, message: "Fingerprint not recognized on this account." });
        }

        // FIX: v10 requires the "credential" object instead of "authenticator"
        const verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin,
            expectedRPID: rpID,
            credential: {
                id: passkey.credentialID,
                publicKey: new Uint8Array(passkey.credentialPublicKey), // Safe conversion to Uint8Array
                counter: passkey.counter || 0, // Fallback to 0 if undefined
                transports: passkey.transports || [],
            }
        });

        if (verification.verified) {
            const { authenticationInfo } = verification;
            
            // Update the counter to prevent replay attacks
            passkey.counter = authenticationInfo.newCounter;
            user.currentChallenge = undefined; // Wipe challenge
            await user.save();
            
            return res.status(200).json({ success: true, message: "Identity Verified" });
        } else {
            return res.status(400).json({ success: false, message: "Biometric verification failed." });
        }
    } catch (error) {
        console.error("Auth Verify Error:", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};