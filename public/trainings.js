import { fetchPlayers, populatePlayerSelect } from './common.js'

const maxPlayers = 4
const startValueSelect = document.getElementById('startValue')
const newTrainingButton = document.getElementById('newTraining')
const resetTrainingButton = document.getElementById('resetTraining')
const addPlayerButton = document.getElementById('addPlayer')
const removePlayerButton = document.getElementById('removePlayer')
const playerSections = document.getElementById('playerSections')
const trainingSection = document.getElementById('trainingSection')
const trainingTables = document.getElementById('trainingTables')
const nextRoundButton = document.getElementById('nextRound')
const saveTrainingsButton = document.getElementById('saveTrainings')

let players = []
let currentTraining = null

function createPlayerSection(index, selectedValue = '') {
  const container = document.createElement('div')
  container.className = 'player-section'
  container.dataset.index = String(index)

  const label = document.createElement('label')
  label.setAttribute('for', `player${index}`)
  label.textContent = `Player ${index}`

  const select = document.createElement('select')
  select.id = `player${index}`
  select.addEventListener('change', () => {
    updateTrainingPlayerOptions()
    updateNewTrainingButtonState()
  })

  container.appendChild(label)
  container.appendChild(select)

  playerSections.appendChild(container)
  populatePlayerSelect(select, players)
  select.value = selectedValue
}

function updateTrainingPlayerOptions() {
  const selectedPlayerIds = getSelectedPlayerIds()
  const selects = Array.from(playerSections.querySelectorAll('select'))

  selects.forEach((select) => {
    players.forEach((player) => {
      const option = select.querySelector(`option[value="${player.id}"]`)
      if (option) {
        const isSelectedInOtherSelect = selectedPlayerIds.includes(String(player.id)) && select.value !== String(player.id)
        option.hidden = isSelectedInOtherSelect
      }
    })
  })
}

function refreshPlayerSelects() {
  const selectedValues = getSelectedPlayerIds()
  const sectionElements = Array.from(playerSections.querySelectorAll('select'))

  sectionElements.forEach((select, index) => {
    const currentValue = select.value
    populatePlayerSelect(select, players)
    select.value = currentValue || selectedValues[index] || ''
  })
  
  updateTrainingPlayerOptions()
}

function getSelectedPlayerIds() {
  return Array.from(playerSections.querySelectorAll('select'))
    .map((select) => select.value)
    .filter((value) => value)
}

function updatePlayerActionState() {
  const sectionCount = playerSections.children.length
  removePlayerButton.disabled = sectionCount <= 1
  addPlayerButton.disabled = sectionCount >= maxPlayers
  updateNewTrainingButtonState()
}

function updateNewTrainingButtonState() {
  if (currentTraining) {
    newTrainingButton.disabled = true
    return
  }

  const startValue = Number(startValueSelect.value)
  const selectedPlayerIds = getSelectedPlayerIds()
  const allPlayersSelected = selectedPlayerIds.length === playerSections.children.length
  const allUniquePlayers = new Set(selectedPlayerIds).size === selectedPlayerIds.length

  newTrainingButton.disabled = !(startValue && allPlayersSelected && allUniquePlayers)
}

function addPlayer() {
  if (playerSections.children.length >= maxPlayers) return
  createPlayerSection(playerSections.children.length + 1)
  refreshPlayerSelects()
  updatePlayerActionState()
}

function removePlayer() {
  if (playerSections.children.length <= 1) return
  playerSections.removeChild(playerSections.lastElementChild)
  refreshPlayerSelects()
  updatePlayerActionState()
}

function resetTraining() {
  currentTraining = null
  startValueSelect.disabled = false
  addPlayerButton.disabled = false
  removePlayerButton.disabled = playerSections.children.length <= 1
  Array.from(playerSections.querySelectorAll('select')).forEach((select) => {
    select.disabled = false
  })

  trainingSection.hidden = true
  nextRoundButton.hidden = true
  saveTrainingsButton.hidden = true
  newTrainingButton.hidden = false
  resetTrainingButton.hidden = true
  trainingTables.innerHTML = ''
  updateNewTrainingButtonState()
  newTrainingButton.focus()
}

