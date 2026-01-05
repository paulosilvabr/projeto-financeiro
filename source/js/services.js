/* ==========================================================================
   SERVIÇOS EXTERNOS (SERVICES.JS)
   --------------------------------------------------------------------------
   Camada de integração com dados externos.
   Responsável por buscar informações de APIs ou arquivos estáticos (JSON).
   ========================================================================== */

import { appState, TEXT } from './state.js';

// ==========================================================================
// 1. DICAS FINANCEIRAS (LOCAL JSON)
// ==========================================================================

/**
 * Carrega uma dica financeira aleatória de um arquivo JSON local.
 * Exibe a dica no widget correspondente na interface.
 */
export async function loadRandomInsight() {
    const el = document.getElementById('insight-content');
    if (!el) return; // Proteção caso o widget esteja oculto ou não exista

    fetch('insights.json')
        .then(response => {
            if (!response.ok) throw new Error('Falha ao carregar insights');
            return response.json();
        })
        .then(insights => {
            if (!insights || insights.length === 0) {
                throw new Error('Lista vazia');
            }
            // Seleciona item aleatório
            const randomIndex = Math.floor(Math.random() * insights.length);
            const item = insights[randomIndex];
            const text = typeof item === 'string' ? item : (item.pt || '');
            
            el.textContent = text;
        })
        .catch(error => {
            console.warn('Erro ao carregar insights:', error);
            el.textContent = TEXT.insightError;
        });
}

// ==========================================================================
// 2. COTAÇÃO DO DÓLAR (API EXTERNA)
// ==========================================================================

/**
 * Busca a cotação atual do Dólar (USD-BRL) na API AwesomeAPI.
 * Atualiza o widget de câmbio e o estado global da aplicação.
 */
export async function loadExchangeRate() {
    const el = document.getElementById('exchange-content');
    if (!el) return;

    el.textContent = TEXT.loading;

    try {
        // API pública e gratuita de cotações
        const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
        if (!response.ok) throw new Error('Erro na API de Câmbio');

        const data = await response.json();
        const bid = parseFloat(data.USDBRL.bid);

        // Salva no estado global (útil para conversões futuras)
        appState.currentExchangeRate = bid;

        // Formatação nativa para moeda (ex: R$ 5,20)
        const formatted = bid.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });

        el.textContent = `USD 1 = ${formatted}`;

    } catch (error) {
        console.warn('Erro ao carregar câmbio:', error);
        el.textContent = TEXT.exchangeError;
    }
}