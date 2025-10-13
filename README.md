# 📊 Planejador Financeiro Pessoal

Um aplicativo web completo para planejamento financeiro, desenvolvido com **HTML5, CSS3 e JavaScript puro (Vanilla JS)**. A aplicação é totalmente client-side, utilizando o `localStorage` do navegador para persistir os dados, o que significa que não necessita de um backend para funcionar.

O projeto foi construído com foco em modularidade, código limpo e boas práticas de desenvolvimento, tornando-o fácil de entender, manter e expandir com novas funcionalidades no futuro.

## ✨ Funcionalidades Principais

-   **Gerenciamento de Contas**: Adicione, edite e exclua múltiplas contas (ex: carteira, banco, investimentos).
-   **Rastreamento de Transações**: Registre receitas, despesas e transferências entre contas. Os saldos são atualizados automaticamente.
-   **Dashboard Visual**: Visualize um resumo do seu saldo total e gráficos interativos que mostram a distribuição de despesas por categoria.
-   **Internacionalização (i18n)**: Suporte a múltiplos idiomas (Inglês e Português com traduções completas) com a seleção persistida.
-   **Persistência de Dados**: Todas as suas contas e transações são salvas localmente no seu navegador usando a Web Storage API (`localStorage`).
-   **Operações Assíncronas**:
    -   Carrega dicas financeiras de um arquivo `insights.json` local usando `async/await`.
    -   Busca taxas de câmbio de uma API pública (`exchangerate-api`) usando `.then()/.catch()`.
-   **Tema Claro e Escuro (Dark/Light Mode)**: Alterne entre os temas para uma melhor experiência visual. A preferência é salva localmente.
-   **Design Responsivo**: Interface limpa e moderna que se adapta perfeitamente a desktops, tablets e dispositivos móveis.

## 🚀 Como Executar o Projeto

Como este é um projeto puramente front-end, você não precisa de um ambiente de desenvolvimento complexo.

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/seu-usuario/nome-do-repositorio.git](https://github.com/seu-usuario/nome-do-repositorio.git)
    ```

2.  **Navegue até a pasta do projeto:**
    ```bash
    cd nome-do-repositorio
    ```

3.  **Abra o arquivo `index.html` em um navegador.**

    > **Nota Importante:** Para que a funcionalidade de carregar o arquivo local `insights.json` funcione corretamente (devido às políticas de segurança CORS dos navegadores), é recomendado servir os arquivos através de um servidor local simples.
    >
    > Você pode usar a extensão **Live Server** no VS Code ou executar um dos seguintes comandos no seu terminal, dentro da pasta do projeto:
    >
    > **Usando Python:**
    > ```bash
    > python -m http.server
    > ```
    > **Usando Node.js (requer `npx`):**
    > ```bash
    > npx serve
    > ```
    > Depois, acesse `http://localhost:8000` (ou a porta indicada) no seu navegador.

## 🛠️ Tecnologias Utilizadas

-   **HTML5**: Estrutura semântica e acessível.
-   **CSS3**: Estilização moderna com Flexbox, Grid, Variáveis CSS (para o theming) e design responsivo (Mobile-First).
-   **JavaScript (ES6+)**: Toda a lógica da aplicação, manipulação do DOM, gerenciamento de estado e chamadas assíncronas, sem nenhum framework ou biblioteca externa (exceto Chart.js).
-   **Chart.js**: Biblioteca utilizada para a renderização dos gráficos de pizza/rosca.
-   **Google Material Symbols**: Para os ícones da interface.

## 📂 Estrutura do Projeto

O código está organizado de forma modular para facilitar a manutenção:

```
/
├── index.html          # Arquivo principal com a estrutura da página
├── styles.css          # Folha de estilos para toda a aplicação
├── app.js              # Lógica principal em JavaScript (estado, eventos, renderização)
├── translations.js     # Objeto com as strings de tradução para os idiomas
└── insights.json       # Arquivo de dados com as dicas financeiras
```