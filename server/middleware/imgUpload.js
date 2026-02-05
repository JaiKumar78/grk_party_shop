// middleware/imgUpload.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto'; // Import crypto for generating random strings

const uploadsDir = path.join(process.cwd(), 'uploads');

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        // Create 'uploads' directory if it does not exist.
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },

    filename: function (req, file, cb) {
        // Generate a unique filename for each uploaded file
        // This avoids collisions and ensures each temporary file has a distinct name.
        const uniqueSuffix = crypto.randomBytes(16).toString('hex'); // Generate a random hex string
        const fileExtension = path.extname(file.originalname); // Get the original file extension
        const filename = `${file.fieldname}-${uniqueSuffix}${fileExtension}`; // Combine fieldname, unique string, and extension
        
        // Example: If fieldname is 'images', filename could be 'images-a1b2c3d4e5f6g7h8.jpg'
        // If fieldname is 'variants[0].images', filename could be 'variants[0].images-x9y8z7w6v5u4t3s2.png'
        
        cb(null, filename);
    }
});

// Allowed file types
const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
];

// File filter to only allow image files
const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
};

const imgUpload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
    },
    fileFilter: fileFilter // Enforce image-only file types
});

export default imgUpload;
