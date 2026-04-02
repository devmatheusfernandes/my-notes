const Database = require('better-sqlite3');
const path = require('path');

function checkSchema(fileName) {
  const dbPath = path.join(process.cwd(), 'data', 'bibles', fileName);
  console.log(`\n--- Schema for ${fileName} ---`);
  try {
    const db = new Database(dbPath, { readonly: true });
    // Use sqlite_master for table list
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables:', tables.map(t => t.name).join(', '));
    
    for (const table of tables) {
      // Use pragma for columns
      const cols = db.prepare(`PRAGMA table_info(${table.name})`).all();
      console.log(`Columns for ${table.name}:`, cols.map(c => `${c.name} (${c.type})`).join(', '));
    }
  } catch (e) {
    console.error(`Error reading ${fileName}:`, e.message);
  }
}

checkSchema('NWT.sqlite');
checkSchema('ACF.sqlite');
