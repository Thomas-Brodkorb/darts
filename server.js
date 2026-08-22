import express from 'express'
import cors from 'cors'
import sql from './db.js'
import { Dart } from './public/Dart.js'
import { Visit } from './public/Visit.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Serve the HTML + JS files from the public folder
app.use(express.static('public'))
// Serve the Chart.js package from node_modules for browser module imports
app.use('/node_modules', express.static('node_modules'))
// app.use(express.static('.'))

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

    // For visits where the detailed darts are stored (value = -1) fetch darts, reconstruct Dart/Visit and compute value
    const visitsWithDarts = await Promise.all(visits.map(async (v) => {
      const dartsRows = await sql`select * from Darts where visit = ${v.id} order by id`
      if (dartsRows.length === 0) {
        // no darts stored, return as-is
        return v
      }

      // build Dart instances from rows
      const dartInstances = [null, null, null]
      for (let i = 0; i < Math.min(3, dartsRows.length); i++) {
        const d = dartsRows[i]
        let valueString = `${d.single_value}`
        if (d.factor === 2) valueString = `D${d.single_value}`
        else if (d.factor === 3) valueString = `T${d.single_value}`
        try {
          dartInstances[i] = new Dart(valueString)
        } catch (e) {
          // fallback to null if parsing fails
          dartInstances[i] = null
        }
      }

      const visitObj = new Visit(dartInstances[0], dartInstances[1], dartInstances[2])
      // attach readable dart strings for frontend and computed total
      v.dart1 = dartInstances[0] ? dartInstances[0].toString() : ''
      v.dart2 = dartInstances[1] ? dartInstances[1].toString() : ''
      v.dart3 = dartInstances[2] ? dartInstances[2].toString() : ''
      v.value = visitObj.totalScore

      return v
    }))

    res.json(visitsWithDarts)
  } catch (error) {
    console.error('GET /api/visits error:', error)
    res.status(500).json({ error: 'Unable to fetch visits' })
  }
})

app.get('/api/visit-averages', async (req, res) => {
  try {
    const averages = await sql`
      select
        concat(date_part('year', v.created_at), ' ', date_part('week', v.created_at)) as yearweek,
        p.name,
        avg(v.value) as value
      from Visits v
      join Players p on p.id = v.player_id
      group by concat(date_part('year', v.created_at), ' ', date_part('week', v.created_at)), p.name
      order by min(v.created_at) asc, p.name asc
    `

    res.json(averages)
  } catch (error) {
    console.error('GET /api/visit-averages error:', error)
    res.status(500).json({ error: 'Unable to fetch visit averages' })
  }
})

