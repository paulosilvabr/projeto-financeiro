# Projeto Integrador: Me Poupe! - Planejador Financeiro Pessoal

- **Disciplina:** Introducao a Programacao Web
- **Tema:** Aplicacao de Controle Financeiro Pessoal

## 1. Resumo do Projeto

O **"Me Poupe!"** e uma aplicacao web **client-side** desenvolvida para auxiliar no controle financeiro pessoal. O sistema permite ao usuario gerenciar multiplas contas bancarias, registrar transacoes (**receitas**, **despesas** e **transferencias**), visualizar o saldo consolidado e analisar a distribuicao de gastos atraves de **graficos interativos**.

A aplicacao foi construida utilizando **HTML5 semantico**, **CSS3** (com abordagem **Mobile First**) e **JavaScript Puro (Vanilla JS)** modularizado. Todos os dados sao persistidos localmente no navegador do usuario utilizando **Web Storage**.

![Home Page](./source/assets/app-screen-desktop-graph-2.png|width=400)

## 2. Checklist de Conformidade

Conforme solicitado na rubrica de avaliacao:

- [x] Estruturas basicas (condicionais, lacos, funcoes).
- [x] Objetos + Arrays com map/filter/reduce (>= 3 metodos).
- [x] Arrow functions (incluindo eventos).
- [x] DOM dinamico (criacao/remocao/atualizacao; formularios e eventos).
- [x] Requisicao assincrona com fetch + loading/erros.
- [x] Promises (.then/.catch) e async/await (try/catch).
- [x] Web Storage para persistencia.
- [x] +1 API HTML5 opcional (Canvas API via Chart.js).
- [x] Responsivo + semantica + acessibilidade basica.
- [x] Organizacao de arquivos e README completo.

## 3. Estrutura de Arquivos

```text
/
├── source
│   ├── favicon
│   │   └── favicon.ico      # Icone da aba do navegador
│   ├── js
│   │   ├── app.js           # Controlador principal e eventos globais
│   │   ├── auth.js          # Logica de login, registro e sessao
│   │   ├── charts.js        # Configuracao e renderizacao dos graficos
│   │   ├── modals.js        # Controle de abertura/fechamento de janelas
│   │   ├── render.js        # Manipulacao do DOM e atualizacao visual
│   │   ├── services.js      # Requisicoes externas (Fetch API e JSON)
│   │   ├── state.js         # Estado global (State) e constantes
│   │   ├── storage.js       # Persistencia de dados (LocalStorage)
│   │   └── utils.js         # Formatadores e funcoes auxiliares
│   └── style
│       ├── base.css         # Reset CSS e tipografia padrao
│       ├── charts.css       # Estilos para graficos e tooltips
│       ├── components.css   # Estilos de cards, botoes e inputs
│       ├── layout.css       # Grid principal, header e sidebar
│       ├── modals.css       # Estilos de overlays e popups
│       ├── querie.css       # Media Queries para responsividade
│       ├── styles.css       # Arquivo indice de importacao CSS
│       ├── utilities.css    # Classes auxiliares e animacoes
│       └── variables.css    # Variaveis de cor e temas (Dark/Light)
├── index.html               # Estrutura semantica principal
└── insights.json            # Banco de dados local de dicas financeiras
```

Abaixo, a descricao da organizacao do repositorio e a responsabilidade de cada arquivo principal:

### Raiz
* **index.html**: Arquivo principal contendo a **estrutura semantica** e o layout base da aplicacao.
* **insights.json**: Banco de dados estatico local contendo frases para o recurso de **Dicas Financeiras**.

