const legsDetailsContainer = document.getElementById('legsDetails');
const showAllTimesLegsToggle = document.getElementById('showAllTimesLegs');
const detailState = { openLegId: null };
const trainingsDetailsContainer = document.getElementById('trainingsDetails');
const showAllTimesTrainingsToggle = document.getElementById('showAllTimesTrainings');
const trainingDetailState = { openTrainingId: null };

function formatLegDate(dateValue) {
  if (!dateValue) return '';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  return parsed.toDateString();
}

function getVisitCells(visit, previousLeft) {
  const cells = [];

  if (!visit) {
    for (let i = 0; i < 5; i += 1) {
      const cell = document.createElement('td');
      cell.textContent = '';
      cell.style.border = '1px solid #ddd';
      cell.style.padding = '6px';
      cell.style.textAlign = 'right';
      cells.push(cell);
    }
    return cells;
  }

  const firstDart = visit.dart1 || '';
  const secondDart = visit.dart2 || '';
  const thirdDart = visit.dart3 || '';
  const total = Number(visit.value ?? 0);
  const left = (previousLeft - total<0)? previousLeft:(previousLeft - total);

  [firstDart, secondDart, thirdDart, total, left].forEach((value) => {
    const cell = document.createElement('td');
    cell.textContent = value;
    cell.style.border = '1px solid #ddd';
    cell.style.padding = '6px';
    cell.style.textAlign = 'right';
    cells.push(cell);
  });

  return cells;
}

function buildLegDetailTable(leg, visitsForLeg) {
  const detailTable = document.createElement('table');
  detailTable.style.width = '100%';
  detailTable.style.borderCollapse = 'collapse';
  detailTable.style.background = '#fff';

  const playerHeaderRow = detailTable.insertRow();

  const firstPlayerHeader = playerHeaderRow.insertCell();
  firstPlayerHeader.colSpan = 5;
  firstPlayerHeader.textContent = leg.player_one_name;
  firstPlayerHeader.style.border = '1px solid #ddd';
  firstPlayerHeader.style.padding = '8px';
  firstPlayerHeader.style.textAlign = 'center';
  firstPlayerHeader.style.fontWeight = 'bold';

  const secondPlayerHeader = playerHeaderRow.insertCell();
  secondPlayerHeader.colSpan = 5;
  secondPlayerHeader.textContent = leg.player_two_name;
  secondPlayerHeader.style.border = '1px solid #ddd';
  secondPlayerHeader.style.padding = '8px';
  secondPlayerHeader.style.textAlign = 'center';
  secondPlayerHeader.style.fontWeight = 'bold';

  const headerRow = detailTable.insertRow();
  ['Dart 1', 'Dart 2', 'Dart 3', 'Total', 'Left', 'Dart 1', 'Dart 2', 'Dart 3', 'Total', 'Left'].forEach((label) => {
    const cell = document.createElement('th');
    cell.textContent = label;
    cell.style.border = '1px solid #ddd';
    cell.style.padding = '6px';
    cell.style.textAlign = 'center';
    headerRow.appendChild(cell);
  });

  const playerOneVisits = (visitsForLeg || [])
    .filter((visit) => Number(visit.player_id) === Number(leg.player_one))
    .sort((a, b) => Number(a.id) - Number(b.id));

  const playerTwoVisits = (visitsForLeg || [])
    .filter((visit) => Number(visit.player_id) === Number(leg.player_two))
    .sort((a, b) => Number(a.id) - Number(b.id));

  const maxRows = Math.max(playerOneVisits.length, playerTwoVisits.length);
  let previousLeftPlayerOne = Number(leg.start_value);
  let previousLeftPlayerTwo = Number(leg.start_value);

  for (let i = 0; i < maxRows; i += 1) {
    const row = detailTable.insertRow();
    const firstVisit = playerOneVisits[i];
    const secondVisit = playerTwoVisits[i];

    const firstPlayerCells = getVisitCells(firstVisit, previousLeftPlayerOne);
    const secondPlayerCells = getVisitCells(secondVisit, previousLeftPlayerTwo);

    firstPlayerCells.forEach((cell) => row.appendChild(cell));
    secondPlayerCells.forEach((cell) => row.appendChild(cell));

    if (firstVisit) {
      previousLeftPlayerOne = (previousLeftPlayerOne - Number(firstVisit.value ?? 0) < 0) ? previousLeftPlayerOne:(previousLeftPlayerOne - Number(firstVisit.value ?? 0));
    }

    if (secondVisit) {
      previousLeftPlayerTwo = (previousLeftPlayerTwo - Number(secondVisit.value ?? 0) < 0) ? previousLeftPlayerTwo : previousLeftPlayerTwo - Number(secondVisit.value ?? 0);
    }
  }

  return detailTable;
}

