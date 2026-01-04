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
  // Filtra apenas despesas
  const expenses = transactions.filter(transaction => transaction.type === 'expense');
  const container = document.querySelector('.chart-container');
  let canvas = document.getElementById('expenses-chart');
  
  // 1. Limpeza e Verificação
  if (expenses.length === 0) {
    if (window.expensesChart) { 
        window.expensesChart.destroy(); 
        window.expensesChart = null; 
    }
    if (container) {
        container.innerHTML = '<p class="empty-message" style="text-align:center; padding-top: 80px; color: var(--text-secondary); font-size: 0.9rem;">Sem despesas neste período.</p>';
    }
    return;
  }
  
  if (!container) return;
  
  // Se o container tiver a mensagem de vazio ou não tiver canvas, recria
  if (!canvas || container.querySelector('.empty-message')) {
    container.innerHTML = '';
    canvas = document.createElement('canvas');
    canvas.id = 'expenses-chart';
    container.appendChild(canvas);
  }

  // 2. Preparação dos Dados
  const expensesByCategory = {};
  expenses.forEach(t => { 
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount; 
  });
  
  const categories = Object.keys(expensesByCategory);
  const values = Object.values(expensesByCategory);
  const labels = categories.map(c => CATEGORY_LABEL_PT[c] || c);
  
  // Cores (Persistentes)
  const userKey = appState.currentUser || 'default';
  const stored = getChartColors(userKey);
  const colors = categories.map(cat => {
      if (!stored[cat]) {
          const used = Object.values(stored);
          const c = generateRandomColor(used, stored.__last);
          stored[cat] = c; 
          stored.__last = c;
      }
      return stored[cat];
  });
  setChartColors(userKey, stored);

  // Destroi gráfico anterior se existir
  if (window.expensesChart) { window.expensesChart.destroy(); }
  
  const ctx = canvas.getContext('2d');

  // =========================================================================
  // 3. TOOLTIP PERSONALIZADO (Mantendo sua configuração)
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

  // 4. Criação do Gráfico (SUA CONFIGURAÇÃO INTACTA)
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
                      usePointStyle: true,
                      font: {
                          size: 14
                      },
                      // Tenta pegar a cor do CSS, fallback para cinza se falhar
                      color: getComputedStyle(document.body).getPropertyValue('--text-secondary')?.trim() || '#64748B'
                  }
              },
              tooltip: {
                  enabled: false, // Desabilita tooltip nativo para usar o externo
                  external: externalTooltipHandler
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
  drawSparkline('income-sparkline', getSparklineData('income', transactions), '#10B981');
  drawSparkline('expense-sparkline', getSparklineData('expense', transactions), '#EF4444');
  drawSparkline('total-balance-sparkline', getSparklineData('balance', transactions), '#22D3FF');
}

/**
 * Calcula os dados financeiros dos últimos 7 dias.
 * Ajustado para usar DATA LOCAL e evitar erros de fuso horário.
 */
function getSparklineData(type, sourceTransactions) {
  const labels = [];
  const data = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    
    // Label Visual (dd/mm)
    labels.push( d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' } ) );
    
    // Data ISO Local (YYYY-MM-DD) para comparação com o banco
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const localIsoDate = `${year}-${month}-${day}`;

    // Filtra transações do dia específico
    const dailyTransaction = sourceTransactions.filter(t => t.date === localIsoDate);

    if (type === 'balance'){
      // Para saldo, somamos receitas e subtraímos despesas do dia
      const dailyBal = dailyTransaction.reduce( (acc, t) => {
        if (t.type === 'income') return acc + t.amount;
        if (t.type === 'expense' || t.type === 'transfer') return acc - t.amount;
        return acc;
      }, 0 );
      data.push(dailyBal);
    } else {
      // Para Receita ou Despesa pura
      const total = dailyTransaction
      .filter(t => t.type === type)
      .reduce( (acc, t) => acc + t.amount, 0 );
      data.push(total);
    }
  }

  return { labels, data };
}

// ==========================================================================
// 3. HELPER DE DESENHO (DRAW)
// ==========================================================================

function drawSparkline(canvasId, dataObj, color) {
  const canvas = document.getElementById(canvasId);
  if(!canvas) return;

  const ctx = canvas.getContext('2d');
  const chartHeight = canvas.offsetHeight || 50;

  // Gradiente de fundo
  const gradientColor = ctx.createLinearGradient(0, 0, 0, chartHeight);
  gradientColor.addColorStop(0, color + '66'); // Cor com transparência
  gradientColor.addColorStop(1, color + '00'); // Transparente

  // Se já existe gráfico nesse canvas, destroi antes de recriar
  const existChart = Chart.getChart(canvas);
  if (existChart) existChart.destroy();

  // Configuração Sparkline (Simplificada)
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
        tension: 0.4 // Curva suave
      } ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
          legend: { display: false }, 
          tooltip: { enabled: true, intersect: false, mode: 'index' } 
      },
      scales: {
        x: { display: false }, // Esconde eixo X
        y: { display: false, min: 0 }  // Esconde eixo Y
      },
      interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
      }
    }
  });
}