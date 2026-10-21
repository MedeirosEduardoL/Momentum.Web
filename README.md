# Momentum.Web

Front React do Momentum, gerenciador de trabalho com cards e IA para o P.O e para o
desenvolvedor; os chamados virão do Megabrain. Consome a API do [Momentum.Core](../Momentum.Core), que fica na pasta
irmã.

O repositório é preparado para desenvolvimento agêntico com o Claude Code:

| Onde | O quê |
| --- | --- |
| [`CLAUDE.md`](CLAUDE.md) | Guia do agente: produto, comandos, diretrizes, regras e arquitetura FSD |
| [`../Momentum.Core/ai/roadmap.md`](../Momentum.Core/ai/roadmap.md) | Roadmap do produto, com os passos **[Web]** |
| [`../Momentum.Core/CONTEXT.md`](../Momentum.Core/CONTEXT.md) | Glossário do produto |
| [`.claude/rules/`](.claude/rules) | Regras por camada, carregadas pelo caminho do arquivo |
| [`.claude/skills/`](.claude/skills) | Receitas: `new-feature`, `deliver`, `teach`… |
| [`.claude/hooks/`](.claude/hooks) | Início de sessão, guarda de edição e portão de fim de turno |
| [`ai/knowledge/`](ai/knowledge) | Invariantes ligados ao código por caminho |
| [`ai/memory/`](ai/memory) | Mapa das telas, notas por assunto e changelog |

Para rodar: `nvm use`, `npm ci` e `npm start`; `npm run quality` é o CI local (detalhes em
[`CLAUDE.md`](CLAUDE.md)).
