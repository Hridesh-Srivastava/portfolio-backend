import express from "express"
import { createContact } from "../controllers/contactController.js"

const router = express.Router()

// Contact form submission route
router.post("/", createContact)

// Health check for contact routes
router.get("/health", (req, res) => {
  console.log("Contact routes health check")
  res.status(200).json({
    success: true,
    message: "Contact routes are working",
    timestamp: new Date().toISOString(),
    routes: {
      "POST /": "Submit contact form",
      "GET /health": "Health check",
    },
  })
})

// Test route
router.get("/test", (req, res) => {
  console.log("Contact routes test")
  res.status(200).json({
    success: true,
    message: "Contact routes test successful",
    timestamp: new Date().toISOString(),
  })
})

export default router
