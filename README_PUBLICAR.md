# Loja de Temas — PC Ultra Manager

Este site é estático e pode ser publicado gratuitamente no GitHub Pages, Vercel, Netlify ou Cloudflare Pages.

## O que ele faz

- Usa o mesmo login do app (`/auth/login`).
- Carrega temas do servidor (`/themes/store`).
- Compra tema pelo servidor (`/themes/purchase`).
- Mostra QR Code PIX e PIX Copia e Cola retornados pelo servidor.
- Verifica pagamento (`/themes/orders/{id}/payment-status`).
- Não guarda token do Mercado Pago no front-end.

## Onde configurar a URL do servidor

No começo do arquivo `script.js`:

```js
const API_URL = localStorage.getItem("pcultra_api_url") || "https://pc-ultra-manager-server.onrender.com";
```

## CORS no Render

Adicione o domínio do site na variável `CORS_ORIGINS` do servidor.

Exemplo GitHub Pages:

```env
CORS_ORIGINS=https://alemaozin404.github.io,https://alemaozin404.github.io/loja-temas-pc-ultra
```

Exemplo Vercel:

```env
CORS_ORIGINS=https://loja-temas-pc-ultra.vercel.app
```

## Publicar no GitHub Pages

1. Crie um repositório, por exemplo `loja-temas-pc-ultra`.
2. Envie `index.html`, `style.css`, `script.js` e este README.
3. Vá em `Settings > Pages`.
4. Escolha `Deploy from a branch`.
5. Selecione `main / root`.
6. Aguarde o GitHub gerar o link público.
