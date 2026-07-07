const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

const INITIAL_DB = {
  enrollments: [],
  emails: [],
  config: {
    smtpEnabled: false,
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: '',
    smtpPass: '',
    senderEmail: 'registrar@aetheracademy.org'
  }
};

// Helper function to read from the JSON database file
function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DB, null, 2), 'utf8');
      return INITIAL_DB;
    }
    const content = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(content);
    // Ensure config exists on load
    if (!parsed.config) {
      parsed.config = { ...INITIAL_DB.config };
    }
    return parsed;
  } catch (err) {
    console.error('Error reading database file:', err);
    return INITIAL_DB;
  }
}

// Helper function to write to the JSON database file
function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing to database file:', err);
  }
}

const dbHelper = {
  // Retrieve all enrollments
  getEnrollments() {
    return readDb().enrollments;
  },

  // Save a new enrollment record
  addEnrollment(enrollment) {
    const db = readDb();
    db.enrollments.unshift(enrollment); // Add to the beginning of the list
    writeDb(db);
    return enrollment;
  },

  // Update enrollment details (e.g. status updates)
  updateEnrollment(id, updates) {
    const db = readDb();
    const index = db.enrollments.findIndex(e => e.id === id);
    if (index !== -1) {
      db.enrollments[index] = { ...db.enrollments[index], ...updates };
      writeDb(db);
      return db.enrollments[index];
    }
    return null;
  },

  // Retrieve all sent emails (simulated inbox logs)
  getEmails() {
    return readDb().emails;
  },

  // Log a new email in the sandbox inbox
  addEmail(email) {
    const db = readDb();
    db.emails.unshift(email); // Add to the beginning of the list
    writeDb(db);
    return email;
  },

  // Retrieve current configurations
  getConfig() {
    return readDb().config;
  },

  // Save/Update config
  saveConfig(newConfig) {
    const db = readDb();
    db.config = { ...db.config, ...newConfig };
    writeDb(db);
    return db.config;
  }
};

module.exports = dbHelper;