### JavaScript (`source/js/`)
* **app.js**: Controlador principal (**Entry Point**). Inicializa a aplicacao, configura os **Event Listeners** globais e gerencia o tema.
* **auth.js**: Gerencia o fluxo de **autenticacao**, login, registro e recuperacao de senha.
* **state.js**: Armazena o **estado global** (state) da aplicacao e constantes de texto.
* **storage.js**: Camada de **persistencia** (Model). Gerencia a leitura e escrita no **localStorage**.
* **render.js**: Camada de **visualizacao** (View). Manipula o **DOM** para desenhar listas, cards e atualizar totais.
* **services.js**: Camada de servicos externos. Realiza requisicoes **Fetch** para APIs e arquivos JSON.
* **charts.js**: Responsavel pela logica e renderizacao dos graficos usando a biblioteca **Chart.js**.
* **modals.js**: Controla a abertura, fechamento e logica interna das janelas **modais**.
* **utils.js**: Funcoes utilitarias para **formatacao** (moeda/data), geracao de IDs e validacoes.

### Estilos (`source/style/`)
* **styles.css**: Arquivo indice que importa todos os outros CSS na ordem correta (Cascata).
* **variables.css**: Define as **variaveis CSS** (tokens) para cores e fontes, incluindo suporte a **Dark Mode**.
* **base.css**: Reseta estilos do navegador e define a tipografia base.
* **layout.css**: Estrutura o **Grid** principal, Sidebar e Header.
* **components.css**: Estiliza componentes reutilizaveis como **Cards**, **Botoes** e Inputs.
* **modals.css**: Estilos especificos para as janelas flutuantes e overlays.
* **charts.css**: Estilos para os containers dos graficos e tooltips personalizados.
* **utilities.css**: Classes auxiliares para animacoes, toasts e acessibilidade.
* **querie.css**: Media Queries para garantir a **responsividade** em Tablets e Desktops.

## 4. Decisoes Tecnicas e Arquitetura

A aplicacao foi estruturada utilizando **Modulos ES6** (import/export) para garantir organizacao e manutenibilidade do codigo. A arquitetura segue uma separacao de responsabilidades clara:

* **Model/Persistencia (storage.js e state.js):** Gerencia o **estado global** da aplicacao (appState) e a persistencia de dados no localStorage.
* **View/Renderizacao (render.js e charts.js):** Responsavel por manipular o DOM, criar elementos HTML dinamicamente e renderizar os graficos de analise.
* **Controller/Logica (app.js, auth.js e modals.js):** Gerencia os eventos do usuario, fluxo de autenticacao, validacao de formularios e controle de janelas modais.
* **Servicos (services.js):** Centraliza as comunicacoes externas (**Fetch API**).

### Detalhes de Implementacao dos Requisitos

* **Manipulacao de Arrays:** Foram utilizados extensivamente em `render.js` e `charts.js` os metodos:
    * **filter**: Para filtrar transacoes por mes, conta, tipo e busca textual.
    * **reduce**: Para calcular saldos totais, receitas e despesas.
    * **sort**: Para ordenacao das transacoes por data ou valor.
    * **map**: Para transformacao de dados ao gerar os labels e valores dos graficos.
    * **find**: Para localizar contas e usuarios especificos.
* **Assincronismo (Promises e Async/Await):** O arquivo `services.js` demonstra o dominio de ambas as sintaxes exigidas:
    * A funcao `loadRandomInsight` implementa o fluxo utilizando **Promises** com `.then()` e `.catch()` para carregar o arquivo JSON local de dicas.
    * A funcao `loadExchangeRate` implementa o fluxo utilizando **async/await** e **try/catch** para consumir a API externa de cotacao do dolar.
* **API HTML5 Opcional:**
    * **Canvas API:** Utilizada para renderizacao dos graficos de rosca (despesas) e linhas (sparklines) no arquivo `charts.js`. A manipulacao do contexto 2D do Canvas e usada para criar gradientes visuais nos graficos de linha.

## 5. Funcionalidades Principais

* **Autenticacao:** Sistema de Login e Cadastro com persistencia de sessao via **LocalStorage**.

![Tela de Autenticação](./source/assets/auth-screen-mobile.png|width=200)

