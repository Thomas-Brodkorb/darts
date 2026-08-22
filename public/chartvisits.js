(async function () {
  async function loadVisitAverages() {
    const response = await fetch('/api/visit-averages')
    if (!response.ok) {
      throw new Error(`Failed to load visit averages: ${response.status} ${response.statusText}`)
    }
    return response.json()
  }

  function sortYearWeek(a, b) {
    const [ay, aw] = a.split(' ').map(Number)
    const [by, bw] = b.split(' ').map(Number)
    return ay - by || aw - bw
  }

  try {
    const data = await loadVisitAverages()

    const labels = Array.from(new Set(data.map(row => row.yearweek))).sort(sortYearWeek)
    const playerNames = Array.from(new Set(data.map(row => row.name)))

    const dataMap = new Map()
    data.forEach(row => {
      const value = Number(row.value)
      dataMap.set(`${row.name}|${row.yearweek}`, Number.isFinite(value) ? value : null)
    })

    const datasets = playerNames.map(name => ({
      label: name,
      data: labels.map((yearweek) => {
        const value = dataMap.get(`${name}|${yearweek}`)
        return { x: yearweek, y: value === undefined || value === null ? null : value }
      })
    }))

    const chartBackgroundPlugin = {
      id: 'chartBackground',
      beforeDraw(chart,args,options) {

        const { ctx, chartArea: { left, top, width, height } } = chart;
        ctx.save()
        ctx.fillStyle = options.color || '#ffffff';
        ctx.fillRect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
        ctx.restore();
      }
    };

    new Chart(
      document.getElementById('visits'),
      {
        type: 'line',
        options: {
          animation: false,
          scales: {
            x: {
              ticks: {
                autoSkip: false
              },
              title: {
                display: true,
                text: 'Year-Week'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Average Visit'
              }
            }
          },
          plugins: {
            legend: {
              display: true
            },
            tooltip: {
              enabled: false
            },
              chartBackground: {
                color: '#7e3939'
              }
            }
        },
        data: {
          labels,
          datasets
        }
      }
    )
  } catch (error) {
    console.error(error)
  }
})()

