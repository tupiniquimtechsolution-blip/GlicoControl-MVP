---
name: tupiniquim-toolbox
description: Contrato universal de execução da Tupiniquim para planejamento, implementação, auditoria, segurança, UI/UX, pesquisa, prompts e adoção segura de ferramentas.
---

# Tupiniquim Toolbox — GlicoControl

## Método obrigatório

1. Inspecione o estado real do repositório antes de editar.
2. Identifique a categoria da tarefa e carregue somente referências pertinentes.
3. Preserve arquitetura, escopo e decisões existentes.
4. Não copie código externo cegamente; valide licença, dependências, manutenção, risco e compatibilidade.
5. Aplique a baseline de segurança.
6. Execute checks existentes e registre evidências.
7. Transforme achados reais em Issues pequenas, verificáveis e priorizadas quando necessário.
8. Finalize com arquivos alterados, checks executados, riscos restantes, referências usadas e próximo passo.

## Loadout deste projeto

- UI/UX/design system → UI UX Pro Max.
- Motion/microinterações → emilkowalski/skills somente sob demanda.
- Engineering workflow/quality → Vibe Coding Toolkit como referência.
- Supabase → platform source aprovada para este projeto, com RLS obrigatório.
- Pentest/remediação → Strix somente no próprio projeto/ambiente autorizado e antes de release.
- Taste Skill → não carregar por padrão; o produto é data-heavy/dashboard/mobile multi-step.

## Segurança

- Nunca exponha secrets, tokens, cookies, senhas ou chaves.
- Autenticação/autorização sensíveis devem ser verificadas no servidor/banco.
- Valide entradas e considere injection, abuso de API, path traversal e vazamento de dados conforme a stack.
- Rate limiting em autenticação, recuperação de senha e endpoints sensíveis/caros.
- Mudanças destrutivas, migrações irreversíveis, publicação externa e alteração de dados reais exigem aprovação.
