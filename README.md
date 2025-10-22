# wp-missing-assets-resolver

Ferramenta Node.js para identificar e baixar automaticamente imagens ausentes do diretório `/wp-content/uploads` de um site WordPress, tanto as referenciadas no tema quanto no banco de dados. Gera relatórios organizados a cada execução.

## Funcionalidades

- Busca imagens referenciadas no código do tema ativo (PHP, Blade, JS, SCSS, CSS, HTML).
- Busca imagens referenciadas no banco de dados (posts, campos personalizados, opções, etc).
- Baixa automaticamente as imagens ausentes do site de produção para o ambiente local.
- Gera relatórios de imagens baixadas e ausentes, organizados por data/hora.
- Detecta automaticamente o tema ativo e o domínio de produção (opcional).

## Pré-requisitos

- Node.js 16+
- Banco de dados MySQL acessível (ex: via Lando, Docker, LocalWP, etc)
- Permissão de escrita na pasta do projeto

## Instalação

1. Instale as dependências:
   ```bash
   npm install mysql2 follow-redirects
   ```
2. Ajuste as credenciais do banco de dados nos arquivos de script, se necessário.

## Como usar

1. Coloque os arquivos do projeto na pasta `wp-missing-assets-resolver/` do seu projeto WordPress local.
2. Execute o script principal:
   ```bash
   node wp-missing-assets-resolver/download-all-missing-assets.js
   ```
3. O script irá:
   - Buscar imagens no tema ativo e no banco de dados
   - Baixar as ausentes do site de produção
   - Gerar um relatório em `wp-missing-assets-resolver/relatorios/<data-hora>-download-imagens-relatorio/`

## Estrutura dos scripts

- `download-all-missing-assets.js`: Script principal, orquestra tudo e gera relatório unificado.
- `download-theme-missing-assets.js`: Módulo para varredura do tema ativo.
- `download-db-missing-assets.js`: Módulo para varredura do banco de dados.

## Relatórios

- Cada execução gera uma pasta em `wp-missing-assets-resolver/relatorios/` com data/hora.
- Arquivos:
  - `download-imagens.txt`: URLs das imagens baixadas.
  - `imagensausentes.txt`: URLs das imagens ausentes em produção.

## Observações

- O script não sobrescreve imagens já existentes localmente.
- O domínio de produção pode ser ajustado nos scripts, ou lido do banco de dados.
- Ideal para ambientes de desenvolvimento, staging ou migração.

## Licença

MIT

---

**Autor:** Seu Nome

Contribuições e sugestões são bem-vindas!