function startTraining() {
  const startValue = Number(startValueSelect.value)
  const selectedPlayerIds = getSelectedPlayerIds()

  if (!startValue || selectedPlayerIds.length !== playerSections.children.length) {
    alert('Please select a start value and a player for every player section.')
    return
  }

  if (new Set(selectedPlayerIds).size !== selectedPlayerIds.length) {
    alert('Please select different players for each player section.')
    return
  }

  const selectedPlayers = selectedPlayerIds.map((id) => players.find((player) => String(player.id) === id))
  if (selectedPlayers.some((player) => !player)) {
    alert('Selected players could not be found. Please refresh the page.')
    return
  }

  currentTraining = {
    startValue,
    players: selectedPlayers.map((player) => ({
      player,
      left: startValue,
      roundsData: [],
      isFinished: false,
      table: null,
      tbody: null,
      liveRow: null,
    })),
    rounds: 0,
  }

  trainingSection.hidden = false
  nextRoundButton.hidden = false
  saveTrainingsButton.hidden = true
  newTrainingButton.hidden = true
  resetTrainingButton.hidden = false

  startValueSelect.disabled = true
  addPlayerButton.disabled = true
  removePlayerButton.disabled = true
  Array.from(playerSections.querySelectorAll('select')).forEach((select) => {
    select.disabled = true
  })

  trainingTables.innerHTML = ''

  currentTraining.players.forEach((trainingPlayer) => {
    const table = document.createElement('table')
    table.classList.add('legs-table')

    const thead = document.createElement('thead')
    const headerRow = document.createElement('tr')
    const headerCell = document.createElement('th')
    headerCell.setAttribute('colspan', '4')
    headerCell.textContent = trainingPlayer.player.name
    headerRow.appendChild(headerCell)
    thead.appendChild(headerRow)

    const labelRow = document.createElement('tr');
    ['Dart 1', 'Dart 2', 'Dart 3', 'Left'].forEach((text) => {
      const th = document.createElement('th')
      th.textContent = text
      labelRow.appendChild(th)
    })
    thead.appendChild(labelRow)

    const tbody = document.createElement('tbody')
    const liveRow = createLiveRow(trainingPlayer)
    tbody.appendChild(liveRow)

    table.appendChild(thead)
    table.appendChild(tbody)
    trainingTables.appendChild(table)

    trainingPlayer.table = table
    trainingPlayer.tbody = tbody
    trainingPlayer.liveRow = liveRow
    updateLiveRowLeft(trainingPlayer)
  })

  focusFirstActiveInput()
}

function createLiveRow(trainingPlayer) {
  const row = document.createElement('tr')
  row.classList.add('live-row')
  row.dataset.playerId = String(trainingPlayer.player.id)

  for (let i = 0; i < 3; i += 1) {
    const td = document.createElement('td')
    const input = document.createElement('input')
    input.type = 'number'
    input.min = '0'
    input.classList.add('align-right')
    input.style.width = '80%'
    input.addEventListener('input', () => updateLiveRowLeft(trainingPlayer))
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return
      event.preventDefault()
      if (input.value.trim() === '') return
      const nextInput = getNextLiveInput(input)
      if (nextInput) {
        nextInput.focus()
      } else {
        nextRoundButton.focus()
      }
    })
    td.appendChild(input)
    row.appendChild(td)
  }

  const leftTd = document.createElement('td')
  leftTd.classList.add('align-right')
  row.appendChild(leftTd)

  return row
}

function updateLiveRowLeft(trainingPlayer) {
  if (!trainingPlayer || !trainingPlayer.liveRow) return

  const inputs = Array.from(trainingPlayer.liveRow.querySelectorAll('input'))
  const sum = inputs.reduce((acc, input) => {
    const value = input.value.trim()
    return acc + (value === '' ? 0 : Number(value))
  }, 0)
  const leftCell = trainingPlayer.liveRow.children[3]
  leftCell.textContent = trainingPlayer.left - sum
}

function getNextLiveInput(currentInput) {
  const inputs = Array.from(trainingTables.querySelectorAll('tr.live-row input:not(:disabled)'))
  const currentIndex = inputs.indexOf(currentInput)
  if (currentIndex === -1 || currentIndex === inputs.length - 1) {
    return null
  }
  return inputs[currentIndex + 1]
}

