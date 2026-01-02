/* ==========================================================================
   SERVIÇOS EXTERNOS (API & FETCH)
   --------------------------------------------------------------------------
   Funções responsáveis por buscar dados externos (JSON local ou APIs Web).
   ========================================================================== */

import { appState, TEXT } from './state.js';

// ==========================================================================
// 1. SERVIÇO DE INSIGHTS (DICAS)
// ==========================================================================
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
// 2. SERVIÇO DE CÂMBIO (API)
// ==========================================================================
export function loadExchangeRate() {
  const el = document.getElementById('exchange-content');
  if (el) el.textContent = TEXT.loading;
  
  fetch('https://api.exchangerate-api.com/v4/latest/USD')
    .then(response => { 
        if (!response.ok) throw new Error(); 
        return response.json(); 
    })
    .then(data => { 
        appState.currentExchangeRate = data.rates.BRL; 
        const formattedRate = appState.currentExchangeRate.toFixed(2); 
        const e = document.getElementById('exchange-content'); 
        if (e) e.textContent = `USD 1 = BRL ${formattedRate}`; 
    })
    .catch((error) => { 
        console.error(error); 
        const e = document.getElementById('exchange-content'); 
        if (e) e.textContent = TEXT.exchangeError; 
    });
}