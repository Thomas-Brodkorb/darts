import { fetchPlayers } from './common.js'

const player1Select = document.getElementById('player1')
const player2Select = document.getElementById('player2')
const startValueSelect = document.getElementById('startValue')
const newLegButton = document.getElementById('newLeg')
const legTable = document.getElementById('legTable')
const legBody = document.getElementById('legBody')
const nextRoundButton = document.getElementById('nextRound')
const saveLegButton = document.getElementById('saveLeg')
const player1Header = document.getElementById('player1Header')
const player2Header = document.getElementById('player2Header')

let currentLeg = null

function setPlayers(players) {
  player1Select.innerHTML = '<option value="">(Select player)</option>'
  player2Select.innerHTML = '<option value="">(Select player)</option>'

  players.forEach((player) => {
    const opt1 = document.createElement('option')
    opt1.value = player.id
    opt1.textContent = player.name
    player1Select.appendChild(opt1)

    const opt2 = document.createElement('option')
    opt2.value = player.id
    opt2.textContent = player.name
    player2Select.appendChild(opt2)
  })
}

function createInputRow() {
  const row = document.createElement('tr')

  // Player 1 darts
  for (let i = 0; i < 3; i += 1) {
    const td = document.createElement('td')
    const input = document.createElement('input')
    input.type = 'number'
    input.min = '0'
    input.classList.add('align-right')
    input.style.width = '80%'
    td.appendChild(input)
    row.appendChild(td)
  }

  // Left column (computed)
  const left1 = document.createElement('td')
  left1.classList.add('align-right')
  row.appendChild(left1)

  // Player 2 darts
  for (let i = 0; i < 3; i += 1) {
    const td = document.createElement('td')
    const input = document.createElement('input')
    input.type = 'number'
    input.min = '0'
    input.classList.add('align-right')
    input.style.width = '80%'
    td.appendChild(input)
    row.appendChild(td)
  }

  // Left column (computed)
  const left2 = document.createElement('td')
  left2.classList.add('align-right')
  row.appendChild(left2)

  // Update during typing
  const inputs = row.querySelectorAll('input')
  inputs.forEach((input) => {
    input.addEventListener('input', () => {
      updateInputRowLefts(row)
    })
  })

  return row
}

function updateInputRowLefts(row) {
  if (!currentLeg) return

  const inputs = Array.from(row.querySelectorAll('input'))
  const [d1, d2, d3, d4, d5, d6] = inputs.map((input) => {
    const val = input.value.trim()
    return val === '' ? 0 : Number(val)
  })

  const [left1, left2] = currentLeg.left
  const leftCell1 = row.children[3]
  const leftCell2 = row.children[7]

  leftCell1.textContent = left1 - (d1 + d2 + d3)
  leftCell2.textContent = left2 - (d4 + d5 + d6)
}

function createDisplayRow(values) {
  const row = document.createElement('tr')
  values.forEach((value) => {
    const td = document.createElement('td')
    td.classList.add('align-right')
    td.textContent = value
    row.appendChild(td)
  })
  return row
}

function resetLeg() {
  currentLeg = null
  player1Select.disabled = false
  player2Select.disabled = false
  startValueSelect.disabled = false
  newLegButton.textContent = 'New leg'


  // switch players
  const tempPlayerValue = player1Select.value
  player1Select.value = player2Select.value
  player2Select.value = tempPlayerValue

  legTable.hidden = true
  nextRoundButton.hidden = true
  saveLegButton.hidden = true
  legBody.innerHTML = ''

  player1Header.textContent = 'Player 1'
  player2Header.textContent = 'Player 2'
}

function startLeg(player1, player2, startValue) {
  currentLeg = {
    player1,
    player2,
    startValue,
    left: [startValue, startValue],
    rounds: 0,
    roundsData: [],
    isBreak: false,
  }

  player1Select.disabled = true
  player2Select.disabled = true
  startValueSelect.disabled = true
  newLegButton.textContent = 'Reset leg'

  player1Header.textContent = player1.name
  player2Header.textContent = player2.name

  legTable.hidden = false
  nextRoundButton.hidden = false
  nextRoundButton.disabled=false
  saveLegButton.hidden = true

  legBody.innerHTML = ''
  const inputRow = createInputRow()
  legBody.appendChild(inputRow)

  // Set initial left values (start value) for the live input row
  updateInputRowLefts(inputRow)
  focusFirstInput(inputRow)
}

function focusFirstInput(row) {
  const firstInput = row.querySelector('input')
      if (firstInput) firstInput.focus()
}

function getCurrentInputValues() {
  const inputs = Array.from(legBody.querySelectorAll('input'))
  return inputs.map((input) => input.value.trim())
}

