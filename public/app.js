import { formatDate } from './common.js'

const legsOutput = document.getElementById('legsOutput')
const averagesOutput = document.getElementById('averagesOutput')
const refreshLegsButton = document.getElementById('refreshLegs')
const refreshAveragesButton = document.getElementById('refreshAverages')

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


function renderAverages(averages) {
  if (!Array.isArray(averages)) {
    averagesOutput.textContent = JSON.stringify(averages, null, 2)
    return
  }

  if (averages.length === 0) {
    averagesOutput.textContent = 'No averages found.'
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

  averagesOutput.innerHTML = ''
  averagesOutput.appendChild(table)
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

function renderLegs(legs) {
  if (!Array.isArray(legs)) {
    legsOutput.textContent = JSON.stringify(legs, null, 2)
    return
  }

  if (legs.length === 0) {
    legsOutput.textContent = 'No legs found.'
    return
  }

  let playerScores = [];

  const table = document.createElement('table');
  table.classList.add('players-table');
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
    // maintain player Scores
    let id = leg.break?leg.player_two:leg.player_one;
    let name = leg.break?leg.player_two_name:leg.player_one_name;
    let playerScore = findPlayer(playerScores,id);
    if (!playerScore) {
      playerScore = new PlayerScore(id,name);
      playerScores.push(playerScore);
    }
    if (leg.break) {
      playerScore.breaksPlusOne();
    } else {
      playerScore.straitsPlusOne();
    }
    

    // color the winner green based on the value of break
    let greenColumn = leg.break ? 3 : 2;
    let column = 1;

    values.forEach((value) => {
      const td = document.createElement('td')
      td.textContent = value
      if (column === greenColumn) {
        td.classList.add("winner");
      }
      if (column === 4 || column === 5) {
        td.classList.add('align-right');
      }
      column++;
      row.appendChild(td)
    })

    table.appendChild(row)
  })

  /* sort playerScores and create an HTML table */
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
    const values = [
      playerScore.id,
      playerScore.name,
      playerScore.total,
      playerScore.breaks
    ]
    values.forEach((value) => {
      const td = document.createElement('td')
      td.textContent = value
      winnerRow.appendChild(td)
    })

    winnerTable.appendChild(winnerRow);
  });

  let winnerHeader = document.createElement('h2');
  winnerHeader.textContent = "Winner";
  let detailsHeader = document.createElement('h2');
  detailsHeader.textContent = "Details";


  legsOutput.innerHTML = '';
  legsOutput.appendChild(winnerHeader);
  legsOutput.appendChild(winnerTable);
  legsOutput.appendChild(detailsHeader);
  legsOutput.appendChild(table);
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

async function loadLegs() {
  try {
    const res = await fetch('/api/legs')
    const data = await res.json()
    populateLegSelect(data)
    renderLegs(data)
  } catch (error) {
    console.warn('Error fetching legs:', error)
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

refreshLegsButton.addEventListener('click', () => {
  loadLegs()
})

refreshAveragesButton.addEventListener('click', () => {
  loadAverages()
})

Promise.all([loadAverages(), loadLegs()]).catch((error) => {
  console.warn('Error loading initial data:', error)
})
