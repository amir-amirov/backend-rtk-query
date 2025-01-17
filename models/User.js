const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  refreshToken: String,
});

module.exports = mongoose.model("User", foodSchema);
