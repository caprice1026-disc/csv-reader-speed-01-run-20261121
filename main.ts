// Adapted from make.fun's MIT-licensed csv-reader driver for Node 22.
// Serialize each case before parsing the next so its rows can be reclaimed.

import { closeSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setFlagsFromString } from 'node:v8';

// V8's incremental marking off, set before solve.js is imported so all of its work runs under it (the rules: the house
// baseline runs with --no-incremental-marking, and an entry may tune V8's flags too).
setFlagsFromString('--no-incremental-marking');

/** solve.js, imported by its URL (a .js module carries no types) and typed by its contract. */
const { run } = (await import(new URL('./solve.js', import.meta.url).href)) as { run: (input: unknown) => unknown };

const INPUT_DIR = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const cases = JSON.parse(readFileSync(join(INPUT_DIR, 'cases.json'), 'utf8')) as { id: string; input: unknown }[];
const output = openSync(join(OUTPUT_DIR, 'answers.json'), 'w');
try {
  writeFileSync(output, '[');
  for (const [index, c] of cases.entries()) {
    if (index > 0) writeFileSync(output, ',');
    writeFileSync(output, JSON.stringify(run(c.input)));
  }
  writeFileSync(output, ']');
} finally {
  closeSync(output);
}
