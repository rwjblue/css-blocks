import { Configuration, ImportedFile, Importer, Syntax, syntaxFromExtension } from "@css-blocks/core";
import type { FS as MergedFileSystem } from "fs-merger";
import * as path from "path";

const PREFIX = "broccoli-tree:";
const PREFIX_LENGTH = PREFIX.length;
const PREFIX_RE = new RegExp(`^${PREFIX}`);

export function isBroccoliTreeIdentifier(identifier: string | null): identifier is string {
  return !!(identifier && PREFIX_RE.test(identifier));
}

export function identToPath(identifier: string): string {
  return identifier.substring(PREFIX_LENGTH);
}

export function pathToIdent(relativePath: string): string {
  return PREFIX + relativePath;
}

/**
 * Knows how to import blocks from a broccoli merged filesystem interface.
 */
export class BroccoliTreeImporter implements Importer {
  fallbackImporter: Importer;
  input: MergedFileSystem;

  constructor(input: MergedFileSystem, fallbackImporter: Importer) {
    this.input = input;
    this.fallbackImporter = fallbackImporter;
  }

  identifier(fromIdentifier: string | null, importPath: string, config: Readonly<Configuration>): string {
    if (isBroccoliTreeIdentifier(fromIdentifier)) {
      if (importPath.startsWith("./") || importPath.startsWith("../")) {
        return pathToIdent(path.resolve(path.dirname(identToPath(fromIdentifier)), importPath));
      } else {
        return this.fallbackImporter.identifier(null, importPath, config);
      }
    } else {
      return this.fallbackImporter.identifier(fromIdentifier, importPath, config);
    }
  }

  async import(identifier: string, config: Readonly<Configuration>): Promise<ImportedFile> {
    if (isBroccoliTreeIdentifier(identifier)) {
      let relativePath = identToPath(identifier);
      let contents = this.input.readFileSync(relativePath, "utf8");
      let syntax = syntaxFromExtension(path.extname(relativePath));
      let defaultName = path.basename(relativePath);
      defaultName = defaultName.replace(/.block$/, "");
      return {
        identifier,
        defaultName,
        syntax,
        contents,
      };
    } else {
      return this.fallbackImporter.import(identifier, config);
    }
  }

  defaultName(identifier: string, configuration: Readonly<Configuration>): string {
    if (isBroccoliTreeIdentifier(identifier)) {
      let relativePath = identToPath(identifier);
      let defaultName = path.basename(relativePath);
      defaultName = defaultName.replace(/.block$/, "");
      return defaultName;
    } else {
      return this.fallbackImporter.defaultName(identifier, configuration);
    }
  }

  filesystemPath(identifier: string, config: Readonly<Configuration>): string | null {
    if (isBroccoliTreeIdentifier(identifier)) {
      let relativePath = identToPath(identifier);
      return relativePath;
    } else {
      return this.fallbackImporter.filesystemPath(identifier, config);
    }
  }

  debugIdentifier(identifier: string, config: Readonly<Configuration>): string {
    if (isBroccoliTreeIdentifier(identifier)) {
      let relativePath = identToPath(identifier);
      return relativePath;
    } else {
      return this.fallbackImporter.debugIdentifier(identifier, config);
    }
  }

  syntax(identifier: string, config: Readonly<Configuration>): Syntax {
    if (isBroccoliTreeIdentifier(identifier)) {
      let relativePath = identToPath(identifier);
      let syntax = syntaxFromExtension(path.extname(relativePath));
      return syntax;
    } else {
      return this.fallbackImporter.syntax(identifier, config);
    }
  }
}