function clearInputs({ focusFirst = true } = {}) {
  legBody.querySelectorAll('input').forEach((input) => {
    input.value = ''
  })

  // Update live left values after clearing
  const inputRow = legBody.querySelector('tr:last-child')
  if (inputRow) {
    updateInputRowLefts(inputRow)
    if (focusFirst) {
      focusFirstInput(inputRow)
    }
  }
}

newLegButton.addEventListener('click', async () => {
  if (currentLeg) {
    resetLeg()
    return
  }

  const player1Id = player1Select.value
  const player2Id = player2Select.value
  const startValue = Number(startValueSelect.value)

  if (!player1Id || !player2Id || !startValue) {
    alert('Please select two players and a start value.')
    return
  }

  if (player1Id === player2Id) {
    alert('Please select two different players.')
    return
  }

  const players = await fetchPlayers()
  const player1 = players.find((p) => String(p.id) === player1Id)
  const player2 = players.find((p) => String(p.id) === player2Id)

  if (!player1 || !player2) {
    alert('Selected players could not be found. Please refresh the page.')
    return
  }

  startLeg(player1, player2, startValue)
})

nextRoundButton.addEventListener('click', () => {
  if (!currentLeg) return

  const values = getCurrentInputValues()

  // Validate all fields have values
  if (values.some((v) => v === '')) {
    alert('Please fill in all dart values before proceeding to the next round.')
    return
  }

  const numericValues = values.map((v) => Number(v))
  if (numericValues.some((v) => Number.isNaN(v))) {
    alert('Please enter valid numbers for all dart values.')
    return
  }

  const [d1, d2, d3, d4, d5, d6] = numericValues

  const [left1, left2] = currentLeg.left
  const newLeft1 = left1 - (d1 + d2 + d3)
  const newLeft2 = left2 - (d4 + d5 + d6)

  // Prevent going negative
  currentLeg.left = [newLeft1<0 ? left1 : newLeft1, newLeft2<0 ? left2 : newLeft2]

  const displayRow = createDisplayRow([
    d1,
    d2,
    d3,
    newLeft1,
    d4,
    d5,
    d6,
    newLeft2,
  ])

  // Insert display row above the input row
  legBody.insertBefore(displayRow, legBody.lastElementChild)

  // Track completed rounds and record visit values
  currentLeg.roundsData.push({
    player_one_values: [d1, d2, d3],
    player_two_values: [d4, d5, d6],
  })
  currentLeg.rounds = currentLeg.roundsData.length

  const isWinner = newLeft1 === 0 || newLeft2 === 0
  clearInputs({ focusFirst: !isWinner })

  // If someone just finished the leg, show winner and offer save
  if (isWinner) {
    currentLeg.isBreak = newLeft2 === 0

    // Remove the now-unused input row
    const inputRow = legBody.querySelector('tr:last-child')
    if (inputRow) inputRow.remove()

    nextRoundButton.disabled = true
    saveLegButton.hidden = false

    const winnerName = newLeft1 === 0 ? currentLeg.player1.name : currentLeg.player2.name
    const winnerRow = document.createElement('tr')
    const td = document.createElement('td')
    td.setAttribute('colspan', '8')
    td.textContent = `Winner: ${winnerName}`
    td.style.fontWeight = 'bold'
    td.style.textAlign = 'center'
    winnerRow.appendChild(td)
    legBody.appendChild(winnerRow)

    // Focus the save button (no more input needed)
    saveLegButton.focus()
  }
})

// Save leg button behavior
saveLegButton.addEventListener('click', async () => {
  if (!currentLeg) return

  const payload = {
    player_one: currentLeg.player1.id,
    player_two: currentLeg.player2.id,
    "break": currentLeg.isBreak,
    start_value: currentLeg.startValue,
    rounds: currentLeg.rounds,
    visits: [],
  }

  // create one visit per player per round
  currentLeg.roundsData.forEach(({ player_one_values, player_two_values }) => {
    const playerOneSum = player_one_values.reduce((sum, v) => sum + v, 0)
    const playerTwoSum = player_two_values.reduce((sum, v) => sum + v, 0)

    payload.visits.push({ player_id: currentLeg.player1.id, value: playerOneSum })
    payload.visits.push({ player_id: currentLeg.player2.id, value: playerTwoSum })
  })

  try {
    const res = await fetch('/api/legs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || res.statusText)
    }

    alert('Leg saved! You can now start a new leg.')
    resetLeg()
  } catch (error) {
    alert(`Unable to save leg: ${error.message}`)
  }
})

// Initial setup
;(async () => {
  const players = await fetchPlayers()
  setPlayers(players)
})()
