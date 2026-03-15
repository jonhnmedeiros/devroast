# specs/ — Formato de Especificacao

Toda feature nova deve ter uma spec em `specs/` **antes** da implementacao comecar. A spec e o contrato entre o planejamento e a execucao.

## Nome do arquivo

`specs/<feature-slug>.md` — slug curto e descritivo (ex: `drizzle.md`, `editor.md`, `ai-roast.md`).

## Estrutura obrigatoria

```markdown
# Titulo da Feature

## Contexto

O que existe hoje e por que essa mudanca e necessaria. 2-3 frases.

## Decisoes

Tecnologias escolhidas, patterns adotados, e o motivo de cada escolha.
Se houve pesquisa/comparacao, incluir tabela resumida.

## Especificacao

O que vai ser construido. Inclui:
- Estrutura de arquivos criados/modificados
- Schemas, tipos, interfaces (com blocos de codigo)
- Comportamentos e regras de negocio
- Props/APIs expostas

## TODOs de implementacao

Checklist ordenado com todas as tarefas necessarias.
Usar `- [ ]` para cada item. Marcar `- [x]` conforme completa.
```

## Regras

1. **Seja preciso** — blocos de codigo, tabelas de schema, assinaturas de funcao. Nada generico.
2. **Sem prosa desnecessaria** — spec nao e documentacao. E instrucao de implementacao.
3. **Mapeie ao design** — se a feature tem tela no Pencil, conectar cada campo/componente ao design.
4. **Inclua dependencias** — listar pacotes a instalar e impacto no bundle.
5. **Checklist no final** — ordem de execucao. Cada item e uma unidade de trabalho atomica.
