export const STORAGE = { USERS_DB: 'users_db', CURRENT_USER: 'current_user' };
export const appState = {
  theme: 'light',
  currentUser: null,
  accounts: [],
  transactions: [],
  currentExchangeRate: null,
  editingAccountId: null,
  activeMonthFilter: null,
  activeAccountFilter: 'all',
  dateFilterStart: null,
  dateFilterEnd: null,
};
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
export const CATEGORY_LABEL_PT = {
  moradia: 'Moradia',
  alimentacao: 'Alimentação',
  transporte: 'Transporte',
  lazer: 'Lazer',
  saude: 'Saúde',
  educacao: 'Educação',
  outros: 'Outros'
};
