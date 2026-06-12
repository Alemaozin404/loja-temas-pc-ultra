# PC Ultra Manager — Loja de Temas Premium

Site estático da loja de temas conectada ao servidor oficial.

## Arquivos

- `index.html` — estrutura da loja
- `style.css` — visual premium/cinema/liquid glass
- `script.js` — login, loja, compra PIX, QR Code e sincronização com servidor

## Publicar no GitHub Pages

1. Crie ou abra o repositório do site.
2. Envie estes arquivos para a raiz do repositório:
   - `index.html`
   - `style.css`
   - `script.js`
   - `README_PUBLICAR.md`
3. Vá em `Settings > Pages`.
4. Use:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Salve e aguarde o link do GitHub Pages.

## CORS no Render

No servidor `pc-ultra-manager-server`, em Environment, configure:

```env
CORS_ORIGINS=https://alemaozin404.github.io,https://alemaozin404.github.io/loja-temas-pc-ultra
```

Depois faça `Manual Deploy > Deploy latest commit`.

## Servidor usado

Por padrão o site chama:

```txt
https://pc-ultra-manager-server.onrender.com
```

Para trocar sem editar o código, abra o console do navegador e rode:

```js
localStorage.setItem("pcultra_api_url", "https://seu-servidor.onrender.com")
```

Depois recarregue a página.


## E-mail após pagamento

A tela de compra agora pede e-mail com função real: após o pagamento aprovado, o servidor envia comprovante, tutorial de ativação, agradecimento, data da assinatura e validade quando o tema for assinatura, como Matrix Effect.

## Atualização — E-mail profissional

O campo de e-mail da compra agora tem função real: depois do pagamento aprovado, o usuário recebe um comprovante com código de suporte, tutorial de ativação na aba Loja de Temas, data da ativação e validade quando for assinatura/evento.
