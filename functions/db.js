const fs = require('fs');
const path = require('path');

let admin = null;
let db = null;

try {
  // Check if running in Firebase Cloud Functions, local emulator, or Google Cloud Run
  if (process.env.FIREBASE_CONFIG || process.env.FUNCTIONS_EMULATOR || process.env.K_SERVICE) {
    admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    db = admin.firestore();
    console.log("Firebase Admin initialized. Running database in Firestore mode.");
  }
} catch (e) {
  console.log("Firebase Admin not initialized, running in local JSON mode:", e.message);
}

// Local JSON file paths (used when running locally without Firestore)
const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');
const DATASETS_FILE = path.join(DATA_DIR, 'datasets.json');

// Ensure local folders and files exist if using JSON database
if (!db) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));
  if (!fs.existsSync(GAMES_FILE)) fs.writeFileSync(GAMES_FILE, JSON.stringify([]));
}

// Helpers for JSON reading/writing
function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// ---------------- DATABASE METHODS ----------------

// Users database methods
async function findUser(username) {
  if (db) {
    try {
      const doc = await db.collection('users').doc(username.toLowerCase()).get();
      return doc.exists ? doc.data() : null;
    } catch (e) {
      console.error("Firestore read user error:", e);
      return null;
    }
  } else {
    const users = readJSON(USERS_FILE);
    return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  }
}

async function saveUser(user) {
  if (db) {
    try {
      await db.collection('users').doc(user.username.toLowerCase()).set(user);
    } catch (e) {
      console.error("Firestore save user error:", e);
    }
  } else {
    const users = readJSON(USERS_FILE);
    const idx = users.findIndex(u => u.username.toLowerCase() === user.username.toLowerCase());
    if (idx !== -1) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    writeJSON(USERS_FILE, users);
  }
}

// Games database methods
async function getGames(username) {
  if (db) {
    try {
      const snapshot = await db.collection('games')
                                .where('username', '==', username)
                                .get();
      const games = [];
      snapshot.forEach(doc => {
        games.push(doc.data());
      });
      return games.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (e) {
      console.error("Firestore read games error:", e);
      return [];
    }
  } else {
    const games = readJSON(GAMES_FILE);
    return games.filter(g => g.username === username)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
}

async function saveGame(game) {
  if (db) {
    try {
      await db.collection('games').doc(game.id).set(game);
    } catch (e) {
      console.error("Firestore save game error:", e);
    }
  } else {
    const games = readJSON(GAMES_FILE);
    games.push(game);
    writeJSON(GAMES_FILE, games);
  }
}

// Datasets database methods
async function getDataset() {
  if (db) {
    try {
      const doc = await db.collection('datasets').doc('ipl').get();
      if (doc.exists) {
        return doc.data();
      } else {
        // Fallback: Read local datasets file and write it to Firestore to initialize it
        const localData = JSON.parse(fs.readFileSync(DATASETS_FILE, 'utf8'));
        await db.collection('datasets').doc('ipl').set(localData);
        return localData;
      }
    } catch (e) {
      console.error("Firestore read dataset error, loading local JSON:", e);
      try {
        return JSON.parse(fs.readFileSync(DATASETS_FILE, 'utf8'));
      } catch (err) {
        return { player: [], team: [], scenario: [] };
      }
    }
  } else {
    try {
      return JSON.parse(fs.readFileSync(DATASETS_FILE, 'utf8'));
    } catch (e) {
      return { player: [], team: [], scenario: [] };
    }
  }
}

async function saveDataset(datasets) {
  if (db) {
    try {
      await db.collection('datasets').doc('ipl').set(datasets);
    } catch (e) {
      console.error("Firestore save dataset error:", e);
    }
  } else {
    writeJSON(DATASETS_FILE, datasets);
  }
}

module.exports = {
  findUser,
  saveUser,
  getGames,
  saveGame,
  getDataset,
  saveDataset
};
