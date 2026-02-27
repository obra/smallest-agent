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
    // positional args are shorter than {input:..., output:...}
    rl = createInterface(process.stdin, process.stdout);
  line = await new Promise(r => rl.question("> ", r));
) {
  push("user", line);

  // Inner loop: agentic loop until Claude responds without a tool call
  for (;;) {
    const { content } = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4000,
      messages,
      // "sh" is shorter than "bash", description is optional
      tools: [{ name: "sh", input_schema: { type: "object", properties: { cmd: {} } } }],
    });

    // tool_use blocks have an `input` property; text blocks don't
    const tool = content.find(b => b.input);
    push("assistant", content);

    if (!tool) {
      // when there's no tool call, first block is always text
      log(content[0]?.text);
      break;
    }

    // var (not let) so it's hoisted and visible after the try/catch block
    try { var output = execSync(tool.input.cmd) + ""; }
    catch (e) { output = e.message; }
    // log cmd and output together — saves a separate log(cmd) call
    log(tool.input.cmd, output);
    push("user", [{ type: "tool_result", tool_use_id: tool.id, content: output }]);
  }
}