* **Dashboard:** Visao geral com saldo total, receitas, despesas, dicas financeiras aleatorias e cotacao do dolar em tempo real.

![Gráfico](./source/assets/app-screen-desktop-graph-1.png|width=400)

* **Gestao de Contas:** Criacao, edicao e exclusao de contas bancarias com calculo automatico de saldo.
* **Gestao de Transacoes:** Adicao de receitas, despesas e transferencias entre contas com validacao de dados.

![Tela de Transação](./source/assets/app-screen-mobile-history.png|width=200)

* **Filtros Avancados:** Barra lateral responsiva para filtrar por mes (atual/anterior), conta especifica, tipo de transacao, categoria e busca textual.

![Filtros](./source/assets/app-screen-desktop-filter.png|width=400)

* **Visualizacao de Dados:** Grafico de rosca para analise de despesas por categoria e mini-graficos de tendencia.
* **Configuracoes:** Alteracao de senha, alternancia de tema (**Dark/Light mode**) e controle de visibilidade de widgets.

## 6. Como Executar

Este projeto utiliza **Modulos ES6 JavaScript**. Por razoes de seguranca (politica de CORS), navegadores modernos bloqueiam a execucao de modulos se o arquivo HTML for aberto diretamente pelo sistema de arquivos.

E necessario utilizar um **servidor HTTP local**.

### Opcao Recomendada (Node.js)

1.  Baixe e extraia o arquivo ZIP do projeto.
2.  Abra o terminal na pasta raiz do projeto.
3.  Execute o comando (caso tenha Node.js instalado):
    `npx http-server .`
4.  Acesse o endereco indicado no terminal (geralmente `http://127.0.0.1:8080`).

### Opcao Alternativa (VS Code)

1.  Abra a pasta do projeto no VS Code.
2.  Instale a extensao "**Live Server**".
3.  Clique com o botao direito no arquivo `index.html` e selecione "**Open with Live Server**".

## 7. Limitacoes Conhecidas

1.  **Backend:** Como e uma aplicacao puramente **Client-Side**, nao ha banco de dados em servidor. Se o cache do navegador for limpo, os dados serao perdidos.
2.  **Seguranca:** As senhas sao armazenadas utilizando uma conversao simples para Hexadecimal (`stringToHex` em `utils.js`) apenas para ofuscacao visual. Em um ambiente de producao, seria obrigatorio o uso de **hash criptografico**.

## 8. Referencias

Documentacao oficial consultada para o desenvolvimento deste projeto:

* **HTML & DOM:** [MDN Web Docs - HTML](https://developer.mozilla.org/pt-BR/docs/Web/HTML)
* **CSS:** [MDN Web Docs - CSS](https://developer.mozilla.org/pt-BR/docs/Web/CSS)
* **JavaScript:** [MDN Web Docs - JavaScript](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)
* **Chart.js:** [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
* **AwesomeAPI (Cotacao):** [AwesomeAPI Documentation](https://docs.awesomeapi.com.br/)

## 9. Declaracao de Uso de IA

Este projeto e de autoria individual. Ferramentas de Inteligencia Artificial foram utilizadas como apoio nas seguintes etapas especificas:

1.  **Explicacao de Codigo:** Apoio no entendimento de conceitos complexos de JavaScript e CSS.
2.  **Criacao da Base do Projeto:** Auxilio na estruturacao inicial dos arquivos e pastas.
3.  **Implementacao de Features:** Sugestoes para a melhor forma de implementar a logica de filtros e graficos.
4.  **Organizacao de Codigo:** Auxilio na modularizacao e limpeza do codigo (refatoracao).
5.  **Auxilio no README:** Estruturacao e redacao da documentacao tecnica.
6.  **Teste de Aplicacao:** Geracao de dados ficticios (massas de teste) e cenarios para validar todas as funcionalidades do sistema.

Todas as decisoes arquiteturais, logica de negocios final e implementacao dos requisitos obrigatorios foram conduzidas e revisadas pelo estudante.