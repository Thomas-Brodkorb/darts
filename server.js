import express from 'express'
import cors from 'cors'
import sql from './db.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Serve the HTML + JS files from the public folder
app.use(express.static('public'))

// Example: GET all players
app.get('/api/players', async (req, res) => {
  try {
    const players = await sql`select * from Players`
    res.json(players)
  } catch (error) {
    console.error('GET /api/players error:', error)
    res.status(500).json({ error: 'Unable to fetch players' })
  }
})

// Example: Create a player (or insert into any other pre-defined table)
app.post('/api/players', async (req, res) => {
  try {
    const playerData = req.body

    // IMPORTANT: Adjust this to match your table columns.
    // If your table is called Players and has columns (name, email, score) you can send those keys.
    // Here we let postgres.js generate an INSERT statement from an object.
    const inserted = await sql`
      insert into Players ${sql(playerData)}
      returning *
    `

    res.status(201).json(inserted[0])
  } catch (error) {
    console.error('POST /api/players error:', error)
    res.status(500).json({ error: 'Unable to insert player' })
  }
})

// Visits: each visit belongs to a player and contains a total value (sum of 3 darts)
app.get('/api/visits', async (req, res) => {
  try {
    // Join to include player info and optional leg info (leg_id can be null).
    const visits = await sql`
      select v.*, p.name as player_name, l.player_one as leg_player_one, l.player_two as leg_player_two, l."break" as leg_break, l.rounds as leg_rounds
      from Visits v
      join Players p on p.id = v.player_id
      left join Legs l on l.id = v.leg_id
      order by v.created_at desc
    `

    res.json(visits)
  } catch (error) {
    console.error('GET /api/visits error:', error)
    res.status(500).json({ error: 'Unable to fetch visits' })
  }
})

app.post('/api/visits', async (req, res) => {
  try {
    const visitData = req.body

    const inserted = await sql`
      insert into Visits ${sql(visitData)}
      returning *
    `

    res.status(201).json(inserted[0])
  } catch (error) {
    console.error('POST /api/visits error:', error)
    res.status(500).json({ error: 'Unable to insert visit' })
  }
})

// Legs: each leg has two players and a boolean 'break' to indicate who won
app.get('/api/legs', async (req, res) => {
  try {
    const legs = await sql`
      select l.*, p1.name as player_one_name, p2.name as player_two_name
      from Legs l
      join Players p1 on p1.id = l.player_one
      join Players p2 on p2.id = l.player_two
      order by l.created_at desc
    `

    res.json(legs)
  } catch (error) {
    console.error('GET /api/legs error:', error)
    res.status(500).json({ error: 'Unable to fetch legs' })
  }
})

/*
select l.player_one, p1.name as player_one_name, count(l.id)
      from Legs l
      join Players p1 on p1.id = l.player_one
      where l.break = false
      group by l.player_one,p1.name
      order by count(l.id) desc
*/

app.get('/api/legs/:id', async (req, res) => {
  try {
    const { id } = req.params
    const legs = await sql`
      select l.*, p1.name as player_one_name, p2.name as player_two_name
      from Legs l
      join Players p1 on p1.id = l.player_one
      join Players p2 on p2.id = l.player_two
      where l.id = ${id}
    `

    if (legs.length === 0) {
      return res.status(404).json({ error: 'Leg not found' })
    }

    res.json(legs[0])
  } catch (error) {
    console.error('GET /api/legs/:id error:', error)
    res.status(500).json({ error: 'Unable to fetch leg' })
  }
})

app.post('/api/legs', async (req, res) => {
  try {
    const { player_one, player_two, break: isBreak, start_value, rounds, visits } = req.body

    const insertedLeg = await sql.begin(async (tx) => {
      const [leg] = await tx`
        insert into Legs ${sql({
          player_one,
          player_two,
          "break": isBreak,
          start_value,
          rounds,
        })}
        returning *
      `

      if (Array.isArray(visits) && visits.length > 0) {
        for (const visit of visits) {
          await tx`
            insert into Visits ${sql({
              player_id: visit.player_id,
              leg_id: leg.id,
              value: visit.value,
            })}
          `
        }
      }

      return leg
    })

    res.status(201).json(insertedLeg)
  } catch (error) {
    console.error('POST /api/legs error:', error)
    res.status(500).json({ error: 'Unable to insert leg' })
  }
})

// Player averages: return average visit value per player
app.get('/api/player-averages', async (req, res) => {
  try {
    const averages = await sql`
      select
        p.name as player_name,
        avg(v.value) as average_value
      from Players p
      join Visits v on v.player_id = p.id
      group by p.name
      order by average_value desc
    `

    res.json(averages)
  } catch (error) {
    console.error('GET /api/player-averages error:', error)
    res.status(500).json({ error: 'Unable to fetch averages' })
  }
})

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`)
})
