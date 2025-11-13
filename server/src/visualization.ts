export async function visualizationPage() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Uptime Monitor Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .header p { opacity: 0.8; }
    .controls {
      padding: 30px;
      background: #f7fafc;
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      align-items: center;
    }
    .controls input, .controls select, .controls button {
      padding: 12px 20px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 1em;
    }
    .controls button {
      background: #667eea;
      color: white;
      border: none;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }
    .controls button:hover { background: #5a67d8; transform: translateY(-2px); }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 30px;
    }
    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }
    .stat-card h3 { font-size: 0.9em; opacity: 0.9; margin-bottom: 10px; }
    .stat-card .value { font-size: 2.5em; font-weight: bold; }
    .charts {
      padding: 30px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 30px;
    }
    .chart-container {
      background: white;
      padding: 20px;
      border-radius: 15px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.1);
    }
    .chart-container h2 {
      margin-bottom: 20px;
      color: #2d3748;
      font-size: 1.3em;
    }
    .table-container {
      padding: 30px;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 5px 20px rgba(0,0,0,0.1);
    }
    th, td { padding: 15px; text-align: left; }
    th {
      background: #2d3748;
      color: white;
      font-weight: 600;
    }
    tr:nth-child(even) { background: #f7fafc; }
    tr:hover { background: #edf2f7; }
    .status-badge {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: 600;
    }
    .status-up { background: #c6f6d5; color: #22543d; }
    .status-down { background: #fed7d7; color: #742a2a; }
    .status-degraded { background: #feebc8; color: #7c2d12; }
    .loading {
      text-align: center;
      padding: 50px;
      font-size: 1.2em;
      color: #718096;
    }
    .api-key-input {
      background: #fff3cd;
      padding: 20px;
      margin: 20px 30px;
      border-radius: 10px;
      border: 2px solid #ffc107;
    }
    .api-key-input input {
      width: 100%;
      padding: 12px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 1em;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Uptime Monitor Dashboard</h1>
      <p>Real-time monitoring and analytics powered by Axiolot Hub</p>
    </div>

    <div class="api-key-input">
      <strong>⚠️ API Key Required:</strong>
      <input type="password" id="apiKey" placeholder="Enter your API key (axh_...)">
    </div>

    <div class="controls">
      <select id="environment">
        <option value="">All Environments</option>
        <option value="production">Production</option>
        <option value="staging">Staging</option>
        <option value="development">Development</option>
      </select>
      <button onclick="loadDashboard()">🔄 Refresh</button>
      <button onclick="exportData()">📥 Export CSV</button>
    </div>

    <div class="stats" id="stats">
      <div class="stat-card">
        <h3>Average Uptime</h3>
        <div class="value" id="avgUptime">--</div>
      </div>
      <div class="stat-card">
        <h3>Average Latency</h3>
        <div class="value" id="avgLatency">-- ms</div>
      </div>
      <div class="stat-card">
        <h3>Total Reports</h3>
        <div class="value" id="totalReports">--</div>
      </div>
      <div class="stat-card">
        <h3>Incidents</h3>
        <div class="value" id="incidents">--</div>
      </div>
    </div>

    <div class="charts">
      <div class="chart-container">
        <h2>Uptime Trend</h2>
        <canvas id="uptimeChart"></canvas>
      </div>
      <div class="chart-container">
        <h2>Status Distribution</h2>
        <canvas id="statusChart"></canvas>
      </div>
    </div>

    <div class="table-container">
      <h2 style="margin-bottom: 20px; color: #2d3748;">Recent Reports</h2>
      <div id="loading" class="loading">Loading data...</div>
      <table id="reportsTable" style="display: none;">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Environment</th>
            <th>Uptime %</th>
            <th>Latency (ms)</th>
            <th>Up/Down/Degraded</th>
          </tr>
        </thead>
        <tbody id="tableBody"></tbody>
      </table>
    </div>
  </div>

  <script>
    let uptimeChart, statusChart;
    let allData = [];

    async function loadDashboard() {
      const apiKey = document.getElementById('apiKey').value;
      if (!apiKey) {
        alert('Please enter your API key');
        return;
      }

      const environment = document.getElementById('environment').value;
      const url = '/dashboard/data' + (environment ? \`?environment=\${environment}\` : '');

      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': \`Bearer \${apiKey}\`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data. Check your API key.');
        }

        const result = await response.json();
        allData = result.data.data;

        updateStats(allData);
        updateCharts(allData);
        updateTable(allData);

        document.getElementById('loading').style.display = 'none';
        document.getElementById('reportsTable').style.display = 'table';
      } catch (error) {
        console.error(error);
        alert('Error loading dashboard: ' + error.message);
      }
    }

    function updateStats(data) {
      if (data.length === 0) return;

      const avgUptime = data.reduce((sum, r) => sum + r.uptime_percent, 0) / data.length;
      const avgLatency = data.reduce((sum, r) => sum + r.average_latency_ms, 0) / data.length;
      const incidents = data.reduce((sum, r) => sum + r.downtime_count, 0);

      document.getElementById('avgUptime').textContent = avgUptime.toFixed(2) + '%';
      document.getElementById('avgLatency').textContent = avgLatency.toFixed(2);
      document.getElementById('totalReports').textContent = data.length;
      document.getElementById('incidents').textContent = incidents;
    }

    function updateCharts(data) {
      // Uptime trend chart
      const ctx1 = document.getElementById('uptimeChart').getContext('2d');
      if (uptimeChart) uptimeChart.destroy();

      const labels = data.slice(-20).map(r => new Date(r.timestamp).toLocaleTimeString());
      const uptimeData = data.slice(-20).map(r => r.uptime_percent);

      uptimeChart = new Chart(ctx1, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Uptime %',
            data: uptimeData,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: true } },
          scales: {
            y: { beginAtZero: true, max: 100 }
          }
        }
      });

      // Status distribution chart
      const ctx2 = document.getElementById('statusChart').getContext('2d');
      if (statusChart) statusChart.destroy();

      const totalUp = data.reduce((sum, r) => sum + r.uptime_count, 0);
      const totalDown = data.reduce((sum, r) => sum + r.downtime_count, 0);
      const totalDegraded = data.reduce((sum, r) => sum + r.degraded_count, 0);

      statusChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: ['Up', 'Down', 'Degraded'],
          datasets: [{
            data: [totalUp, totalDown, totalDegraded],
            backgroundColor: ['#48bb78', '#f56565', '#ed8936']
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }

    function updateTable(data) {
      const tbody = document.getElementById('tableBody');
      tbody.innerHTML = '';

      data.slice(0, 20).forEach(report => {
        const row = tbody.insertRow();
        row.innerHTML = \`
          <td>\${new Date(report.timestamp).toLocaleString()}</td>
          <td>\${report.environment}</td>
          <td>\${report.uptime_percent.toFixed(2)}%</td>
          <td>\${report.average_latency_ms.toFixed(2)}</td>
          <td>
            <span class="status-badge status-up">\${report.uptime_count} Up</span>
            <span class="status-badge status-down">\${report.downtime_count} Down</span>
            <span class="status-badge status-degraded">\${report.degraded_count} Degraded</span>
          </td>
        \`;
      });
    }

    function exportData() {
      if (allData.length === 0) {
        alert('No data to export');
        return;
      }
        const csv = 'Timestamp,Environment,Uptime%,Latency,Up,Down,Degraded\\n' +
        allData.map(r => \`\${r.timestamp},\${r.environment},\${r.uptime_percent},\${r.average_latency_ms},\${r.uptime_count},\${r.downtime_count},\${r.degraded_count}\`).join('\\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`uptime-report-\${new Date().toISOString()}.csv\`;
      a.click();
    }

    window.addEventListener('load', () => {
      const savedKey = localStorage.getItem('apiKey');
      if (savedKey) {
        document.getElementById('apiKey').value = savedKey;
        loadDashboard();
      }
    });

    // Save API key
    document.getElementById('apiKey').addEventListener('change', (e) => {
      localStorage.setItem('apiKey', e.target.value);
    });
  </script>
</body>
</html>
  `;
}