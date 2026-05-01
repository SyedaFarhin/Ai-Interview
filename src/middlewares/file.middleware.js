const multer = require("multer")

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter(req, file, cb) {
        const allowedMimeTypes = [
            "application/pdf",
            "application/x-pdf"
        ]

        const allowedExtensions = [".pdf"]
        const fileName = file.originalname.toLowerCase()
        const extensionAllowed = allowedExtensions.some(ext => fileName.endsWith(ext))

        if (allowedMimeTypes.includes(file.mimetype) || extensionAllowed) {
            cb(null, true)
        } else {
            cb(new Error("Only PDF resume files are allowed."))
        }
    }
})

module.exports = upload