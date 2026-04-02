const Database = require('better-sqlite3');
const path = require('path');

function checkData(fileName) {
  const dbPath = path.join(process.cwd(), 'data', 'bibles', fileName);
  console.log(`\n--- Data Sample for ${fileName} ---`);
  try {
    const db = new Database(dbPath, { readonly: true });
    if (fileName === 'NWT.sqlite') {
      const sample = db.prepare("SELECT DISTINCT book FROM verses LIMIT 5").all();
      console.log('Sample book values:', sample.map(s => s.book).join(', '));
    }
  } catch (e) {
    console.error(`Error reading ${fileName}:`, e.message);
  }
}

checkData('NWT.sqlite');
