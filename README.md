# CSV reader

A dependency-free Node.js CSV reader that preserves make.fun csv-reader 1.0.0's recovery rules for malformed rows. The entry exports `run({text, header})` from `solve.js`. The Node 22 driver in `main.ts` reads `cases.json` and writes each answer to `answers.json` in input order. Run `node main.ts` with `MAKEFUN_INPUT_DIR` and `MAKEFUN_OUTPUT_DIR` pointing to the input and output directories.
