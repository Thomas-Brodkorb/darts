import { formatDate } from './common.js'

const visitsOutput = document.getElementById('visitsOutput')
const refreshVisitsButton = document.getElementById('refreshVisits')

function createVisitHeaderRow(headerRow) {
  ['id', 'player_name', 'dart 1', 'dart 2', 'dart 3', 'value', 'created_at'].forEach((key) => {
    const th = document.createElement('th')
    th.textContent = key
    headerRow.appendChild(th)
  })
  return headerRow
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
    const row = document.createElement('tr')
    const values = [visit.id, visit.player_name, visit.dart1 || '', visit.dart2 || '', visit.dart3 || '', visit.value, formatDate(visit.created_at)]
    let col = 0

    values.forEach((value) => {
      const td = document.createElement('td')
      td.textContent = value
      // right-align dart1, dart2, dart3 and value columns
      if ([2, 3, 4, 5].includes(col)) {
        td.classList.add('align-right')
      }
      row.appendChild(td)
      col++
    })

    table.appendChild(row)
  })

  visitsOutput.innerHTML = ''
  visitsOutput.appendChild(table)
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

refreshVisitsButton.addEventListener('click', () => {
  loadVisits()
})

loadVisits()
