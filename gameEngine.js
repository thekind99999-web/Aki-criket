// Aki-Cricket Game Engine
// Local Bayesian-style probability engine for IPL guessing game

const DATASETS = {
  player: [
    {
      name: "MS Dhoni",
      attributes: {
        active: true, overseas: false, batsman: true, bowler: false, allrounder: false,
        captain: true, trophy: true, orangeCap: false, purpleCap: false, spinner: false,
        fastBowler: false, csk: true, mi: false, rcb: false, kkr: false, leftHanded: false,
        century: false, fiveWickets: false, hemisphere: false
      }
    },
    {
      name: "Virat Kohli",
      attributes: {
        active: true, overseas: false, batsman: true, bowler: false, allrounder: false,
        captain: true, trophy: false, orangeCap: true, purpleCap: false, spinner: false,
        fastBowler: false, csk: false, mi: false, rcb: true, kkr: false, leftHanded: false,
        century: true, fiveWickets: false, hemisphere: false
      }
    },
    {
      name: "Rohit Sharma",
      attributes: {
        active: true, overseas: false, batsman: true, bowler: false, allrounder: false,
        captain: true, trophy: true, orangeCap: false, purpleCap: false, spinner: false,
        fastBowler: false, csk: false, mi: true, rcb: false, kkr: false, leftHanded: false,
        century: true, fiveWickets: false, hemisphere: false
      }
    },
    {
      name: "AB de Villiers",
      attributes: {
        active: false, overseas: true, batsman: true, bowler: false, allrounder: false,
        captain: false, trophy: false, orangeCap: false, purpleCap: false, spinner: false,
        fastBowler: false, csk: false, mi: false, rcb: true, kkr: false, leftHanded: false,
        century: true, fiveWickets: false, hemisphere: true
      }
    },
    {
      name: "Chris Gayle",
      attributes: {
        active: false, overseas: true, batsman: true, bowler: false, allrounder: true,
        captain: false, trophy: false, orangeCap: true, purpleCap: false, spinner: true,
        fastBowler: false, csk: false, mi: false, rcb: true, kkr: true, leftHanded: true,
        century: true, fiveWickets: false, hemisphere: false
      }
    },
    {
      name: "Sunil Narine",
      attributes: {
        active: true, overseas: true, batsman: false, bowler: false, allrounder: true,
        captain: false, trophy: true, orangeCap: false, purpleCap: false, spinner: true,
        fastBowler: false, csk: false, mi: false, rcb: false, kkr: true, leftHanded: true,
        century: true, fiveWickets: true, hemisphere: false
      }
    },
    {
      name: "Rashid Khan",
      attributes: {
        active: true, overseas: true, batsman: false, bowler: false, allrounder: true,
        captain: false, trophy: true, orangeCap: false, purpleCap: false, spinner: true,
        fastBowler: false, csk: false, mi: false, rcb: false, kkr: false, leftHanded: false,
        century: false, fiveWickets: false, hemisphere: false
      }
    },
    {
      name: "Jasprit Bumrah",
      attributes: {
        active: true, overseas: false, batsman: false, bowler: true, allrounder: false,
        captain: false, trophy: true, orangeCap: false, purpleCap: false, spinner: false,
        fastBowler: true, csk: false, mi: true, rcb: false, kkr: false, leftHanded: false,
        century: false, fiveWickets: true, hemisphere: false
      }
    },
    {
      name: "Lasith Malinga",
      attributes: {
        active: false, overseas: true, batsman: false, bowler: true, allrounder: false,
        captain: false, trophy: true, orangeCap: false, purpleCap: true, spinner: false,
        fastBowler: true, csk: false, mi: true, rcb: false, kkr: false, leftHanded: false,
        century: false, fiveWickets: true, hemisphere: false
      }
    },
    {
      name: "Hardik Pandya",
      attributes: {
        active: true, overseas: false, batsman: false, bowler: false, allrounder: true,
        captain: true, trophy: true, orangeCap: false, purpleCap: false, spinner: false,
        fastBowler: true, csk: false, mi: true, rcb: false, kkr: false, leftHanded: false,
        century: false, fiveWickets: false, hemisphere: false
      }
    },
    {
      name: "Gautam Gambhir",
      attributes: {
        active: false, overseas: false, batsman: true, bowler: false, allrounder: false,
        captain: true, trophy: true, orangeCap: false, purpleCap: false, spinner: false,
        fastBowler: false, csk: false, mi: false, rcb: false, kkr: true, leftHanded: true,
        century: false, fiveWickets: false, hemisphere: false
      }
    },
    {
      name: "Suresh Raina",
      attributes: {
        active: false, overseas: false, batsman: true, bowler: false, allrounder: true,
        captain: true, trophy: true, orangeCap: false, purpleCap: false, spinner: true,
        fastBowler: false, csk: true, mi: false, rcb: false, kkr: false, leftHanded: true,
        century: true, fiveWickets: false, hemisphere: false
      }
    },
    {
      name: "Ravindra Jadeja",
      attributes: {
        active: true, overseas: false, batsman: false, bowler: false, allrounder: true,
        captain: true, trophy: true, orangeCap: false, purpleCap: false, spinner: true,
        fastBowler: false, csk: true, mi: false, rcb: false, kkr: false, leftHanded: true,
        century: false, fiveWickets: true, hemisphere: false
      }
    },
    {
      name: "Glenn Maxwell",
      attributes: {
        active: true, overseas: true, batsman: false, bowler: false, allrounder: true,
        captain: true, trophy: true, orangeCap: false, purpleCap: false, spinner: true,
        fastBowler: false, csk: false, mi: true, rcb: true, kkr: false, leftHanded: false,
        century: false, fiveWickets: false, hemisphere: true
      }
    },
    {
      name: "Jos Buttler",
      attributes: {
        active: true, overseas: true, batsman: true, bowler: false, allrounder: false,
        captain: false, trophy: true, orangeCap: true, purpleCap: false, spinner: false,
        fastBowler: false, csk: false, mi: true, rcb: false, kkr: false, leftHanded: false,
        century: true, fiveWickets: false, hemisphere: false
      }
    },
    {
      name: "Andre Russell",
      attributes: {
        active: true, overseas: true, batsman: false, bowler: false, allrounder: true,
        captain: false, trophy: true, orangeCap: false, purpleCap: false, spinner: false,
        fastBowler: true, csk: false, mi: false, rcb: false, kkr: true, leftHanded: false,
        century: false, fiveWickets: true, hemisphere: false
      }
    },
    {
      name: "David Warner",
      attributes: {
        active: true, overseas: true, batsman: true, bowler: false, allrounder: false,
        captain: true, trophy: true, orangeCap: true, purpleCap: false, spinner: false,
        fastBowler: false, csk: false, mi: false, rcb: false, kkr: false, leftHanded: true,
        century: true, fiveWickets: false, hemisphere: true
      }
    },
    {
      name: "KL Rahul",
      attributes: {
        active: true, overseas: false, batsman: true, bowler: false, allrounder: false,
        captain: true, trophy: false, orangeCap: true, purpleCap: false, spinner: false,
        fastBowler: false, csk: false, mi: false, rcb: true, kkr: false, leftHanded: false,
        century: true, fiveWickets: false, hemisphere: false
      }
    },
    {
      name: "Shikhar Dhawan",
      attributes: {
        active: true, overseas: false, batsman: true, bowler: false, allrounder: false,
        captain: true, trophy: true, orangeCap: false, purpleCap: false, spinner: false,
        fastBowler: false, csk: false, mi: true, rcb: false, kkr: false, leftHanded: true,
        century: true, fiveWickets: false, hemisphere: false
      }
    },
    {
      name: "Shubman Gill",
      attributes: {
        active: true, overseas: false, batsman: true, bowler: false, allrounder: false,
        captain: true, trophy: true, orangeCap: true, purpleCap: false, spinner: false,
        fastBowler: false, csk: false, mi: false, rcb: false, kkr: true, leftHanded: false,
        century: true, fiveWickets: false, hemisphere: false
      }
    },
    {
      name: "Yuzvendra Chahal",
      attributes: {
        active: true, overseas: false, batsman: false, bowler: true, allrounder: false,
        captain: false, trophy: false, orangeCap: false, purpleCap: true, spinner: true,
        fastBowler: false, csk: false, mi: true, rcb: true, kkr: false, leftHanded: false,
        century: false, fiveWickets: true, hemisphere: false
      }
    },
    {
      name: "Bhuvneshwar Kumar",
      attributes: {
        active: true, overseas: false, batsman: false, bowler: true, allrounder: false,
        captain: true, trophy: true, orangeCap: false, purpleCap: true, spinner: false,
        fastBowler: true, csk: false, mi: false, rcb: false, kkr: false, leftHanded: false,
        century: false, fiveWickets: true, hemisphere: false
      }
    },
    {
      name: "Dinesh Karthik",
      attributes: {
        active: false, overseas: false, batsman: true, bowler: false, allrounder: false,
        captain: true, trophy: true, orangeCap: false, purpleCap: false, spinner: false,
        fastBowler: false, csk: false, mi: true, rcb: true, kkr: true, leftHanded: false,
        century: false, fiveWickets: false, hemisphere: false
      }
    },
    {
      name: "Shane Watson",
      attributes: {
        active: false, overseas: true, batsman: false, bowler: false, allrounder: true,
        captain: true, trophy: true, orangeCap: false, purpleCap: false, spinner: false,
        fastBowler: true, csk: true, mi: false, rcb: true, kkr: false, leftHanded: false,
        century: true, fiveWickets: false, hemisphere: true
      }
    },
    {
      name: "Amit Mishra",
      attributes: {
        active: true, overseas: false, batsman: false, bowler: true, allrounder: false,
        captain: false, trophy: false, orangeCap: false, purpleCap: false, spinner: true,
        fastBowler: false, csk: false, mi: false, rcb: false, kkr: false, leftHanded: false,
        century: false, fiveWickets: true, hemisphere: false
      }
    },
    {
      name: "Rishabh Pant",
      attributes: {
        active: true, overseas: false, batsman: true, bowler: false, allrounder: false,
        captain: true, trophy: false, orangeCap: false, purpleCap: false, spinner: false,
        fastBowler: false, csk: false, mi: false, rcb: false, kkr: false, leftHanded: true,
        century: true, fiveWickets: false, hemisphere: false
      }
    },
    {
      name: "Sanju Samson",
      attributes: {
        active: true, overseas: false, batsman: true, bowler: false, allrounder: false,
        captain: true, trophy: false, orangeCap: false, purpleCap: false, spinner: false,
        fastBowler: false, csk: false, mi: false, rcb: false, kkr: false, leftHanded: false,
        century: true, fiveWickets: false, hemisphere: false
      }
    },
    {
      name: "Marcus Stoinis",
      attributes: {
        active: true, overseas: true, batsman: false, bowler: false, allrounder: true,
        captain: false, trophy: false, orangeCap: false, purpleCap: false, spinner: false,
        fastBowler: true, csk: false, mi: false, rcb: false, kkr: false, leftHanded: false,
        century: true, fiveWickets: false, hemisphere: true
      }
    },
    {
      name: "Heinrich Klaasen",
      attributes: {
        active: true, overseas: true, batsman: true, bowler: false, allrounder: false,
        captain: false, trophy: false, orangeCap: false, purpleCap: false, spinner: false,
        fastBowler: false, csk: false, mi: false, rcb: false, kkr: false, leftHanded: false,
        century: false, fiveWickets: false, hemisphere: true
      }
    },
    {
      name: "Quinton de Kock",
      attributes: {
        active: true, overseas: true, batsman: true, bowler: false, allrounder: false,
        captain: false, trophy: true, orangeCap: false, purpleCap: false, spinner: false,
        fastBowler: false, csk: false, mi: true, rcb: false, kkr: false, leftHanded: true,
        century: true, fiveWickets: false, hemisphere: true
      }
    }
  ],
  team: [
    {
      name: "Chennai Super Kings (CSK)",
      attributes: {
        active: true, wonTrophy: true, multipleTrophies: true, blueJersey: false, redJersey: false,
        founded2008: true, captainedByDhoni: true, captainedByKohli: false, captainedByRohit: false,
        playInSouth: true
      }
    },
    {
      name: "Mumbai Indians (MI)",
      attributes: {
        active: true, wonTrophy: true, multipleTrophies: true, blueJersey: true, redJersey: false,
        founded2008: true, captainedByDhoni: false, captainedByKohli: false, captainedByRohit: true,
        playInSouth: false
      }
    },
    {
      name: "Royal Challengers Bengaluru (RCB)",
      attributes: {
        active: true, wonTrophy: false, multipleTrophies: false, blueJersey: false, redJersey: true,
        founded2008: true, captainedByDhoni: false, captainedByKohli: true, captainedByRohit: false,
        playInSouth: true
      }
    },
    {
      name: "Kolkata Knight Riders (KKR)",
      attributes: {
        active: true, wonTrophy: true, multipleTrophies: true, blueJersey: false, redJersey: false,
        founded2008: true, captainedByDhoni: false, captainedByKohli: false, captainedByRohit: false,
        playInSouth: false
      }
    },
    {
      name: "Rajasthan Royals (RR)",
      attributes: {
        active: true, wonTrophy: true, multipleTrophies: false, blueJersey: false, redJersey: false,
        founded2008: true, captainedByDhoni: false, captainedByKohli: false, captainedByRohit: false,
        playInSouth: false
      }
    },
    {
      name: "Sunrisers Hyderabad (SRH)",
      attributes: {
        active: true, wonTrophy: true, multipleTrophies: false, blueJersey: false, redJersey: false,
        founded2008: false, captainedByDhoni: false, captainedByKohli: false, captainedByRohit: false,
        playInSouth: true
      }
    },
    {
      name: "Delhi Capitals (DC)",
      attributes: {
        active: true, wonTrophy: false, multipleTrophies: false, blueJersey: true, redJersey: false,
        founded2008: true, captainedByDhoni: false, captainedByKohli: false, captainedByRohit: false,
        playInSouth: false
      }
    },
    {
      name: "Punjab Kings (PBKS)",
      attributes: {
        active: true, wonTrophy: false, multipleTrophies: false, blueJersey: false, redJersey: true,
        founded2008: true, captainedByDhoni: false, captainedByKohli: false, captainedByRohit: false,
        playInSouth: false
      }
    },
    {
      name: "Gujarat Titans (GT)",
      attributes: {
        active: true, wonTrophy: true, multipleTrophies: false, blueJersey: true, redJersey: false,
        founded2008: false, captainedByDhoni: false, captainedByKohli: false, captainedByRohit: false,
        playInSouth: false
      }
    },
    {
      name: "Lucknow Super Giants (LSG)",
      attributes: {
        active: true, wonTrophy: false, multipleTrophies: false, blueJersey: true, redJersey: false,
        founded2008: false, captainedByDhoni: false, captainedByKohli: false, captainedByRohit: false,
        playInSouth: false
      }
    },
    {
      name: "Deccan Chargers",
      attributes: {
        active: false, wonTrophy: true, multipleTrophies: false, blueJersey: true, redJersey: false,
        founded2008: true, captainedByDhoni: false, captainedByKohli: false, captainedByRohit: false,
        playInSouth: true
      }
    },
    {
      name: "Rising Pune Supergiant",
      attributes: {
        active: false, wonTrophy: false, multipleTrophies: false, blueJersey: true, redJersey: false,
        founded2008: false, captainedByDhoni: true, captainedByKohli: false, captainedByRohit: false,
        playInSouth: false
      }
    }
  ],
  scenario: [
    {
      name: "Rinku Singh's 5 Sixes in 5 Balls (KKR vs GT, 2023)",
      attributes: {
        occurredInFinal: false, lastBallFinish: true, involvedCSK: false, involvedMI: false,
        involvedRCB: false, individualRecord: true, battingFeat: true, bowlingFeat: false,
        occurredInFirstDecade: false, occurredPost2020: true, wonByChasing: true, superOver: false
      }
    },
    {
      name: "MI winning by 1 run against RPS (2017 Final)",
      attributes: {
        occurredInFinal: true, lastBallFinish: true, involvedCSK: false, involvedMI: true,
        involvedRCB: false, individualRecord: false, battingFeat: false, bowlingFeat: false,
        occurredInFirstDecade: true, occurredPost2020: false, wonByChasing: false, superOver: false
      }
    },
    {
      name: "MI winning by 1 run against CSK (2019 Final)",
      attributes: {
        occurredInFinal: true, lastBallFinish: true, involvedCSK: true, involvedMI: true,
        involvedRCB: false, individualRecord: false, battingFeat: false, bowlingFeat: false,
        occurredInFirstDecade: false, occurredPost2020: false, wonByChasing: false, superOver: false
      }
    },
    {
      name: "CSK winning on the last ball of 2023 Final (Jadeja's 6 and 4)",
      attributes: {
        occurredInFinal: true, lastBallFinish: true, involvedCSK: true, involvedMI: false,
        involvedRCB: false, individualRecord: false, battingFeat: true, bowlingFeat: false,
        occurredInFirstDecade: false, occurredPost2020: true, wonByChasing: true, superOver: false
      }
    },
    {
      name: "Chris Gayle's 175* against PWI (2013)",
      attributes: {
        occurredInFinal: false, lastBallFinish: false, involvedCSK: false, involvedMI: false,
        involvedRCB: true, individualRecord: true, battingFeat: true, bowlingFeat: false,
        occurredInFirstDecade: true, occurredPost2020: false, wonByChasing: false, superOver: false
      }
    },
    {
      name: "Brendon McCullum's 158* in the first-ever IPL match (2008)",
      attributes: {
        occurredInFinal: false, lastBallFinish: false, involvedCSK: false, involvedMI: false,
        involvedRCB: true, individualRecord: true, battingFeat: true, bowlingFeat: false,
        occurredInFirstDecade: true, occurredPost2020: false, wonByChasing: false, superOver: false
      }
    },
    {
      name: "Yuvraj Singh's hat-trick and 50 in the same match (2009)",
      attributes: {
        occurredInFinal: false, lastBallFinish: false, involvedCSK: false, involvedMI: false,
        involvedRCB: true, individualRecord: true, battingFeat: true, bowlingFeat: true,
        occurredInFirstDecade: true, occurredPost2020: false, wonByChasing: true, superOver: false
      }
    },
    {
      name: "MI vs PBKS Double Super Over (2020)",
      attributes: {
        occurredInFinal: false, lastBallFinish: true, involvedCSK: false, involvedMI: true,
        involvedRCB: false, individualRecord: false, battingFeat: false, bowlingFeat: false,
        occurredInFirstDecade: false, occurredPost2020: true, wonByChasing: true, superOver: true
      }
    },
    {
      name: "Alzarri Joseph's 6 wickets for 12 runs on debut (2019)",
      attributes: {
        occurredInFinal: false, lastBallFinish: false, involvedCSK: false, involvedMI: true,
        involvedRCB: false, individualRecord: true, battingFeat: false, bowlingFeat: true,
        occurredInFirstDecade: false, occurredPost2020: false, wonByChasing: false, superOver: false
      }
    },
    {
      name: "Dhoni hitting 23 runs in the final over against Axar Patel (2016)",
      attributes: {
        occurredInFinal: false, lastBallFinish: true, involvedCSK: false, involvedMI: false,
        involvedRCB: false, individualRecord: true, battingFeat: true, bowlingFeat: false,
        occurredInFirstDecade: true, occurredPost2020: false, wonByChasing: true, superOver: false
      }
    }
  ]
};

const QUESTIONS = {
  player: [
    { id: "active", text: "Is the player currently active in the IPL (e.g., played in the last season or active squad)?" },
    { id: "overseas", text: "Is he an overseas (non-Indian) player?" },
    { id: "batsman", text: "Is he primarily a batsman or wicket-keeper?" },
    { id: "bowler", text: "Is he primarily a bowler?" },
    { id: "allrounder", text: "Is he a recognized all-rounder?" },
    { id: "captain", text: "Has he ever captained an IPL franchise?" },
    { id: "trophy", text: "Has he won at least one IPL trophy?" },
    { id: "orangeCap", text: "Has he ever won an Orange Cap (Highest run scorer)?" },
    { id: "purpleCap", text: "Has he ever won a Purple Cap (Highest wicket taker)?" },
    { id: "spinner", text: "Is he a spin bowler (including spin-bowling all-rounders)?" },
    { id: "fastBowler", text: "Is he a fast or medium-fast bowler?" },
    { id: "csk", text: "Has he ever played for Chennai Super Kings (CSK)?" },
    { id: "mi", text: "Has he ever played for Mumbai Indians (MI)?" },
    { id: "rcb", text: "Has he ever played for Royal Challengers Bengaluru (RCB)?" },
    { id: "kkr", text: "Has he ever played for Kolkata Knight Riders (KKR)?" },
    { id: "leftHanded", text: "Is he left-handed (in batting or bowling)?" },
    { id: "century", text: "Has he scored a century in the IPL?" },
    { id: "fiveWickets", text: "Has he ever taken a 5-wicket haul in the IPL?" },
    { id: "hemisphere", text: "Does he represent a country in the Southern Hemisphere (Australia, South Africa, New Zealand)?" }
  ],
  team: [
    { id: "active", text: "Is the team currently active in the IPL?" },
    { id: "wonTrophy", text: "Has the team won at least one IPL trophy?" },
    { id: "multipleTrophies", text: "Has the team won multiple IPL trophies?" },
    { id: "blueJersey", text: "Is the team's primary jersey color blue?" },
    { id: "redJersey", text: "Is the team's primary jersey color red?" },
    { id: "founded2008", text: "Was the franchise founded in 2008 as one of the original teams?" },
    { id: "captainedByDhoni", text: "Has MS Dhoni ever captained this franchise?" },
    { id: "captainedByKohli", text: "Has Virat Kohli ever captained this franchise?" },
    { id: "captainedByRohit", text: "Has Rohit Sharma ever captained this franchise?" },
    { id: "playInSouth", text: "Is the team's home venue located in South India?" }
  ],
  scenario: [
    { id: "occurredInFinal", text: "Did this historic match scenario occur in an IPL Final?" },
    { id: "lastBallFinish", text: "Was this match decided on the final ball of the innings?" },
    { id: "involvedCSK", text: "Was Chennai Super Kings (CSK) one of the teams playing?" },
    { id: "involvedMI", text: "Was Mumbai Indians (MI) one of the teams playing?" },
    { id: "involvedRCB", text: "Was Royal Challengers Bengaluru (RCB) one of the teams playing?" },
    { id: "individualRecord", text: "Is this scenario famous for an individual record-breaking performance?" },
    { id: "battingFeat", text: "Was this scenario primarily a batting milestone or run chase feat?" },
    { id: "bowlingFeat", text: "Was this scenario primarily a bowling milestone (e.g. hat-trick, bowling figures)?" },
    { id: "occurredInFirstDecade", text: "Did this match happen in the first decade of the IPL (2008-2017)?" },
    { id: "occurredPost2020", text: "Did this match happen in 2020 or later?" },
    { id: "wonByChasing", text: "Was this match won by the team chasing the target?" },
    { id: "superOver", text: "Did this match involve a Super Over?" }
  ]
};

// Franchise Colors Mapping
const FRANCHISE_COLORS = {
  "Chennai Super Kings (CSK)": { primary: "#FFEB3B", secondary: "#1976D2" },
  "Mumbai Indians (MI)": { primary: "#0D47A1", secondary: "#FFD54F" },
  "Royal Challengers Bengaluru (RCB)": { primary: "#D32F2F", secondary: "#FFD54F" },
  "Kolkata Knight Riders (KKR)": { primary: "#4A148C", secondary: "#D4AF37" },
  "Rajasthan Royals (RR)": { primary: "#E91E63", secondary: "#0D47A1" },
  "Sunrisers Hyderabad (SRH)": { primary: "#FF5722", secondary: "#212121" },
  "Delhi Capitals (DC)": { primary: "#1976D2", secondary: "#D32F2F" },
  "Punjab Kings (PBKS)": { primary: "#D32F2F", secondary: "#E0E0E0" },
  "Gujarat Titans (GT)": { primary: "#1C2A38", secondary: "#C5A059" },
  "Lucknow Super Giants (LSG)": { primary: "#00A8B5", secondary: "#FF4500" },
  "Deccan Chargers": { primary: "#0B1B3D", secondary: "#C5A059" },
  "Rising Pune Supergiant": { primary: "#4A148C", secondary: "#B76E79" }
};

function getPlayerTeam(playerName) {
  const mapping = {
    "MS Dhoni": "Chennai Super Kings (CSK)",
    "Virat Kohli": "Royal Challengers Bengaluru (RCB)",
    "Rohit Sharma": "Mumbai Indians (MI)",
    "AB de Villiers": "Royal Challengers Bengaluru (RCB)",
    "Chris Gayle": "Royal Challengers Bengaluru (RCB)",
    "Sunil Narine": "Kolkata Knight Riders (KKR)",
    "Rashid Khan": "Gujarat Titans (GT)",
    "Jasprit Bumrah": "Mumbai Indians (MI)",
    "Lasith Malinga": "Mumbai Indians (MI)",
    "Hardik Pandya": "Mumbai Indians (MI)",
    "Gautam Gambhir": "Kolkata Knight Riders (KKR)",
    "Suresh Raina": "Chennai Super Kings (CSK)",
    "Ravindra Jadeja": "Chennai Super Kings (CSK)",
    "Glenn Maxwell": "Royal Challengers Bengaluru (RCB)",
    "Jos Buttler": "Rajasthan Royals (RR)",
    "Andre Russell": "Kolkata Knight Riders (KKR)",
    "David Warner": "Delhi Capitals (DC)",
    "KL Rahul": "Lucknow Super Giants (LSG)",
    "Shikhar Dhawan": "Punjab Kings (PBKS)",
    "Shubman Gill": "Gujarat Titans (GT)",
    "Yuzvendra Chahal": "Rajasthan Royals (RR)",
    "Bhuvneshwar Kumar": "Sunrisers Hyderabad (SRH)",
    "Dinesh Karthik": "Royal Challengers Bengaluru (RCB)",
    "Shane Watson": "Chennai Super Kings (CSK)",
    "Amit Mishra": "Lucknow Super Giants (LSG)",
    "Rishabh Pant": "Delhi Capitals (DC)",
    "Sanju Samson": "Rajasthan Royals (RR)",
    "Marcus Stoinis": "Lucknow Super Giants (LSG)",
    "Heinrich Klaasen": "Sunrisers Hyderabad (SRH)",
    "Quinton de Kock": "Lucknow Super Giants (LSG)"
  };
  return mapping[playerName] || "Royal Challengers Bengaluru (RCB)";
}

