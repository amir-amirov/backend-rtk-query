// const Food = require("./models/Food");
// const Order = require("./models/Order");

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  refreshToken: String,
});
const LessonSchema = new mongoose.Schema({ title: String, content: String });
const ExerciseSchema = new mongoose.Schema({
  title: String,
  question: String,
  answer: String,
});

const User = mongoose.model("User", UserSchema);
const Lesson = mongoose.model("Lesson", LessonSchema);
const Exercise = mongoose.model("Exercise", ExerciseSchema);

const verifyJWT = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Access Denied" });

  jwt.verify(token.split(" ")[1], process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid Token" });
    req.user = decoded;
    next();
  });
};

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  await user.save();
  res.json({ message: "User registered" });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: "Invalid credentials" });

  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET, {
    expiresIn: "7d",
  });
  user.refreshToken = refreshToken;
  await user.save();
  res.json({ accessToken, refreshToken });
});

app.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ message: "No refresh token provided" });

  const user = await User.findOne({ refreshToken });
  if (!user) return res.status(403).json({ message: "Invalid refresh token" });

  jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid refresh token" });
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    res.json({ accessToken });
  });
});

// CRUD for Lessons
app.get("/lessons", verifyJWT, async (req, res) => {
  console.log("Received GET request:");
  res.json(await Lesson.find());
});
app.post("/lessons", verifyJWT, async (req, res) => {
  console.log("Received POST request:");
  res.json(await new Lesson(req.body).save());
});

app.put("/lessons/:id", verifyJWT, async (req, res) => {
  console.log("Received UPDATE request:");
  console.log("Body:", req.body);
  res.json(
    await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true })
  );
});
app.delete("/lessons/:id", verifyJWT, async (req, res) => {
  console.log("Received DELETE request:");
  console.log("Body:", req.body);
  res.json(await Lesson.findByIdAndDelete(req.params.id));
});

// CRUD for Exercises
app.get("/exercises", verifyJWT, async (req, res) =>
  res.json(await Exercise.find())
);
app.post("/exercises", verifyJWT, async (req, res) => {
  console.log("Received exercise data:", req.body);
  res.json(await new Exercise(req.body).save());
});
app.put("/exercises/:id", verifyJWT, async (req, res) =>
  res.json(
    await Exercise.findByIdAndUpdate(req.params.id, req.body, { new: true })
  )
);
app.delete("/exercises/:id", verifyJWT, async (req, res) =>
  res.json(await Exercise.findByIdAndDelete(req.params.id))
);

app.listen(5000, () => console.log("Server running on port 5000"));
