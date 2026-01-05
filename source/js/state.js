/* ==========================================================================
   ESTADO GLOBAL & CONSTANTES (state.js)
   --------------------------------------------------------------------------
   Centraliza as variáveis de estado (appState) e textos fixos do sistema.
   ========================================================================== */

// 1. CHAVES DE ARMAZENAMENTO (LOCALSTORAGE)
export const STORAGE = { 
    USERS_DB: 'users_db', 
    CURRENT_USER: 'current_user' 
};

// 2. ESTADO DA APLICAÇÃO (STATE)
export const appState = {
  // --- PREFERÊNCIAS E SESSÃO ---
  theme: 'light',
  currentUser: null,

  // --- DADOS FINANCEIROS ---
  accounts: [],
  transactions: [],
  currentExchangeRate: null,

  // --- ESTADOS DOS FILTROS (SIDEBAR) ---
  activeMonthFilter: 'current',                   // 'current' (mês atual) ou 'prev' (mês anterior)
  activeAccountFilter: 'all',                     // ID da conta ou 'all'
  filterTerm: '',                                 // Texto da busca
  filterTypes: ['income', 'expense', 'transfer'], // Tipos visíveis na lista
  filterCategory: 'all',                          // Categoria selecionada
  filterSort: 'date-desc',                        // Ordenação padrão (mais recentes)

  // --- CONTROLE DE INTERFACE (UI) ---
  editingAccountId: null,         // Se preenchido, estamos editando esta conta
  showAllTransactions: false,     // Controla se mostra apenas 5 ou todas na lista principal
};

// 3. TEXTOS E MENSAGENS DO SISTEMA
export const TEXT = {
  noAccounts: 'Nenhuma conta encontrada. Adicione uma conta para começar.',
  noTransactions: 'Nenhuma transação encontrada.',
  confirmDeleteAccount: 'Tem certeza que deseja excluir esta conta?',
  confirmDeleteTransactions: 'Excluir também as transações associadas?',
  accountNameRequired: 'Nome da conta é obrigatório.',
  descriptionRequired: 'Descrição é obrigatória.',
  amountPositive: 'O valor deve ser positivo.',
  accountRequired: 'Selecione uma conta.',
  dateRequired: 'Selecione uma data.',
  destinationAccountRequired: 'Selecione a conta destino.',
  differentAccountsRequired: 'As contas devem ser diferentes.',
  initialDeposit: 'Depósito inicial',
  balanceAdjustment: 'Ajuste de saldo',
  loading: 'Carregando...',
  insightError: 'Erro ao carregar dica financeira.',
  exchangeError: 'Erro ao carregar taxa de câmbio.'
};

// 4. CATEGORIAS (LABEL)
export const CATEGORY_LABEL_PT = {
  moradia: 'Moradia',
  alimentacao: 'Alimentação',
  transporte: 'Transporte',
  lazer: 'Lazer',
  saude: 'Saúde',
  educacao: 'Educação',
  outros: 'Outros'
};