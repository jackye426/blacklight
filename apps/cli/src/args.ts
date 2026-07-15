/**
 * A tiny argv parser. Splits positionals, `--flag[=value]` options, and everything after a
 * bare `--` into a passthrough list (used by `atlas trace -- <command>`). Deliberately small —
 * the CLI's surface does not justify a dependency.
 */

export interface ParsedArgs {
  positionals: string[];
  flags: Record<string, string | boolean>;
  /** Tokens after a bare `--`, passed through verbatim. */
  passthrough: string[];
}

export function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};
  let passthrough: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--") {
      passthrough = argv.slice(i + 1);
      break;
    }
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      if (eq !== -1) {
        flags[arg.slice(2, eq)] = arg.slice(eq + 1);
      } else {
        const key = arg.slice(2);
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith("--") && next !== "--") {
          flags[key] = next;
          i++;
        } else {
          flags[key] = true;
        }
      }
    } else {
      positionals.push(arg);
    }
  }

  return { positionals, flags, passthrough };
}

/** Read a flag as a string, or undefined if unset/boolean. */
export function stringFlag(flags: ParsedArgs["flags"], name: string): string | undefined {
  const v = flags[name];
  return typeof v === "string" ? v : undefined;
}
