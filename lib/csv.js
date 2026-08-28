// Small CSV reader. The content CSVs contain quoted fields with embedded
// commas and newlines, so a split(",") won't do. Kept dependency-free
// deliberately — this is the only parsing the app needs.

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  return rows.filter((r) => r.length > 1 || r[0] !== "");
}

export function toObjects(text) {
  const rows = parseCsv(text);
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cells) =>
    Object.fromEntries(header.map((key, i) => [key, cells[i] ?? ""]))
  );
}

// Pipe is the in-cell list delimiter across every CSV in data/.
export function splitList(value) {
  return value ? value.split("|").map((v) => v.trim()).filter(Boolean) : [];
}
