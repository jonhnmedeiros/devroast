# Editor com Syntax Highlighting

## Contexto

A homepage do DevRoast tem um editor de codigo onde o usuario cola um trecho para ser "roasted". Hoje e um `<textarea>` sem highlight. Precisamos adicionar syntax highlighting em tempo real e deteccao/selecao de linguagem.

## Pesquisa

### Como o ray-so faz

O ray-so (Raycast) **nao usa nenhuma lib de editor** (nem CodeMirror, nem Monaco). Usa o pattern classico de **textarea transparente sobre um div com HTML highlighted**:

- `<textarea>` invisivel (captura input, selecao, undo/redo nativo do browser)
- `<div>` com `dangerouslySetInnerHTML` renderizando o output do **shiki** por baixo
- Comportamentos manuais: tab/shift-tab para indent, enter com auto-indent, bracket dedent
- **shiki** para highlighting (WASM, lazy-load de grammars)
- **highlight.js** apenas para auto-deteccao de linguagem (nunca renderiza)
- Temas via CSS variables customizadas (`createCssVariablesTheme` do shiki com prefixo `--ray-`)
- 66 linguagens suportadas com lazy-loading

### Opcoes avaliadas

| Opcao | Bundle incremental | UX de edicao | Consistencia visual | Fit pro DevRoast |
|-------|-------------------|--------------|---------------------|------------------|
| **react-simple-code-editor + shiki** | ~3 KB (shiki ja instalado) | Aceitavel (paste-focused) | Identica ao CodeBlock existente | Ideal |
| **CodeMirror 6** | ~135 KB gzip | Excelente (editor real) | Tema novo necessario | Overkill |
| **Monaco** | ~860 KB gzip | Melhor possivel | Tema novo necessario | Muito pesado |
| **Prism + textarea** | ~12 KB + shiki duplicado | Aceitavel | Inconsistente com CodeBlock | Redundante |
| **Textarea + shiki (manual, estilo ray-so)** | ~0 KB (shiki ja instalado) | Customizavel | Identica ao CodeBlock | Boa, mais controle |

### Deteccao de linguagem

| Abordagem | Precisao | Bundle | Nota |
|-----------|----------|--------|------|
| **highlight.js `highlightAuto()`** | Boa (10+ linhas) | ~50 KB (subset) | Madura, usada pelo ray-so |
| **Heuristica custom** | Boa para top 10 linguagens | 0 KB | Regex simples, cobre 80% dos casos |
| **Combinacao** | Melhor dos dois | ~50 KB | Heuristica primeiro, hljs como fallback |

## Decisao

### Editor: textarea transparente + shiki (inspirado no ray-so)

Motivos:
- **Zero bundle adicional** — shiki v4 ja esta no projeto
- **Consistencia visual total** — mesmo highlighter e tema (`vesper`) do CodeBlock
- **Controle total** — podemos implementar exatamente o comportamento que queremos
- **Simplicidade** — para um fluxo paste-focused com snippets pequenos (~50 linhas), nao precisamos de um editor completo

A lib `react-simple-code-editor` tambem seria viavel (3 KB), mas como o pattern e simples e queremos controle sobre o comportamento, fazer manual (como o ray-so) da mais flexibilidade sem dependencia extra.

### Deteccao: highlight.js (auto) + dropdown manual

Motivos:
- `hljs.highlightAuto()` e a solucao mais madura para deteccao
- Subset de ~15-20 linguagens mais comuns mantem o bundle razoavel
- Dropdown no header do editor permite correcao manual
- Deteccao roda no `onPaste` / debounce apos digitacao

## Especificacao

### Componente: `CodeEditor`

- **Tipo**: Client component (`"use client"`)
- **Local**: `src/components/ui/code-editor.tsx`
- **Pattern**: `twMerge` + forwardRef (sem `tv()` — nao tem variantes)

### Estrutura visual

```
+--------------------------------------------------+
| [header: 3 dots + language dropdown]             |
|--------------------------------------------------|
| [line numbers] | [textarea + highlighted overlay] |
|                |                                  |
|                |                                  |
+--------------------------------------------------+
```

- Header com window dots (red/amber/green) e dropdown de linguagem no lado direito
- Coluna de line numbers (read-only, sincronizada com o conteudo)
- Area de codigo: textarea transparente sobreposta ao div com highlight
- Visual identico ao editor mockado no design atual da homepage

### Comportamento

1. **Paste**: usuario cola codigo, textarea captura, highlight e aplicado via shiki, linguagem e auto-detectada
2. **Digitacao**: highlight atualizado com debounce (~150ms) para nao travar
3. **Tab**: insere 2 espacos (nao muda foco)
4. **Shift+Tab**: remove indent
5. **Linguagem**: auto-detectada no paste, exibida no dropdown, editavel manualmente
6. **Placeholder**: texto placeholder visivel quando editor vazio (ex: `// cole seu codigo aqui...`)

### Deteccao de linguagem

- Importar highlight.js core + subset de linguagens (js, ts, python, java, go, rust, ruby, php, swift, sql, html, css, bash, c, cpp)
- Rodar `hljs.highlightAuto(code, languageSubset)` no paste e apos debounce de digitacao
- Se o usuario selecionar manualmente no dropdown, desabilitar auto-detect e usar a escolha do usuario
- Se o usuario limpar a selecao, voltar para auto-detect

### Highlighting

- Usar `codeToHtml` do shiki com tema `vesper` (ja em uso no projeto)
- Inicializar highlighter client-side com `getHighlighterCore` + WASM
- Pre-carregar grammars das linguagens mais comuns
- Lazy-load grammars menos comuns quando selecionadas no dropdown
- Output: HTML injetado via `dangerouslySetInnerHTML` no div overlay

### Dropdown de linguagem

- Posicionado no header do editor, lado direito
- Usar primitivo de `@base-ui/react` (Select ou Popover) para acessibilidade
- Lista as linguagens suportadas
- Mostra a linguagem atual (detectada ou selecionada)
- Indicador visual quando e auto-detect vs selecao manual

### Props expostas

```ts
type CodeEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  language?: string;
  onLanguageChange?: (language: string) => void;
  placeholder?: string;
  className?: string;
};
```

### Dependencias novas

- `highlight.js` — apenas para deteccao de linguagem (nao para rendering)

### Impacto no bundle

- highlight.js core + 15 linguagens: ~50 KB gzip (carregado apenas client-side na homepage)
- shiki grammars: ja carregados no projeto (lazy-load conforme necessario)

## TODOs de implementacao

- [ ] Instalar `highlight.js`
- [ ] Criar componente `CodeEditor` em `src/components/ui/code-editor.tsx`
- [ ] Implementar textarea + div overlay com sincronizacao de scroll
- [ ] Integrar shiki client-side (inicializacao com `getHighlighterCore` + WASM)
- [ ] Implementar highlight com debounce (~150ms)
- [ ] Implementar line numbers sincronizados
- [ ] Implementar deteccao de linguagem via `hljs.highlightAuto()`
- [ ] Criar dropdown de linguagem com `@base-ui/react`
- [ ] Implementar tab/shift-tab para indent/dedent
- [ ] Substituir o textarea atual da homepage pelo `CodeEditor`
- [ ] Testar com snippets de diferentes linguagens
- [ ] Verificar performance com snippets de ~50 linhas
- [ ] Atualizar AGENTS.md com documentacao do componente
