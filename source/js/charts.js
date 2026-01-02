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
export function renderExpensesChart() {
  const expenses = appState.transactions.filter(transaction => transaction.type === 'expense');
  const container = document.querySelector('.chart-container');
  let canvas = document.getElementById('expenses-chart');
  if (expenses.length === 0) {
    if (window.expensesChart) { window.expensesChart.destroy(); window.expensesChart = null; }
    if (container) { container.innerHTML = 'Sem despesas registradas'; }
    return;
  }
  if (!container) return;
  if (!canvas) {
    container.innerHTML = '';
    canvas = document.createElement('canvas');
    canvas.id = 'expenses-chart';
    container.appendChild(canvas);
  }
  const expensesByCategory = {};
  expenses.forEach(expense => { expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + expense.amount; });
  const categories = Object.keys(expensesByCategory);
  const values = Object.values(expensesByCategory);
  const labelss = categories.map(category => CATEGORY_LABEL_PT[category] || category);
  const userKey = appState.currentUser || 'default';
  const stored = getChartColors(userKey);
  const colors = [];
  categories.forEach((cat) => {
    let color = stored[cat];
    if (!color) {
      const used = Object.values(stored);
      color = generateRandomColor(used, stored.__last || null);
      stored[cat] = color;
      stored.__last = color;
    }
    colors.push(color);
  });
  setChartColors(userKey, stored);
  if (window.expensesChart) { window.expensesChart.destroy(); window.expensesChart = null; }
  const ctx = canvas.getContext('2d');
  window.expensesChart = new Chart(ctx, { type: 'doughnut', data: { labelss, datasets: [{ data: values, backgroundColor: colors, borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } } });
}

// ==========================================================================
// 2. SPARKLINES (GRÁFICOS DE LINHA PEQUENOS)
// ==========================================================================

// Função que inicializa todos os Sparklines
export function renderAllSparklines() {
  //Grafico de receita
  drawSparkline('income-sparkline', getSparklineData('income'), '#10B981')

  //Grafico de despesa
  drawSparkline('expense-sparkline', getSparklineData('expense'), '#EF4444')

  //Grafico de salto total
  drawSparkline('total-balance-sparkline', getSparklineData('balance'), '#22D3FF')
}

// Obtem os dados dos últimos 7 dias
function getSparklineData(type) {
  const labels = [];
  const data = [];
  const today = new Date();

  // Pega todos os dias, de hoje até 7 dias atrás
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    
    // Formata a data para exibir no gráfico e pra filtrar
    labels.push( d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' } ) );
    const isoDate = d.toISOString().split('T')[0]

    // Filtra transação real do estado da aplicação
    const dailyTransaction = appState.transactions.filter(t => t.date === isoDate);

    if (type === 'balance'){
      // Saldo do dia: Receita - Despesas
      const dailyBal = dailyTransaction.reduce( (acc, t) => {
        return t.type === 'income' ? acc + t.amount : acc - t.amount;
      }, 0 );
      data.push(dailyBal)
    } else {
      // Soma do tipo específico (Income {Receita} ou Expense {Despesa})
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

  // Faz o Gradiente de cor
  const gradientColor = ctx.createLinearGradient(0, 0, 0, chartHeight);
  gradientColor.addColorStop(0, color + '66');
  gradientColor.addColorStop(1, color + '00');

  // Evita bug de sobreposição
  const existChat = Chart.getChart(canvas);
  if (existChat) existChat.destroy();

  // Desenha o SparkLine de fato
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
        x: {
          beginAtZero: true,
          display: false
        },
        y: {
          beginAtZero: true,
          display: false
        } }
    }
  });
}
