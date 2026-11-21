# CSV reader

A dependency-free Node.js CSV reader that preserves make.fun csv-reader 1.0.0's recovery rules for malformed rows. The entry exports `run({text, header})` from `solve.js` and uses the official Node 22 driver in `main.ts` to read `cases.json` and write `answers.json`. Run `node main.ts` with `MAKEFUN_INPUT_DIR` and `MAKEFUN_OUTPUT_DIR` pointing to the input and output directories.