function createDisplayRow(values) {
  const row = document.createElement('tr')
  values.forEach((value) => {
    const td = document.createElement('td')
    td.classList.add('align-right')
    td.textContent = String(value)
    row.appendChild(td)
  })
  return row
}

function clearActiveInputs() {
  currentTraining.players.forEach((trainingPlayer) => {
    if (trainingPlayer.isFinished) return
    const inputs = Array.from(trainingPlayer.liveRow.querySelectorAll('input'))
    inputs.forEach((input) => {
      input.value = ''
    })
    updateLiveRowLeft(trainingPlayer)
  })
}

function focusFirstActiveInput() {
  const activeInput = trainingTables.querySelector('tr.live-row input:not(:disabled)')
  if (activeInput) {
    activeInput.focus()
  } else {
    nextRoundButton.focus()
  }
}

function startRound() {
  if (!currentTraining) return

  const activePlayers = currentTraining.players.filter((trainingPlayer) => !trainingPlayer.isFinished)
  const hasMissingValue = activePlayers.some((trainingPlayer) =>
    Array.from(trainingPlayer.liveRow.querySelectorAll('input')).some((input) => input.value.trim() === '')
  )

  if (hasMissingValue) {
    alert('Please fill in all dart values before proceeding to the next round.')
    return
  }

  const invalidNumber = activePlayers.some((trainingPlayer) =>
    Array.from(trainingPlayer.liveRow.querySelectorAll('input')).some((input) => Number.isNaN(Number(input.value)))
  )

  if (invalidNumber) {
    alert('Please enter valid numbers for all dart values.')
    return
  }

  activePlayers.forEach((trainingPlayer) => {
    const inputs = Array.from(trainingPlayer.liveRow.querySelectorAll('input'))
    const values = inputs.map((input) => Number(input.value.trim()))
    const roundSum = values.reduce((sum, value) => sum + value, 0)

    const newLeft = trainingPlayer.left - roundSum
    const finalLeft = newLeft < 0 ? trainingPlayer.left : newLeft

    const displayRow = createDisplayRow([...values, finalLeft])
    trainingPlayer.tbody.insertBefore(displayRow, trainingPlayer.liveRow)

    trainingPlayer.roundsData.push({
      values,
      value: roundSum,
    })

    trainingPlayer.left = finalLeft

    if (finalLeft === 0) {
      trainingPlayer.isFinished = true
      trainingPlayer.liveRow.remove()
    }
  })

  currentTraining.rounds += 1

  if (currentTraining.players.every((trainingPlayer) => trainingPlayer.isFinished)) {
    nextRoundButton.hidden = true
    saveTrainingsButton.hidden = false
    saveTrainingsButton.focus()
    return
  }

  clearActiveInputs()
  focusFirstActiveInput()
}

async function saveTrainings() {
  if (!currentTraining) return

  const visits = []
  currentTraining.players.forEach((trainingPlayer) => {
    trainingPlayer.roundsData.forEach((roundData) => {
      visits.push({
        player_id: trainingPlayer.player.id,
        value: roundData.value,
      })
    })
  })

  try {
    await Promise.all(
      visits.map((visit) =>
        fetch('/api/visits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(visit),
        }).then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || res.statusText)
          }
        })
      )
    )

    alert('Training saved! You can now start a new training.')
    resetTraining()
  } catch (error) {
    alert(`Unable to save training: ${error.message}`)
  }
}

newTrainingButton.addEventListener('click', startTraining)
resetTrainingButton.addEventListener('click', resetTraining)
addPlayerButton.addEventListener('click', addPlayer)
removePlayerButton.addEventListener('click', removePlayer)
nextRoundButton.addEventListener('click', startRound)
saveTrainingsButton.addEventListener('click', saveTrainings)
startValueSelect.addEventListener('change', updateNewTrainingButtonState)

;(async () => {
  players = await fetchPlayers()
  createPlayerSection(1)
  refreshPlayerSelects()
  updatePlayerActionState()
})()
