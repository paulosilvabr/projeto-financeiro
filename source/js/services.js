/* ==========================================================================
   SERVIÇOS EXTERNOS (API & FETCH)
   --------------------------------------------------------------------------
   Funções responsáveis por buscar dados externos (JSON local ou APIs Web).
   ========================================================================== */

import { appState, TEXT } from './state.js';

// ==========================================================================
// 1. SERVIÇO DE INSIGHTS (DICAS)
// ==========================================================================

/**
 * Busca uma dica financeira aleatória de um arquivo JSON local.
 * Utiliza async/await para lidar com a requisição assíncrona.
 * Atualiza o elemento DOM diretamente com o texto recebido.
 */
export async function loadRandomInsight() {
  try {
    const response = await fetch('insights.json');
    if (!response.ok) throw new Error();
    const insights = await response.json();
    let randomInsightText = '';
    
    if (Array.isArray(insights)) {
      const randomIndex = Math.floor(Math.random() * insights.length);
      const selected = insights[randomIndex];
      randomInsightText = typeof selected === 'string' ? selected : (selected?.pt || '');
    } else {
      const languageInsights = insights?.pt || [];
      const randomIndex = Math.floor(Math.random() * (languageInsights.length || 0));
      randomInsightText = languageInsights?.[randomIndex] || '';
    }
    
    const el = document.getElementById('insight-content');
    if (el) el.textContent = randomInsightText || TEXT.loading;
  } catch (error) {
    console.error(error);
    const el = document.getElementById('insight-content');
    if (el) el.textContent = TEXT.insightError;
  }
}

// ==========================================================================
// 2. SERVIÇO DE CÂMBIO (API) {DolarAPI.doc}
// ==========================================================================

/**
 * Consulta a API externa (AwesomeAPI) para obter a cotação atual do Dólar (USD-BRL).
 * Utiliza Promises (.then/.catch) para tratar a resposta.
 * Atualiza o card de cotação com o valor de compra ('bid') atual.
 */
export function loadExchangeRate() {
  const el = document.getElementById('exchange-content');
  if (el) el.textContent = TEXT.loading;
  
  // URL da AwesomeAPI
  fetch('https://economia.awesomeapi.com.br/last/USD-BRL')
    .then(response => { 
        if (!response.ok) throw new Error(); 
        return response.json(); 
    })
    .then(data => { 
        // A AwesomeAPI devolve nesse formato: data.USDBRL.bid (valor de compra/mercado)
        const valor = parseFloat(data.USDBRL.bid);
        
        appState.currentExchangeRate = valor; 
        const formatted = valor.toFixed(2).replace('.', ',');
        
        const e = document.getElementById('exchange-content'); 
        if (e) e.textContent = `USD 1 = R$ ${formatted}`; 
    })
    .catch((error) => { 
        console.error(error); 
        const e = document.getElementById('exchange-content'); 
        if (e) e.textContent = TEXT.exchangeError; 
    });
}
