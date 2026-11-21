// Parse one CSV input. Values remain strings, including empty fields.
export function run(input) {
  const text = String(input.text);
  const header = input.header === true;
  const rows = [];
  const errors = [];
  let columns = null;
  let width = -1;
  let line = 1;
  let pos = text.charCodeAt(0) === 0xfeff ? 1 : 0;
  const end = text.length;

  while (pos < end) {
    const recordLine = line;
    const row = header && columns === null ? null : rows.length;
    const fields = [];
    let quoted;

    while (true) {
      const open = pos;
      let value = '';
      let closed = false;
      quoted = text.charCodeAt(pos) === 34;
      if (quoted) {
        let quote = text.indexOf('"', open + 1);
        while (quote !== -1 && text.charCodeAt(quote + 1) === 34) {
          quote = text.indexOf('"', quote + 2);
        }
        if (quote === -1) {
          errors.push({code: 'unterminated_quote', line: recordLine, row});
        } else {
          value = text.slice(open + 1, quote).replace(/""/g, '"').replace(/\r\n?/g, '\n');
          for (let lf = value.indexOf('\n'); lf >= 0; lf = value.indexOf('\n', lf + 1)) line++;
          pos = quote + 1;
          closed = true;
        }
      }

      const beforeSuffix = value.length;
      let start = pos;
      while (pos < end) {
        const code = text.charCodeAt(pos);
        if (code === 44 || code === 10) break;
        if (code === 13) {
          if (text.charCodeAt(pos + 1) === 10) break;
          value += text.slice(start, pos);
          errors.push({code: 'stray_cr', line: recordLine, row});
          start = pos + 1;
        }
        pos++;
      }
      value += text.slice(start, pos);
      if (closed && value.length > beforeSuffix) errors.push({code: 'quote_junk', line: recordLine, row});
      fields.push(value);
      if (text.charCodeAt(pos) === 44) {
        pos++;
        continue;
      }
      if (pos < end) {
        pos += text.charCodeAt(pos) === 13 ? 2 : 1;
        line++;
      }
      break;
    }
    if (fields.length === 1 && fields[0] === '' && !quoted) continue;
    if (width < 0) width = fields.length;
    if (header && columns === null) {
      columns = fields;
      continue;
    }
    if (fields.length < width) {
      errors.push({code: 'short_row', line: recordLine, row, fields: fields.length});
      while (fields.length < width) fields.push('');
    } else if (fields.length > width) {
      errors.push({code: 'long_row', line: recordLine, row, extra: fields.splice(width)});
    }
    rows.push(fields);
  }
  return {columns: header ? columns ?? [] : null, rows, errors};
}
