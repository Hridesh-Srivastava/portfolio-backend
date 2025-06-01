import ExcelJS from "exceljs"
import Contact from "../models/Contact.js"

export const createExcelFile = async () => {
  try {
    console.log("📊 Creating Excel file with contact submissions...")

    const workbook = new ExcelJS.Workbook()

    // Set workbook properties
    workbook.creator = "Hridayesh Srivastava Portfolio"
    workbook.lastModifiedBy = "Portfolio Backend"
    workbook.created = new Date()
    workbook.modified = new Date()

    // Create Contact Submissions worksheet
    const worksheet = workbook.addWorksheet("Contact Submissions", {
      properties: { tabColor: { argb: "FF667eea" } },
    })

    // Define columns with proper formatting
    worksheet.columns = [
      { header: "Sr. No.", key: "srNo", width: 8 },
      { header: "Submission Date", key: "submissionDate", width: 20 },
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 35 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "LinkedIn/Naukri Profile", key: "linkedinProfile", width: 40 },
      { header: "Message", key: "message", width: 60 },
      { header: "Status", key: "status", width: 12 },
      { header: "IP Address", key: "ipAddress", width: 15 },
      { header: "Contact ID", key: "contactId", width: 25 },
    ]

    // Style the header row
    const headerRow = worksheet.getRow(1)
    headerRow.height = 25
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } }
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF667eea" },
    }
    headerRow.alignment = { vertical: "middle", horizontal: "center" }

    // Add borders to header
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      }
    })

    // Get all contacts from database, sorted by newest first
    const contacts = await Contact.find().sort({ createdAt: -1 })
    console.log(`📋 Found ${contacts.length} contact submissions`)

    // Add contact data rows
    contacts.forEach((contact, index) => {
      const rowData = {
        srNo: index + 1,
        submissionDate: contact.createdAt.toLocaleString("en-IN", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        }),
        name: contact.name,
        email: contact.email,
        phone: contact.phone || "Not provided",
        linkedinProfile: contact.linkedinProfile || "Not provided",
        message: contact.message,
        status: contact.status.toUpperCase(),
        ipAddress: contact.ipAddress || "Unknown",
        contactId: contact._id.toString(),
      }

      const row = worksheet.addRow(rowData)

      // Style data rows
      row.height = 20
      row.alignment = { vertical: "top", wrapText: true }

      // Alternate row colors
      if (index % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8F9FA" },
        }
      }

      // Add borders to data cells
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFE0E0E0" } },
          left: { style: "thin", color: { argb: "FFE0E0E0" } },
          bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
          right: { style: "thin", color: { argb: "FFE0E0E0" } },
        }
      })

      // Color code status
      const statusCell = row.getCell("status")
      switch (contact.status.toLowerCase()) {
        case "new":
          statusCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE3F2FD" },
          }
          statusCell.font = { color: { argb: "FF1976D2" }, bold: true }
          break
        case "read":
          statusCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFF3E0" },
          }
          statusCell.font = { color: { argb: "FFF57C00" }, bold: true }
          break
        case "replied":
          statusCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE8F5E8" },
          }
          statusCell.font = { color: { argb: "FF388E3C" }, bold: true }
          break
        case "archived":
          statusCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFAFAFA" },
          }
          statusCell.font = { color: { argb: "FF757575" }, bold: true }
          break
      }
    })

    // Add summary worksheet
    const summarySheet = workbook.addWorksheet("Summary", {
      properties: { tabColor: { argb: "FF28a745" } },
    })

    // Summary data
    const totalContacts = contacts.length
    const newContacts = contacts.filter((c) => c.status === "new").length
    const readContacts = contacts.filter((c) => c.status === "read").length
    const repliedContacts = contacts.filter((c) => c.status === "replied").length
    const archivedContacts = contacts.filter((c) => c.status === "archived").length

    // Summary sheet structure
    summarySheet.columns = [
      { header: "Metric", key: "metric", width: 25 },
      { header: "Value", key: "value", width: 15 },
      { header: "Percentage", key: "percentage", width: 15 },
    ]

    // Style summary header
    const summaryHeaderRow = summarySheet.getRow(1)
    summaryHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } }
    summaryHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF28a745" },
    }

    // Add summary data
    const summaryData = [
      { metric: "Total Contacts", value: totalContacts, percentage: "100%" },
      {
        metric: "New Contacts",
        value: newContacts,
        percentage: totalContacts > 0 ? `${Math.round((newContacts / totalContacts) * 100)}%` : "0%",
      },
      {
        metric: "Read Contacts",
        value: readContacts,
        percentage: totalContacts > 0 ? `${Math.round((readContacts / totalContacts) * 100)}%` : "0%",
      },
      {
        metric: "Replied Contacts",
        value: repliedContacts,
        percentage: totalContacts > 0 ? `${Math.round((repliedContacts / totalContacts) * 100)}%` : "0%",
      },
      {
        metric: "Archived Contacts",
        value: archivedContacts,
        percentage: totalContacts > 0 ? `${Math.round((archivedContacts / totalContacts) * 100)}%` : "0%",
      },
      {
        metric: "Generated On",
        value: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        percentage: "",
      },
    ]

    summaryData.forEach((data) => {
      summarySheet.addRow(data)
    })

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      if (column.key === "message") {
        column.width = 60 // Keep message column wide
      }
    })

    console.log("✅ Excel file created successfully with contact submissions")

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()
    return buffer
  } catch (error) {
    console.error("❌ Excel creation error:", error)
    throw new Error(`Failed to create Excel file: ${error.message}`)
  }
}

export const getExcelFileName = () => {
  const today = new Date()
  const dateStr = today.toISOString().split("T")[0] // YYYY-MM-DD format
  return `contact-submissions-${dateStr}.xlsx`
}

export default { createExcelFile, getExcelFileName }
