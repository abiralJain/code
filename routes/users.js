const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

mongoose.connect('mongodb://localhost/realblog');

var userSchema = mongoose.Schema({
  username: String,
  email: String,
  profileImage: {
    type: String,
    default: './images/Uploads/default.png'
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'posts'
    }
  ],
  password: String,
  name: String
})

userSchema.plugin(plm);

module.exports= mongoose.model('users', userSchema);