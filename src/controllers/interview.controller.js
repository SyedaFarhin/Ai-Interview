const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

function handleDatabaseError(res, err) {
    if (err && err.name === "ValidationError") {
        const message = Object.values(err.errors).map(error => error.message).join(", ")
        return res.status(400).json({ message })
    }

    console.error(err)
    return res.status(500).json({
        message: err?.message || "Internal server error"
    })
}

function validateAiReport(report) {
    if (!report || typeof report !== "object") return false
    if (!report.title || typeof report.title !== "string") return false
    if (typeof report.matchScore !== "number") return false
    if (!Array.isArray(report.technicalQuestions)) return false
    if (!Array.isArray(report.behavioralQuestions)) return false
    if (!Array.isArray(report.skillGaps)) return false
    if (!Array.isArray(report.preparationPlan)) return false
    return true
}

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        const { selfDescription, jobDescription } = req.body

        if (!jobDescription || (!req.file && !selfDescription)) {
            return res.status(400).json({
                message: "Please provide a job description and either a resume file or a self description."
            })
        }

        let resumeText = ""

        if (req.file) {
            if (!req.file.buffer) {
                return res.status(400).json({
                    message: "Uploaded resume file is invalid. Please try again with a PDF file."
                })
            }

            try {
                const parsedResume = await pdfParse(Buffer.from(req.file.buffer))
                resumeText = parsedResume?.text?.trim() || ""
            } catch (parseError) {
                console.error("Resume parsing failed:", parseError)
                resumeText = "Resume text could not be extracted from the uploaded PDF."
            }
        }

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription
        })

        if (!validateAiReport(interViewReportByAi)) {
            return res.status(400).json({
                message: "AI report payload is invalid or missing required fields."
            })
        }

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription,
            jobDescription,
            ...interViewReportByAi
        })

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })
    } catch (err) {
        return handleDatabaseError(res, err)
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findById(interviewReportId)

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport

    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }