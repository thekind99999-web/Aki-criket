const express = require('express');
const path = require('path');
const app = require('./functions/index.js');

const PORT = process.env.PORT || 8080;

// Add static serving middleware for local running
app.use(express.static(path.join(__dirname)));

// Serve index.html for frontend routing catch-all
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
