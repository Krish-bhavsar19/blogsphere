const jwt = require('jsonwebtoken');


function setUser(user) {
  return jwt.sign({
      _id: user._id,
      email: user.email,
  }, process.env.JWT_SECRET, { expiresIn: '1d' });
}


function getUser(token) {
    if (!token) return null;
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        return payload;
    } catch (error) {
        return null;
    }
}

module.exports = {
    setUser,
    getUser
};