function getScenarioTeam(scenarioName) {
  if (scenarioName.includes("KKR") || scenarioName.includes("Rinku") || scenarioName.includes("McCullum")) return "Kolkata Knight Riders (KKR)";
  if (scenarioName.includes("MI") || scenarioName.includes("Alzarri")) return "Mumbai Indians (MI)";
  if (scenarioName.includes("CSK") || scenarioName.includes("Jadeja")) return "Chennai Super Kings (CSK)";
  if (scenarioName.includes("Gayle") || scenarioName.includes("Yuvraj")) return "Royal Challengers Bengaluru (RCB)";
  if (scenarioName.includes("Dhoni hitting 23")) return "Rising Pune Supergiant";
  return "Mumbai Indians (MI)";
}

class GameState {
  constructor(gameType) {
    this.gameType = gameType; // 'player', 'team', or 'scenario'
    this.totalQuestionsAsked = 0;
    this.history = []; // [{ questionId, questionText, userAnswer }]
    this.usedQuestions = new Set();

    // Copy candidates from database
    this.candidates = DATASETS[gameType].map(c => ({
      name: c.name,
      attributes: c.attributes,
      score: 1.0 // Initialize equal weights
    }));

    this.normalizeScores();
  }

  normalizeScores() {
    const sum = this.candidates.reduce((acc, c) => acc + c.score, 0);
    if (sum > 0) {
      this.candidates.forEach(c => {
        c.score = c.score / sum;
      });
    } else {
      // Emergency reset if all candidates eliminated
      this.candidates.forEach(c => {
        c.score = 1.0 / this.candidates.length;
      });
    }
  }

