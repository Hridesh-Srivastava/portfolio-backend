import mongoose from "mongoose"
import Contact from "../models/Contact.js"
import { sendContactEmail } from "../utils/emailService.js"
import { createExcelFile } from "../utils/excelService.js"

export const createContact = async (req, res) => {
  try {
    console.log("\n" + "=".repeat(50))
    console.log("📝 NEW CONTACT FORM SUBMISSION")
    console.log("=".repeat(50))
    console.log("📋 Request body:", JSON.stringify(req.body, null, 2))
    console.log("🌐 IP Address:", req.ip)
    console.log("🖥️ User Agent:", req.get("User-Agent"))

    const { name, email, phone, linkedinProfile, message } = req.body

    // Validation
    if (!name || !email || !message) {
      console.log("❌ Validation failed: Missing required fields")
      return res.status(400).json({
        success: false,
        error: "Name, email, and message are required fields",
        received: { name: !!name, email: !!email, message: !!message },
      })
    }

    // Email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    if (!emailRegex.test(email)) {
      console.log("❌ Validation failed: Invalid email format")
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address",
      })
    }

    // Message length validation
    if (message.trim().length < 10) {
      console.log("❌ Validation failed: Message too short")
      return res.status(400).json({
        success: false,
        error: "Message must be at least 10 characters long",
      })
    }

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.warn("⚠️ MongoDB not connected, proceeding without database save")

      // Still try to send emails
      try {
        const emailResult = await sendContactEmail({
          name,
          email,
          phone,
          linkedinProfile,
          message,
          submittedAt: new Date(),
          contactId: "temp-" + Date.now(),
        })

        return res.status(200).json({
          success: true,
          message: "Message received! Email sent successfully. (Database temporarily unavailable)",
          emailSent: emailResult.success,
        })
      } catch (emailError) {
        console.error("❌ Email error:", emailError)
        return res.status(200).json({
          success: true,
          message: "Message received! I'll get back to you soon. (Database and email temporarily unavailable)",
        })
      }
    }

    // Create contact record
    const contactData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      linkedinProfile: linkedinProfile?.trim() || null,
      message: message.trim(),
      status: "new",
      ipAddress: req.ip || "unknown",
      userAgent: req.get("User-Agent") || "unknown",
    }

    console.log("💾 Saving contact to database...")
    const contact = new Contact(contactData)
    const savedContact = await contact.save()
    console.log("✅ Contact saved successfully!")
    console.log("🆔 Contact ID:", savedContact._id)

    // Try to create Excel file (non-blocking)
    let excelBuffer = null
    try {
      console.log("📊 Creating Excel file with all contact submissions...")
      excelBuffer = await createExcelFile()
      console.log("✅ Excel file created successfully with contact database")
    } catch (excelError) {
      console.warn("⚠️ Excel creation failed:", excelError.message)
    }

    // Try to send emails (non-blocking)
    let emailSent = false
    try {
      console.log("📧 Sending emails...")
      const emailResult = await sendContactEmail(
        {
          name,
          email,
          phone,
          linkedinProfile,
          message,
          submittedAt: savedContact.createdAt,
          contactId: savedContact._id,
        },
        excelBuffer,
      )

      emailSent = emailResult.success
      if (emailSent) {
        console.log("✅ Emails sent successfully with updated contact database")
      } else {
        console.warn("⚠️ Email sending failed:", emailResult.error)
      }
    } catch (emailError) {
      console.warn("⚠️ Email error:", emailError.message)
    }

    console.log("=".repeat(50))
    console.log("✅ CONTACT SUBMISSION COMPLETED")
    console.log("=".repeat(50) + "\n")

    // Return success response
    res.status(201).json({
      success: true,
      message: "Thank you for reaching out! I have received your message and will get back to you soon.",
      data: {
        id: savedContact._id,
        submittedAt: savedContact.createdAt,
        emailSent,
      },
    })
  } catch (error) {
    console.error("\n❌ CONTACT SUBMISSION ERROR:")
    console.error("Error:", error.message)
    console.error("Stack:", error.stack)

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      })
    }

    res.status(500).json({
      success: false,
      error: "Failed to submit contact form",
      message: "An unexpected error occurred. Please try again later.",
      timestamp: new Date().toISOString(),
    })
  }
}

export default { createContact }
