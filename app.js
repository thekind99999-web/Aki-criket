// Aki-Cricket Controller

const initApp = () => {
  let game = null;
  let currentQuestion = null;
  let soundEnabled = true;
  let speechEnabled = false;
  let stadium3d = null;

  // Audio Context for Sound Effects
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Play Sound Effects using Web Audio API
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
        // Success Fanfare arpeggio
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
        // Sad trombone sliding down
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.6);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (type === 'wrong') {
        // Buzz sound
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
    const list = BANTER_LINES[mood];
    return list[Math.floor(Math.random() * list.length)];
  }

  // State Navigation
  function showScreen(screenId) {
    if (screenId === "screen-guess") {
      // Keep screen-game visible, overlay guess screen on top!
      document.getElementById("screen-guess").classList.add("active");
    } else {
      document.querySelectorAll(".screen").forEach(s => {
        if (s.id !== "screen-guess") {
          s.classList.remove("active");
        }
      });
      document.getElementById("screen-guess").classList.remove("active");
      const target = document.getElementById(screenId);
      target.classList.add("active");
    }
  }

  // Initialize Game Loop
  function startNewGame(category) {
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

    // Load first question
    askNext();
    showScreen("screen-game");
  }

  // Ask Next Question
  function askNext() {
    currentQuestion = game.getNextQuestion();

    if (!currentQuestion) {
      // Out of questions - force final guess
      triggerGuessOrEnd();
      return;
    }

    const report = game.getEngineReport();

    // Update 3D state
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

    // Question
    document.getElementById("question-text").innerText = currentQuestion.text;

    // Banter
    const banter = getBanter(mood);
    document.getElementById("banter-text").innerText = `"${banter}"`;
    speak(banter + " " + currentQuestion.text);
  }

  // Handle answers with thinking pacing delay
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

      // Submit to engine
      game.submitAnswer(currentQuestion.id, answerVal);

      // Disable buttons
      setAnswerButtonsEnabled(false);
      
      // Update banter text to show thinking phrase
      const randomThinking = THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)];
      document.getElementById("banter-text").innerText = `"${randomThinking}"`;

      // Delay evaluating next action to simulate AI thinking
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
      // Propose final guess
      playSound('guess');
      
      let catLabel = "IPL Player";
      if (game.gameType === "team") catLabel = "IPL Team";
      else if (game.gameType === "scenario") catLabel = "IPL Match Scenario";
      
      document.getElementById("guess-type").innerText = catLabel;
      document.getElementById("guess-entity").innerText = report.topCandidate || "N/A";
      
      showScreen("screen-guess");
    } else {
      // Lost completely
      showResult(false, "Unknown Player/Team");
    }
  }

  // Guess Confirmed (Aki Wins)
  document.getElementById("confirm-guess-btn").addEventListener("click", () => {
    playSound('win');
    const report = game.getEngineReport();
    
    // Trigger 3D six celebration
    if (stadium3d) {
      stadium3d.updateState({
        batsmanAnimationTrigger: "MASSIVE_SIX_CELEBRATION",
        stadiumColorPalette: { primaryNeon: "#FFD700", secondaryGlow: "#00E676" },
        particleEffect: "FIREWORKS"
      });
    }

    // Trigger flying "6" overlay
    const flyingSix = document.getElementById("flying-six-overlay");
    if (flyingSix) {
      flyingSix.classList.add("active");
      setTimeout(() => {
        flyingSix.classList.remove("active");
      }, 1800);
    }

    // Delay result screen transition to let the animation play!
    setTimeout(() => {
      showResult(true, report.topCandidate);
    }, 1800);
  });

  // Guess Rejected (Aki Wrong)
  document.getElementById("reject-guess-btn").addEventListener("click", () => {
    playSound('wrong');
    const report = game.getEngineReport();
    
    // Tell engine guess was rejected
    game.rejectGuess(report.topCandidate);

    const updatedReport = game.getEngineReport();

    // If reached 15 questions or we have no more viable candidates, Aki loses
    if (game.totalQuestionsAsked >= 15 || updatedReport.confidence < 0.01) {
      showResult(false, report.topCandidate);
    } else {
      // Otherwise, go back to game, and ask next question
      showScreen("screen-game");
      askNext();
    }
  });

  // Show Results Screen
  function showResult(akiWon, targetEntity) {
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
      
      // Start confetti celebration
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

      // Reset piece at bottom
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

  // Hover play sounds for navigation buttons
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
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
