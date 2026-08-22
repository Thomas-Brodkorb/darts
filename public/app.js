const output = document.getElementById('output')
const visitsOutput = document.getElementById('visitsOutput')
const averagesOutput = document.getElementById('averagesOutput')
const refreshButton = document.getElementById('refresh')
const refreshVisitsButton = document.getElementById('refreshVisits')
const refreshAveragesButton = document.getElementById('refreshAverages')
const refreshLegsButton = document.getElementById('refreshLegs')
const legsWinnersMonthOutput = document.getElementById('legsWinnersMonth')
const legsWinnersAllOutput = document.getElementById('legsWinnersAll')
const averagesMonthOutput = document.getElementById('averagesMonth')
const averagesAllOutput = document.getElementById('averagesAll')
const form = document.getElementById('playerForm')
const visitForm = document.getElementById('visitForm')
const playerSelect = document.getElementById('player')

function renderPlayers(players) {
  if (!Array.isArray(players)) {
    output.textContent = JSON.stringify(players, null, 2)
    return
  }

  // Populate the player select dropdown (used for creating visits)
  populatePlayerSelect(players)

  // Render as a table
  if (players.length === 0) {
    output.textContent = 'No players found.'
    return
  }

  const table = document.createElement('table')
  table.classList.add('players-table')
  const headerRow = document.createElement('tr')

  createPlayerHeaderRow(headerRow)
  table.appendChild(headerRow)

  players.forEach((player) => {
    const row = document.createElement('tr')
    let col = 0;
    Object.values(player).forEach((value) => {
      const td = document.createElement('td');
      td.textContent = value;
      if (col === 3) { // Assuming 'score' is the 4th column (index 3)
        td.classList.add('align-right')
      }
      row.appendChild(td);
      col++
    })
    table.appendChild(row)
  })

  output.innerHTML = ''
  output.appendChild(table)
}

function populatePlayerSelect(players) {
  if (!playerSelect) return
  playerSelect.innerHTML = '<option value="">(Choose a player)</option>'
  players.forEach((p) => {
    const option = document.createElement('option')
    option.value = p.id
    option.textContent = p.name
    playerSelect.appendChild(option)
  })
}

function renderVisits(visits) {
  if (!Array.isArray(visits)) {
    visitsOutput.textContent = JSON.stringify(visits, null, 2)
    return
  }

  if (visits.length === 0) {
    visitsOutput.textContent = 'No visits found.'
    return
  }

  const table = document.createElement('table')
  table.classList.add('players-table')
  const headerRow = document.createElement('tr')
  createVisitHeaderRow(headerRow)
  table.appendChild(headerRow)

  visits.forEach((visit) => {
    const row = document.createElement('tr');
    const values = [visit.id, visit.player_name, visit.value, visit.created_at];
    let col = 0;
    values.forEach((value) => {
      const td = document.createElement('td')
      td.textContent = value
      if (col === 2) { // Assuming 'value' is the 3rd column (index 2)
        td.classList.add('align-right');
      }
      row.appendChild(td);
      col++;
    })
    table.appendChild(row)
  })

  visitsOutput.innerHTML = ''
  visitsOutput.appendChild(table)
}

function renderAverages(averages, container = averagesOutput) {
  if (!container) return
  if (!Array.isArray(averages)) {
    container.textContent = JSON.stringify(averages, null, 2)
    return
  }

  if (averages.length === 0) {
    container.textContent = 'No averages found.'
    return
  }

  const table = document.createElement('table')
  table.classList.add('players-table')
  const headerRow = document.createElement('tr')
  createAverageHeaderRow(headerRow)
  table.appendChild(headerRow)

  averages.forEach((avg) => {
    const row = document.createElement('tr')

    const nameTd = document.createElement('td')
    nameTd.textContent = avg.player_name
    row.appendChild(nameTd)

    const avgTd = document.createElement('td')
    avgTd.textContent = Number(avg.average_value).toFixed(2)
    avgTd.classList.add('align-right')
    row.appendChild(avgTd)

    table.appendChild(row)
  })

  container.innerHTML = ''
  container.appendChild(table)
}

function createPlayerHeaderRow(headerRow) {
  ['id', 'name', 'email', 'score', 'created_at'].forEach((key) => {
    const th = document.createElement('th')
    th.textContent = key
    headerRow.appendChild(th)
  })
  return headerRow
}

function createVisitHeaderRow(headerRow) {
  ['id', 'player_name', 'value', 'created_at'].forEach((key) => {
    const th = document.createElement('th')
    th.textContent = key
    headerRow.appendChild(th)
  })
  return headerRow
}

function createAverageHeaderRow(headerRow) {
  const headers = ['Player Name', 'Average visit']
  headers.forEach((text) => {
    const th = document.createElement('th')
    th.textContent = text
    headerRow.appendChild(th)
  })
  return headerRow
}

async function loadPlayers() {
  try {
    const res = await fetch('/api/players')
    const data = await res.json()
    renderPlayers(data)
  } catch (error) {
    output.textContent = `Error fetching players: ${error}`
  }
}

async function loadVisits() {
  try {
    const res = await fetch('/api/visits')
    const data = await res.json()
    renderVisits(data)
  } catch (error) {
    visitsOutput.textContent = `Error fetching visits: ${error}`
  }
}

