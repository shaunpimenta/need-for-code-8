const express = require('express');
const createError = require('http-errors');
const User = require("../models/userModel");
const { isAuth, generateAccessToken, generateRefreshToken } = require("../lib/auth")

const router = express.Router();

// Get all users (debugging purposes)
router.get("/", async (req, res, next) => {
  const users = await User.find({});

  return res.status(200).json(users);
});

// Delete all users
router.delete("/delete/all", async (req, res, next) => {
  await User.deleteMany({});

  return res.status(200).send("Deleted all users");
});

// Profile
router.get("/profile", isAuth, async (req, res, next) => {
  const user = await User.findOne({ email: req.user.email });

  if (!user) return next(createError(404, "User id not found"));

  delete user.password;
  return res.status(201).send(user);
});

// Delete user
router.delete("/delete", isAuth, async (req, res, next) => {
  const user = await User.findOneAndDelete({ email: req.user.email });

  if (!user) return next(createError(404, "User not found"));

  return res.status(200).send(user);
});

// Sign up
router.post("/signup", async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) return next(createError(409, "User already exists"));

  const createdUser = await new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  }).save();

  // Generate Tokens
  const tokenData = {
    name: createdUser.name,
    email: createdUser.email,
  },
    accessToken = generateAccessToken(tokenData),
    refreshToken = generateRefreshToken(tokenData);

  // Save refresh token in user document
  createdUser.refreshToken = refreshToken;
  await createdUser.save();

  delete createdUser.password; // Delete password field

  return res.status(201).send({
    ...createdUser.toObject({ versionKey: false }),
    accessToken: accessToken,
    refreshToken: refreshToken,
  });
});

// Sign in
router.post("/signin", async (req, res, next) => {
  // Check if password is passed in request
  if (!req.body.password)
    return next(createError(400, "User Credentials not provided"));

  const user = await User.findOne({ email: req.body.email });

  // User not found
  if (!user) return next(createError(404, "User not found"));

  // Compare passwords
  if (!(await user.comparePassword(req.body.password)))
    return next(createError(401, "Invalid user credentials"));

  // Generate Tokens
  const tokenData = {
    name: user.name,
    email: user.email,
  },
    accessToken = generateAccessToken(tokenData),
    refreshToken = generateRefreshToken(tokenData);

  // Save refresh token in user document
  user.refreshToken = refreshToken;
  await user.save();

  // Delete password field
  delete user.password;

  return res.status(200).send({
    ...user.toObject({ versionKey: false }),
    accessToken: accessToken,
    refreshToken: refreshToken,
  });
}
);

// Sign out
router.get("/signout", isAuth, async (req, res, next) => {
  const user = await User.findOneAndUpdate(
    { email: req.user.email },
    { $unset: { refreshToken: "" } }
  );

  if (!user) return next(createError(404, "User Not Found"));

  return res.status(200).send({ message: "Successfully signed out" });
});

// Get new access token
router.post("/token", async (req, res, next) => {
  const refreshToken = req.body.refreshToken;

  if (!refreshToken || !req.body.email)
    return next(createError(400, "Insufficient credentials provided"));

  const user = await User.findOne({ email: req.body.email });

  if (!user) return next(createError(404, "User Not Found"));

  if (user.refreshToken !== refreshToken)
    return next(createError(403, "Invalid Refresh Token"));

  return res.status(200).send({
    accessToken: generateAccessToken({ name: user.name, email: user.email }),
  });
});

module.exports = router;
