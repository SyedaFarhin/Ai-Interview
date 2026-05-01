const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const multer = require("multer")

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}))

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")


/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message })
    }

    if (err && typeof err.message === "string") {
        if (
            err.message.includes("Only PDF and DOCX") ||
            err.message.includes("File too large") ||
            err.message.includes("Unexpected field")
        ) {
            return res.status(400).json({ message: err.message })
        }
    }

    console.error(err)
    return res.status(500).json({ message: err?.message || "Internal server error" })
})

module.exports = app