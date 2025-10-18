# Arcadia Retro

Arcadia Retro é uma vitrine digital para celebrar a estética e a jogabilidade dos clássicos dos videogames. O projeto apresenta uma landing page estática que reúne destaques de jogos, contexto histórico, um formulário de inscrição para receber novidades e uma releitura interativa de SimCity.

## Funcionalidades

- **Seção hero** com chamada principal e convite para explorar a coleção.
- **Biblioteca de jogos** com cards responsivos e categorias temáticas.
- **Apresentação do projeto** destacando curadoria, experiência e comunidade.
- **Formulário de inscrição** com feedback visual de confirmação.
- **Layout responsivo** com tipografia inspirada em fliperamas.
- **SimCity Classic jogável** com ferramentas de construção, painel econômico e simulação de energia.
- **Pac-Man Dimension** com labirinto neon, fantasmas inteligentes e modo energético temporário.

## SimCity Classic interativo

A seção dedicada ao SimCity Classic apresenta um tabuleiro 20x20 inspirado na estética retrô futurista do projeto. O objetivo é equilibrar orçamento, energia e humor cívico para expandir a cidade.

### Ferramentas disponíveis

- **Estrada**: conecta zonas e permite que recebam moradores ou empregos.
- **Residencial, Comercial e Industrial**: zonas que geram população, impostos e empregos quando ligadas à rede.
- **Usina**: aumenta a capacidade energética. Sem energia suficiente, as zonas funcionam com capacidade reduzida.
- **Parque**: melhora o humor da população e suaviza momentos de crise.
- **Remover**: libera terrenos, devolvendo parte do investimento.

### Dicas de progresso

1. Trace estradas e instale a primeira usina para garantir energia inicial.
2. Alterne entre zonas residenciais, comerciais e industriais para equilibrar população e empregos.
3. Observe o painel do prefeito: impostos e manutenção são calculados a cada ciclo de tempo.
4. Use parques para recuperar o humor cívico quando o caixa estiver pressionado.

## Pac-Man Dimension

Pac-Man Dimension traz uma releitura neon do clássico arcade, combinando labirintos compactos com fantasmas que perseguem o jogador dinamicamente. A cada partida é possível acumular pontos, acionar o modo energético e disputar combos ao devorar fantasmas vulneráveis.

### Como jogar

1. Clique em **Iniciar rodada** para resetar o labirinto e começar uma nova partida.
2. Utilize as setas do teclado para direcionar o Pac-Man pelas rotas disponíveis.
3. Coma todas as pastilhas para vencer. As pastilhas energéticas permitem capturar fantasmas por alguns segundos e rendem pontos extras.

## Estrutura do projeto

```
.
├── index.html      # Página principal do site
├── scripts.js      # Interações da landing page
├── styles/
│   └── main.css    # Estilos globais do projeto
├── Readme          # Registro original do repositório
└── README.md       # Este guia atualizado
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

3. Abra o arquivo `index.html` diretamente no navegador ou utilize uma extensão de servidor estático (como Live Server) para visualizar a página.

## Personalização

- Atualize as imagens dos cards na seção Biblioteca substituindo as URLs no arquivo `index.html`.
- Ajuste cores, tipografias e efeitos no arquivo `styles/main.css` para adequar a identidade visual.
- Inclua novos scripts em `scripts.js` para ampliar interações ou integrar serviços externos.

## Licença

Este projeto é fornecido para fins educacionais e pode ser adaptado livremente. Consulte os direitos das imagens externas utilizadas antes de distribuir o site publicamente.
