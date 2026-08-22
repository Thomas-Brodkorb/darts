import { formatDate } from './common.js'

const legsWinnersMonthOutput = document.getElementById('legsWinnersMonth')
const legsWinnersAllOutput = document.getElementById('legsWinnersAll')
const legsDetailsOutput = document.getElementById('legsDetails')
const showAllTimesLegsToggle = document.getElementById('showAllTimesLegs')
const averagesMonthOutput = document.getElementById('averagesMonth')
const averagesAllOutput = document.getElementById('averagesAll')
const refreshLegsButton = document.getElementById('refreshLegs')
const refreshAveragesButton = document.getElementById('refreshAverages')
const showAllTimesTrainingsToggle = document.getElementById('showAllTimesTrainings')
const refreshTrainingsButton = document.getElementById('refreshTrainings')
const trainingsDetailsOutput = document.getElementById('trainingsDetails')

function populateLegSelect(legs) {
  const legSelect = document.getElementById('leg')
  if (!legSelect) return
  legSelect.innerHTML = '<option value="">(No leg)</option>'
  legs.forEach((l) => {
    const option = document.createElement('option')
    option.value = l.id
    option.textContent = `#${l.id}: ${l.player_one_name} vs ${l.player_two_name} (${l.rounds} rounds)`
    legSelect.appendChild(option)
  })
}


