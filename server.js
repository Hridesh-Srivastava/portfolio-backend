import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import dotenv from "dotenv"
import { fileURLToPath } from "url"
import { dirname } from "path"
import contactRoutes from "./routes/contact.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config()

console.log("Current directory:", __dirname)
console.log("Environment:", process.env.NODE_ENV || "development")

const app = express()

// Trust proxy for accurate IP addresses
app.set("trust proxy", 1)

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)

    // Allow localhost on any port
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return callback(null, true)
    }

    // Allow your production domain
    if (
      origin.includes("hridayesh-srivastava.vercel.app") ||
      origin.includes("portfolio-backend-plum-nine.vercel.app") ||
      origin.includes("hridayesh-srivastava.me") ||         
      origin.includes("www.hridayesh-srivastava.me") ||     
      origin.includes("api.hridayesh-srivastava.me")
    ) {
      return callback(null, true)
    }

    if (process.env.NODE_ENV !== "production") {
      return callback(null, true)
    }

    callback(new Error("Not allowed by CORS"))
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  optionsSuccessStatus: 200,
}

app.use(cors(corsOptions))

// Handle preflight requests explicitly
app.options("*", cors(corsOptions))

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: false,
  }),
)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Simple rate limiting for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, 
  message: {
    success: false,
    error: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  console.log(`${timestamp} - ${req.method} ${req.path} - Origin: ${req.get("origin") || "none"}`)
  next()
})

const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...")
    console.log("MongoDB URI:", process.env.MONGODB_URI ? "Configured" : "Missing")

    if (!process.env.MONGODB_URI) {
      console.warn("MongoDB URI not configured, running without database")
      return
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI)

    console.log(`MongoDB Connected Successfully!`)
    console.log(`Host: ${conn.connection.host}`)
  } catch (error) {
    console.error("MongoDB connection error:", error.message)
    console.warn("Continuing without database connection...")
  }
}

await connectDB()

// Routes
app.use("/api/contact", contactRoutes)

app.get("/api/health", (req, res) => {
  console.log("Health check requested from:", req.ip)

  const healthData = {
    success: true,
    status: "OK",
    message: "Portfolio Backend API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    port: process.env.PORT || 8080,
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: "1.0.0",
  }

  console.log("Health check response:", healthData)
  res.status(200).json(healthData)
})

// Test endpoint for CORS verification
app.get("/api/test", (req, res) => {
  console.log("Test endpoint requested")
  res.status(200).json({
    success: true,
    message: "CORS test successful",
    timestamp: new Date().toISOString(),
    headers: req.headers,
    origin: req.get("origin"),
  })
})

// Root endpoint
app.get("/", (req, res) => {
  console.log("Root endpoint requested")
  res.status(200).json({
    success: true,
    message: "Hridayesh Srivastava - Portfolio Backend API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/health",
      test: "/api/test",
      contact: "/api/contact",
    },
  })
})

// 404 handler
app.use("*", (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`)
  res.status(404).json({
    success: false,
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableRoutes: ["/", "/api/health", "/api/test", "/api/contact"],
  })
})

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error)

  res.status(error.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Internal server error" : error.message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  })
})

const gracefulShutdown = async (signal) => {
  console.log(`\n ${signal} received, shutting down gracefully...`)

  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close()
      console.log("MongoDB connection closed")
    }
  } catch (error) {
    console.error("Error closing MongoDB:", error)
  }

  process.exit(0)
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
process.on("SIGINT", () => gracefulShutdown("SIGINT"))

const startServer = async () => {
  // Use port 8080 as requested, with fallback to 5000
  const PORT = Number.parseInt(process.env.PORT) || 8080

  try {
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server URL: http://localhost:${PORT}`)
      console.log(`Health Check: http://localhost:${PORT}/api/health`)
      console.log(`Test Endpoint: http://localhost:${PORT}/api/test`)
      console.log(`Contact API: http://localhost:${PORT}/api/contact`)
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`)
      console.log(`Email configured: ${process.env.EMAIL_USER ? "Yes" : "No"}`)
      console.log(`Database: ${mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"}`)
    })

    return server
  } catch (error) {
    console.error("Server startup error:", error)
    process.exit(1)
  }
}

startServer().catch((error) => {
  console.error("Failed to start server:", error)
  process.exit(1)
})

export default app
