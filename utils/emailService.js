import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config()

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ Email credentials not configured")
    return null
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number.parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === "465",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })
}

const generateAdminEmailHTML = (contactData) => {
  const { name, email, phone, linkedinProfile, message, submittedAt, contactId } = contactData

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Form Submission</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background-color: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 30px 20px;
        }
        .field {
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }
        .label {
          font-weight: 600;
          color: #495057;
          margin-bottom: 5px;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .value {
          color: #212529;
          font-size: 16px;
        }
        .message-box {
          background-color: #e9ecef;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #28a745;
          margin-top: 10px;
          font-style: italic;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #6c757d;
          border-top: 1px solid #dee2e6;
        }
        .contact-id {
          background-color: #667eea;
          color: white;
          padding: 5px 10px;
          border-radius: 15px;
          font-size: 12px;
          display: inline-block;
          margin-top: 10px;
        }
        .attachment-note {
          background-color: #d1ecf1;
          border: 1px solid #bee5eb;
          color: #0c5460;
          padding: 15px;
          border-radius: 8px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 New Contact Form Submission</h1>
          <p>Someone is interested in working with you!</p>
        </div>
        
        <div class="content">
          <div class="field">
            <div class="label">👤 Name</div>
            <div class="value">${name}</div>
          </div>
          
          <div class="field">
            <div class="label">📧 Email</div>
            <div class="value"><a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a></div>
          </div>
          
          <div class="field">
            <div class="label">📱 Phone</div>
            <div class="value">${phone || "Not provided"}</div>
          </div>
          
          <div class="field">
            <div class="label">🔗 LinkedIn/Naukri Profile</div>
            <div class="value">
              ${linkedinProfile ? `<a href="${linkedinProfile}" target="_blank" style="color: #667eea; text-decoration: none;">${linkedinProfile}</a>` : "Not provided"}
            </div>
          </div>
          
          <div class="field">
            <div class="label">💬 Message</div>
            <div class="message-box">${message}</div>
          </div>
          
          <div class="field">
            <div class="label">⏰ Submitted On</div>
            <div class="value">${new Date(submittedAt).toLocaleString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZoneName: "short",
            })}</div>
            <div class="contact-id">ID: ${contactId}</div>
          </div>
          
          ${
            contactData.excelAttached
              ? `
          <div class="attachment-note">
            📊 <strong>Contact Database Attached:</strong> An updated Excel file with all contact submissions (including this new one) is attached to this email for your records.
          </div>
          `
              : ""
          }
        </div>
        
        <div class="footer">
          <p>This is an automated message from your portfolio website.</p>
          <p>Portfolio Backend API • Powered by Node.js & Express</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Generate HTML email template for user confirmation
const generateUserEmailHTML = (contactData) => {
  const { name, message } = contactData

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank You for Contacting Me</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background-color: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 30px 20px;
        }
        .message-box {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #667eea;
          margin: 20px 0;
          font-style: italic;
        }
        .social-links {
          margin-top: 30px;
          text-align: center;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }
        .social-links a {
          color: #667eea;
          margin: 0 15px;
          text-decoration: none;
          font-weight: 500;
        }
        .social-links a:hover {
          text-decoration: underline;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #6c757d;
          border-top: 1px solid #dee2e6;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 25px;
          border-radius: 25px;
          text-decoration: none;
          font-weight: 600;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🙏 Thank You for Reaching Out!</h1>
          <p>I appreciate you taking the time to contact me</p>
        </div>
        
        <div class="content">
          <p>Hi <strong>${name}</strong>,</p>
          
          <p>Thank you for contacting me through my portfolio website. I have received your message and will get back to you as soon as possible, typically within 24-48 hours.</p>
          
          <p><strong>Here's a copy of your message:</strong></p>
          
          <div class="message-box">
            "${message}"
          </div>
          
          <p>If you have any additional information or questions in the meantime, feel free to reply to this email directly.</p>
          
          <p>I'm excited about the possibility of working together and will be in touch soon!</p>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}" class="cta-button">Visit My Portfolio</a>
          </div>
          
          <div class="social-links">
            <p><strong>Connect with me:</strong></p>
            <a href="https://github.com/Hridesh-Srivastava" target="_blank">🔗 GitHub</a>
            <a href="https://linkedin.com/in/HridayeshSrivastava" target="_blank">💼 LinkedIn</a>
            <a href="https://vercel.com/hridesh-srivastava" target="_blank">🚀 Vercel</a>
          </div>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>Hridayesh Srivastava</strong><br>
            <em>Full-Stack Developer</em>
          </p>
        </div>
        
        <div class="footer">
          <p>This is an automated response. You can reply directly to this email.</p>
          <p>© 2024 Hridayesh Srivastava • Portfolio Website</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Send contact email with Excel attachment
export const sendContactEmail = async (contactData, excelBuffer = null) => {
  try {
    const transporter = createTransporter()

    if (!transporter) {
      console.warn("⚠️ Email transporter not configured")
      return { success: false, error: "Email not configured" }
    }

    // Verify transporter configuration
    await transporter.verify()
    console.log("✅ Email transporter verified")

    const { name, email } = contactData

    // Email to admin (you) with Excel attachment
    const adminMailOptions = {
      from: {
        name: "Portfolio Contact Form",
        address: process.env.EMAIL_USER,
      },
      to: process.env.EMAIL_USER,
      subject: `New Contact: ${name} wants to connect!`,
      html: generateAdminEmailHTML({
        ...contactData,
        excelAttached: !!excelBuffer,
      }),
      ...(excelBuffer && {
        attachments: [
          {
            filename: `contact-database-${new Date().toISOString().split("T")[0]}.xlsx`,
            content: excelBuffer,
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        ],
      }),
    }

    // Thank you email to user
    const userMailOptions = {
      from: {
        name: "Hridayesh Srivastava",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: "Thank you for reaching out!",
      html: generateUserEmailHTML(contactData),
    }

    // Send both emails
    console.log("📧 Sending admin email...")
    const adminResult = await transporter.sendMail(adminMailOptions)
    console.log("✅ Admin email sent:", adminResult.messageId)

    console.log("📧 Sending user confirmation email...")
    const userResult = await transporter.sendMail(userMailOptions)
    console.log("✅ User email sent:", userResult.messageId)

    return { success: true }
  } catch (error) {
    console.error("❌ Email sending error:", error)
    return { success: false, error: error.message }
  }
}

// Test email configuration
export const testEmailConfig = async () => {
  try {
    const transporter = createTransporter()
    if (!transporter) {
      return false
    }
    await transporter.verify()
    console.log("✅ Email configuration is valid")
    return true
  } catch (error) {
    console.error("❌ Email configuration error:", error)
    return false
  }
}

export default { sendContactEmail, testEmailConfig }
