const express = require("express");
const googleAuthController = require("../../controllers/user/googleAuthController");
const router = express.Router();


const { validate } = require("../../validations/validate");
const googleAuthValidation = require("../../validations/user/googleAuthValidation");
const { rateLimit } = require("../../middlewares/rateLimiter");

//Google-Register/Login
router.post(
    "/google-login",
    rateLimit("google-login", 25, 15 * 60),
    validate(googleAuthValidation),
    googleAuthController
);

module.exports=router;