import { Visit } from './visit.js'
import {Dart} from './dart.js'
// Common functions shared across JS files

export async function fetchPlayers() {
  const res = await fetch('/api/players')
  if (!res.ok) throw new Error('Unable to fetch players')
  return res.json()
}

export function populatePlayerSelect(selectElement, players) {
  if (!selectElement) return
  selectElement.innerHTML = '<option value="">(Choose a player)</option>'
  players.forEach((p) => {
    const option = document.createElement('option')
    option.value = p.id
    option.textContent = p.name
    selectElement.appendChild(option)
  })
}

export function createPlayerHeaderRow(headerRow) {
  ['id', 'name', 'email', 'score', 'created_at'].forEach((key) => {
    const th = document.createElement('th')
    th.textContent = key
    headerRow.appendChild(th)
  })
  return headerRow
}

/*
  date: a string representing the date/time from database, e.g.
  2026-03-23T20:59:14.724Z
  returns date only formatted string
*/
export function formatDate(date) {
  let d = new Date(date);
  return d.toDateString();
}

export function createPlayerTable(player) {
  const table = document.createElement('table')
  table.classList.add('visits-table');

  const thead = document.createElement('thead')
  const headerRow = document.createElement('tr')
  const headerCell = document.createElement('th')
  headerCell.setAttribute('colspan', '4')
  headerCell.textContent = player.player.name
  headerRow.appendChild(headerCell)
  thead.appendChild(headerRow)

  const labelRow = document.createElement('tr');
  ['Dart 1', 'Dart 2', 'Dart 3', 'Left'].forEach((text) => {
    const th = document.createElement('th');
    th.textContent = text;
    labelRow.appendChild(th);
  })
  thead.appendChild(labelRow)

  const tbody = document.createElement('tbody')


  table.appendChild(thead);
  table.appendChild(tbody);

  player.table = table;
  player.tbody = tbody;
  return table;

}

export function createLiveVisitRow(player,errorMessage, goodMessage) {
  const row = Visit.createInputRow(errorMessage, goodMessage, (visit) => {
    if (!visit) return
    player.totalScore = visit.totalScore;
    player.complete = visit.isComplete;
    player.currentVisit = visit;
    updateLiveRowLeft(player);
  });
  row.classList.add('live-row')
  row.dataset.playerId = String(player.player.id);

  const leftTd = document.createElement('td')
  leftTd.classList.add('align-right')
  leftTd.textContent = String(player.left);
  row.appendChild(leftTd)

  return row;
}

export function updateLiveRowLeft(player) {
  if (!player || !player.liveRow) return;
  const sum = player.currentVisit? player.currentVisit.totalScore : 0;
  const leftCell = player.liveRow.children[3];
  leftCell.textContent = player.left - sum;
}

export function addLeftColumn(row, leftValue) {

  const td = document.createElement('td')
  td.classList.add('align-right')
  td.classList.add('leftCell')
  td.textContent = String(leftValue);
  row.appendChild(td)
  return row
}