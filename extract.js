const fs = require('fs');
const path = require('path');

const logPath = 'C:/Users/DELL/.gemini/antigravity-ide/brain/875f74e7-c494-4047-b1a9-bdbc4425dad7/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.tool_calls) {
      for (const call of obj.tool_calls) {
        if (call.name === 'replace_file_content' || call.name === 'multi_replace_file_content') {
          const args = typeof call.args === 'string' ? JSON.parse(call.args) : call.args;
          const file = (args.TargetFile || '').replace(/["']/g, '').trim();
          if (file.endsWith('index.html') || file.endsWith('styles.css') || file.endsWith('app.js')) {
            console.log(`Step ${obj.step_index}: ${call.name} on ${path.basename(file)}`);
            if (call.name === 'replace_file_content') {
              console.log(`  Target: ${args.TargetContent.substring(0, 100)}...`);
              console.log(`  Replacement: ${args.ReplacementContent.substring(0, 200)}...`);
            } else {
              console.log(`  Chunks: ${args.ReplacementChunks.length}`);
              args.ReplacementChunks.forEach((c, idx) => {
                console.log(`    Chunk ${idx}: Target: ${c.TargetContent.substring(0, 50)}... -> Replacement: ${c.ReplacementContent.substring(0, 100)}...`);
              });
            }
          }
        }
      }
    }
  } catch (e) {
    // Ignore parse errors
  }
}
