const LessonSchema = new mongoose.Schema({ title: String, content: String });

module.exports = mongoose.model("Lesson", LessonSchema);