function buildTrainingDetailTable(training, visitsForTraining) {
  const detailTable = document.createElement('table');
  detailTable.style.width = '100%';
  detailTable.style.borderCollapse = 'collapse';
  detailTable.style.background = '#fff';

  const headerRow = detailTable.insertRow();
  ['Dart 1', 'Dart 2', 'Dart 3', 'Total', 'Left'].forEach((label) => {
    const cell = document.createElement('th');
    cell.textContent = label;
    cell.style.border = '1px solid #ddd';
    cell.style.padding = '6px';
    cell.style.textAlign = 'center';
    headerRow.appendChild(cell);
  });

  let previousLeft = Number(training.start_value);
  visitsForTraining.forEach((visit) => {
    const row = detailTable.insertRow();
    getVisitCells(visit, previousLeft).forEach((cell) => row.appendChild(cell));
    previousLeft = (previousLeft - Number(visit.value ?? 0) < 0)
      ? previousLeft
      : previousLeft - Number(visit.value ?? 0);
  });

  return detailTable;
}

function renderLegsTable(legs, visits) {
  if (!legsDetailsContainer) return;
  if (!Array.isArray(legs) || legs.length === 0) {
    legsDetailsContainer.textContent = 'No legs found.';
    return;
  }

  const table = document.createElement('table');
  table.classList.add('legs-table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';

  const headerRow = table.insertRow();
  ['id', 'Player 1', 'Player 2', 'Start Value', 'Rounds', 'Break', 'Played @'].forEach((label) => {
    const th = document.createElement('th');
    th.textContent = label;
    th.style.border = '1px solid #ddd';
    th.style.padding = '8px';
    th.style.textAlign = 'left';
    headerRow.appendChild(th);
  });

  const tbody = document.createElement('tbody');
  table.appendChild(tbody);

  legs.forEach((leg) => {
    const row = document.createElement('tr');

    const idCell = document.createElement('td');
    idCell.textContent = leg.id;
    idCell.style.cursor = 'pointer';
    idCell.style.textDecoration = 'underline';
    idCell.style.color = '#0055cc';
    idCell.style.border = '1px solid #ddd';
    idCell.style.padding = '8px';
    idCell.title = 'Show leg details';

    idCell.addEventListener('click', () => {
      const existingDetailRow = row.parentElement.querySelector(`tr[data-detail-leg-id="${leg.id}"]`);
      if (existingDetailRow) {
        existingDetailRow.remove();
        detailState.openLegId = null;
        return;
      }

      if (detailState.openLegId !== null) {
        const previousRow = row.parentElement.querySelector(`tr[data-detail-leg-id="${detailState.openLegId}"]`);
        if (previousRow) previousRow.remove();
      }

      detailState.openLegId = leg.id;
      const detailRow = document.createElement('tr');
      detailRow.dataset.detailLegId = String(leg.id);

      const detailCell = document.createElement('td');
      detailCell.colSpan = 7;
      detailCell.style.border = '1px solid #ddd';
      detailCell.style.padding = '12px';
      detailCell.style.background = '#fafafa';

      const legVisits = (Array.isArray(visits) ? visits.filter((visit) => Number(visit.leg_id) === Number(leg.id)) : []);
      detailCell.appendChild(buildLegDetailTable(leg, legVisits));
      detailRow.appendChild(detailCell);
      row.after(detailRow);
    });

    row.appendChild(idCell);

    const playerOneCell = document.createElement('td');
    playerOneCell.textContent = leg.player_one_name;
    playerOneCell.style.border = '1px solid #ddd';
    playerOneCell.style.padding = '8px';
    if (leg.break === false) {
      playerOneCell.classList.add('winner');
    }
    row.appendChild(playerOneCell);

    const playerTwoCell = document.createElement('td');
    playerTwoCell.textContent = leg.player_two_name;
    playerTwoCell.style.border = '1px solid #ddd';
    playerTwoCell.style.padding = '8px';
    if (leg.break === true) {
      playerTwoCell.classList.add('winner');
    }
    row.appendChild(playerTwoCell);

    const startValueCell = document.createElement('td');
    startValueCell.textContent = leg.start_value;
    startValueCell.style.border = '1px solid #ddd';
    startValueCell.style.padding = '8px';
    row.appendChild(startValueCell);

    const roundsCell = document.createElement('td');
    roundsCell.textContent = leg.rounds;
    roundsCell.style.border = '1px solid #ddd';
    roundsCell.style.padding = '8px';
    row.appendChild(roundsCell);

    const breakCell = document.createElement('td');
    breakCell.textContent = leg.break ? 'Yes' : 'No';
    breakCell.style.border = '1px solid #ddd';
    breakCell.style.padding = '8px';
    row.appendChild(breakCell);

    const playedAtCell = document.createElement('td');
    playedAtCell.textContent = formatLegDate(leg.created_at);
    playedAtCell.style.border = '1px solid #ddd';
    playedAtCell.style.padding = '8px';
    row.appendChild(playedAtCell);

    tbody.appendChild(row);
  });

  legsDetailsContainer.innerHTML = '';
  legsDetailsContainer.appendChild(table);
}

function getTrainingVisits(training, visits) {
  const trainingTime = new Date(training.created_at).getTime();
  const playerVisits = (Array.isArray(visits) ? visits : [])
    .filter((visit) => Number(visit.player_id) === Number(training.player))
    .filter((visit) => {
      const visitTime = new Date(visit.created_at).getTime();
      return Number.isNaN(trainingTime) || Number.isNaN(visitTime) || visitTime <= trainingTime;
    })
    .sort((a, b) => Number(a.id) - Number(b.id));

  return playerVisits.slice(-Number(training.rounds));
}

function renderTrainingsTable(trainings, visits) {
  if (!trainingsDetailsContainer) return;
  if (!Array.isArray(trainings) || trainings.length === 0) {
    trainingsDetailsContainer.textContent = 'No trainings found.';
    return;
  }

  const table = document.createElement('table');
  table.classList.add('trainings-table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';

  const headerRow = table.insertRow();
  ['id', 'Player', 'Start Value', 'Rounds', 'Played @'].forEach((label) => {
    const th = document.createElement('th');
    th.textContent = label;
    th.style.border = '1px solid #ddd';
    th.style.padding = '8px';
    th.style.textAlign = 'left';
    headerRow.appendChild(th);
  });

  const tbody = document.createElement('tbody');
  table.appendChild(tbody);

  trainings.forEach((training) => {
    const row = document.createElement('tr');
    const idCell = document.createElement('td');
    idCell.textContent = training.id;
    idCell.style.cursor = 'pointer';
    idCell.style.textDecoration = 'underline';
    idCell.style.color = '#0055cc';
    idCell.style.border = '1px solid #ddd';
    idCell.style.padding = '8px';
    idCell.title = 'Show training details';

    idCell.addEventListener('click', () => {
      const existingDetailRow = row.parentElement.querySelector(`tr[data-detail-training-id="${training.id}"]`);
      if (existingDetailRow) {
        existingDetailRow.remove();
        trainingDetailState.openTrainingId = null;
        return;
      }

      if (trainingDetailState.openTrainingId !== null) {
        const previousRow = row.parentElement.querySelector(`tr[data-detail-training-id="${trainingDetailState.openTrainingId}"]`);
        if (previousRow) previousRow.remove();
      }

      trainingDetailState.openTrainingId = training.id;
      const detailRow = document.createElement('tr');
      detailRow.dataset.detailTrainingId = String(training.id);

      const detailCell = document.createElement('td');
      detailCell.colSpan = 5;
      detailCell.style.border = '1px solid #ddd';
      detailCell.style.padding = '12px';
      detailCell.style.background = '#fafafa';
      detailCell.appendChild(buildTrainingDetailTable(training, getTrainingVisits(training, visits)));
      detailRow.appendChild(detailCell);
      row.after(detailRow);
    });
    row.appendChild(idCell);

    [
      training.player_name,
      training.start_value,
      training.rounds,
      formatLegDate(training.created_at),
    ].forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      cell.style.border = '1px solid #ddd';
      cell.style.padding = '8px';
      row.appendChild(cell);
    });

    tbody.appendChild(row);
  });

  trainingsDetailsContainer.innerHTML = '';
  trainingsDetailsContainer.appendChild(table);
}

