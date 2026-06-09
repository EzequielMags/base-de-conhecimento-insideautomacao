# Plano de implementação

## 1) Otimização (navegação, carregamento inicial, animações)

**Causas atuais:**
- Cada página recarrega `Header`, `AppSidebar`, `SidebarProvider` do zero
- Imports síncronos de todas as páginas no `App.tsx` inflam o bundle inicial
- Skins usam gradientes/blur pesados aplicados globalmente
- Várias animações em loop (pulses, bounces) sempre ativas
- Re-renders por contexto (Theme/Skin) propagam pra tudo

**Mudanças:**
- `App.tsx`: converter rotas para `React.lazy` + `Suspense`, mantendo Auth/Index eager
- Criar layout pai `<AppLayout>` (SidebarProvider + AppSidebar + Header) usado via `<Outlet/>` para evitar remount a cada rota
- Reduzir blur/saturate dos skins (`backdrop-blur-xl` → `md`, remover `saturate(1.5)`)
- `framer-motion`: trocar imports default por `motion/react` lazy onde for animação pontual; remover animações infinitas fora da viewport (`whileInView`)
- `useThemeSkin`/`useTheme`: memoizar value e mover persistência pra debounce
- Remover `HoverSoundEffect` global ou só pré-carregar áudio quando necessário
- Adicionar `loading="lazy"` em imagens de cards
- `vite.config`: ativar manualChunks separando recharts/jszip/framer-motion

## 2) Minha Pasta — visual Windows Explorer + cópia real

- Substituir o grid de cards por **tabela** (`<table>`) com colunas:
  - Ícone + Nome | Data de modificação | Tipo | Tamanho
  - Hover/seleção igual Explorer escuro (linha destacada)
  - Click = seleciona; duplo-click = abrir (preview/download); botão direito = menu (Copiar, Baixar, Excluir, Copiar link)
- Toolbar superior compacta (Voltar, Novo, Upload, Excluir, Buscar à direita)
- **Copiar arquivo real**: substituir `handleCopyFile` por estratégia que:
  - Imagens → `ClipboardItem` com o blob real (já funciona)
  - PDF/texto/outros → tenta `ClipboardItem` com mime nativo (Chromium suporta); se falhar (Firefox/Safari), **baixa automaticamente o arquivo** com toast "Arquivo baixado — navegador não permite copiar este tipo direto"
  - Remove o erro toast atual; sempre conclui com sucesso (cópia OU download silencioso)
- Adicionar suporte a arrastar arquivo da página pro Explorer do Windows (atributo `draggable` + `DownloadURL` no `dragstart`)

## 3) Verificação por código no 1º login

**Banco:**
- Coluna `profiles.email_verified BOOLEAN DEFAULT false`
- Tabela `email_verifications`: user_id, code_hash, expires_at, attempts, status
- Marcar admins (`henrique@`, `ezequielmagoga07@`) como `email_verified = true` automaticamente para não travarem
- Demais contas existentes: `email_verified = false` (terão que verificar 1x conforme pedido)
- RPCs: `request_verification_code()` (gera código, salva hash, retorna ok), `verify_email_code(code)` (valida e marca profile)

**Edge function `send-verification-code`:**
- Recebe user_id da sessão
- Gera código de 6 dígitos
- Salva hash via RPC
- Envia e-mail HTML para `suporte@insideautomacao.com.br` com: nome, e-mail do solicitante, código, validade 15 min
- Usa conector **Resend** (remetente `onboarding@resend.dev` — funciona sem domínio próprio)

**Frontend:**
- Novo componente `EmailVerificationGate` envolvendo `PrivateRoute`
- Ao logar: consulta `profiles.email_verified`; se false → tela bloqueante com:
  - Botão "Enviar código para suporte@insideautomacao.com.br"
  - Input de 6 dígitos + botão "Verificar"
  - Link "Reenviar" (cooldown 60s)
- Após verificar com sucesso → libera o app permanentemente

## Pré-requisito do usuário
Você precisará **conectar o Resend** (workspace connector). Vou disparar o picker — basta autorizar; sem ele a função de envio não funciona. Se preferir outro provedor (ex: domínio próprio via Lovable Emails), me avise.

## Ordem de execução
1. Conectar Resend
2. Migração (verificação + grants + admins liberados)
3. Edge function `send-verification-code`
4. Frontend: `EmailVerificationGate`
5. Refator Minha Pasta (tabela + cópia)
6. Otimizações (lazy routes, layout pai, skins mais leves, vite chunks)

Responda **aprovado** para eu executar, ou ajuste o que quiser mudar.