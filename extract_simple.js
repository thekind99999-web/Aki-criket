const fs = require('fs');
const logPath = 'C:/Users/DELL/.gemini/antigravity-ide/brain/875f74e7-c494-4047-b1a9-bdbc4425dad7/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');

let htmlContent = '';
let cssContent = '';
let jsContent = '';

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.tool_calls) {
      for (const call of obj.tool_calls) {
        if (call.name === 'write_to_file') {
          const args = typeof call.args === 'string' ? JSON.parse(call.args) : call.args;
          let file = args.TargetFile || '';
          file = file.replace(/["']/g, '').trim();
          const content = args.CodeContent || '';
          
          if (obj.step_index === 589 && file.endsWith('index.html')) {
            htmlContent = content;
          }
          if (obj.step_index === 605 && file.endsWith('styles.css')) {
            cssContent = content;
          }
          if (obj.step_index === 603 && file.endsWith('app.js')) {
            jsContent = content;
          }
        }
      }
    }
  } catch (e) {
    //
  }
}

if (htmlContent) {
  fs.writeFileSync('simple_index.html', htmlContent);
  console.log('Wrote simple_index.html, length:', htmlContent.length);
} else {
  console.log('Failed to find htmlContent in step 589');
}

if (cssContent) {
  fs.writeFileSync('simple_styles.css', cssContent);
  console.log('Wrote simple_styles.css, length:', cssContent.length);
} else {
  console.log('Failed to find cssContent in step 605');
}

if (jsContent) {
  fs.writeFileSync('simple_app.js', jsContent);
  console.log('Wrote simple_app.js, length:', jsContent.length);
} else {
  console.log('Failed to find jsContent in step 603');
}
