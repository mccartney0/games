# Arcadia Retro

Arcadia Retro é uma vitrine digital para celebrar a estética e a jogabilidade dos clássicos dos videogames. Agora cada jogo possui uma página própria com arquivos HTML, CSS e JavaScript dedicados, facilitando a manutenção e a expansão da coleção.

## Funcionalidades

- **Landing page temática** com destaques, biblioteca de clássicos e formulário de inscrição.
- **Página do SimCity Classic** com tabuleiro 20x20, painel econômico e ferramentas de construção independentes.
- **Página do Pac-Man Dimension** com labirinto neon, fantasmas inteligentes e modo energético temporário.
- **Arquitetura modular**: cada jogo tem sua pasta com ativos isolados.
- **Estilo retrô futurista** aplicado em todas as páginas.

## Estrutura do projeto

```
.
├── assets/
│   ├── css/
│   │   ├── base.css       # Estilos globais compartilhados
│   │   ├── home.css       # Estilos da landing page
│   │   ├── pacman.css     # Estilos da página Pac-Man Dimension
│   │   └── simcity.css    # Estilos da página SimCity Classic
│   └── js/
│       ├── home.js        # Interações da landing page
│       ├── pacman.js      # Lógica do jogo Pac-Man Dimension
│       └── simcity.js     # Lógica do jogo SimCity Classic
├── index.html             # Página inicial com apresentação da coleção
├── pages/
│   ├── pacman/
│   │   └── index.html     # Página dedicada ao Pac-Man Dimension
│   └── simcity/
│       └── index.html     # Página dedicada ao SimCity Classic
├── Readme                 # Registro original do repositório
└── README.md              # Este guia atualizado
```

## Como executar localmente

1. Faça o clone do repositório:

   ```bash
   git clone <url-do-repositorio>
   ```

2. Acesse a pasta do projeto:

   ```bash
   cd games
   ```

3. Abra o arquivo `index.html` diretamente no navegador ou utilize uma extensão de servidor estático (como Live Server) para visualizar a landing page. As páginas dos jogos ficam em `pages/simcity/index.html` e `pages/pacman/index.html`.

## Personalização

- Para adicionar um novo jogo, crie uma pasta em `pages/` com seus arquivos HTML, CSS e JavaScript e importe os ativos necessários a partir de `assets/`.
- Ajuste cores, tipografias e efeitos globais no arquivo `assets/css/base.css`.
- Atualize os conteúdos da página inicial em `index.html` para destacar novos títulos ou eventos.

## Licença

Este projeto é fornecido para fins educacionais e pode ser adaptado livremente. Consulte os direitos das imagens externas utilizadas antes de distribuir o site publicamente.