async function loadAverages() {
  try {
    const res = await fetch('/api/player-averages')
    const data = await res.json()
    renderAverages(data)
  } catch (error) {
    averagesOutput.textContent = `Error fetching averages: ${error}`
  }
}

async function loadStatsAverages() {
  try {
    const [allResponse, monthResponse] = await Promise.all([
      fetch('/api/player-averages'),
      fetch('/api/player-averages/month')
    ])
    if (!allResponse.ok || !monthResponse.ok) throw new Error('Unable to load averages')

    const [allAverages, monthAverages] = await Promise.all([
      allResponse.json(),
      monthResponse.json()
    ])
    renderAverages(allAverages, averagesAllOutput)
    renderAverages(monthAverages, averagesMonthOutput)
  } catch (error) {
    if (averagesAllOutput) averagesAllOutput.textContent = `Error loading averages: ${error.message}`
    if (averagesMonthOutput) averagesMonthOutput.textContent = `Error loading averages: ${error.message}`
  }
}

function renderWinners(container, legs) {
  if (!container) return

  const scores = new Map()
  legs.forEach((leg) => {
    const playerId = leg.break ? leg.player_two : leg.player_one
    const playerName = leg.break ? leg.player_two_name : leg.player_one_name
    const score = scores.get(playerId) || { id: playerId, name: playerName, total: 0, breaks: 0 }
    score.total += 1
    if (leg.break) score.breaks += 1
    scores.set(playerId, score)
  })

  const table = document.createElement('table')
  table.classList.add('players-table')
  const headerRow = document.createElement('tr')
  ;['id', 'Player', 'Total', 'Breaks'].forEach((label) => {
    const th = document.createElement('th')
    th.textContent = label
    headerRow.appendChild(th)
  })
  table.appendChild(headerRow)

  Array.from(scores.values())
    .sort((a, b) => b.total - a.total)
    .forEach((score) => {
      const row = document.createElement('tr')
      ;[score.id, score.name, score.total, score.breaks].forEach((value) => {
        const cell = document.createElement('td')
        cell.textContent = value
        row.appendChild(cell)
      })
      table.appendChild(row)
    })

  container.innerHTML = ''
  container.appendChild(table)
}

async function loadStatsWinners() {
  try {
    const [allResponse, monthResponse] = await Promise.all([
      fetch('/api/legs'),
      fetch('/api/legs/month')
    ])
    if (!allResponse.ok || !monthResponse.ok) throw new Error('Unable to load leg winners')

    const [allLegs, monthLegs] = await Promise.all([
      allResponse.json(),
      monthResponse.json()
    ])
    renderWinners(legsWinnersAllOutput, allLegs)
    renderWinners(legsWinnersMonthOutput, monthLegs)
  } catch (error) {
    if (legsWinnersAllOutput) legsWinnersAllOutput.textContent = `Error loading winners: ${error.message}`
    if (legsWinnersMonthOutput) legsWinnersMonthOutput.textContent = `Error loading winners: ${error.message}`
  }
}

async function addPlayer(player) {
  const res = await fetch('/api/players', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(player),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || res.statusText)
  }

  return res.json()
}

async function addVisit(visit) {
  const res = await fetch('/api/visits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(visit),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || res.statusText)
  }

  return res.json()
}

if (form) form.addEventListener('submit', async (event) => {
  event.preventDefault()

  const formData = new FormData(form)
  const player = {
    name: formData.get('name'),
    email: formData.get('email'),
    score: Number(formData.get('score')),
  }

  try {
    const newPlayer = await addPlayer(player)
    output.textContent = `Inserted:
${JSON.stringify(newPlayer, null, 2)}`
    form.reset()
    await loadPlayers()
  } catch (error) {
    output.textContent = `Error inserting player: ${error.message}`
  }
})

if (visitForm) visitForm.addEventListener('submit', async (event) => {
  event.preventDefault()

  const formData = new FormData(visitForm)
  const playerId = Number(formData.get('player'))
  const dart1 = Number(formData.get('dart1'))
  const dart2 = Number(formData.get('dart2'))
  const dart3 = Number(formData.get('dart3'))
  const value = dart1 + dart2 + dart3

  const visit = {
    player_id: playerId,
    value,
  }

  try {
    const newVisit = await addVisit(visit)
    visitsOutput.textContent = `Inserted:
${JSON.stringify(newVisit, null, 2)}`
    visitForm.reset()
    await loadVisits()
  } catch (error) {
    visitsOutput.textContent = `Error inserting visit: ${error.message}`
  }
})

if (refreshButton) refreshButton.addEventListener('click', () => {
  loadPlayers()
})

if (refreshVisitsButton) refreshVisitsButton.addEventListener('click', () => {
  loadVisits()
})

if (refreshAveragesButton) refreshAveragesButton.addEventListener('click', () => {
  if (averagesMonthOutput || averagesAllOutput) loadStatsAverages()
  else loadAverages()
})

if (refreshLegsButton) refreshLegsButton.addEventListener('click', () => {
  loadStatsWinners()
})

if (output || form) loadPlayers()
if (visitsOutput || visitForm) loadVisits()
if (averagesOutput) loadAverages()
if (averagesMonthOutput || averagesAllOutput) loadStatsAverages()
if (legsWinnersAllOutput || legsWinnersMonthOutput) loadStatsWinners()
