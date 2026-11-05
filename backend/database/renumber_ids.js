// database/renumber_ids.js
// Renumbers every table's primary key (user_id, product_id, ...) to 1,2,3,... (keeping the existing order) and moves every
// foreign key column with it, then resets AUTO_INCREMENT. Back up the database first.
// Logged-in users must sign in again afterwards: JWTs carry the old user id.
//   node database/renumber_ids.js
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ecommerce_db_live',
  });

  // Single-column integer primary keys (tables use table-wise names: users.user_id, products.product_id, ...)
  const [tables] = await conn.query(
    `SELECT TABLE_NAME AS name, COLUMN_NAME AS pk FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_KEY = 'PRI' AND DATA_TYPE = 'int'`
  );
  const [fks] = await conn.query(
    `SELECT TABLE_NAME AS child, COLUMN_NAME AS col, REFERENCED_TABLE_NAME AS parent, REFERENCED_COLUMN_NAME AS ref
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL`
  );

  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  try {
    await conn.beginTransaction();
    for (const { name, pk } of tables) {
      const [rows] = await conn.query(`SELECT \`${pk}\` AS id FROM \`${name}\` ORDER BY \`${pk}\``);
      const children = fks.filter((f) => f.parent === name && f.ref === pk);
      let changed = 0;
      // Ascending order: the new id (rank) is always below the old one and already free
      for (let i = 0; i < rows.length; i++) {
        const oldId = rows[i].id;
        const newId = i + 1;
        if (oldId === newId) continue;
        await conn.query(`UPDATE \`${name}\` SET \`${pk}\` = ? WHERE \`${pk}\` = ?`, [newId, oldId]);
        for (const f of children) {
          await conn.query(`UPDATE \`${f.child}\` SET \`${f.col}\` = ? WHERE \`${f.col}\` = ?`, [newId, oldId]);
        }
        changed++;
      }
      console.log(`${name}: ${rows.length} rows, ${changed} renumbered`);
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  // ALTER commits implicitly, so it runs after the data change; 1 snaps to MAX(pk)+1
  for (const { name } of tables) {
    await conn.query(`ALTER TABLE \`${name}\` AUTO_INCREMENT = 1`);
  }

  // Every foreign key value must still point at an existing parent row
  let orphans = 0;
  for (const f of fks) {
    const [[{ n }]] = await conn.query(
      `SELECT COUNT(*) AS n FROM \`${f.child}\` c LEFT JOIN \`${f.parent}\` p ON p.\`${f.ref}\` = c.\`${f.col}\`
       WHERE c.\`${f.col}\` IS NOT NULL AND p.\`${f.ref}\` IS NULL`
    );
    if (n) console.error(`orphans: ${f.child}.${f.col} -> ${f.parent} (${n})`);
    orphans += n;
  }
  console.log(orphans ? `Done with ${orphans} orphan rows` : 'Done, all foreign keys intact');
  await conn.end();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
