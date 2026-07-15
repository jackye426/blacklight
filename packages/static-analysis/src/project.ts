/**
 * Build a single ts-morph {@link Project} for a target and share it across analyses. Parsing
 * is the expensive step, so imports and concepts run against one loaded project rather than
 * two. Files that fail to load are reported, not silently dropped.
 */

import { ModuleKind, ModuleResolutionKind, Project, ScriptTarget } from "ts-morph";
import { ANALYSABLE_EXTS, type FileEntry } from "./walk.ts";

export interface LoadedProject {
  project: Project;
  parseFailures: string[];
}

/** Create an emit-free, permissive project and add every analysable file to it. */
export function loadProject(files: FileEntry[]): LoadedProject {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      allowJs: true,
      checkJs: false,
      module: ModuleKind.ESNext,
      moduleResolution: ModuleResolutionKind.Bundler,
      target: ScriptTarget.ES2022,
      // Resolve modern ESM specifiers, including the `./foo.ts` style Blacklight uses itself.
      allowImportingTsExtensions: true,
      noEmit: true,
      skipLibCheck: true,
    },
  });

  const parseFailures: string[] = [];
  for (const file of files) {
    if (!ANALYSABLE_EXTS.has(file.ext)) continue;
    try {
      project.addSourceFileAtPath(file.absPath);
    } catch {
      parseFailures.push(file.relPath);
    }
  }

  return { project, parseFailures };
}
