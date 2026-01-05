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

export function renderExpensesChart(transactions = appState.transactions) {
  const expenses = transactions.filter(transaction => transaction.type === 'expense');
  const container = document.querySelector('.chart-container');
  let canvas = document.getElementById('expenses-chart');
  
  // 1. Limpeza
  if (expenses.length === 0) {
    if (window.expensesChart) { window.expensesChart.destroy(); window.expensesChart = null; }
    if (container) container.innerHTML = '<p class="empty-message" style="text-align:center; padding-top: 80px; color: var(--text-secondary); font-size: 0.9rem;">Sem despesas neste período.</p>';
    return;
  }
  
  if (!container) return;
  
  if (!canvas || container.querySelector('.empty-message')) {
    container.innerHTML = '';
    canvas = document.createElement('canvas');
    canvas.id = 'expenses-chart';
    container.appendChild(canvas);
  }

  // 2. Dados
  const expensesByCategory = {};
  expenses.forEach(t => { expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount; });
  
  const categories = Object.keys(expensesByCategory);
  const values = Object.values(expensesByCategory);
  const labels = categories.map(c => CATEGORY_LABEL_PT[c] || c);
  
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
  const isDark = document.body.classList.contains('dark') || document.body.getAttribute('data-theme') === 'dark';

  // =========================================================================
  // 3. HANDLER DO TOOLTIP (CORREÇÃO DE HOVER)
  // =========================================================================
  const externalTooltipHandler = (context) => {
    let tooltipEl = document.getElementById('chartjs-tooltip');

    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'chartjs-tooltip';
      // Garante que o tooltip não bloqueie o mouse
      tooltipEl.style.pointerEvents = 'none'; 
      tooltipEl.style.position = 'absolute';
      tooltipEl.style.transition = 'opacity 0.1s ease';
      tooltipEl.style.zIndex = 9999;
      document.body.appendChild(tooltipEl);
    }

    const tooltipModel = context.tooltip;

    // Esconde se mouse saiu
    if (tooltipModel.opacity === 0) {
      tooltipEl.style.opacity = 0;
      return;
    }

    // Renderiza HTML
    if (tooltipModel.body) {
      const dataIndex = tooltipModel.dataPoints[0].dataIndex;
      const category = labels[dataIndex];
      const value = values[dataIndex];
      const color = colors[dataIndex];
      const formattedValue = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      tooltipEl.innerHTML = `
        <div class="tooltip-header" style="color: #94A3B8; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 6px;">${category}</div>
        <div class="tooltip-body" style="display: flex; align-items: center; color: white; font-weight: 700; font-size: 15px;">
            <span style="display:inline-block; width: 10px; height: 10px; background-color: ${color}; margin-right: 8px; border-radius: 2px;"></span>
            ${formattedValue}
        </div>
      `;
    }

    // Posiciona
    const position = context.chart.canvas.getBoundingClientRect();
    
    tooltipEl.style.opacity = 1;
    // Segue o mouse instantaneamente
    tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
    tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
    
    // Ajuste para ficar acima do cursor
    tooltipEl.style.transform = 'translate(-50%, -120%)';
  };

  // 4. Configuração do Gráfico
  window.expensesChart = new Chart(ctx, { 
      type: 'doughnut', 
      data: { 
          labels: labels, 
          datasets: [{ 
              data: values, 
              backgroundColor: colors, 
              borderWidth: 0,
              borderColor: isDark ? '#1E293B' : '#FFFFFF',
              hoverOffset: 20
          }] 
      }, 
      options: { 
          responsive: true, 
          maintainAspectRatio: false, 
          layout: { padding: 20 },
          events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
          hover: {
              mode: 'nearest',
              intersect: true
          },
          interaction: {
              mode: 'nearest',
              intersect: true
          },
          plugins: { 
              legend: { 
                  position: 'left',
                  labels: {
                      padding: 10,
                      usePointStyle: true,
                      font: { size: 16 },
                      color: getComputedStyle(document.body).getPropertyValue('--text-secondary')?.trim() || '#64748B'
                  }
              },
              tooltip: {
                  enabled: false, // Desliga nativo
                  external: externalTooltipHandler, // Liga customizado
                  animation: false
              }
          } 
      } 
  });
}

// ==========================================================================
// 2. SPARKLINES
// ==========================================================================

export function renderAllSparklines(transactions = appState.transactions) {
  // Passamos 'transactions' (lista completa) e a função abaixo filtra os últimos 30 dias
  drawSparkline('income-sparkline', getSparklineData('income', transactions), '#10B981');
  drawSparkline('expense-sparkline', getSparklineData('expense', transactions), '#EF4444');
  drawSparkline('total-balance-sparkline', getSparklineData('balance', transactions), '#22D3FF');
}

/**
 * LÓGICA DE 30 DIAS
 * Calcula os dados baseados na data de hoje ou no mês selecionado.
 */
function getSparklineData(type, sourceTransactions) {
  const labels = [];
  const data = [];
  
  let referenceDate = new Date();
  
  // Se o filtro for 'Mês Anterior', a referência é o último dia do mês passado
  if (appState.activeMonthFilter === 'prev') { 
      referenceDate.setDate(0); // Volta para o dia 0 deste mês (último dia do mês anterior)
  }

  // Loop de 30 dias (de 29 até 0)
  for (let i = 29; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(referenceDate.getDate() - i);
    
    // Formata YYYY-MM-DD localmente
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const localIsoDate = `${year}-${month}-${day}`;
    
    // Label Visual
    labels.push( d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' } ) );

    // Filtra transações deste dia específico
    const dailyTransaction = sourceTransactions.filter(t => t.date === localIsoDate);

    if (type === 'balance'){
      const dailyBal = dailyTransaction.reduce( (acc, t) => {
        if (t.type === 'income') return acc + t.amount;
        if (t.type === 'expense' || t.type === 'transfer') return acc - t.amount;
        return acc;
      }, 0 );
      data.push(dailyBal);
    } else {
      const total = dailyTransaction.filter(t => t.type === type).reduce( (acc, t) => acc + t.amount, 0 );
      data.push(total);
    }
  }
  return { labels, data };
}

function drawSparkline(canvasId, dataObj, color) {
  const canvas = document.getElementById(canvasId);
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const chartHeight = canvas.offsetHeight || 50;

  const gradientColor = ctx.createLinearGradient(0, 0, 0, chartHeight);
  gradientColor.addColorStop(0, color + '66');
  gradientColor.addColorStop(1, color + '00');

  const existChart = Chart.getChart(canvas);
  if (existChart) existChart.destroy();

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
      plugins: { 
          legend: { display: false }, 
          tooltip: { 
              enabled: true, 
              intersect: false, 
              mode: 'index',
              displayColors: false,
              callbacks: {
                  label: function(context) { return context.parsed.y.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
              }
          } 
      },
      scales: { x: { display: false }, y: { display: false, min: 0 } },
      interaction: { mode: 'nearest', axis: 'x', intersect: false }
    }
  });
}