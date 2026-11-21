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

function* readCases(bytes: Buffer): Generator<{ input: unknown }> {
  let end = bytes.length - 1;
  while (end > 0 && bytes[end] <= 32) end--;
  if (bytes[0] !== 91 || bytes[end] !== 93) {
    yield* JSON.parse(bytes.toString('utf8'));
    return;
  }
  const objectSeparator = Buffer.from('},{');
  let start = 1;
  while (start < end) {
    const next = bytes.indexOf(objectSeparator, start);
    const stop = next === -1 ? end : next + 1;
    let item;
    try {
      item = JSON.parse(bytes.toString('utf8', start, stop));
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      // A separator can occur in a quoted string or nested array. Parse the
      // remaining array normally if the proposed element isn't complete.
      yield* JSON.parse('[' + bytes.toString('utf8', start, end) + ']');
      return;
    }
    yield item;
    start = stop + 1;
  }
}
const cases = readCases(readFileSync(join(INPUT_DIR, 'cases.json')));
const output = openSync(join(OUTPUT_DIR, 'answers.json'), 'w');
try {
  writeFileSync(output, '[');
  let first = true;
  for (const c of cases) {
    if (!first) writeFileSync(output, ',');
    first = false;
    writeFileSync(output, JSON.stringify(run(c.input)));
  }
  writeFileSync(output, ']');
} finally {
  closeSync(output);
}
