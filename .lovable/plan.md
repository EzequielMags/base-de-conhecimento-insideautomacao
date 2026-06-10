# Plano de atualizações

## 1. Otimização (prioridade máxima)

**Causa raiz da lentidão**: o site re-renderiza tudo a cada troca de rota porque o `AppShell` (sidebar, header, providers) está dentro do `<Routes>`, e os efeitos das skins usam `backdrop-blur`, partículas e transições pesadas em elementos animados.

**Ações**:
- Code-splitting com `React.lazy` em todas as rotas (`/pdfs-tecnicos`, `/scripts`, `/skins`, `/banco-lojas`, etc.). Só a rota visitada baixa o JS.
- Memoizar `CardForm`, `CardGrid` e `SolutionCard` com `React.memo` + `useCallback` nos handlers, e mover a busca do perfil do autor para fora do dialog (cache no `useUserRole`). Isso resolve a lentidão ao digitar no Novo Card.
- Reduzir animações das skins: trocar `backdrop-blur-xl` por `bg-card/95` simples, remover partículas em loop infinito e cortar `transition-all` longos. Manter apenas `fade-in` curto.
- Adicionar `manualChunks` no `vite.config.ts` separando `react`, `@radix-ui`, `framer-motion` e `supabase` em bundles próprios — primeiro carregamento bem mais rápido.

## 2. Music player

- Remover as músicas pré-cadastradas e o seletor antigo.
- Player flutuante fica embaixo à direita (já está), com **ícone de onda sonora** 🌊 fechado.
- Ao clicar, abre um pop-over compacto com:
  - Input "Cole um link do YouTube"
  - Botão Play/Pause, próximo, volume
  - Histórico curto de URLs já coladas (localStorage)
- Player usa YouTube IFrame API escondida, áudio continua tocando ao trocar de aba (já é montado uma vez no `App.tsx`).

## 3. Verificação de conta (aprovação por admin)

**Sem e-mail, sem código — admin libera direto no painel.**

Backend:
- Nova coluna `is_verified boolean default false` em `profiles` (admins já existentes ficam `true` por migração).
- RPC `admin_verify_user(_user_id uuid)` (SECURITY DEFINER, checa `has_role(auth.uid(),'admin')`) que seta `is_verified = true`.
- Políticas das tabelas de escrita (cards, demands, repository_files, etc.) passam a exigir `is_verified = true` além dos roles atuais — usuários não verificados podem ler, mas não criam/editam nada.

Frontend:
- Componente `AccountVerificationGate` global: bloqueia a tela inicial com um pop-up **não-dismissível** se `is_verified = false`.
  - Texto: "Sua conta está aguardando liberação por um administrador."
  - Botão **"Verificar conta"**: re-consulta o status; se já liberado, mostra "Conta verificada! Bem-vindo." e fecha; se não, mostra "Os administradores ainda estão analisando sua conta."
  - O pop-up volta a aparecer mesmo após reload enquanto `is_verified=false`.
- Painel admin (Gerenciamento de usuários, dentro da página atual): cada linha de usuário ganha um badge "Não verificado" + botão **"Liberar conta"** (verde). Clicar chama o RPC e atualiza a lista.
- Admins (e-mails henrique@ e ezequielmagoga07@) já entram verificados.

## 4. Update notes → sino de notificações

Trocar o pop-up atual por um ícone 🔔 no header (canto direito) com badge de não-lidos. Click abre dropdown com as últimas notas; "lido" salvo no localStorage.

## Plano técnico resumido

```text
DB:
  ALTER profiles ADD is_verified boolean default false
  UPDATE profiles SET is_verified=true WHERE id IN (admins existentes)
  CREATE FUNCTION admin_verify_user(_user_id uuid) ...
  Ajustar policies INSERT/UPDATE das tabelas de conteúdo p/ exigir is_verified

Frontend:
  src/App.tsx                → React.lazy + <Suspense>
  vite.config.ts             → manualChunks
  src/components/CardForm    → memo + handlers estáveis
  src/hooks/use-theme-skin   → remover blur/partículas pesadas
  src/components/FloatingMusicPlayer + BackgroundMusicPlayer → reescrever
                              com YouTube IFrame + popover
  src/components/AccountVerificationGate (novo)
  src/components/UserSettings (já admin panel) → botão Liberar conta
  src/components/UpdateNotes → vira NotificationBell no Header
```

## O que não vou mexer

- Esquema de roles (admin/user/read) e regras de signup por domínio continuam iguais.
- Conteúdo das tabelas existentes não é apagado.
- Buckets públicos continuam públicos (mudar quebraria as imagens).

Confirma para eu aplicar tudo de uma vez?
