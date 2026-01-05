/* ==========================================================================
   ESTADO GLOBAL & CONSTANTES (STATE.JS)
   --------------------------------------------------------------------------
   Arquivo responsável por centralizar o estado reativo da aplicação (appState)
   e armazenar constantes de texto e chaves de configuração.
   ========================================================================== */

/**
 * Chaves utilizadas para persistência no LocalStorage.
 * @enum {string}
 */
export const STORAGE = {
    USERS_DB: 'users_db',
    CURRENT_USER: 'current_user'
};

/**
 * Objeto central de estado da aplicação.
 * Armazena dados voláteis que alimentam a interface e a lógica de negócio.
 */
export const appState = {
    // --- PREFERÊNCIAS DE SESSÃO ---
    /** @type {'light'|'dark'} Tema visual atual */
    theme: 'light',
    /** @type {string|null} Username do usuário logado */
    currentUser: null,

    // --- DADOS FINANCEIROS ---
    /** @type {Array<Object>} Lista de contas bancárias do usuário */
    accounts: [],
    /** @type {Array<Object>} Lista completa de transações */
    transactions: [],
    /** @type {number|null} Valor atual do Dólar (cache) */
    currentExchangeRate: null,

    // --- ESTADOS DOS FILTROS (BARRA LATERAL) ---
    /** @type {'current'|'prev'} Filtro de mês: Atual ou Anterior */
    activeMonthFilter: 'current',
    /** @type {string} ID da conta para filtrar ou 'all' */
    activeAccountFilter: 'all',
    /** @type {string} Termo de busca textual */
    filterTerm: '',
    /** @type {Array<string>} Tipos de transação visíveis (income, expense, transfer) */
    filterTypes: ['income', 'expense', 'transfer'],
    /** @type {string} Categoria selecionada para filtro */
    filterCategory: 'all',
    /** @type {string} Critério de ordenação da lista */
    filterSort: 'date-desc',

    // --- CONTROLE DE INTERFACE (UI) ---
    /** @type {string|null} ID da conta sendo editada no momento (null se criando) */
    editingAccountId: null,
    /** @type {boolean} Se true, exibe histórico completo; se false, apenas as últimas 5 */
    showAllTransactions: false,
};

/**
 * Textos fixos e mensagens de feedback do sistema.
 * Centralizado para facilitar manutenção ou futura tradução.
 */
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

/**
 * Mapeamento de categorias (ID -> Texto Legível).
 * Usado para renderizar o nome bonito da categoria na lista.
 */
export const CATEGORY_LABEL_PT = {
    moradia: 'Moradia',
    alimentacao: 'Alimentação',
    transporte: 'Transporte',
    lazer: 'Lazer',
    saude: 'Saúde',
    educacao: 'Educação',
    outros: 'Outros'
};