async function loadLegDetails() {
  try {
    const showAllTimes = !!(showAllTimesLegsToggle && showAllTimesLegsToggle.checked);
    const legsEndpoint = showAllTimes ? '/api/legs' : '/api/legs/month';
    const [legsResponse, visitsResponse] = await Promise.all([
      fetch(legsEndpoint),
      fetch('/api/visits')
    ]);

    if (!legsResponse.ok || !visitsResponse.ok) {
      throw new Error('Unable to load leg details');
    }

    const legs = await legsResponse.json();
    const visits = await visitsResponse.json();
    renderLegsTable(legs, Array.isArray(visits) ? visits : []);
  } catch (error) {
    if (legsDetailsContainer) {
      legsDetailsContainer.textContent = `Error loading leg details: ${error.message}`;
    }
  }
}

async function loadTrainingDetails() {
  try {
    const showAllTimes = !!(showAllTimesTrainingsToggle && showAllTimesTrainingsToggle.checked);
    const trainingsEndpoint = showAllTimes ? '/api/trainings' : '/api/trainings/month';
    const [trainingsResponse, visitsResponse] = await Promise.all([
      fetch(trainingsEndpoint),
      fetch('/api/visits')
    ]);

    if (!trainingsResponse.ok || !visitsResponse.ok) {
      throw new Error('Unable to load training details');
    }

    const trainings = await trainingsResponse.json();
    const visits = await visitsResponse.json();
    renderTrainingsTable(trainings, visits);
  } catch (error) {
    if (trainingsDetailsContainer) {
      trainingsDetailsContainer.textContent = `Error loading training details: ${error.message}`;
    }
  }
}

if (document.getElementById('legsDetails')) {
  if (showAllTimesLegsToggle) {
    showAllTimesLegsToggle.addEventListener('change', () => {
      detailState.openLegId = null;
      loadLegDetails();
    });
  }
  loadLegDetails();
}

if (document.getElementById('trainingsDetails')) {
  if (showAllTimesTrainingsToggle) {
    showAllTimesTrainingsToggle.addEventListener('change', () => {
      trainingDetailState.openTrainingId = null;
      loadTrainingDetails();
    });
  }
  const refreshTrainingsButton = document.getElementById('refreshTrainings');
  if (refreshTrainingsButton) {
    refreshTrainingsButton.addEventListener('click', () => {
      trainingDetailState.openTrainingId = null;
      loadTrainingDetails();
    });
  }
  loadTrainingDetails();
}
