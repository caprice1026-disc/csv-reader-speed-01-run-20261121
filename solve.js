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
  let comma = -1;
  let cr = -1;
  let lf = -1;
  function next(delimiter, from) {
    const index = text.indexOf(delimiter, from);
    return index < 0 ? end : index;
  }

  while (pos < end) {
    const recordLine = line;
    const row = header && columns === null ? null : rows.length;
    const fields = width < 0 ? [] : new Array(width);
    let fieldCount = 0;
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
          // A delimiter immediately after the closing quote leaves no suffix to recover.
          const delimiter = text.charCodeAt(pos);
          if (delimiter === 44) {
            fields[fieldCount++] = value;
            pos++;
            continue;
          }
          if (pos === end || delimiter === 10 ||
              (delimiter === 13 && text.charCodeAt(pos + 1) === 10)) {
            fields[fieldCount++] = value;
            if (pos < end) {
              pos += delimiter === 13 ? 2 : 1;
              line++;
            }
            break;
          }
          closed = true;
        }
      }

      const beforeSuffix = value.length;
      if (comma < pos) comma = next(',', pos);
      if (cr < pos) cr = next('\r', pos);
      if (lf < pos) lf = next('\n', pos);
      if (!quoted && comma < cr && comma < lf) {
        fields[fieldCount++] = text.slice(pos, comma);
        pos = comma + 1;
        continue;
      }
      const stop = Math.min(comma, lf);
      while (cr < stop && text.charCodeAt(cr + 1) !== 10) {
        value += text.slice(pos, cr);
        errors.push({code: 'stray_cr', line: recordLine, row});
        pos = cr + 1;
        cr = next('\r', pos);
      }
      const boundary = Math.min(cr, stop);
      value += text.slice(pos, boundary);
      pos = boundary;
      if (closed && value.length > beforeSuffix) errors.push({code: 'quote_junk', line: recordLine, row});
      fields[fieldCount++] = value;
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
    if (fieldCount === 1 && fields[0] === '' && !quoted) continue;
    if (width < 0) width = fields.length;
    if (header && columns === null) {
      columns = fields;
      continue;
    }
    if (fieldCount < width) {
      errors.push({code: 'short_row', line: recordLine, row, fields: fieldCount});
      fields.fill('', fieldCount, width);
    } else if (fields.length > width) {
      errors.push({code: 'long_row', line: recordLine, row, extra: fields.splice(width)});
    }
    rows.push(fields);
  }
  return {columns: header ? columns ?? [] : null, rows, errors};
}