app.post('/api/visits', async (req, res) => {
  try {
    const visitData = req.body

    // If darts are provided in the payload, store the visit with value -1 and persist darts
    if (Array.isArray(visitData.darts) && visitData.darts.length > 0) {
      const inserted = await sql.begin(async (tx) => {
        const [visitRow] = await tx`
          insert into Visits ${sql({ player_id: visitData.player_id, leg_id: visitData.leg_id || null, value: -1 })}
          returning *
        `

        for (const dart of visitData.darts) {
          // dart can be a string like 'D20' or an object { single_value, factor }
          let single_value = null
          let factor = null
          if (typeof dart === 'string') {
            const m = dart.match(/^(D|T|d|t)?(\d{1,2})$/)
            if (m) {
              const [, prefix, number] = m
              single_value = Number(number)
              if (prefix === 'D' || prefix === 'd') factor = 2
              else if (prefix === 'T' || prefix === 't') factor = 3
              else factor = 1
            }
          } else if (dart && typeof dart === 'object') {
            single_value = Number(dart.single_value)
            factor = Number(dart.factor)
          }

          if (single_value !== null && factor !== null) {
            await tx`insert into Darts ${sql({ single_value, factor, visit: visitRow.id })}`
          }
        }

        return visitRow
      })

      res.status(201).json(inserted)
      return
    }

    // default behavior: store visit as provided
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

// monthly legs endpoint should be defined before the '/api/legs/:id' route
/*
select l.player_one, p1.name as player_one_name, count(l.id)
      from Legs l
      join Players p1 on p1.id = l.player_one
      where l.break = false
      group by l.player_one,p1.name
      order by count(l.id) desc
*/

app.get('/api/legs/month', async (req, res) => {
  try {
    const legs = await sql`
      select l.*, p1.name as player_one_name, p2.name as player_two_name
      from Legs l
      join Players p1 on p1.id = l.player_one
      join Players p2 on p2.id = l.player_two
      where date_trunc('month', l.created_at) = date_trunc('month', now())
      order by l.created_at desc
    `

    res.json(legs)
  } catch (error) {
    console.error('GET /api/legs/month error:', error)
    res.status(500).json({ error: 'Unable to fetch monthly legs' })
  }
})

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
          if (Array.isArray(visit.darts) && visit.darts.length > 0) {
            const [visitRow] = await tx`
                insert into Visits ${sql({ player_id: visit.player_id, leg_id: leg.id, value: -1 })}
                returning *
              `
            for (const dart of visit.darts) {
              let single_value = null
              let factor = null
              if (typeof dart === 'string') {
                const m = dart.match(/^(D|T|d|t)?(\d{1,2})$/)
                if (m) {
                  const [, prefix, number] = m
                  single_value = Number(number)
                  if (prefix === 'D' || prefix === 'd') factor = 2
                  else if (prefix === 'T' || prefix === 't') factor = 3
                  else factor = 1
                }
              } else if (dart && typeof dart === 'object') {
                single_value = Number(dart.single_value)
                factor = Number(dart.factor)
              }
              if (single_value !== null && factor !== null) {
                await tx`insert into Darts ${sql({ single_value, factor, visit: visitRow.id })}`
              }
            }
          } else {
            await tx`
                insert into Visits ${sql({
              player_id: visit.player_id,
              leg_id: leg.id,
              value: visit.value,
            })}
              `
          }
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

app.get('/api/player-averages/month', async (req, res) => {
  try {
    const averages = await sql`
      select
        p.name as player_name,
        avg(v.value) as average_value
      from Visits v
      join Players p on p.id = v.player_id
      where date_trunc('month', v.created_at) = date_trunc('month', now())
      group by p.name
      order by average_value desc
    `

    res.json(averages)
  } catch (error) {
    console.error('GET /api/player-averages/month error:', error)
    res.status(500).json({ error: 'Unable to fetch monthly averages' })
  }
})

app.get('/api/legs/month', async (req, res) => {
  try {
    const legs = await sql`
      select l.*, p1.name as player_one_name, p2.name as player_two_name
      from Legs l
      join Players p1 on p1.id = l.player_one
      join Players p2 on p2.id = l.player_two
      where date_trunc('month', l.created_at) = date_trunc('month', now())
      order by l.created_at desc
    `

    res.json(legs)
  } catch (error) {
    console.error('GET /api/legs/month error:', error)
    res.status(500).json({ error: 'Unable to fetch monthly legs' })
  }
})

// Trainings: store training sessions per player
app.post('/api/trainings', async (req, res) => {
  try {
    const trainingData = req.body
    // accept either a single training or an array
    if (Array.isArray(trainingData)) {
      const inserted = await sql.begin(async (tx) => {
        const results = []
        for (const t of trainingData) {
          const [row] = await tx`
            insert into Trainings ${sql({ player: t.player_id, rounds: t.rounds, start_value: t.start_value })}
            returning *
          `
          results.push(row)
        }
        return results
      })
      res.status(201).json(inserted)
      return
    }

    const inserted = await sql`
      insert into Trainings ${sql({ player: trainingData.player_id, rounds: trainingData.rounds, start_value: trainingData.start_value })}
      returning *
    `

    res.status(201).json(inserted[0])
  } catch (error) {
    console.error('POST /api/trainings error:', error)
    res.status(500).json({ error: 'Unable to insert trainings' })
  }
})

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`)
})