function renderAveragesInto(container, averages) {
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

class PlayerScore {
  #id;
  #name;
  #breaks = 0;
  #straits = 0;
  constructor(id,name) {
    this.#id = id;
    this.#name = name;
  }
  get id() {
    return this.#id;
  }
  get name() {
    return this.#name;
  }
  get total() {
    return this.#breaks + this.#straits;
  }
  get breaks() {
    return this.#breaks;
  }
  get straits() {
    return this.#straits;
  }
  
  breaksPlusOne() {
    this.#breaks++;
  }

  straitsPlusOne() {
    this.#straits++;
  }

}

/* 
  playerScores: an array of PlayerScore objects
    the functions searches for PlayerScore 
  id: to be searched in the array
  returns
    undefined if the id was not found
    an object of type PlayerScore with the given id
*/
function findPlayer(playerScores,id) {
  if (!Array.isArray(playerScores)) 
    return undefined;

  for (let i=0;i<playerScores.length;i++) {
    if (playerScores[i].id === id)
      return playerScores[i];
  }
  
  return undefined;
}

function comparePlayers(playerScoreA,playerScoreB) {
  return playerScoreB.total - playerScoreA.total;
}

function renderWinnersInto(container, legs) {
  if (!Array.isArray(legs)) {
    container.textContent = JSON.stringify(legs, null, 2)
    return
  }

  let playerScores = [];
  legs.forEach((leg) => {
    let id = leg.break ? leg.player_two : leg.player_one;
    let name = leg.break ? leg.player_two_name : leg.player_one_name;
    let playerScore = findPlayer(playerScores, id);
    if (!playerScore) {
      playerScore = new PlayerScore(id, name);
      playerScores.push(playerScore);
    }
    if (leg.break) playerScore.breaksPlusOne();
    else playerScore.straitsPlusOne();
  })

  playerScores.sort(comparePlayers);
  const winnerTable = document.createElement('table');
  winnerTable.classList.add('players-table');
  const winnerHeaderRow = document.createElement('tr');
  ['id', 'Player', 'Total', 'Breaks'].forEach((key) => {
    const th = document.createElement('th')
    th.textContent = key
    winnerHeaderRow.appendChild(th)
  })
  winnerTable.appendChild(winnerHeaderRow);

  playerScores.forEach(playerScore => {
    const winnerRow = document.createElement('tr');
    const values = [playerScore.id, playerScore.name, playerScore.total, playerScore.breaks]
    values.forEach((value) => {
      const td = document.createElement('td')
      td.textContent = value
      winnerRow.appendChild(td)
    })
    winnerTable.appendChild(winnerRow);
  });

  

  container.innerHTML = '';
  container.appendChild(winnerTable);
}

function renderLegsTableInto(container, legs) {
  if (!Array.isArray(legs)) {
    container.textContent = JSON.stringify(legs, null, 2)
    return
  }
  if (legs.length === 0) {
    container.textContent = 'No legs found.'
    return
  }

  const table = document.createElement('table');
  table.classList.add('legs-table');
  const headerRow = document.createElement('tr');
  ['id', 'Player', 'Player', 'Start Value', 'Rounds', 'break', 'Played @'].forEach((key) => {
    const th = document.createElement('th')
    th.textContent = key
    headerRow.appendChild(th)
  })
  table.appendChild(headerRow)

  legs.forEach((leg) => {
    const row = document.createElement('tr')
    const values = [
      leg.id,
      leg.player_one_name,
      leg.player_two_name,
      leg.start_value,
      leg.rounds,
      String(leg.break),
      formatDate(leg.created_at),
    ]

    let greenColumn = leg.break ? 3 : 2;
    let column = 1;
    values.forEach((value) => {
      const td = document.createElement('td')
      td.textContent = value
      if (column === greenColumn) td.classList.add('winner')
      if (column === 4 || column === 5) td.classList.add('align-right')
      column++
      row.appendChild(td)
    })

    table.appendChild(row)
  })

  let detailsHeader = document.createElement('h2');
  detailsHeader.textContent = 'Details';

  container.innerHTML = '';
  container.appendChild(detailsHeader);
  container.appendChild(table);
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

function renderTrainingsTableInto(container, trainings) {
  if (!Array.isArray(trainings)) {
    container.textContent = JSON.stringify(trainings, null, 2)
    return
  }
  if (trainings.length === 0) {
    container.textContent = 'No trainings found.'
    return
  }

  const table = document.createElement('table');
  table.classList.add('legs-table');
  const headerRow = document.createElement('tr');
  ['id', 'Player', 'Start Value', 'Rounds', 'Player @'].forEach((key) => {
    const th = document.createElement('th')
    th.textContent = key
    headerRow.appendChild(th)
  })
  table.appendChild(headerRow)

  trainings.forEach((t) => {
    const row = document.createElement('tr')
    const values = [
      t.id,
      t.player_name || t.player || '',
      t.start_value,
      t.rounds,
      formatDate(t.created_at),
    ]

    let column = 1;
    values.forEach((value) => {
      const td = document.createElement('td')
      td.textContent = value
      if (column === 3 || column === 4) td.classList.add('align-right')
      column++
      row.appendChild(td)
    })

    table.appendChild(row)
  })

  let detailsHeader = document.createElement('h2');
  detailsHeader.textContent = 'Details';

  container.innerHTML = '';
  container.appendChild(detailsHeader);
  container.appendChild(table);
}

async function loadLegs() {
  try {
    const [allRes, monthRes] = await Promise.all([
      fetch('/api/legs'),
      fetch('/api/legs/month')
    ])
    const [allData, monthData] = await Promise.all([allRes.json(), monthRes.json()])
    populateLegSelect(allData)
    // render winners in left/right containers
    renderWinnersInto(legsWinnersMonthOutput, monthData)
    renderWinnersInto(legsWinnersAllOutput, allData)

    // render the details table; default shows month legs, can toggle to all-time
    function updateDetails() {
      if (showAllTimesLegsToggle && showAllTimesLegsToggle.checked) {
        renderLegsTableInto(legsDetailsOutput, allData)
      } else {
        renderLegsTableInto(legsDetailsOutput, monthData)
      }
    }

    if (showAllTimesLegsToggle) {
      showAllTimesLegsToggle.addEventListener('change', updateDetails)
    }
    updateDetails()
  } catch (error) {
    console.warn('Error fetching legs:', error)
  }
}

async function loadAverages() {
  try {
    const [allRes, monthRes] = await Promise.all([
      fetch('/api/player-averages'),
      fetch('/api/player-averages/month')
    ])
    const [allData, monthData] = await Promise.all([allRes.json(), monthRes.json()])
    renderAveragesInto(averagesAllOutput, allData)
    renderAveragesInto(averagesMonthOutput, monthData)
  } catch (error) {
    averagesAllOutput.textContent = `Error fetching averages: ${error}`
    averagesMonthOutput.textContent = `Error fetching averages: ${error}`
  }
}

refreshLegsButton.addEventListener('click', () => loadLegs())
refreshAveragesButton.addEventListener('click', () => loadAverages())
refreshTrainingsButton && refreshTrainingsButton.addEventListener('click', () => loadTrainings())

async function loadTrainings() {
  try {
    const [allRes, monthRes] = await Promise.all([
      fetch('/api/trainings'),
      fetch('/api/trainings/month')
    ])
    const [allData, monthData] = await Promise.all([allRes.json(), monthRes.json()])

    function updateDetails() {
      if (showAllTimesTrainingsToggle && showAllTimesTrainingsToggle.checked) {
        renderTrainingsTableInto(trainingsDetailsOutput, allData)
      } else {
        renderTrainingsTableInto(trainingsDetailsOutput, monthData)
      }
    }

    if (showAllTimesTrainingsToggle) {
      showAllTimesTrainingsToggle.addEventListener('change', updateDetails)
    }
    updateDetails()
  } catch (error) {
    console.warn('Error fetching trainings:', error)
  }
}

Promise.all([loadAverages(), loadLegs(), loadTrainings()]).catch((error) => {
  console.warn('Error loading initial data:', error)
})
