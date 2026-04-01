import { fetchPlayers, populatePlayerSelect, createPlayerHeaderRow ,formatDate} from './common.js'

const output = document.getElementById('output')
const refreshButton = document.getElementById('refresh')
const form = document.getElementById('playerForm')

function renderPlayers(players) {
  if (!Array.isArray(players)) {
    output.textContent = JSON.stringify(players, null, 2)
    return
  }

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
      if (col == 4) {
        td.textContent = formatDate(value);
      } else {
         td.textContent = value;
      }
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

async function loadPlayers() {
  try {
    const data = await fetchPlayers()
    renderPlayers(data)
  } catch (error) {
    output.textContent = `Error fetching players: ${error}`
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

form.addEventListener('submit', async (event) => {
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

refreshButton.addEventListener('click', () => {
  loadPlayers()
})

loadPlayers()