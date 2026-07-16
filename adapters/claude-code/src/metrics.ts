/**
 * Turn a normalised Claude Code hook trace into experiment metric counts. Every number here is
 * an observation — a count of hook firings — keyed by the experiment-runner's standard metric
 * vocabulary. Only PreToolUse firings are counted so Pre/Post pairs aren't double-counted.
 */

import type { TraceEvent } from "@blacklight/runtime-tracing";

const SEARCH_TOOLS = new Set(["Grep", "Glob", "WebSearch"]);
const READ_TOOLS = new Set(["Read", "NotebookRead"]);
const EDIT_TOOLS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);
const COMMAND_TOOLS = new Set(["Bash", "PowerShell"]);
const SUBAGENT_TOOLS = new Set(["Task", "Agent"]);

export function hookTraceToMetrics(events: TraceEvent[]): Record<string, number> {
  const counts = {
    "files-searched": 0,
    "files-read": 0,
    "edits-made": 0,
    "commands-executed": 0,
    "subagents-used": 0,
    "permission-requests": 0,
    "context-compactions": 0,
  };

  for (const e of events) {
    if (e.type === "permission.wait") counts["permission-requests"]++;
    if (e.type === "hook.execution" && e.data?.["hook"] === "PreCompact") counts["context-compactions"]++;
    if (e.type !== "tool.call" || e.data?.["hook"] !== "PreToolUse") continue;

    const tool = String(e.data?.["tool"] ?? "");
    if (SEARCH_TOOLS.has(tool)) counts["files-searched"]++;
    else if (READ_TOOLS.has(tool)) counts["files-read"]++;
    else if (EDIT_TOOLS.has(tool)) counts["edits-made"]++;
    else if (COMMAND_TOOLS.has(tool)) counts["commands-executed"]++;
    else if (SUBAGENT_TOOLS.has(tool)) counts["subagents-used"]++;
  }

  return counts;
}
