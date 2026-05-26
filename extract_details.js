const fs = require('fs');
const logPath = 'C:/Users/DELL/.gemini/antigravity-ide/brain/875f74e7-c494-4047-b1a9-bdbc4425dad7/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');

const targetSteps = [308, 312, 314, 351, 355, 373, 388, 480, 484];

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    if (targetSteps.includes(obj.step_index)) {
      if (obj.tool_calls) {
        for (const call of obj.tool_calls) {
          if (call.name === 'replace_file_content' || call.name === 'multi_replace_file_content') {
            const args = typeof call.args === 'string' ? JSON.parse(call.args) : call.args;
            const file = (args.TargetFile || '').replace(/["']/g, '').trim();
            const stepName = `step_${obj.step_index}_${pathSeq(file)}`;
            fs.writeFileSync(`${stepName}.json`, JSON.stringify(args, null, 2));
            console.log(`Wrote ${stepName}.json`);
          }
        }
      }
    }
  } catch (e) {
    //
  }
}

function pathSeq(file) {
  return file.split(/[\\/]/).pop();
}
