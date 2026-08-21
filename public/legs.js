import { fetchPlayers, createPlayerTable, createLiveVisitRow, updateLiveRowLeft, addLeftColumn } from './common.js'
import { Dart } from './dart.js';
import { Visit } from './visit.js';

const player1Select = document.getElementById('player1')
const player2Select = document.getElementById('player2')
const startValueSelect = document.getElementById('startValue')
const newLegButton = document.getElementById('newLeg')
const legTable = document.getElementById('legTable')
const visitDivs = [document.getElementById('divPlayer1'), document.getElementById('divPlayer2')];
const nextRoundButton = document.getElementById('nextRound')
const saveLegButton = document.getElementById('saveLeg')
const errorMessage = document.getElementById('errorMessage');
const goodMessage = null; // document.getElementById('goodMessage');


let currentLeg = null
let allPlayers = []

function setPlayers(players) {
  allPlayers = players
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

function updatePlayerOptions() {
  const player1Selected = player1Select.value
  const player2Selected = player2Select.value

  allPlayers.forEach((player) => {
    const player1Option = player1Select.querySelector(`option[value="${player.id}"]`)
    const player2Option = player2Select.querySelector(`option[value="${player.id}"]`)

    if (player1Option) {
      player1Option.hidden = player2Selected === String(player.id)
    }
    if (player2Option) {
      player2Option.hidden = player1Selected === String(player.id)
    }
  })
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
  newLegButton.textContent = 'New leg';
  newLegButton.focus();


  // switch players
  const tempPlayerValue = player1Select.value
  player1Select.value = player2Select.value
  player2Select.value = tempPlayerValue

  legTable.hidden = true
  nextRoundButton.hidden = true
  saveLegButton.hidden = true
  visitDivs.forEach((div) => {
    div.innerHTML = ''
  })
  legTable.querySelectorAll('tr').forEach((row) => {
    if (row !== legTable.querySelector('tr:first-child')) {
      row.remove()
    }
  })

}

function startLeg(player1, player2, startValue) {
  currentLeg = {
    startValue,
    players: [{
      player: player1,
      left: startValue,
      roundsData: [],
      isFinished: false,
      table: null,
      tbody: null,
      liveRow: null,
    }, {
      player: player2,
      left: startValue,
      roundsData: [],
      isFinished: false,
      table: null,
      tbody: null,
      liveRow: null,
    }],
    isBreak: false,
    rounds: 0
  }


  player1Select.disabled = true
  player2Select.disabled = true
  startValueSelect.disabled = true
  newLegButton.textContent = 'Reset leg'

  visitDivs.forEach((div, index) => {
    const player = currentLeg.players[index]
    div.appendChild(createPlayerTable(player));
    div.style.verticalAlign = 'top';
  });

  nextRoundButton.hidden = false;
  nextRoundButton.disabled = false;
  saveLegButton.hidden = true;
  legTable.hidden = false;


  currentLeg.players.forEach((trainingPlayer) => {
    trainingPlayer.liveRow = createLiveVisitRow(trainingPlayer, errorMessage, goodMessage);
    trainingPlayer.tbody.appendChild(trainingPlayer.liveRow);
    updateLiveRowLeft(trainingPlayer)
  })




  // Set initial left values (start value) for the live input row
  setInputFocusHandling();
  focusFirstActiveInput();
}

function setInputFocusHandling() {
  const inputs = Array.from(legTable.querySelectorAll('tr.live-row input:not(:disabled)'))
  inputs.forEach((input, index) => {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        const nextInput = getNextLiveInput(input)
        if (nextInput) {
          nextInput.focus()
        } else {
          nextRoundButton.focus()
        }
      }
    })
  })
}

function getNextLiveInput(currentInput) {
  const inputs = Array.from(legTable.querySelectorAll('tr.live-row input:not(:disabled)'))
  const currentIndex = inputs.indexOf(currentInput)
  if (currentIndex === -1 || currentIndex === inputs.length - 1) {
    return null
  }
  return inputs[currentIndex + 1]
}

