/* ==========================================================================
   SERVIÇOS EXTERNOS (SERVICES.JS)
   --------------------------------------------------------------------------
   Funções responsáveis por buscar dados externos (JSON local ou APIs Web).
   ========================================================================== */

import { appState, TEXT } from './state.js';

// ==========================================================================
// 1. DICAS FINANCEIRAS (JSON LOCAL)
// ==========================================================================

export async function loadRandomInsight() {
  const el = document.getElementById('insight-content');
  if (!el) return; // Proteção caso o widget não exista

  try {
    const response = await fetch('insights.json');
    if (!response.ok) throw new Error('Falha ao carregar insights');
    
    const insights = await response.json();
    
    if (!insights || insights.length === 0) {
        el.textContent = TEXT.insightError;
        return;
    }

    // Seleciona um aleatório
    const randomIndex = Math.floor(Math.random() * insights.length);
    const item = insights[randomIndex];
    
    // Suporta tanto array de strings quanto objetos {pt: '...'}
    const text = typeof item === 'string' ? item : (item.pt || '');
    
    el.textContent = text || TEXT.insightError;

  } catch (error) {
    console.warn('Erro ao carregar insights:', error);
    el.textContent = TEXT.insightError;
  }
}

// ==========================================================================
// 2. COTAÇÃO DO DÓLAR (API EXTERNA)
// ==========================================================================

export async function loadExchangeRate() {
  const el = document.getElementById('exchange-content');
  if (!el) return;
  
  el.textContent = TEXT.loading;

  try {
    const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
    if (!response.ok) throw new Error('Erro na API de Câmbio');
    
    const data = await response.json();
    const bid = parseFloat(data.USDBRL.bid);
    
    // Salva no estado global (caso precise usar em cálculos futuros)
    appState.currentExchangeRate = bid;
    
    // Formatação nativa para moeda (R$ 5,20)
    const formatted = bid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    el.textContent = `USD 1 = ${formatted}`;

  } catch (error) {
    console.warn('Erro ao carregar câmbio:', error);
    el.textContent = TEXT.exchangeError;
  }
}