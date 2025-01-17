const ExerciseSchema = new mongoose.Schema({
  title: String,
  question: String,
  answer: String,
});

module.exports = mongoose.model("Exercise", ExerciseSchema);