function focusFirstActiveInput() {
  const activeInput = legTable.querySelector('tr.live-row input:not(:disabled)')
  if (activeInput) {
    activeInput.focus()
  } else {
    nextRoundButton.focus()
  }
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
      focusFirstActiveInput()
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

nextRoundButton.addEventListener('click', startNextRound);

function startNextRound() {
  if (!currentLeg) return;
  // Check if one player has finished the leg. 
  if (currentLeg.players.some(player => player.currentVisit && player.left === player.currentVisit.totalScore)) {
    console.log('One player has already finished the leg. Don\'t check for missing values, );');

  } else {

    // Ensure all players entered all their dart values before proceeding to the next round
    const hasMissingValue = currentLeg.players.some((player) => {
      return !player.currentVisit || !player.currentVisit.isComplete;
    });

    if (hasMissingValue) {
      alert('Please fill in all dart values before proceeding to the next round.')
      return
    }
  }

  let playerFinished = null;
  currentLeg.players.forEach((player) => {
    if (player.currentVisit) {
      const newLeft = player.left - player.currentVisit.totalScore;
      const finalLeft = newLeft < 0 ? player.left : newLeft;

      const displayRow = player.currentVisit.createDisplayRow();

      addLeftColumn(displayRow, finalLeft);
      player.tbody.insertBefore(displayRow, player.liveRow);
      player.left = finalLeft;

      player.roundsData.push({
        visit: player.currentVisit
      })

      if (finalLeft === 0) {
        player.isFinished = true;
        if (!playerFinished) {
          playerFinished = player;
        }
      }
    }

    player.liveRow.remove(); // Remove the old live row
    player.liveRow = createLiveVisitRow(player, errorMessage, goodMessage); // Recreate the live row for the next round
    player.currentVisit = null; // Reset current visit for the next round
    player.tbody.appendChild(player.liveRow); // Append the new live row

  })
  currentLeg.rounds += 1
  if (playerFinished) {
    if (playerFinished === currentLeg.players[1])
      currentLeg.isBreak = true;

    // remove the live rows for both players since the leg is finished
    currentLeg.players.forEach((player) => {
      if (player.liveRow) {
        player.liveRow.remove();
        player.liveRow = null;
      }
    });


    nextRoundButton.disabled = true
    saveLegButton.hidden = false

    const winnerName = playerFinished.player.name;
    const winnerRow = document.createElement('tr')
    const td = document.createElement('td')
    td.setAttribute('colspan', '2')
    td.textContent = `Winner: ${winnerName}`
    td.style.fontWeight = 'bold'
    td.style.textAlign = 'center'
    winnerRow.appendChild(td)
    legTable.appendChild(winnerRow)

    // Focus the save button (no more input needed)
    saveLegButton.focus()
  } else {
    // Focus the first active input for the next round
    setInputFocusHandling();
    focusFirstActiveInput();
  }
}




// Save leg button behavior
saveLegButton.addEventListener('click', async () => {
  if (!currentLeg) return

  const payload = {
    player_one: currentLeg.players[0].player.id,
    player_two: currentLeg.players[1].player.id,
    "break": currentLeg.isBreak,
    start_value: currentLeg.startValue,
    rounds: currentLeg.rounds,
    visits: [],
  }

  // create one visit per player per round
  currentLeg.players.forEach((trainingPlayer) => {
    trainingPlayer.roundsData.forEach((roundData) => {
      payload.visits.push({
        player_id: trainingPlayer.player.id,
        darts: roundData.visit.darts.map(d => d ? d.toString() : null).filter(x => x !== null)
      })
    })
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
  ; (async () => {
    const players = await fetchPlayers()
    setPlayers(players)

    player1Select.addEventListener('change', updatePlayerOptions)
    player2Select.addEventListener('change', updatePlayerOptions)
  })()
