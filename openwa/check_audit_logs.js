import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data/main.sqlite', (err) => {
  if (err) {
    console.error("Error opening database:", err);
    return;
  }
  
  db.all("SELECT * FROM audit_logs ORDER BY createdAt DESC", (err, logs) => {
    if (err) {
      console.error("Error reading audit logs:", err);
    } else {
      console.log("=== AUDIT LOGS ===");
      logs.forEach(log => {
        console.log(`[${log.createdAt}] ${log.action} - ${log.level}: ${log.message}`);
        if (log.details) {
          console.log(`   Details: ${log.details}`);
        }
      });
    }
    db.close();
  });
});
