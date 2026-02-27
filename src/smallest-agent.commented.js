// ABOUTME: Ultra-minimal AI agent that connects Claude to bash commands
// ABOUTME: Provides interactive CLI for AI-assisted coding (exit with Ctrl+C)

import Anthropic from "@anthropic-ai/sdk";
import { execSync } from "child_process";
import { createInterface } from "readline";

// Pack all declarations into the for init — saves `const ...;for(let` → just `for(let`
for (
  let line,
    client = new Anthropic(),      // reads ANTHROPIC_API_KEY automatically
    messages = [],
    log = console.log,
    push = (role, content) => messages.push({ role, content }),
    rl = createInterface({ input: process.stdin, output: process.stdout });
  line = await new Promise(r => rl.question("> ", r));
) {
  push("user", line);

  // Inner loop: agentic loop until Claude responds without a tool call
  for (;;) {
    const { content } = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4000,
      messages,
      tools: [{ name: "bash", description: "sh", input_schema: { type: "object", properties: { cmd: {} } } }],
    });

    // "tool_use" > "text" alphabetically, so this finds tool_use blocks
    const tool = content.find(b => b.type > "text");
    push("assistant", content);

    if (!tool) {
      // "text" < "tool" alphabetically, so this finds text blocks
      log(content.find(b => b.type < "tool")?.text);
      break;
    }

    log(tool.input.cmd);
    // var (not let) so it's visible after the try/catch block
    try { var output = execSync(tool.input.cmd) + ""; }
    catch (e) { output = e.message; }
    log(output);
    push("user", [{ type: "tool_result", tool_use_id: tool.id, content: output }]);
  }
}
