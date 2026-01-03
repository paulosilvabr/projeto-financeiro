/* ==========================================================================
   GRÁFICOS E VISUALIZAÇÃO (CHARTS)
   --------------------------------------------------------------------------
   Lógica de renderização de gráficos usando a biblioteca Chart.js.
   ========================================================================== */

import {
    appState,
    CATEGORY_LABEL_PT
} from './state.js';

import {
    generateRandomColor,
    getChartColors,
    setChartColors
} from './utils.js';

// ==========================================================================
// 1. GRÁFICO DE ROSCA (DESPESAS POR CATEGORIA)
// ==========================================================================

/**
 * Renderiza o gráfico de rosca com TOOLTIP HTML PERSONALIZADO (Space-Between).
 * @param {Array} transactions - Lista de transações (se não passar nada, usa todas).
 */
export function renderExpensesChart(transactions = appState.transactions) {
  // CORREÇÃO: Usa 'transactions' recebido como parâmetro, não 'appState.transactions' direto
  const expenses = transactions.filter(transaction => transaction.type === 'expense');
  const container = document.querySelector('.chart-container');
  let canvas = document.getElementById('expenses-chart');
  
  // 1. Limpeza e Verificação
  if (expenses.length === 0) {
    if (window.expensesChart) { window.expensesChart.destroy(); window.expensesChart = null; }
    if (container) container.innerHTML = '<p class="empty-message" style="text-align:center; padding-top: 40px; color: var(--text-secondary);">Sem despesas neste filtro.</p>';
    return;
  }
  
  if (!container) return;
  if (!canvas || container.innerHTML.includes('Sem despesas')) {
    container.innerHTML = '';
    canvas = document.createElement('canvas');
    canvas.id = 'expenses-chart';
    container.appendChild(canvas);
  }

  // 2. Preparação dos Dados
  const expensesByCategory = {};
  expenses.forEach(t => { expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount; });
  
  const categories = Object.keys(expensesByCategory);
  const values = Object.values(expensesByCategory);
  const labels = categories.map(c => CATEGORY_LABEL_PT[c] || c);
  
  // Cores
  const userKey = appState.currentUser || 'default';
  const stored = getChartColors(userKey);
  const colors = categories.map(cat => {
      if (!stored[cat]) {
          const used = Object.values(stored);
          const c = generateRandomColor(used, stored.__last);
          stored[cat] = c; stored.__last = c;
      }
      return stored[cat];
  });
  setChartColors(userKey, stored);

  if (window.expensesChart) { window.expensesChart.destroy(); }
  
  const ctx = canvas.getContext('2d');

  // =========================================================================
  // 3. O SEGREDO: HANDLER DO TOOLTIP EXTERNO
  // =========================================================================
  const externalTooltipHandler = (context) => {
    let tooltipEl = document.getElementById('chartjs-tooltip');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'chartjs-tooltip';
      document.body.appendChild(tooltipEl);
    }

    const tooltipModel = context.tooltip;
    if (tooltipModel.opacity === 0) {
      tooltipEl.style.opacity = 0;
      return;
    }

    if (tooltipModel.body) {
      const index = tooltipModel.dataPoints[0].dataIndex;
      const category = labels[index];
      const value = values[index];
      const color = colors[index];
      const formattedValue = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      const innerHtml = `
        <div class="tooltip-header">${category}</div>
        <div class="tooltip-body">
            <span style="display:flex; align-items:center;">
                <span class="tooltip-indicator" style="background-color: ${color}"></span>
                <span>Total</span>
            </span>
            <span class="tooltip-value">${formattedValue}</span>
        </div>
      `;
      tooltipEl.innerHTML = innerHtml;
    }

    const position = context.chart.canvas.getBoundingClientRect();
    tooltipEl.style.opacity = 1;
    tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
    tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
  };

  // 4. Criação do Gráfico
  window.expensesChart = new Chart(ctx, { 
      type: 'doughnut', 
      data: { 
          labels: labels, 
          datasets: [{ 
              data: values, 
              backgroundColor: colors, 
              borderWidth: 0,
              borderColor: document.body.classList.contains('dark') ? '#1E293B' : '#FFFFFF',
              hoverOffset: 20
          }] 
      }, 
      options: { 
          responsive: true, 
          maintainAspectRatio: false, 
          layout: {
              padding: 10
          },
          plugins: { 
              legend: { 
                  position: 'left',
                  labels: {
                      padding: 19,
                      usePointStyle: true, // Bolinhas em vez de quadrados na legenda
                      font: {
                          size: 14
                      },
                      color: getComputedStyle(document.body).getPropertyValue('--text-secondary').trim() // Cor adaptativa
                  }
              },
              tooltip: {
                  callbacks: {
                      title: function(tooltipItems) {
                          return tooltipItems[0].label;
                      },

                      label: function(context) {
                          const value = context.raw;
                          return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                      }
                  },
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  padding: 12,
                  cornerRadius: 8,
                  titleFont: { size: 14, weight: 'bolder' },
                  bodyFont: { size: 13 },
                  boxPadding: 10
              }
          } 
      } 
  });
}

// ==========================================================================
// 2. SPARKLINES (GRÁFICOS DE LINHA PEQUENOS)
// ==========================================================================

/**
 * Função orquestradora que desenha os 3 gráficos de linha.
 * @param {Array} transactions - Transações FILTRADAS.
 */
export function renderAllSparklines(transactions = appState.transactions) {
  drawSparkline('income-sparkline', getSparklineData('income', transactions), '#10B981')
  drawSparkline('expense-sparkline', getSparklineData('expense', transactions), '#EF4444')
  drawSparkline('total-balance-sparkline', getSparklineData('balance', transactions), '#22D3FF')
}

/**
 * Calcula os dados financeiros dos últimos 7 dias.
 * @param {string} type - Tipo de dado.
 * @param {Array} sourceTransactions - Lista de onde tirar os dados.
 */
function getSparklineData(type, sourceTransactions) {
  const labels = [];
  const data = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    
    labels.push( d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' } ) );
    const isoDate = d.toISOString().split('T')[0]

    const dailyTransaction = sourceTransactions.filter(t => t.date === isoDate);

    if (type === 'balance'){
      const dailyBal = dailyTransaction.reduce( (acc, t) => {
        return t.type === 'income' ? acc + t.amount : acc - t.amount;
      }, 0 );
      data.push(dailyBal)
    } else {
      const total = dailyTransaction
      .filter(t => t.type === type)
      .reduce( (acc, t) => acc + t.amount, 0 );
      data.push(total);
    }
  }

  return { labels, data }
}

// ==========================================================================
// 3. HELPER DE DESENHO (DRAW)
// ==========================================================================

function drawSparkline(canvasId, dataObj, color) {
  const canvas = document.getElementById(canvasId);
  if(!canvas) return;

  const ctx = canvas.getContext('2d')
  const chartHeight = canvas.offsetHeight || 50;

  const gradientColor = ctx.createLinearGradient(0, 0, 0, chartHeight);
  gradientColor.addColorStop(0, color + '66');
  gradientColor.addColorStop(1, color + '00');

  const existChat = Chart.getChart(canvas);
  if (existChat) existChat.destroy();

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: dataObj.labels,
      datasets: [ {
        data: dataObj.data,
        borderColor: color,
        borderWidth: 2,
        backgroundColor: gradientColor,
        fill: true,
        pointRadius: 0,
        tension: 0.4
      } ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enebled: true } },
      scales: {
        x: { beginAtZero: true, display: false },
        y: { beginAtZero: true, display: false } 
      }
    }
  });
}