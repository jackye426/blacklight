import { describe, expect, it } from "vitest";
import { readHookTrace } from "./hooks.ts";
import { readClaudeSession } from "./session.ts";
import { readOtlpSpans } from "./otel.ts";

describe("readHookTrace", () => {
  it("maps hook firings to typed, parented events", () => {
    const lines = [
      { source: "claude-code-hook", hookEvent: "SessionStart", ts: "2026-01-01T00:00:00.000Z", payload: {} },
      { source: "claude-code-hook", hookEvent: "PreToolUse", ts: "2026-01-01T00:00:01.000Z", payload: { tool_name: "Bash" } },
      { source: "claude-code-hook", hookEvent: "Notification", ts: "2026-01-01T00:00:02.000Z", payload: {} },
      { source: "claude-code-hook", hookEvent: "Stop", ts: "2026-01-01T00:00:03.000Z", payload: {} },
    ]
      .map((l) => JSON.stringify(l))
      .join("\n");

    const events = readHookTrace(lines);
    expect(events.map((e) => e.type)).toEqual(["interaction", "tool.call", "permission.wait", "interaction"]);
    expect(events[1]!.parentId).toBe(events[0]!.id);
    expect(events[1]!.data?.["tool"]).toBe("Bash");
    expect(events[1]!.atMs).toBe(1000);
  });
});

describe("readClaudeSession", () => {
  it("reconstructs interaction → model.request → tool.call", () => {
    const lines = [
      { type: "user", uuid: "u1", timestamp: "2026-01-01T00:00:00.000Z", message: { role: "user", content: "hi" } },
      {
        type: "assistant",
        uuid: "a1",
        parentUuid: "u1",
        timestamp: "2026-01-01T00:00:01.000Z",
        message: { role: "assistant", content: [{ type: "text" }, { type: "tool_use", name: "Read", id: "t1" }] },
      },
    ]
      .map((l) => JSON.stringify(l))
      .join("\n");

    const events = readClaudeSession(lines);
    expect(events.map((e) => e.type)).toEqual(["interaction", "model.request", "tool.call"]);
    expect(events[1]!.parentId).toBe(events[0]!.id);
    expect(events[2]!.parentId).toBe(events[1]!.id);
    expect(events[2]!.data?.["tool"]).toBe("Read");
  });
});

describe("readOtlpSpans", () => {
  it("maps spans by name and links via parentSpanId", () => {
    const doc = {
      resourceSpans: [
        {
          scopeSpans: [
            {
              spans: [
                { spanId: "A", name: "interaction", startTimeUnixNano: "1000000000" },
                { spanId: "B", parentSpanId: "A", name: "tool call", startTimeUnixNano: "1500000000" },
              ],
            },
          ],
        },
      ],
    };
    const events = readOtlpSpans(doc);
    expect(events.map((e) => e.type)).toEqual(["interaction", "tool.call"]);
    const b = events.find((e) => e.id === "B")!;
    expect(b.parentId).toBe("A");
    expect(b.atMs).toBe(500);
  });
});
