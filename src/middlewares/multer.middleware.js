import multer from "multer";
import path from "path";

// file structure
// {
//   fieldname: 'image',
//   originalname: 'photo.png',
//   encoding: '7bit',
//   mimetype: 'image/png',
//   destination: 'uploads/',
//   filename: '16987654321-123456789.png',
//   path: 'uploads/16987654321-123456789.png',
//   size: 34567
// }

// 1️⃣ Define storage
const storage = multer.diskStorage({
  //part 1
  destination: function (req, file, cb) {
    cb(null,"./public/temp"); // local folder
  },
  //part 2
  filename: function (req, file, cb) {
    const uniqueName =Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

// 2️⃣ Create multer middleware
const UploadToDisk = multer({
  storage,
});

export default UploadToDisk;
