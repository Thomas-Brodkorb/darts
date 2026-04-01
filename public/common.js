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