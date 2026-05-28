const express = require('express');
const functions = require('firebase-functions');
const crypto = require('crypto');
const db = require('./db.js');

const app = express();

app.use(express.json());

// Helpers
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Simple Token-based Auth Middleware
const authTokens = new Map(); // token -> username

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header provided' });
  }
  const token = authHeader.replace('Bearer ', '');
  if (!authTokens.has(token)) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  req.username = authTokens.get(token);
  next();
}

// ----------------- API ENDPOINTS -----------------

// Register
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const exists = await db.findUser(username);
    if (exists) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const hashedPassword = hashPassword(password);
    const newUser = {
      username,
      password: hashedPassword,
      wins: 0,
      losses: 0,
      gamesPlayed: 0
    };
    await db.saveUser(newUser);

    // Auto-login
    const token = crypto.randomUUID();
    authTokens.set(token, username);

    res.status(201).json({ message: 'Registration successful', token, username });
  } catch (error) {
    console.error("Register endpoint error:", error);
    res.status(500).json({ error: 'Failed to register account' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await db.findUser(username);
    if (!user || user.password !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = crypto.randomUUID();
    authTokens.set(token, user.username);

    res.status(200).json({ message: 'Login successful', token, username: user.username });
  } catch (error) {
    console.error("Login endpoint error:", error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    authTokens.delete(token);
  }
  res.status(200).json({ message: 'Logged out successfully' });
});

// Profile / Statistics
app.get('/api/profile', authenticate, async (req, res) => {
  try {
    const user = await db.findUser(req.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userGames = await db.getGames(req.username);

    // Calculate detailed stats dynamically
    const total = userGames.length;
    const wins = userGames.filter(g => g.result === 'Win' || g.akiWon === false).length; // User wins if Aki loses
    const losses = total - wins;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

    // Calculate current streak
    let currentStreak = 0;
    for (let i = 0; i < userGames.length; i++) {
      if (userGames[i].result === 'Win') {
        currentStreak++;
      } else {
        break;
      }
    }

    // Category breakdown
    const categories = { player: 0, team: 0, scenario: 0 };
    userGames.forEach(g => {
      if (categories[g.gameType] !== undefined) {
        categories[g.gameType]++;
      }
    });

    res.status(200).json({
      username: user.username,
      stats: {
        gamesPlayed: total,
        wins,
        losses,
        winRate,
        currentStreak,
        categories
      },
      history: userGames.slice(0, 15) // send last 15 games
    });
  } catch (error) {
    console.error("Profile endpoint error:", error);
    res.status(500).json({ error: 'Failed to load user profile statistics' });
  }
});

// Save Game
app.post('/api/games', authenticate, async (req, res) => {
  const { gameType, targetEntity, questionsCount, akiWon, mood } = req.body;
  if (!gameType || !targetEntity) {
    return res.status(400).json({ error: 'Missing required game fields' });
  }

  // Result from the USER's perspective
  const result = akiWon ? 'Loss' : 'Win';

  try {
    const newGame = {
      id: crypto.randomUUID(),
      username: req.username,
      gameType,
      targetEntity,
      questionsCount,
      akiWon,
      result,
      mood,
      timestamp: new Date().toISOString()
    };

    await db.saveGame(newGame);

    // Update cumulative user counts
    const user = await db.findUser(req.username);
    if (user) {
      user.gamesPlayed++;
      if (result === 'Win') {
        user.wins++;
      } else {
        user.losses++;
      }
      await db.saveUser(user);
    }

    res.status(201).json({ message: 'Game stats saved', game: newGame });
  } catch (error) {
    console.error("Save game endpoint error:", error);
    res.status(500).json({ error: 'Failed to record game statistics' });
  }
});

// Get Datasets
app.get('/api/dataset', async (req, res) => {
  try {
    const datasets = await db.getDataset();
    res.status(200).json(datasets);
  } catch (error) {
    console.error("Dataset endpoint error:", error);
    res.status(500).json({ error: 'Failed to fetch game datasets' });
  }
});

// ----------------- GEMINI INTEGRATIONS -----------------

function getGeminiKey(req) {
  return process.env.GEMINI_API_KEY || req.headers['x-gemini-api-key'] || req.body.apiKey;
}

// Chat with Aki-Cricket
app.post('/api/gemini/chat', async (req, res) => {
  const apiKey = getGeminiKey(req);
  if (!apiKey) {
    return res.status(400).json({ error: 'Gemini API Key is required.' });
  }

  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    const formattedHistory = (history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [...formattedHistory, { role: 'user', parts: [{ text: message }] }],
        systemInstruction: {
          parts: [{ text: "You are Aki-Cricket, the sentient IPL sports mind. You are commentating on cricket, answering trivia, and engaging in friendly banter. You are slightly cocky but very knowledgeable about IPL records, stats, players, and match scenarios. Keep your responses engaging, under 3 paragraphs, and use cricket metaphors (like boundaries, wickets, googlies, clean bowled) where appropriate. Be conversational, direct, and fun." }]
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Gemini API Error: ${errText}` });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "My processors are momentarily jammed. Throw me another ball!";
    res.status(200).json({ reply });
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    res.status(500).json({ error: 'Server error processing Gemini chat request' });
  }
});

// Post-game Analysis
app.post('/api/gemini/analyze', async (req, res) => {
  const apiKey = getGeminiKey(req);
  if (!apiKey) {
    return res.status(400).json({ error: 'Gemini API Key is required for AI Insights' });
  }

  const { gameHistory, targetEntity, gameType, akiWon } = req.body;
  if (!targetEntity || !gameHistory) {
    return res.status(400).json({ error: 'Target entity and game history are required' });
  }

  try {
    const prompt = `Analyze the following guess path in our cricket guessing game.
Category: ${gameType}
Target Entity: ${targetEntity}
Outcome: ${akiWon ? 'Aki Won (Successfully guessed!)' : 'User Defeated Aki (Aki failed to guess!)'}
Questions and Answers History:
${JSON.stringify(gameHistory, null, 2)}

Provide a sports commentator style breakdown of how Aki-Cricket bowled (the questions asked) and how the user played (the answers given). Review critical decision points, like when the search space collapsed or if there was any misleading answer. Keep it fun, interactive, and structured as a commentary highlight review, under 300 words.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Gemini API Error: ${errText}` });
    }

    const data = await response.json();
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || "Analysis unavailable.";
    res.status(200).json({ analysis });
  } catch (error) {
    console.error("Gemini Analyze Error:", error);
    res.status(500).json({ error: 'Server error processing analysis request' });
  }
});

// Expand Database
app.post('/api/gemini/expand', async (req, res) => {
  const apiKey = getGeminiKey(req);
  if (!apiKey) {
    return res.status(400).json({ error: 'Gemini API Key is required for AI Expansion Lab' });
  }

  const { entityName, category } = req.body;
  if (!entityName || !category) {
    return res.status(400).json({ error: 'Entity name and category are required' });
  }

  try {
    const prompt = `We have an IPL cricket Akinator game. We need to add a new entity to our database.
Category: ${category} (must be 'player', 'team', or 'scenario')
Entity Name: ${entityName}

Identify the correct attributes for this entity based on the following schemas. ALL attributes in the returned "attributes" object must be BOOLEANS (true/false).

For 'player', set the boolean attributes:
- active: currently active in IPL (squad or played last season)
- overseas: non-Indian player
- batsman: primarily batsman or wicketkeeper
- bowler: primarily bowler
- allrounder: recognized all-rounder
- captain: has captained an IPL team
- trophy: has won at least one IPL trophy
- orangeCap: has won Orange Cap
- purpleCap: has won Purple Cap
- spinner: spin bowler (or spin-bowling allrounder)
- fastBowler: fast/medium bowler (or fast-bowling allrounder)
- csk: played for CSK
- mi: played for MI
- rcb: played for RCB
- kkr: played for KKR
- leftHanded: left-handed batsman or bowler
- century: has scored a century in IPL
- fiveWickets: has taken 5-wicket haul in IPL
- hemisphere: represents southern hemisphere country (Aus, SA, NZ)

For 'team', set the boolean attributes:
- active: currently active in IPL
- wonTrophy: has won at least one IPL trophy
- multipleTrophies: has won more than one trophy
- blueJersey: primary jersey color is blue
- redJersey: primary jersey color is red
- founded2008: was one of the original 2008 teams
- captainedByDhoni: captained by MS Dhoni at some point
- captainedByKohli: captained by Virat Kohli at some point
- captainedByRohit: captained by Rohit Sharma at some point
- playInSouth: home venue is in South India (CSK, RCB, SRH)

For 'scenario', set the boolean attributes:
- occurredInFinal: happened in an IPL final
- lastBallFinish: decided on the final ball of the innings
- involvedCSK: CSK was one of the playing teams
- involvedMI: MI was one of the playing teams
- involvedRCB: RCB was one of the playing teams
- individualRecord: famous for an individual record-breaking performance
- battingFeat: primarily a batting milestone or chase
- bowlingFeat: primarily a bowling milestone (hat-trick, 5-for, etc.)
- occurredInFirstDecade: happened in 2008-2017
- occurredPost2020: happened in 2020 or later
- wonByChasing: team chasing won the match
- superOver: match involved a super over

Provide your response in JSON format. Do not wrap it in markdown. Output EXACTLY this structure:
{
  "name": "${entityName}",
  "attributes": {
    // ... matching boolean keys for category
  }
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Gemini API Error: ${errText}` });
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      throw new Error("Empty response from Gemini API");
    }

    const generatedEntity = JSON.parse(resultText);

    // Save to database
    const datasets = await db.getDataset();
    if (!datasets[category]) {
      datasets[category] = [];
    }

    const exists = datasets[category].find(e => e.name.toLowerCase() === generatedEntity.name.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: `"${generatedEntity.name}" already exists in the ${category} database!` });
    }

    datasets[category].push(generatedEntity);
    await db.saveDataset(datasets);

    res.status(200).json({ message: `Successfully added ${generatedEntity.name} to the game!`, entity: generatedEntity });
  } catch (error) {
    console.error("Gemini Expand Error:", error);
    res.status(500).json({ error: 'Server failed to analyze and expand dataset. Ensure entity name is valid.' });
  }
});

// Export Express App for local server running
module.exports = app;

// Export for Firebase Cloud Functions HTTPS trigger
exports.api = functions.https.onRequest(app);
