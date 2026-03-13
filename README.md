# DevRoast

Cole seu código. Receba um roast brutal.

O **DevRoast** analisa trechos de código com uma avaliação honesta (e sarcástica), dando um score de 0 a 10, sugestões de melhoria e um ranking público dos piores códigos já enviados.

## Como funciona

1. **Cole seu código** — na tela inicial, cole qualquer trecho de código que queira avaliar
2. **Ative o Roast Mode** — para comentários com sarcasmo máximo (ou deixe desligado para uma análise mais contida)
3. **Receba o resultado** — score geral, categorias de análise (legibilidade, boas práticas, performance, segurança), diferenças com sugestões de correção
4. **Entre no ranking** — os piores códigos entram no Shame Leaderboard público

## Funcionalidades

- **Score visual** com anel colorido (verde, amarelo ou vermelho) de acordo com a nota
- **Análise por categorias** com badges de severidade (critical, warning, good)
- **Sugestões de correção** com diff colorido mostrando o antes e depois
- **Syntax highlighting** para todas as linguagens populares
- **Shame Leaderboard** — ranking dos códigos mais vergonhosos, ordenados por nota
- **OG Image** — imagem social gerada automaticamente para compartilhar seu resultado

## Sobre o projeto

Este app foi construído durante o evento **NLW** da [Rocketseat](https://rocketseat.com.br), nas aulas do evento. O NLW (Next Level Week) é uma experiência prática e intensiva de programação onde os participantes constroem um projeto completo do zero.

## Rodando localmente

```bash
# Instale as dependências
pnpm install

# Rode o servidor de desenvolvimento
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Tecnologias

- [Next.js 16](https://nextjs.org/) — framework React com App Router
- [Tailwind CSS v4](https://tailwindcss.com/) — estilização utilitária
- [shiki](https://shiki.style/) — syntax highlighting
- [Biome](https://biomejs.dev/) — lint e formatação