  // Get the best question based on entropy minimization
  getNextQuestion() {
    const availableQuestions = QUESTIONS[this.gameType].filter(q => !this.usedQuestions.has(q.id));

    if (availableQuestions.length === 0) {
      return null;
    }

    let bestQuestion = null;
    let closestToHalfDiff = 1.0;

    availableQuestions.forEach(q => {
      // Sum weights of active candidates where attribute is true
      let yesSum = 0;
      this.candidates.forEach(c => {
        if (c.attributes[q.id] === true) {
          yesSum += c.score;
        }
      });

      const diff = Math.abs(yesSum - 0.5);
      if (diff < closestToHalfDiff) {
        closestToHalfDiff = diff;
        bestQuestion = q;
      }
    });

    return bestQuestion;
  }

  // Update probabilities based on user response
  submitAnswer(questionId, answer) {
    // answer can be 'Yes', 'No', 'Partially', 'Don\'t Know'
    this.usedQuestions.add(questionId);

    this.candidates.forEach(c => {
      const hasAttr = c.attributes[questionId] === true;

      if (answer === 'Yes') {
        if (!hasAttr) {
          c.score *= 0.05; // heavily penalize mismatch
        }
      } else if (answer === 'No') {
        if (hasAttr) {
          c.score *= 0.05; // heavily penalize mismatch
        }
      } else if (answer === 'Partially') {
        // Soft modification
        if (hasAttr) {
          c.score *= 0.8;
        } else {
          c.score *= 0.3;
        }
      }
      // 'Don\'t Know' doesn't alter scores
    });

    this.normalizeScores();

    const qObj = QUESTIONS[this.gameType].find(q => q.id === questionId);
    this.history.push({
      questionId: questionId,
      questionText: qObj.text,
      userAnswer: answer
    });

    this.totalQuestionsAsked++;
  }

