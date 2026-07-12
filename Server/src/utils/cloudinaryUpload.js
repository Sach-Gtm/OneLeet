const cloudinary = require("../config/cloudinary");

// Streams an in-memory file buffer to Cloudinary. Shared by the passport-photo
// and contact-form uploads (both keep the file in memory rather than on disk).
function uploadBufferToCloudinary(buffer, options) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
        stream.end(buffer);
    });
}

module.exports = { uploadBufferToCloudinary };
