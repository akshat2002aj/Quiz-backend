const multer = require('multer');

const storage = multer.memoryStorage();

const singleUploadAvatar = multer({ storage }).single('image');

module.exports = {singleUploadAvatar};