  // Get current state analysis
  getEngineReport() {
    // Sort candidates descending by probability
    const sorted = [...this.candidates].sort((a, b) => b.score - a.score);
    const topCandidate = sorted[0];
    const isFinal = topCandidate.score > 0.85 || this.totalQuestionsAsked >= 15;

    // Calculate UI State
    let batsmanAnimationTrigger = "IDLE_TAP_BAT";
    let primaryNeon = "#00f5ff";
    let secondaryGlow = "#ffffff";
    let particleEffect = "NONE";

    const idx = this.totalQuestionsAsked + 1; // current question index

    if (isFinal) {
      batsmanAnimationTrigger = "MASSIVE_SIX_CELEBRATION";
      primaryNeon = "#FFD700"; // Gold
      secondaryGlow = "#00E676"; // Emerald Green
      particleEffect = "FIREWORKS";
    } else if (idx <= 3) {
      batsmanAnimationTrigger = "IDLE_TAP_BAT";
      primaryNeon = "#00f5ff"; // Neon Electric Blue
      secondaryGlow = "#ffffff"; // Stadium Floodlight White
      particleEffect = "NONE";
    } else if (idx >= 4 && idx <= 10) {
      batsmanAnimationTrigger = (idx % 2 === 0) ? "BACKFOOT_DEFENSE" : "SHUFFLE_CREASE";
      particleEffect = "DUST_KICKUP";

      // Get Team Colors
      let teamName = "";
      if (this.gameType === "player") {
        teamName = getPlayerTeam(topCandidate.name);
      } else if (this.gameType === "team") {
        teamName = topCandidate.name;
      } else if (this.gameType === "scenario") {
        teamName = getScenarioTeam(topCandidate.name);
      }

      const colors = FRANCHISE_COLORS[teamName] || { primary: "#7d26ff", secondary: "#1fef8b" };
      primaryNeon = colors.primary;
      secondaryGlow = colors.secondary;
    } else {
      // Q11-14
      batsmanAnimationTrigger = (idx % 2 === 0) ? "NERVOUS_SWEAT" : "LOOKING_AT_SKY";
      primaryNeon = "#ff9f00"; // Deep Neon Orange
      secondaryGlow = "#ff2a5f"; // Alert Red
      particleEffect = "NONE";
    }

    const report = {
      topCandidate: topCandidate.name,
      confidence: topCandidate.score,
      totalQuestions: this.totalQuestionsAsked,
      isFinalGuess: isFinal,
      sortedCandidates: sorted.slice(0, 5), // Top 5
      uiState: {
        batsmanAnimationTrigger,
        stadiumColorPalette: {
          primaryNeon,
          secondaryGlow
        },
        particleEffect
      }
    };

    return report;
  }

  // If a guess was wrong, eliminate that candidate and re-evaluate
  rejectGuess(candidateName) {
    const match = this.candidates.find(c => c.name === candidateName);
    if (match) {
      match.score = 0.0;
      this.normalizeScores();
    }
  }
}

function setDatasets(newDatasets) {
  if (newDatasets.player) DATASETS.player = newDatasets.player;
  if (newDatasets.team) DATASETS.team = newDatasets.team;
  if (newDatasets.scenario) DATASETS.scenario = newDatasets.scenario;
}

// Export for usage
window.AkiGame = {
  GameState,
  DATASETS,
  QUESTIONS,
  setDatasets
};
