import mysql from "mysql2/promise";

function buildConfig(): mysql.PoolOptions {
  const internalUrl = process.env.MYSQL_URL;
  if (internalUrl) return { uri: internalUrl };

  const publicUrl = process.env.MYSQL_PUBLIC_URL;
  if (publicUrl) return { uri: publicUrl };

  return {
    host:     process.env.MYSQLHOST     ?? "localhost",
    port:     Number(process.env.MYSQLPORT ?? 3306),
    user:     process.env.MYSQLUSER     ?? "root",
    password: process.env.MYSQLPASSWORD ?? "",
    database: process.env.MYSQLDATABASE ?? "railway",
  };
}

const pool = mysql.createPool({
  ...buildConfig(),
  waitForConnections: true,
  connectionLimit:    10,
  timezone:           "Z",       
  decimalNumbers:     true,
});

export default pool;

export async function testConnection(): Promise<void> {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
  console.log("✅ MySQL (Railway) conectado com sucesso.");
}