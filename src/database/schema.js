import db from "./database";

export const createTables = () => {
  try {

    // USERS

    db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        cloudId TEXT UNIQUE,

        fullName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT,

        mobile TEXT,
        age INTEGER,

        role TEXT DEFAULT 'user',

        isVerified INTEGER DEFAULT 0,

        avatarUrl TEXT,
        avatarPublicId TEXT,

        currency TEXT DEFAULT 'INR',

        monthlyBudget REAL DEFAULT 0,

        lastVisitedAt TEXT,

        subscriptionPlan TEXT DEFAULT 'free',
        subscriptionStatus TEXT DEFAULT 'inactive',
        subscriptionProvider TEXT DEFAULT 'none',

        subscriptionStartDate TEXT,
        subscriptionEndDate TEXT,

        autoRenew INTEGER DEFAULT 0,

        chatbotUsed INTEGER DEFAULT 0,
        chatbotLimit INTEGER DEFAULT 0,

        receiptUsed INTEGER DEFAULT 0,
        receiptLimit INTEGER DEFAULT 0,

        voiceUsed INTEGER DEFAULT 0,
        voiceLimit INTEGER DEFAULT 0,

        resetOtp TEXT,
        resetOtpExpiry TEXT,

        createdAt TEXT,
        updatedAt TEXT
      );
    `);



    // TRANSACTIONS

    db.execute(`
      CREATE TABLE IF NOT EXISTS transactions (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        cloudId TEXT UNIQUE,

        userId INTEGER,

        type TEXT NOT NULL,

        category TEXT NOT NULL,

        description TEXT NOT NULL,

        amount REAL NOT NULL,

        paymentMethod TEXT,

        transactionDate TEXT,

        note TEXT,

        isSynced INTEGER DEFAULT 0,

        deleted INTEGER DEFAULT 0,

        createdAt TEXT,

        updatedAt TEXT
      );
    `);



    // SETTINGS

    db.execute(`
      CREATE TABLE IF NOT EXISTS settings (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        theme TEXT DEFAULT 'Dark',

        language TEXT DEFAULT 'English',

        notification INTEGER DEFAULT 1,

        biometric INTEGER DEFAULT 0
      );
    `);



    console.log("✅ SQLite Tables Created Successfully");

  } catch (error) {

    console.log("❌ SQLite Error");

    console.log(error);

  }
};