import postgres from 'postgres'
import mysql from 'mysql2/promise'

const client = (process.env.DB_CLIENT || 'postgres').toLowerCase()
let sql

if (client === 'postgres' || client === 'postgresql') {
  sql = postgres(process.env.DATABASE_URL || {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || 'Darts',
    username: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
  })
} else if (client === 'mysql') {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'darts',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })

  const objectFragment = Symbol('mysql object fragment')

  function createTag(execute) {
    function sql(strings, ...values) {
      if (!Array.isArray(strings) || !Object.hasOwn(strings, 'raw')) {
        if (values.length !== 0 || strings === null || typeof strings !== 'object' || Array.isArray(strings)) {
          throw new TypeError('sql() expects a tagged template or an insert object')
        }
        return { [objectFragment]: strings }
      }

      let query = strings[0]
      const parameters = []

      for (let i = 0; i < values.length; i++) {
        const value = values[i]
        if (value && typeof value === 'object' && objectFragment in value) {
          const entries = Object.entries(value[objectFragment])
          if (entries.length === 0) throw new TypeError('Cannot insert an empty object')
          const columns = entries.map(([key]) => `\`${key.replaceAll('`', '``')}\``)
          query += `(${columns.join(', ')}) VALUES (${entries.map(() => '?').join(', ')})`
          parameters.push(...entries.map(([, entryValue]) => entryValue))
        } else {
          query += '?'
          parameters.push(value)
        }
        query += strings[i + 1]
      }

      return runQuery(execute, query, parameters)
    }

    return sql
  }

  function translateQuery(query) {
    return query
      .replace(/"break"/gi, '`break`')
      .replace(
        /date_trunc\('month',\s*([^)]+)\)\s*=\s*date_trunc\('month',\s*now\(\)\s*\)/gi,
        "DATE_FORMAT($1, '%Y-%m') = DATE_FORMAT(CURRENT_TIMESTAMP, '%Y-%m')",
      )
      .replace(/date_part\('year',\s*([^)]+)\)/gi, 'YEAR($1)')
      .replace(/date_part\('week',\s*([^)]+)\)/gi, 'WEEK($1, 3)')
  }

  async function runQuery(execute, query, parameters) {
    const returning = /\s+returning\s+\*\s*;?\s*$/i.test(query)
    const translated = translateQuery(query).replace(/\s+returning\s+\*\s*;?\s*$/i, '')
    const [result] = await execute(translated, parameters)

    if (!returning) return Array.isArray(result) ? result : []

    const table = translated.match(/\binsert\s+into\s+`?([a-z0-9_]+)`?/i)?.[1]
    if (!table || !result.insertId) {
      throw new Error('MySQL INSERT ... RETURNING requires an auto-increment id')
    }

    const [rows] = await execute(`SELECT * FROM \`${table}\` WHERE id = ?`, [result.insertId])
    return rows
  }

  sql = createTag((query, parameters) => pool.execute(query, parameters))
  sql.begin = async (callback) => {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const transaction = createTag((query, parameters) => connection.execute(query, parameters))
      const result = await callback(transaction)
      await connection.commit()
      return result
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
} else {
  throw new Error(`Unsupported DB_CLIENT "${client}". Use "postgres" or "mysql".`)
}

export default sql
