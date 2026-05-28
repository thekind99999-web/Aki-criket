// Aki-Cricket Controller with Dashboard and Gemini Integrations

const initApp = () => {
  let game = null;
  let currentQuestion = null;
  let soundEnabled = true;
  let speechEnabled = false;
  let stadium3d = null;
  let audioCtx = null;
  
  // AI Chat History
  let chatHistory = [];

  let useLocalFallback = false;

  async function detectBackend() {
    try {
      const res = await fetch('/api/dataset', { method: 'GET' });
      if (res.status === 404 || !res.ok) {
        useLocalFallback = true;
        console.warn("Backend API unavailable (HTTP 404 or error). Falling back to client-side database mode.");
      } else {
        useLocalFallback = false;
        console.log("Backend API is fully available. Running in full-stack mode.");
      }
    } catch (e) {
      useLocalFallback = true;
      console.warn("Backend API unreachable. Falling back to client-side database mode:", e);
    }
  }

  async function callGeminiDirect(apiKey, prompt, systemInstruction = null, isJson = false) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    };
    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }
    if (isJson) {
      body.generationConfig = {
        responseMimeType: "application/json"
      };
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errText = await response.text();
      let msg = `HTTP ${response.status}`;
      try {
        const parsed = JSON.parse(errText);
        msg = parsed.error?.message || msg;
      } catch(e) {}
      throw new Error(msg);
    }
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Empty response from Gemini API");
    }
    return text;
  }

  async function callGeminiChatDirect(apiKey, message, history) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const formattedHistory = (history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));
    
    const body = {
      contents: [...formattedHistory, { role: 'user', parts: [{ text: message }] }],
      systemInstruction: {
        parts: [{ text: "You are Aki-Cricket, the sentient IPL sports mind. You are commentating on cricket, answering trivia, and engaging in friendly banter. You are slightly cocky but very knowledgeable about IPL records, stats, players, and match scenarios. Keep your responses engaging, under 3 paragraphs, and use cricket metaphors (like boundaries, wickets, googlies, clean bowled) where appropriate. Be conversational, direct, and fun." }]
      }
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errText = await response.text();
      let msg = `HTTP ${response.status}`;
      try {
        const parsed = JSON.parse(errText);
        msg = parsed.error?.message || msg;
      } catch(e) {}
      throw new Error(msg);
    }
    
    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "My processors are momentarily jammed. Throw me another ball!";
    return { reply };
  }

  async function handleOfflineRequest(url, options = {}) {
    const payload = options.body ? JSON.parse(options.body) : null;
    const localApiKey = localStorage.getItem('gemini_api_key');
    
    async function offlineHash(password) {
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    function getOfflineUsers() {
      try {
        return JSON.parse(localStorage.getItem('offline_users') || '{}');
      } catch (e) {
        return {};
      }
    }
    
    function saveOfflineUsers(users) {
      localStorage.setItem('offline_users', JSON.stringify(users));
    }

    function getOfflineGames() {
      try {
        return JSON.parse(localStorage.getItem('offline_games') || '[]');
      } catch (e) {
        return [];
      }
    }

    function saveOfflineGames(games) {
      localStorage.setItem('offline_games', JSON.stringify(games));
    }
    
    if (url === '/api/register') {
      const { username, password } = payload;
      if (!username || !password) {
        throw new Error('Username and password are required');
      }
      const users = getOfflineUsers();
      if (users[username]) {
        throw new Error('Username is already taken');
      }
      const hashedPassword = await offlineHash(password);
      users[username] = {
        username,
        password: hashedPassword,
        wins: 0,
        losses: 0,
        gamesPlayed: 0
      };
      saveOfflineUsers(users);
      return { message: 'Registration successful', token: 'mock-offline-token-' + username, username };
    }
    
    if (url === '/api/login') {
      const { username, password } = payload;
      if (!username || !password) {
        throw new Error('Username and password are required');
      }
      const users = getOfflineUsers();
      const user = users[username];
      const hashedPassword = await offlineHash(password);
      if (!user || user.password !== hashedPassword) {
        throw new Error('Invalid username or password');
      }
      return { message: 'Login successful', token: 'mock-offline-token-' + username, username };
    }
    
    if (url === '/api/logout') {
      return { message: 'Logged out successfully' };
    }
    
    if (url === '/api/profile') {
      const username = sessionStorage.getItem('auth_username');
      if (!username) throw new Error('Unauthorized');
      
      const games = getOfflineGames().filter(g => g.username === username);
      const total = games.length;
      const wins = games.filter(g => g.result === 'Win' || g.akiWon === false).length;
      const losses = total - wins;
      const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
      
      let currentStreak = 0;
      for (let i = 0; i < games.length; i++) {
        if (games[i].result === 'Win') {
          currentStreak++;
        } else {
          break;
        }
      }
      
      const categories = { player: 0, team: 0, scenario: 0 };
      games.forEach(g => {
        if (categories[g.gameType] !== undefined) {
          categories[g.gameType]++;
        }
      });
      
      return {
        username,
        stats: {
          gamesPlayed: total,
          wins,
          losses,
          winRate,
          currentStreak,
          categories
        },
        history: games.slice(0, 15)
      };
    }
    
    if (url === '/api/games') {
      const username = sessionStorage.getItem('auth_username');
      if (!username) throw new Error('Unauthorized');
      
      const { gameType, targetEntity, questionsCount, akiWon, mood } = payload;
      const result = akiWon ? 'Loss' : 'Win';
      
      const newGame = {
        id: 'offline-game-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        username,
        gameType,
        targetEntity,
        questionsCount,
        akiWon,
        result,
        mood,
        timestamp: new Date().toISOString()
      };
      
      const games = getOfflineGames();
      games.unshift(newGame);
      saveOfflineGames(games);
      
      const users = getOfflineUsers();
      if (users[username]) {
        users[username].gamesPlayed++;
        if (result === 'Win') {
          users[username].wins++;
        } else {
          users[username].losses++;
        }
        saveOfflineUsers(users);
      }
      
      return { message: 'Game stats saved', game: newGame };
    }
    
    if (url === '/api/dataset') {
      const datasets = JSON.parse(JSON.stringify(window.AkiGame.DATASETS));
      try {
        const offlineDatasets = JSON.parse(localStorage.getItem('offline_datasets') || '{"player":[],"team":[],"scenario":[]}');
        Object.keys(offlineDatasets).forEach(cat => {
          if (Array.isArray(offlineDatasets[cat])) {
            offlineDatasets[cat].forEach(entity => {
              if (!datasets[cat].find(e => e.name.toLowerCase() === entity.name.toLowerCase())) {
                datasets[cat].push(entity);
              }
            });
          }
        });
      } catch (e) {
        console.warn("Failed to merge offline datasets:", e);
      }
      return datasets;
    }
    
    if (url === '/api/gemini/chat') {
      if (!localApiKey) {
        throw new Error('Gemini API Key is required. Please set it in Settings tab.');
      }
      const { message, history } = payload;
      return callGeminiChatDirect(localApiKey, message, history);
    }
    
    if (url === '/api/gemini/analyze') {
      if (!localApiKey) {
        throw new Error('Gemini API Key is required for AI Insights. Please set it in Settings tab.');
      }
      const { gameHistory, targetEntity, gameType, akiWon } = payload;
      
      const prompt = `Analyze the following guess path in our cricket guessing game.
Category: ${gameType}
Target Entity: ${targetEntity}
Outcome: ${akiWon ? 'Aki Won (Successfully guessed!)' : 'User Defeated Aki (Aki failed to guess!)'}
Questions and Answers History:
${JSON.stringify(gameHistory, null, 2)}

Provide a sports commentator style breakdown of how Aki-Cricket bowled (the questions asked) and how the user played (the answers given). Review critical decision points, like when the search space collapsed or if there was any misleading answer. Keep it fun, interactive, and structured as a commentary highlight review, under 300 words.`;

      const analysis = await callGeminiDirect(localApiKey, prompt);
      return { analysis };
    }
    
    if (url === '/api/gemini/expand') {
      if (!localApiKey) {
        throw new Error('Gemini API Key is required for AI Expansion Lab. Please set it in Settings tab.');
      }
      const { entityName, category } = payload;
      
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

      const resText = await callGeminiDirect(localApiKey, prompt, null, true);
      const generatedEntity = JSON.parse(resText);
      
      const offlineDatasets = JSON.parse(localStorage.getItem('offline_datasets') || '{"player":[],"team":[],"scenario":[]}');
      if (!offlineDatasets[category]) {
        offlineDatasets[category] = [];
      }
      const exists = offlineDatasets[category].find(e => e.name.toLowerCase() === generatedEntity.name.toLowerCase());
      if (exists) {
        throw new Error(`"${generatedEntity.name}" already exists in the local database!`);
      }
      
      offlineDatasets[category].push(generatedEntity);
      localStorage.setItem('offline_datasets', JSON.stringify(offlineDatasets));
      
      return { message: `Successfully added ${generatedEntity.name} to the game!`, entity: generatedEntity };
    }
    
    throw new Error(`Unknown API endpoint: ${url}`);
  }

  // Helper API fetch wrapper
  async function apiFetch(url, options = {}) {
    if (useLocalFallback) {
      return handleOfflineRequest(url, options);
    }

    const token = sessionStorage.getItem('auth_token');
    const headers = options.headers || {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Attach Gemini API key from local settings if available
    const localApiKey = localStorage.getItem('gemini_api_key');
    if (localApiKey) {
      headers['x-gemini-api-key'] = localApiKey;
    }
    
    headers['Content-Type'] = 'application/json';
    
    const res = await fetch(url, {
      ...options,
      headers
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `Server returned error: ${res.status}`);
    }
    return res.json();
  }

  // Load and apply datasets from backend database
  async function syncDatasets() {
    try {
      const datasets = await apiFetch('/api/dataset');
      if (window.AkiGame && window.AkiGame.setDatasets) {
        window.AkiGame.setDatasets(datasets);
        console.log("Successfully synchronized dynamic datasets from backend!");
      }
    } catch (e) {
      console.warn("Dynamic dataset sync failed, using static fallbacks:", e);
    }
  }

  // Audio Context for Sound Effects
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Play Sound Effects
  function playSound(type) {
    if (!soundEnabled) return;
    try {
      initAudio();
      
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'hover') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'guess') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.4);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'win') {
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const oscNode = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscNode.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          oscNode.type = 'triangle';
          oscNode.frequency.setValueAtTime(freq, now + idx * 0.08);
          gainNode.gain.setValueAtTime(0.08, now + idx * 0.08);
          gainNode.gain.linearRampToValueAtTime(0, now + idx * 0.08 + 0.25);
          
          oscNode.start(now + idx * 0.08);
          oscNode.stop(now + idx * 0.08 + 0.25);
        });
      } else if (type === 'lose') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.6);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (type === 'wrong') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      console.warn("Audio Context failed to start:", e);
    }
  }

  // Speech Synthesis
  function speak(text) {
    if (!speechEnabled) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  }

  // Banter Lines depending on State/Mood
  const BANTER_LINES = {
    calm: [
      "Accessing cricket archives. Give me a moment...",
      "Analyzing player vectors. Let's see your choice.",
      "Interesting decision. Filtering database attributes...",
      "Matching query properties against IPL historical logs.",
      "The algorithms are running cool. What is the next detail?"
    ],
    cocky: [
      "Ah, the search space is narrowing rapidly. Too easy for me!",
      "I've practically mapped your thought. Do you want to give up?",
      "Checking secondary permutations. I'm three steps ahead of you!",
      "A classic configuration. Your player is practically revealed.",
      "My processors are running at peak smugness right now!"
    ],
    panicked: [
      "Wait... my matrices are overlapping! What kind of choices are these?",
      "System warning: ambiguous signals detected! Recalibrating logic gates...",
      "A rare data branch? Initiating emergency computational recovery!",
      "Hold on! My memory registers are spiking. Let me cross-reference that.",
      "Algorithmic distress! The entropy is not collapsing properly!"
    ],
    dramatic: [
      "We've reached the absolute boundary. The final overs of this game!",
      "One last query to settle this duel. Witness the peak of sports intelligence!",
      "All calculations boil down to this final stand. Prepare yourself!",
      "Tension at maximum. Initiating deep diagnostic overrides!",
      "I will find the answer, even if my core processors overload!"
    ]
  };

  function getBanter(mood) {
    const list = BANTER_LINES[mood] || BANTER_LINES.calm;
    return list[Math.floor(Math.random() * list.length)];
  }

  // State Navigation (for inner Play screen transitions)
  function showScreen(screenId) {
    if (screenId === "screen-guess") {
      document.getElementById("screen-guess").classList.add("active");
    } else {
      document.querySelectorAll(".screen").forEach(s => {
        if (s.id !== "screen-guess") {
          s.classList.remove("active");
        }
      });
      document.getElementById("screen-guess").classList.remove("active");
      const target = document.getElementById(screenId);
      if (target) target.classList.add("active");
    }
  }

  // Initialize Game Loop
  function startNewGame(category) {
    // Hide previous analysis
    document.getElementById('game-ai-insights-box').style.display = 'none';
    document.getElementById('game-insights-content').innerText = '';

    game = new window.AkiGame.GameState(category);
    currentQuestion = null;

    // Reset 3D Renderer
    if (stadium3d) {
      stadium3d.cleanup();
      stadium3d.updateState({
        batsmanAnimationTrigger: "IDLE_TAP_BAT",
        stadiumColorPalette: { primaryNeon: "#00f5ff", secondaryGlow: "#ffffff" },
        particleEffect: "NONE"
      });
    }

    askNext();
    showScreen("screen-game");
  }

  // Ask Next Question
  function askNext() {
    currentQuestion = game.getNextQuestion();

    if (!currentQuestion) {
      triggerGuessOrEnd();
      return;
    }

    const report = game.getEngineReport();

    if (stadium3d) {
      stadium3d.updateState(report.uiState);
    }

    // Determine Aki's Mood
    let mood = "calm";
    let badgeText = "Exploratory Mode";

    if (report.totalQuestions >= 14) {
      mood = "dramatic";
      badgeText = "System Overload imminent";
    } else if (report.totalQuestions >= 10) {
      mood = "panicked";
      badgeText = "Algorithmic Panic";
    } else if (report.totalQuestions >= 5) {
      mood = "cocky";
      badgeText = "Narrowing Down";
    }
    
    // Set Mood Badge
    const badge = document.getElementById("aki-mood-badge");
    if (badge) {
      badge.innerText = badgeText;
      badge.style.borderColor = `var(--color-${mood})`;
      badge.style.color = `var(--color-${mood})`;
      badge.style.background = `rgba(var(--color-${mood}-glow), 0.15)`;
    }

    document.getElementById("question-text").innerText = currentQuestion.text;

    const banter = getBanter(mood);
    document.getElementById("banter-text").innerText = `"${banter}"`;
    speak(banter + " " + currentQuestion.text);
  }

  const THINKING_PHRASES = [
    "Hmm...",
    "Let me check my database...",
    "Interesting choice...",
    "Narrowing down search space...",
    "I'm getting closer!",
    "Analyzing inputs...",
    "Fascinating... let's see.",
    "Recalibrating engine..."
  ];

  document.querySelectorAll(".answer-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      if (!game || !currentQuestion) return;
      
      const answerVal = btn.getAttribute("data-val");
      playSound('click');

      game.submitAnswer(currentQuestion.id, answerVal);
      setAnswerButtonsEnabled(false);
      
      const randomThinking = THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)];
      document.getElementById("banter-text").innerText = `"${randomThinking}"`;

      setTimeout(() => {
        setAnswerButtonsEnabled(true);
        const report = game.getEngineReport();

        if (report.isFinalGuess || game.totalQuestionsAsked >= 15) {
          triggerGuessOrEnd();
        } else {
          askNext();
        }
      }, 1000);
    });
  });

  // Evaluate state and trigger guess card or result screen
  function triggerGuessOrEnd() {
    const report = game.getEngineReport();
    
    if (report.confidence >= 0.70 || game.totalQuestionsAsked >= 15) {
      playSound('guess');
      
      let catLabel = "IPL Player";
      if (game.gameType === "team") catLabel = "IPL Team";
      else if (game.gameType === "scenario") catLabel = "IPL Match Scenario";
      
      document.getElementById("guess-type").innerText = catLabel;
      document.getElementById("guess-entity").innerText = report.topCandidate || "N/A";
      
      showScreen("screen-guess");
    } else {
      showResult(false, "Unknown Entity");
    }
  }

  // Guess Confirmed (Aki Wins)
  document.getElementById("confirm-guess-btn").addEventListener("click", () => {
    playSound('win');
    const report = game.getEngineReport();
    
    if (stadium3d) {
      stadium3d.updateState({
        batsmanAnimationTrigger: "MASSIVE_SIX_CELEBRATION",
        stadiumColorPalette: { primaryNeon: "#FFD700", secondaryGlow: "#00E676" },
        particleEffect: "FIREWORKS"
      });
    }

    const flyingSix = document.getElementById("flying-six-overlay");
    if (flyingSix) {
      flyingSix.classList.add("active");
      setTimeout(() => {
        flyingSix.classList.remove("active");
      }, 1800);
    }

    setTimeout(() => {
      showResult(true, report.topCandidate);
    }, 1800);
  });

  // Guess Rejected (Aki Wrong)
  document.getElementById("reject-guess-btn").addEventListener("click", () => {
    playSound('wrong');
    const report = game.getEngineReport();
    game.rejectGuess(report.topCandidate);

    const updatedReport = game.getEngineReport();

    if (game.totalQuestionsAsked >= 15 || updatedReport.confidence < 0.01) {
      showResult(false, report.topCandidate);
    } else {
      showScreen("screen-game");
      askNext();
    }
  });

  // Show Results Screen & Save Game to Backend
  async function showResult(akiWon, targetEntity) {
    const report = game ? game.getEngineReport() : { totalQuestions: 15 };
    const title = document.getElementById("result-title");
    const subtitle = document.getElementById("result-subtitle");
    const rIcon = document.getElementById("result-icon");

    document.getElementById("result-entity").innerText = targetEntity || "N/A";
    document.getElementById("result-questions").innerText = `${report.totalQuestions} / 15`;

    let finalMood = "Exploratory";
    if (report.totalQuestions >= 13) finalMood = "Desperate";
    else if (report.totalQuestions >= 8) finalMood = "Cocky";
    else if (report.totalQuestions >= 5) finalMood = "Confident";
    
    document.getElementById("result-mood").innerText = finalMood;

    if (akiWon) {
      title.innerText = "AKI WINS!";
      title.style.color = "var(--color-calm)";
      subtitle.innerText = "Your mind is an open book to my algorithms.";
      rIcon.innerHTML = `<i class="fas fa-medal" style="color: var(--color-calm);"></i>`;
      
      startConfetti();
      speak("Aha! Victory is mine! My database registers another win.");
    } else {
      playSound('lose');
      title.innerText = "YOU DEFEATED AKI!";
      title.style.color = "var(--color-dramatic)";
      subtitle.innerText = "My processors have overheated. A legendary sports mind indeed!";
      rIcon.innerHTML = `<i class="fas fa-crown" style="color: var(--color-panicked);"></i>`;
      
      speak("Congratulations! You have defeated my algorithms.");
    }

    showScreen("screen-result");

    // SAVE GAME TO BACKEND
    try {
      await apiFetch('/api/games', {
        method: 'POST',
        body: JSON.stringify({
          gameType: game.gameType,
          targetEntity: targetEntity || "Unknown",
          questionsCount: report.totalQuestions,
          akiWon: akiWon,
          mood: finalMood
        })
      });
      console.log("Match record logged to server successfully.");
      // Proactively refresh profile stats
      updateStats();
    } catch (e) {
      console.error("Failed to log game to server:", e);
    }
  }

  // Play Again logic
  document.getElementById("restart-game-btn").addEventListener("click", () => {
    stopConfetti();
    showScreen("screen-welcome");
  });

  // Set up categories listeners on Welcome screen
  document.querySelectorAll(".category-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      playSound('click');
      const type = btn.getAttribute("data-type");
      startNewGame(type);
    });
    btn.addEventListener("mouseenter", () => {
      playSound('hover');
    });
  });

  // ==================== CONFETTI ENGINE ====================
  let confettiActive = false;
  const canvas = document.getElementById("confetti-canvas");
  const ctx = canvas.getContext("2d");
  let confettiPieces = [];

  function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }

  class ConfettiPiece {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * -canvas.height - 20;
      this.r = Math.random() * 6 + 4;
      this.d = Math.random() * canvas.height;
      this.color = `hsl(${Math.random() * 360}, 90%, 60%)`;
      this.tilt = Math.random() * 10 - 5;
      this.tiltAngleIncremental = Math.random() * 0.07 + 0.02;
      this.tiltAngle = 0;
    }

    draw() {
      ctx.beginPath();
      ctx.lineWidth = this.r;
      ctx.strokeStyle = this.color;
      ctx.moveTo(this.x + this.tilt + this.r/2, this.y);
      ctx.lineTo(this.x + this.tilt, this.y + this.tilt + this.r/2);
      ctx.stroke();
    }

    update() {
      this.tiltAngle += this.tiltAngleIncremental;
      this.y += (Math.cos(this.d) + 3 + this.r/2)/2;
      this.x += Math.sin(this.tiltAngle);
      this.tilt = Math.sin(this.tiltAngle - this.r/2) * 15;

      if (this.y > canvas.height) {
        this.x = Math.random() * canvas.width;
        this.y = -20;
        this.tilt = Math.random() * 10 - 5;
      }
    }
  }

  function drawConfettiFrame() {
    if (!confettiActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confettiPieces.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(drawConfettiFrame);
  }

  function startConfetti() {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    confettiActive = true;
    confettiPieces = [];
    for (let i = 0; i < 100; i++) {
      confettiPieces.push(new ConfettiPiece());
    }
    drawConfettiFrame();
  }

  function stopConfetti() {
    confettiActive = false;
    window.removeEventListener("resize", resizeCanvas);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Initialize 3D Stadium
  try {
    stadium3d = new window.AkiStadium3D("stadium-3d-container");
  } catch (e) {
    console.warn("Failed to initialize 3D Stadium renderer:", e);
    stadium3d = null;
  }

  document.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("mouseenter", () => {
      playSound('hover');
    });
  });

  function setAnswerButtonsEnabled(enabled) {
    document.querySelectorAll(".answer-btn").forEach(btn => {
      btn.disabled = !enabled;
      btn.style.opacity = enabled ? "1" : "0.5";
      btn.style.pointerEvents = enabled ? "auto" : "none";
    });
  }

  // ==================== AUTHENTICATION LOGIC ====================
  let isSignupMode = false;

  const authContainer = document.getElementById('auth-container');
  const dashboardContainer = document.getElementById('dashboard-container');
  const authForm = document.getElementById('auth-form');
  const authSubmitText = document.getElementById('auth-submit-text');
  const authErrorMsg = document.getElementById('auth-error-msg');
  const displayUsername = document.getElementById('display-username');

  // Toggle Auth Modes
  document.getElementById('tab-login-btn').addEventListener('click', () => {
    isSignupMode = false;
    document.getElementById('tab-login-btn').classList.add('active');
    document.getElementById('tab-signup-btn').classList.remove('active');
    authSubmitText.innerText = "Log In";
    authErrorMsg.style.display = 'none';
  });

  document.getElementById('tab-signup-btn').addEventListener('click', () => {
    isSignupMode = true;
    document.getElementById('tab-login-btn').classList.remove('active');
    document.getElementById('tab-signup-btn').classList.add('active');
    authSubmitText.innerText = "Register & Log In";
    authErrorMsg.style.display = 'none';
  });

  // Auth Form Submit
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authErrorMsg.style.display = 'none';

    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;

    const endpoint = isSignupMode ? '/api/register' : '/api/login';

    try {
      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      // Save token & username
      sessionStorage.setItem('auth_token', data.token);
      sessionStorage.setItem('auth_username', data.username);
      
      authForm.reset();
      checkAuth();
      playSound('click');
    } catch (err) {
      authErrorMsg.innerText = err.message || "Authentication failed.";
      authErrorMsg.style.display = 'block';
      playSound('wrong');
    }
  });

  // Log Out Account
  document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
      await apiFetch('/api/logout', { method: 'POST' });
    } catch (e) {
      console.warn("Backend logout request failed:", e);
    }
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_username');
    chatHistory = [];
    checkAuth();
    playSound('click');
  });

  // Check auth state on load
  function checkAuth() {
    const token = sessionStorage.getItem('auth_token');
    const username = sessionStorage.getItem('auth_username');

    if (token && username) {
      authContainer.style.display = 'none';
      dashboardContainer.style.display = 'block';
      displayUsername.innerText = username;
      
      // Initialize view items
      syncDatasets();
      updateStats();
      showTab('tab-play');
    } else {
      authContainer.style.display = 'block';
      dashboardContainer.style.display = 'none';
      
      // If we log out, ensure game stops
      stopConfetti();
      showScreen('screen-welcome');
    }
  }

  // ==================== DASHBOARD TAB ROUTING ====================
  function showTab(tabId) {
    // Toggle tab button active classes
    document.querySelectorAll('.nav-tab').forEach(tab => {
      if (tab.getAttribute('data-target') === tabId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Toggle tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      if (panel.id === tabId) {
        panel.style.display = 'block';
      } else {
        panel.style.display = 'none';
      }
    });

    // Trigger tab specific loads
    if (tabId === 'tab-stats') {
      updateStats();
    } else if (tabId === 'tab-play') {
      // Small resize trigger to fix Three.js rendering viewport sizing issues if tab was hidden
      if (stadium3d) {
        setTimeout(() => stadium3d.onResize(), 100);
      }
    }
  }

  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      playSound('click');
      const target = tab.getAttribute('data-target');
      showTab(target);
    });
  });

  // ==================== STATS & HISTORY TAB LOGIC ====================
  async function updateStats() {
    try {
      const data = await apiFetch('/api/profile');
      
      document.getElementById('stat-games-played').innerText = data.stats.gamesPlayed;
      document.getElementById('stat-wins').innerText = data.stats.wins;
      document.getElementById('stat-losses').innerText = data.stats.losses;
      document.getElementById('stat-win-rate').innerText = `${data.stats.winRate}%`;
      document.getElementById('stat-streak').innerText = data.stats.currentStreak;
      
      // Category Breakdown Bars
      const total = data.stats.gamesPlayed || 1;
      const pPct = Math.round((data.stats.categories.player / total) * 100);
      const tPct = Math.round((data.stats.categories.team / total) * 100);
      const sPct = Math.round((data.stats.categories.scenario / total) * 100);
      
      document.getElementById('bar-players').style.width = `${pPct}%`;
      document.getElementById('val-players').innerText = data.stats.categories.player;
      
      document.getElementById('bar-teams').style.width = `${tPct}%`;
      document.getElementById('val-teams').innerText = data.stats.categories.team;
      
      document.getElementById('bar-scenarios').style.width = `${sPct}%`;
      document.getElementById('val-scenarios').innerText = data.stats.categories.scenario;
      
      // History table
      const tbody = document.getElementById('history-table-body');
      if (data.history.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #747d8c;">No games played yet. Challenge Aki!</td></tr>`;
      } else {
        tbody.innerHTML = data.history.map(g => {
          const dateStr = new Date(g.timestamp).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          });
          const catLabel = g.gameType.toUpperCase();
          const badgeClass = g.result === 'Win' ? 'badge-win' : 'badge-loss';
          const outcomeLabel = g.result === 'Win' ? 'Win' : 'Loss';
          
          return `
            <tr>
              <td>${dateStr}</td>
              <td><span class="highlight">${catLabel}</span></td>
              <td>${g.targetEntity}</td>
              <td>${g.questionsCount}</td>
              <td><span class="${badgeClass}">${outcomeLabel}</span></td>
              <td>
                <button class="insight-btn" data-game-id="${g.id}"><i class="fas fa-brain"></i> Review</button>
              </td>
            </tr>
          `;
        }).join('');
        
        tbody.querySelectorAll('.insight-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const gameId = btn.getAttribute('data-game-id');
            const targetGame = data.history.find(g => g.id === gameId);
            if (targetGame) {
              showModalInsights(targetGame);
            }
          });
        });
      }
    } catch (e) {
      console.error("Failed to fetch profile stats:", e);
    }
  }

  // ==================== AI INSIGHTS & COMMENTARY REVIEW ====================
  
  // 1. Result screen Live Match Analysis Accordion Toggle
  document.getElementById('trigger-insights-toggle').addEventListener('click', () => {
    const body = document.getElementById('game-insights-content');
    const chevron = document.getElementById('insights-chevron');
    if (body.style.display === 'none') {
      body.style.display = 'block';
      chevron.style.transform = 'rotate(180deg)';
    } else {
      body.style.display = 'none';
      chevron.style.transform = 'rotate(0deg)';
    }
  });

  // Request analysis of the active game
  document.getElementById('request-ai-analysis-btn').addEventListener('click', async () => {
    if (!game) return;
    
    const box = document.getElementById('game-ai-insights-box');
    const content = document.getElementById('game-insights-content');
    const chevron = document.getElementById('insights-chevron');
    
    box.style.display = 'block';
    content.style.display = 'block';
    chevron.style.transform = 'rotate(180deg)';
    content.innerText = "Analyzing match play... Aki is preparing the summary...";
    
    try {
      const report = game.getEngineReport();
      const payload = {
        gameHistory: game.history,
        targetEntity: report.topCandidate,
        gameType: game.gameType,
        akiWon: report.isFinalGuess && report.confidence >= 0.70
      };
      
      const res = await apiFetch('/api/gemini/analyze', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      content.innerHTML = res.analysis.replace(/\n/g, '<br>');
    } catch (e) {
      content.innerText = `AI Review failed: ${e.message}. Enter a Gemini API Key in Settings if not set on the server.`;
    }
  });

  // 2. Modal-based review for past games
  const modalOverlay = document.getElementById('insights-modal');
  const modalBody = document.getElementById('modal-insights-body');

  async function showModalInsights(gameObj) {
    modalOverlay.style.display = 'flex';
    modalBody.innerText = "Loading AI Match commentary...";
    
    try {
      const prompt = `Write a short, engaging 2-paragraph cricket commentator highlight report about:
Category: ${gameObj.gameType}
Target Entity: ${gameObj.targetEntity}
Duel Outcome: The AI (Aki-Cricket) played a duel with the user and the user outcome was a ${gameObj.result} in ${gameObj.questionsCount} questions.
Describe the significance of the entity in IPL history and wrap it in fun sports commentator banter.`;

      const res = await apiFetch('/api/gemini/chat', {
        method: 'POST',
        body: JSON.stringify({ message: prompt })
      });
      
      modalBody.innerHTML = res.reply.replace(/\n/g, '<br>');
    } catch (e) {
      modalBody.innerText = `Failed to generate match insights: ${e.message}. Please configure your Gemini API Key in the Settings tab.`;
    }
  }

  document.getElementById('close-insights-modal-btn').addEventListener('click', () => {
    modalOverlay.style.display = 'none';
  });

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.style.display = 'none';
    }
  });

  // ==================== AI CHAT HUB LOGIC ====================
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatMessagesContainer = document.getElementById('chat-messages-container');
  const chatTypingIndicator = document.getElementById('chat-typing-indicator');

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = '';
    playSound('click');

    // Add user bubble
    appendChatBubble('You', text, 'user-bubble');

    // Show loader
    chatTypingIndicator.style.display = 'block';
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

    try {
      const res = await apiFetch('/api/gemini/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          history: chatHistory
        })
      });

      // Add Aki bubble
      appendChatBubble('AKI-CRICKET', res.reply, 'aki-bubble');
      
      // Update memory history
      chatHistory.push({ role: 'user', text });
      chatHistory.push({ role: 'model', text: res.reply });
      
      // Limit local chat memory length
      if (chatHistory.length > 20) {
        chatHistory = chatHistory.slice(-20);
      }
    } catch (err) {
      appendChatBubble('SYSTEM ERROR', `Could not reach Aki's neurons: ${err.message}. Please check your API key in Settings.`, 'aki-bubble');
    } finally {
      chatTypingIndicator.style.display = 'none';
      chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
  });

  function appendChatBubble(sender, text, cssClass) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${cssClass}`;
    
    const senderDiv = document.createElement('div');
    senderDiv.className = 'bubble-sender';
    senderDiv.innerText = `${sender.toUpperCase()}:`;
    
    const textDiv = document.createElement('div');
    textDiv.className = 'bubble-text';
    textDiv.innerHTML = text.replace(/\n/g, '<br>');
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'bubble-time';
    timeDiv.innerText = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    
    bubble.appendChild(senderDiv);
    bubble.appendChild(textDiv);
    bubble.appendChild(timeDiv);
    
    chatMessagesContainer.appendChild(bubble);
  }

  // ==================== AI EXPANSION LAB LOGIC ====================
  const expandForm = document.getElementById('expand-db-form');
  const expandLoader = document.getElementById('expand-loader');
  const expandLoaderTitle = document.getElementById('expand-loader-title');
  const expandSuccessBox = document.getElementById('expand-success-box');
  const expandSuccessTitle = document.getElementById('expand-success-title');
  const attributeReviewGrid = document.getElementById('attribute-review-grid');

  const loaderPhrases = [
    "Consulting Cricket Records...",
    "Extracting match databases...",
    "Compiling player vectors...",
    "Validating batting milestones...",
    "Calibrating Aki's Bayesian Matrix...",
    "Injecting attributes into memory gates..."
  ];

  expandForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const entityName = document.getElementById('expand-name').value.trim();
    const category = document.getElementById('expand-category').value;
    
    if (!entityName) return;

    playSound('click');

    // Show loader and hide success
    expandForm.reset();
    expandSuccessBox.style.display = 'none';
    expandLoader.style.display = 'block';

    // Start loader title rotation
    let phraseIdx = 0;
    expandLoaderTitle.innerText = loaderPhrases[phraseIdx];
    const phraseInterval = setInterval(() => {
      phraseIdx = (phraseIdx + 1) % loaderPhrases.length;
      expandLoaderTitle.innerText = loaderPhrases[phraseIdx];
    }, 1800);

    try {
      const res = await apiFetch('/api/gemini/expand', {
        method: 'POST',
        body: JSON.stringify({ entityName, category })
      });

      clearInterval(phraseInterval);
      expandLoader.style.display = 'none';

      // Show success
      expandSuccessBox.style.display = 'block';
      expandSuccessTitle.innerText = `Ingestion complete! "${res.entity.name}" is now playable in the ${category} database.`;
      
      // Render attributes chips
      attributeReviewGrid.innerHTML = Object.keys(res.entity.attributes).map(key => {
        const val = res.entity.attributes[key];
        const valClass = val ? 'true' : 'false';
        return `
          <div class="attr-chip ${valClass}">
            <span>${key}</span>
            <span>${val ? 'YES' : 'NO'}</span>
          </div>
        `;
      }).join('');

      // Reload dataset to update game Engine!
      await syncDatasets();
    } catch (err) {
      clearInterval(phraseInterval);
      expandLoader.style.display = 'none';
      alert(`Expansion failed: ${err.message}. Enter a valid Gemini API Key in settings if not configured on the server.`);
      playSound('wrong');
    }
  });

  // ==================== SETTINGS OPTIONS LOGIC ====================
  const settingsKeyInput = document.getElementById('settings-api-key');
  const toggleKeyBtn = document.getElementById('toggle-key-visibility');
  const soundToggle = document.getElementById('settings-sound-toggle');
  const speechToggle = document.getElementById('settings-speech-toggle');

  // Load Settings
  const localKey = localStorage.getItem('gemini_api_key') || '';
  settingsKeyInput.value = localKey;
  
  soundToggle.checked = soundEnabled;
  speechToggle.checked = speechEnabled;

  // Toggle key input visibility
  toggleKeyBtn.addEventListener('click', () => {
    if (settingsKeyInput.type === 'password') {
      settingsKeyInput.type = 'text';
      toggleKeyBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
      settingsKeyInput.type = 'password';
      toggleKeyBtn.innerHTML = '<i class="fas fa-eye"></i>';
    }
  });

  // Save Settings
  document.getElementById('save-settings-btn').addEventListener('click', () => {
    playSound('click');
    const key = settingsKeyInput.value.trim();
    if (key) {
      localStorage.setItem('gemini_api_key', key);
    } else {
      localStorage.removeItem('gemini_api_key');
    }

    soundEnabled = soundToggle.checked;
    speechEnabled = speechToggle.checked;

    alert("Dashboard settings updated successfully!");
  });

  // Initialize page on load
  detectBackend().then(() => {
    checkAuth();
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
