# Casos de Teste - Cuidado Floral

Documento atualizado a partir da leitura do projeto em `src/` e `server/`.
Reflete o estado atual após a migração para MySQL, a inclusão de cadastro
público, troca de senha, perfil consolidado da paciente, agenda das voluntárias
com fluxo de claim e o painel admin com abas de Doações e Atividades.

## Premissas

- Ambiente local com `npm run dev` (sobe API em `http://localhost:3001` e
  front-end em `http://localhost:5173` via `concurrently`).
- Banco MySQL (Railway ou local) configurado via `.env` (`MYSQL_URL` ou
  variáveis `MYSQLHOST/MYSQLPORT/MYSQLUSER/MYSQLPASSWORD/MYSQLDATABASE`).
- O servidor faz `testConnection()` no boot — falha de conexão impede subida.
- Não existe mais `npm run seed` nem JSON store; dados de teste devem ser
  inseridos diretamente no banco (tabelas: `usuarios`, `pacientes`, `doadores`,
  `voluntarias`, `atendimentos`, `atendimento_anexos`, `doacoes`,
  `notificacoes`, `horas_voluntarias`, `agenda_voluntarias`, `campanhas`,
  `setores`).
- Para os testes que exigem usuário logado, cadastre uma conta pelo próprio
  fluxo de registro ou insira manualmente no banco com `senha_hash` gerado por
  `bcrypt.hashSync("123", 10)`.

---

## 1. Autenticação e Sessão

### CT-AUTH-001 - Login válido por perfil

**Funções cobertas:** `AuthScreen`, `loginWithDemoAccount`, `POST /api/auth/login`, `setAuthToken`, `App`

**Pré-condições:** usuários ativos no banco para cada um dos perfis (admin,
voluntária, paciente, doador).

**Passos:**

1. Abrir a tela inicial em `/`.
2. Selecionar a aba `Entrar`.
3. Informar e-mail e senha válidos.
4. Clicar em `Entrar`.

**Resultado esperado:**

- API responde `200` com `{ token, role, name }`.
- Token persiste em `localStorage` na chave `cf:session-token`.
- Role persiste em `localStorage` na chave `cf:session-role`.
- O `App` renderiza a área correta:
  - admin → `AdminArea`
  - voluntaria → `VolunteerArea`
  - paciente/doador → `UserArea`

### CT-AUTH-002 - Login com senha inválida

**Funções cobertas:** `POST /api/auth/login`, `bcrypt.compareSync`

**Dados:** e-mail existente / senha errada.

**Resultado esperado:**

- API retorna `401`.
- Mensagem exibida: `E-mail ou senha incorretos. Por favor, tente novamente.`
- Nenhum token é salvo.

### CT-AUTH-003 - Login sem e-mail ou senha

**Funções cobertas:** `POST /api/auth/login`

**Passos:** chamar API com body sem `email`, sem `password` ou ambos vazios.

**Resultado esperado:**

- API retorna `400`.
- Mensagem: `Informe e-mail e senha.`

### CT-AUTH-004 - Login com usuário inativo

**Funções cobertas:** `POST /api/auth/login`

**Pré-condições:** usuário existente com `status = 'Inativo'`.

**Resultado esperado:**

- API retorna `401` com a mesma mensagem genérica de credenciais inválidas
  (filtro `status = "Ativo"` na consulta de login).

### CT-AUTH-005 - Cadastro público válido

**Funções cobertas:** `AuthScreen` (aba Cadastrar), `registerAccount`, `POST /api/auth/register`

**Dados:** nome, e-mail novo, CPF novo (11 dígitos), senha, tipo
(`paciente`, `doador` ou `voluntaria`).

**Resultado esperado:**

- Cria registro em `usuarios` (transação) e o registro auxiliar conforme tipo:
  - paciente → `pacientes` com `id_paciente = pat-<id>`, `prioridade = 'media'`
  - doador → `doadores` com `id_doador = doa-<id>`
  - voluntaria → `voluntarias` com `id_voluntaria = vol-<id>`
- Retorna `{ token, role, name }` e o usuário entra logado automaticamente.

### CT-AUTH-006 - Cadastro com e-mail ou CPF duplicado

**Funções cobertas:** `POST /api/auth/register`

**Resultado esperado:**

- API retorna `400` com mensagem `Este E-mail ou CPF já estão cadastrados.`
- Nenhum registro é criado (rollback da transação).

### CT-AUTH-007 - Cadastro com campos faltantes

**Resultado esperado:**

- API retorna `400` com `Preencha todos os campos obrigatórios.`

### CT-AUTH-008 - Logout limpa sessão

**Funções cobertas:** `clearSession`, `setAuthToken`, `App.handleLogout`

**Resultado esperado:**

- Remove `cf:session-token` e `cf:session-role` do `localStorage`.
- App volta para `AuthScreen`.

### CT-AUTH-009 - Token ausente em rota protegida

**Funções cobertas:** hook `onRequest`, `requireRole`

**Passos:** chamar `GET /api/appointments` sem `Authorization`.

**Resultado esperado:** API retorna `401` com `Sessão expirada ou inválida.`

### CT-AUTH-010 - Papel sem permissão

**Funções cobertas:** `requireRole`

**Passos:** logar como paciente e chamar `GET /api/users` com seu token.

**Resultado esperado:** API retorna `403` com `Você não tem permissão para esta ação.`

### CT-AUTH-011 - 401 no front força logout

**Funções cobertas:** `apiRequest`, `onUnauthorized`, `App`

**Passos:** alterar manualmente `cf:session-token` para valor inválido e
disparar uma ação autenticada.

**Resultado esperado:** `apiRequest` remove token, dispara handler de
`onUnauthorized` e a aplicação retorna à tela de login.

### CT-AUTH-012 - Troca de senha bem-sucedida

**Funções cobertas:** `ChangePasswordButton`, `ChangePasswordModal`,
`changePassword`, `POST /api/auth/change-password`, `updateUserPasswordHash`

**Passos:**

1. Estar logado (qualquer perfil).
2. Clicar no botão `Senha` na navbar.
3. Preencher senha atual válida, nova senha (≥ 6 caracteres) e confirmação.

**Resultado esperado:**

- Mensagem verde `Senha atualizada com sucesso.`
- Novo `bcrypt` hash gravado em `usuarios.senha_hash`.
- Login subsequente exige a nova senha.

### CT-AUTH-013 - Troca de senha com senha atual incorreta

**Resultado esperado:**

- API retorna `401` com `Senha atual incorreta.`
- Mensagem exibida no modal em vermelho.

### CT-AUTH-014 - Troca de senha com nova senha curta

**Resultado esperado:**

- Validação front-end: `A nova senha deve ter ao menos 6 caracteres.`
- API também valida (`400` com a mesma mensagem) caso o front seja burlado.

### CT-AUTH-015 - Troca de senha com nova igual à atual

**Resultado esperado:** mensagem `A nova senha deve ser diferente da atual.`
(validada tanto no front quanto na API).

### CT-AUTH-016 - Troca de senha com confirmação divergente

**Resultado esperado:** validação front-end:
`A confirmação não confere com a nova senha.`

---

## 2. API, Persistência (MySQL) e Conexão

### CT-API-001 - Health check

**Resultado esperado:** `GET /api/health` retorna `{ "status": "ok" }`.

### CT-DB-001 - Conexão MySQL no boot

**Funções cobertas:** `testConnection`

**Resultado esperado:** ao subir o servidor, log
`✅ MySQL (Railway) conectado com sucesso.` ou falha rápida se variáveis de
ambiente estiverem incorretas.

### CT-DB-002 - Usuários sem hash exposto

**Funções cobertas:** `toManagedUsers`, `GET /api/users`

**Resultado esperado:**

- Lista de usuários contém `id`, `name`, `email`, `cpf`, `type`, `status`, `date`.
- Nenhum item contém `passwordHash`.

### CT-DB-003 - Conversão de datas para MySQL

**Funções cobertas:** `toMysqlDatetime`, `toIso`

**Resultado esperado:** datas ISO (`YYYY-MM-DDTHH:MM:SS...Z`) são salvas no
formato `YYYY-MM-DD HH:MM:SS`; ao serem lidas voltam como ISO 8601.

### CT-DB-004 - Save em transação atômica

**Funções cobertas:** `saveUsers`, `saveAppointments`, `saveDonations`,
`saveNotifications`, `saveVolunteerHours`

**Resultado esperado:**

- Erro no meio do lote dispara `rollback`; nenhum registro fica
  parcialmente gravado.
- Para listas (atendimentos, doações, notificações, horas), itens não
  presentes no payload final são apagados (`DELETE WHERE id NOT IN (...)`).

---

## 3. Domínio (src/domain) e Utilitários

### CT-DOM-001 - `getAuthToken` / `setAuthToken`

**Resultado esperado:**

- `setAuthToken("abc")` grava em `cf:session-token`.
- `setAuthToken(null)` remove a chave.
- `getAuthToken()` retorna o valor salvo ou `null` (também `null` em SSR).

### CT-DOM-002 - `apiRequest` adiciona Authorization

**Resultado esperado:** request envia `Authorization: Bearer <token>` quando há
token salvo e `omitAuth` não foi pedido.

### CT-DOM-003 - `apiRequest` trata erro com payload

**Resultado esperado:** lança `Error(message)` com a mensagem retornada pelo
backend (ex.: `Você não tem permissão para esta ação.`).

### CT-DOM-004 - `apiRequest` 401 dispara `onUnauthorized`

**Resultado esperado:** em resposta `401` (fora de `suppressUnauthorizedHandler`)
remove token, chama o handler registrado e lança
`Sessão expirada. Faça login novamente.`

### CT-DOM-005 - `getLoggedUser` decodifica o JWT

**Resultado esperado:** com token válido, retorna `{ sub, role, name }`.
Sem token ou com token malformado, retorna `null`.

### CT-DOM-006 - `buildAppointmentId`

**Resultado esperado:** prefixo `apt-` e duas chamadas geram IDs diferentes.

### CT-DOM-007 - `buildNotificationId`

**Resultado esperado:** prefixo `nt-` e IDs únicos por chamada.

### CT-DOM-008 - `buildDonationId`

**Resultado esperado:** prefixo `don-` e IDs únicos por chamada.

### CT-DOM-009 - `buildDonationProtocol`

**Resultado esperado:** retorna protocolo rastreável (formato derivado do
timestamp), diferente a cada chamada.

### CT-DOM-010 - Permissões dos loaders/savers

**Funções cobertas:** wrappers em `domain/patient-data`, `donor-data`,
`patients-data`, `volunteer-data`, `admin-data`, `sectors-data`.

**Resultado esperado:** chamadas a endpoints protegidos por papel respeitam
as regras (ver Seção 9). Wrappers do front apenas delegam para `apiRequest`.

---

## 4. Upload e Anexos

### CT-UP-001 - Upload sem arquivos

**Funções cobertas:** `uploadAttachments`

**Resultado esperado:** retorna `[]` sem fazer request.

### CT-UP-002 - Upload de PDF válido

**Funções cobertas:** `uploadAttachments`, `POST /api/uploads`, `safeFilename`,
`makeUploadId`, `isAllowedAttachment`

**Resultado esperado:**

- API responde com array `{ id, filename, mimeType, size, url, uploadedAt }`.
- Arquivo salvo em `server/data/uploads/<id>/<filename>`.

### CT-UP-003 - Upload de JPG válido

**Resultado esperado:** mesmo comportamento de CT-UP-002.

### CT-UP-004 - Upload de formato inválido (front)

**Funções cobertas:** validações no modal de solicitar atendimento (paciente).

**Resultado esperado:** arquivo `.txt`/`.docx`/`.png` não entra na lista;
mensagem indica que só PDF ou JPG são aceitos.

### CT-UP-005 - Upload de formato inválido (API)

**Resultado esperado:** API retorna `415` com
`Formato não suportado em "<arquivo>". Envie apenas PDF ou JPG.`

### CT-UP-006 - Upload maior que 10 MB

**Resultado esperado:** API responde `413` com `Arquivo excede o limite de 10 MB.`

### CT-UP-007 - Mais de 10 arquivos por request

**Resultado esperado:** request multipart estoura limite do plugin
(`files: 10`) e retorna erro.

### CT-UP-008 - Nome de arquivo inseguro

**Funções cobertas:** `safeFilename`

**Resultado esperado:** caracteres especiais são substituídos por `_` e nome
final tem no máximo 120 caracteres. Não há escape para fora de `uploads/`.

### CT-UP-009 - `AppointmentAttachments` renderiza lista

**Funções cobertas:** `AppointmentAttachments` em
`user-area/patient/appointment-attachments.tsx`.

**Resultado esperado:** ícones diferentes para PDF e imagens, tamanho
formatado em B/KB/MB.

---

## 5. Área da Paciente

### CT-PAC-001 - Carregamento do dashboard

**Funções cobertas:** `PatientDashboard`, `loadAppointments`,
`loadNotifications`, `loadPatientProfile`.

**Resultado esperado:**

- Carrega `Appointment[]`, `AppNotification[]` e `PatientProfile` da API.
- Exibe seções de perfil, atendimentos e notificações.

### CT-PAC-002 - Perfil consolidado da paciente (GET)

**Funções cobertas:** `GET /api/patients/profile`, `getPatientProfileByUserId`.

**Resultado esperado:**

- Paciente: retorna o próprio perfil (ignora `userId` da query).
- Admin/voluntária: aceita `?userId=<n>` e retorna o perfil correspondente.
- Sem `userId` retorna `400`; perfil inexistente retorna `404`.

### CT-PAC-003 - Edição do perfil (PUT)

**Funções cobertas:** `PUT /api/patients/profile`, `savePatientProfile`.

**Dados:** name, email, phone (obrigatórios); birthDate, city, district,
familyHistory (`sim` | `nao` | `nao_sei`) e symptoms (opcionais).

**Resultado esperado:**

- Atualiza `usuarios.nome/email/telefone` e `pacientes.data_nascimento/cidade/
  bairro/historico_familiar/sintomas`.
- CPF nunca é alterado.
- Falta de name/email/phone retorna `400` com mensagem
  `Nome, e-mail e telefone são obrigatórios.`
- Paciente só edita o próprio perfil; admin pode editar passando `userId`
  no body.

### CT-PAC-004 - Solicitar novo atendimento (modal)

**Funções cobertas:** modal de solicitação no `PatientDashboard`,
`uploadAttachments`, `saveAppointments`.

**Resultado esperado:**

- DatePicker e TimePicker selecionam data/hora (`required`).
- Sem data/hora, o submit é bloqueado pelo `required` do HTML.
- Anexos PDF/JPG são enviados via `/api/uploads` antes do save.
- Falha no upload mantém o modal aberto e exibe mensagem de erro.

### CT-PAC-005 - Atendimento sem anexos

**Resultado esperado:**

- Cria atendimento com `status = "agendado"`, `createdBy = "paciente"`.
- `attachments` fica `undefined`.

### CT-PAC-006 - Atendimento com PDF

**Resultado esperado:**

- Upload retorna metadados que são associados ao atendimento.
- A timeline mostra os anexos com `AppointmentAttachments`.

### CT-PAC-007 - Filtragem de notificações

**Funções cobertas:** filtro em `UserArea` / `PatientDashboard`.

**Resultado esperado:** aparecem notificações com `recipientRole = "paciente"`
e sem `recipientId` (broadcast) ou com `recipientId` igual ao
`pat-<sub>` do logado.

### CT-PAC-008 - Marcar notificação como lida

**Resultado esperado:**

- Notificação selecionada vira `read: true`.
- Contador de não-lidas diminui.
- Alteração persiste via `PUT /api/notifications`.

### CT-PAC-009 - Marcar todas como lidas

**Resultado esperado:** todas as notificações da paciente atual viram
`read: true`. Notificações para outros perfis permanecem inalteradas.

### CT-PAC-010 - Contagem de atendimentos

**Resultado esperado:**

- `agendado` + `em_andamento` contam como agendados.
- `concluido` conta como concluído.
- Próximo atendimento é o de menor `date` entre agendados/em andamento.

### CT-PAC-011 - Timeline de atendimentos

**Funções cobertas:** `PatientAppointmentsTimeline`.

**Resultado esperado:**

- Sem atendimentos: exibe estado vazio sem quebrar layout.
- Com itens: mostra data, status, observações, encaminhamento e anexos.

---

## 6. Histórico de Paciente (visão Voluntária)

### CT-HIST-001 - Abrir histórico

**Funções cobertas:** `PatientHistoryModal`.

**Resultado esperado:** modal abre filtrando atendimentos pela paciente
selecionada na lista.

### CT-HIST-002 - Criar atendimento no histórico

**Funções cobertas:** `PatientHistoryForm`, `handleSaveAppointment`.

**Resultado esperado:** novo atendimento é adicionado no topo da lista e
persiste após `PUT /api/appointments`.

### CT-HIST-003 - Validação sem data

**Resultado esperado:** `Informe a data do atendimento.`

### CT-HIST-004 - Validação sem observações

**Resultado esperado:** `Adicione observações sobre o atendimento.`

### CT-HIST-005 - Editar atendimento existente

**Resultado esperado:**

- `id` e `createdAt` preservados.
- `updatedAt` é atualizado.
- Campos alterados aparecem na timeline e no banco.

### CT-HIST-006 - Excluir atendimento

**Resultado esperado:** registro some da lista e da tabela `atendimentos`
(remoção feita pelo `DELETE WHERE id NOT IN (...)` do save).

### CT-HIST-007 - Encaminhamento "Sem encaminhamento"

**Resultado esperado:** `encaminhamento: null` e `encaminhamentoDetalhe`
permanece `undefined`/`null`.

---

## 7. Área da Voluntária

### CT-VOL-001 - Carregamento da área

**Funções cobertas:** `VolunteerArea`, `loadPatients`, `loadAppointments`,
`loadNotifications`, `loadSectors`, `loadVolunteerHours`,
`loadVolunteerAgenda`.

**Resultado esperado:** todas as listas carregam e os cards de pendentes,
encaminhados e concluídos exibem os totais corretos.

### CT-VOL-002 - Busca por nome de paciente

**Resultado esperado:** filtro ignora maiúsculas/minúsculas e retorna apenas
pacientes com nome compatível.

### CT-VOL-003 - Filtro por status

**Resultado esperado:** `all` mostra todas; `pendente`, `encaminhado` e
`concluido` filtram corretamente.

### CT-VOL-004 - `StatusBadge` / `PriorityBadge`

**Resultado esperado:** cada status/prioridade usa label e cor previstos
(pendente/encaminhado/concluido; alta/média/baixa).

### CT-VOL-005 - Encaminhar paciente

**Funções cobertas:** `ForwardPatientModal`, `handleConfirmForward`,
`saveAppointments`, `saveNotifications`.

**Resultado esperado:**

- Sem setor selecionado: mensagem `Selecione um setor cadastrado...`
- Com setor: paciente vai para `encaminhado`, cria atendimento com
  `status = "encaminhado"` e `createdBy = "voluntaria"` e dispara notificação
  `read: false` para a paciente.

### CT-VOL-006 - Concluir paciente encaminhada

**Funções cobertas:** `handleComplete`.

**Resultado esperado:** paciente passa para `concluido` e o botão de concluir
some.

### CT-VOL-007 - Salvar/excluir atendimento

**Funções cobertas:** `handleSaveAppointment`, `handleDeleteAppointment`.

**Resultado esperado:** atendimento novo entra no topo, edição preserva `id` e
exclusão remove via `saveAppointments`.

### CT-VOL-008 - Alternar abas

**Funções cobertas:** `VolunteerAreaTabs`.

**Resultado esperado:** aba `pacientes` mostra a lista; aba `horas` mostra
`VolunteerAgenda` + `VolunteerHoursList`.

### CT-VOL-009 - Sino de notificações da voluntária

**Resultado esperado:** mostra apenas notificações com
`recipientRole = "voluntaria"` e (broadcast ou `vol-<sub>` da logada);
marcar como lida persiste via `PUT /api/notifications`.

---

## 8. Horas de Voluntariado e Agenda

### CT-HOR-001 - Abrir modal de horas

**Funções cobertas:** `VolunteerHoursModal`.

**Resultado esperado:** modal abre com formulário vazio e categoria padrão
`acolhimento`.

### CT-HOR-002 - Validação de atividade obrigatória

**Resultado esperado:** `Informe a atividade realizada.`

### CT-HOR-003 - Validação de data obrigatória

**Resultado esperado:** `Selecione a data da atividade.`

### CT-HOR-004 - Validação de horas obrigatórias

**Resultado esperado:** `Informe a quantidade de horas.`

### CT-HOR-005 - Horas zero, negativa ou texto

**Resultado esperado:** `As horas devem ser maiores que zero.`

### CT-HOR-006 - Horas acima de 24

**Resultado esperado:** `Use um valor coerente de até 24 horas.`

### CT-HOR-007 - Local obrigatório

**Resultado esperado:** `Informe o local da atividade.`

### CT-HOR-008 - Cadastro válido de horas

**Funções cobertas:** `VolunteerHoursModal.handleSubmit`, `saveVolunteerHours`.

**Resultado esperado:**

- Cria entrada com `volunteerId`, `volunteerName`, `createdAt`.
- Lista ordena por data decrescente.
- Total acumulado é atualizado.

### CT-HOR-009 - Reset ao fechar modal

**Resultado esperado:** ao cancelar e reabrir, todos os campos e erros voltam
ao estado inicial.

### CT-HOR-010 - `VolunteerHoursList` vazia / com registros

**Resultado esperado:** estado vazio quando não há registros; com itens,
exibe data formatada, categoria traduzida, horas, local e observações.

### CT-AGE-001 - `VolunteerAgenda` vazia / com itens

**Funções cobertas:** `VolunteerAgenda` (em `volunteer-hours/volunteer-agenda.tsx`).

**Resultado esperado:** sem compromissos exibe estado vazio; com itens mostra
data, turno, título, local e (se atribuída) nome da voluntária.

### CT-AGE-002 - Voluntária pega atividade aberta (claim)

**Funções cobertas:** `claimVolunteerAgendaItem`, `POST /api/volunteer-agenda/:id/claim`,
`insertNotifications`, `getActiveAdminIds`.

**Pré-condições:** atividade com `status = "aberta"`.

**Resultado esperado:**

- `UPDATE` atômico exige `status = 'aberta'`; só atribui se ainda estava
  aberta (evita corrida).
- Atividade passa para `status = "atribuida"` com `voluntaria_id` preenchido.
- Notificação `recipientRole = "admin"` é criada para cada admin ativo, com
  título `Atividade atribuída` e mensagem citando a voluntária.

### CT-AGE-003 - Claim em atividade já atribuída

**Resultado esperado:** API retorna `409` com
`Atividade já foi atribuída a outra voluntária.`

---

## 9. Área Administrativa

### CT-ADM-001 - Carregamento do painel

**Funções cobertas:** `AdminArea`, `loadManagedUsers`, `loadCampaigns`,
`loadNotifications`.

**Resultado esperado:** cards exibem totais de pacientes, voluntárias e
doadores **ativos**, além do total de campanhas e quantas estão ativas.

### CT-ADM-002 - Sino de notificações do admin

**Resultado esperado:**

- Lista somente notificações com `recipientRole = "admin"`.
- Badge mostra a quantidade não-lida; `9+` quando passa de 9.
- `Marcar tudo` marca todas as notificações de admin como `read: true`.

### CT-ADM-003 - Criar usuário válido

**Funções cobertas:** `AdminUserModal`, `handleSaveUser`, `saveManagedUsers`,
`PUT /api/users`.

**Dados:** nome, e-mail válido, CPF (11 dígitos), tipo, senha (≥ 6 caracteres).

**Resultado esperado:**

- Usuário aparece no topo da lista.
- `status = "Ativo"`, `date = hoje (pt-BR)`.
- Senha enviada vai como `password` no payload e é hasheada no backend; o
  state local não guarda senha após o save.
- ID gerado a partir de `Math.floor(Date.now() / 1000)` para evitar estouro
  de `INT` no MySQL.

### CT-ADM-004 - Editar usuário existente

**Resultado esperado:** preserva `id`, `status` e `date`. Atualiza
nome/e-mail/CPF/tipo. **Senha nunca é alterada na edição** (campo nem é
exibido).

### CT-ADM-005 - Inativar usuário

**Funções cobertas:** `handleInactivateUser`.

**Resultado esperado:** `status` vira `Inativo` e o botão de inativar é
desabilitado. Usuário inativo deixa de aparecer no login.

### CT-ADM-006 - Validações do modal de usuário

**Funções cobertas:** `AdminUserModal.validateForm`.

**Resultado esperado:**

- Nome vazio → `Informe o nome do usuário.`
- E-mail vazio → `Informe o e-mail.`
- E-mail malformado → `Informe um e-mail válido.`
- CPF vazio → `Informe o CPF.`
- CPF com menos de 11 dígitos → `CPF deve conter 11 dígitos.`
- E-mail duplicado → `Já existe um usuário com este e-mail.`
- CPF duplicado → `Já existe um usuário com este CPF.`
- Novo usuário sem senha de ao menos 6 caracteres →
  `Senha deve ter ao menos 6 caracteres.`

### CT-ADM-007 - Exportar usuários CSV

**Funções cobertas:** `handleExportUsersCsv`, `buildCsv`, `downloadCsv`.

**Resultado esperado:** arquivo `usuarios-YYYY-MM-DD.csv` com colunas
Nome, E-mail, CPF, Tipo, Status, Data de cadastro (separador `;`, BOM UTF-8).

### CT-ADM-008 - Exportar usuários PDF

**Funções cobertas:** `handleExportUsersPdf`, `downloadPdfReport`.

**Resultado esperado:** PDF contém título `Relatório de Usuários`, resumo
(Total, Ativos, Pacientes, Voluntárias, Doadores) e tabela completa.

### CT-ADM-009 - Aba campanhas

**Funções cobertas:** `loadCampaigns`.

**Resultado esperado:** mostra `<n> campanhas cadastradas e <m> doações
registradas.` (a aba é apenas informativa por enquanto, sem CRUD).

### CT-ADM-010 - Aba doações (filtros e listagem)

**Funções cobertas:** `AdminDonations`.

**Resultado esperado:**

- Carrega via `loadDonations`, ordena por `date` desc.
- Filtros: status (default `pendente`), kind (financeira/material), source
  (titular/terceiro).
- Cards de resumo: Aguardando confirmação, Confirmadas, Total financeiro
  confirmado (formatado em BRL), Materiais confirmados.

### CT-ADM-011 - Confirmar doação pendente

**Funções cobertas:** `AdminDonations.updateStatus`, `saveDonations`.

**Resultado esperado:**

- Doação passa para `confirmada`.
- Botões de Confirmar/Cancelar somem (linha não-pendente).
- Indicador `Salvando…` aparece durante o request.

### CT-ADM-012 - Cancelar doação pendente

**Resultado esperado:** mesma mecânica, status final `cancelada`.

### CT-ADM-013 - Expandir detalhes da doação

**Resultado esperado:**

- Expansor mostra dados completos: doador, perfil utilizado, telefone, data,
  tipo, origem, valor (financeira) ou item/quantidade/entrega/descrição
  (material), campanha, observações e protocolo (quando houver).
- Quando `donorSource = "terceiro"`, mostra `Nome do terceiro` e
  `Telefone do terceiro`.

### CT-ADM-014 - Aba atividades — listagem

**Funções cobertas:** `AdminActivities`, `loadVolunteerAgenda`.

**Resultado esperado:**

- Carrega itens da agenda.
- Estado vazio: mensagem incentivando criar a primeira atividade.
- Itens são ordenados por data ascendente.

### CT-ADM-015 - Aba atividades — criar atividade e broadcast

**Funções cobertas:** `ActivityFormModal`, `createVolunteerAgendaItem`,
`POST /api/volunteer-agenda`, `getActiveVolunteerIds`,
`insertNotifications`.

**Dados:** título, data, turno, local (obrigatórios); descrição e duração
opcionais.

**Resultado esperado:**

- Atividade criada com `status = "aberta"`.
- Para cada voluntária ativa, gera notificação
  `recipientRole = "voluntaria"`, `recipientId = vol-<id>` com título
  `Nova atividade disponível`.
- Validação no backend: título, data, turno e local obrigatórios; falta
  qualquer um → `400` com `Título, data, turno e local são obrigatórios.`
- Validação no front: `Preencha título, data, turno e local.`

### CT-ADM-016 - Editar atividade

**Funções cobertas:** `updateVolunteerAgendaItem`,
`PUT /api/volunteer-agenda/:id`.

**Resultado esperado:** atualiza título, descrição, data, turno, local e
duração estimada; mantém `status` e `voluntaria_id`.

### CT-ADM-017 - Excluir atividade

**Funções cobertas:** `deleteVolunteerAgendaItem`,
`DELETE /api/volunteer-agenda/:id`.

**Resultado esperado:** confirmação inline (`Excluir esta atividade?`) →
`Excluir` remove a atividade; `Cancelar` mantém.

### CT-ADM-018 - Alternar abas admin

**Funções cobertas:** `TabButton`.

**Resultado esperado:** trocar entre `users`, `donations`, `activities` e
`reports` muda estilo do botão ativo e conteúdo renderizado. (A aba
`campaigns` existe no tipo `AdminTab`, mas não há botão visível no grid
de 5 colunas — só é renderizada se acionada por código.)

---

## 10. Relatórios (`admin/admin-reports.tsx` e `domain/reports.ts`)

### CT-REL-001 - `isWithinRange` sem filtro

**Resultado esperado:** sempre `true` para datas válidas.

### CT-REL-002 - `isWithinRange` com `from`

**Resultado esperado:** datas antes de `from` retornam `false`; iguais ou
posteriores retornam `true`.

### CT-REL-003 - `isWithinRange` com `to`

**Resultado esperado:** datas até `to` (inclusive) retornam `true`;
posteriores `false`.

### CT-REL-004 - `isWithinRange` com ISO datetime

**Resultado esperado:** considera apenas a parte de data (`YYYY-MM-DD`).

### CT-REL-005 - `summarizeAppointments`

**Resultado esperado:** retorna `total`, `byStatus`, `withReferral` (somente
encaminhamentos não nulos) e `uniquePatients` (IDs únicos).

### CT-REL-006 - `summarizeDonations`

**Resultado esperado:** `byKind`, `byStatus`, `totalAmount` (soma apenas
financeiras com `amount`) e `uniqueDonors`.

### CT-REL-007 - `summarizeVolunteerHours`

**Resultado esperado:** total de horas, atividades únicas, e
`byCategory` agregando horas por categoria.

### CT-REL-008 - `consolidateVolunteerHoursByVolunteer`

**Resultado esperado:**

- Agrupa por `volunteerName`; usa `(não atribuído)` quando vazio.
- Ordena por total de horas decrescente.
- Calcula período (mín/máx de data) e ordena atividades alfabeticamente.

### CT-REL-009 - `buildCsv` com dados simples

**Resultado esperado:** primeira linha é o cabeçalho separado por `;`;
linhas seguintes contêm os valores.

### CT-REL-010 - `buildCsv` escapa valores especiais

**Dados:** valores com aspas, ponto-e-vírgula ou quebra de linha.

**Resultado esperado:** valor é envolvido em aspas duplas e aspas internas
são duplicadas.

### CT-REL-011 - `buildCsv` com `null/undefined`

**Resultado esperado:** células ficam vazias.

### CT-REL-012 - `downloadCsv`

**Resultado esperado:** cria `Blob` com BOM UTF-8, dispara download e revoga
a URL temporária.

### CT-REL-013 - `downloadPdfReport` (cabeçalho, resumo, seções)

**Resultado esperado:**

- Sem seções, baixa PDF apenas com cabeçalho, título e período.
- Com resumo: inclui tabela de indicadores.
- Seção sem linhas: exibe `Sem registros no recorte atual.`

### CT-REL-014 - Exportações do admin

**Funções cobertas:** handlers do `AdminReports`.

**Resultado esperado:**

- CSV/PDF de atendimentos refletem filtros aplicados.
- CSV/PDF de doações trazem valores corretos por kind/status.
- CSV/PDF de horas trazem registros + consolidado por voluntária.

### CT-REL-015 - Limpar filtros

**Resultado esperado:** período vazio, status `all`, kind `all`.

### CT-REL-016 - Estados vazios

**Resultado esperado:** seções sem dados mostram mensagem e os botões de
exportar ficam desabilitados.

---

## 11. Área do Doador

### CT-DOA-001 - Dashboard do doador

**Funções cobertas:** `UserArea` (role doador), `DonorDashboard`,
`DonorStats`.

**Resultado esperado:**

- Lista somente doações com `donorId = doa-<sub>` (id derivado do JWT).
- Total financeiro soma apenas `kind = "financeira"`.
- Total de doações conta todas as contribuições.

### CT-DOA-002 - Abrir modal de nova doação

**Funções cobertas:** `DonationModal`, `useBodyScrollLock`.

**Resultado esperado:** modal abre no passo `escolha`; o scroll do `body`
fica travado enquanto aberto.

### CT-DOA-003 - Continuar sem escolher tipo

**Resultado esperado:** botão `Continuar` desabilitado / não avança o step.

### CT-DOA-004 - Doação financeira válida

**Funções cobertas:** `FinancialDonation`, `parseAmount` (CurrencyInput),
`handleFinancialConfirm`.

**Dados:** nome, telefone, valor (`R$ 50,00`).

**Resultado esperado:**

- Cria doação `kind: "financeira"`, `status: "pendente"`, `amount: 50`.
- Gera `protocol` (`buildDonationProtocol`) e `receiptIssuedAt = now`.
- Avança para `confirmacao`.

### CT-DOA-005 - Doação financeira sem nome

**Resultado esperado:** mensagem `Nome é obrigatório`.

### CT-DOA-006 - Doação financeira sem telefone

**Resultado esperado:** mensagem `Telefone é obrigatório`.

### CT-DOA-007 - Valor financeiro vazio

**Resultado esperado:** doação criada com `amount: undefined`; histórico
mostra `A confirmar`/`Valor a confirmar`.

### CT-DOA-008 - Valor financeiro com vírgula

**Resultado esperado:** `CurrencyInput.parseCurrencyInput("R$ 123,45")` →
`123.45`.

### CT-DOA-009 - QR Code Pix exibido

**Funções cobertas:** `FinancialDonation` (imagem em
`src/assets/qrCodePix.png`).

**Resultado esperado:** componente renderiza `<img>` com o QR Code dentro do
quadro 36×36 (rounded-xl, fundo branco). Imagem é importada como módulo
estático e empacotada pelo Vite.

### CT-DOA-010 - Copiar chave PIX

**Funções cobertas:** `handleCopyPix`.

**Resultado esperado:** `navigator.clipboard.writeText` é chamado com a chave
e o botão troca para `Copiado!` por 2 segundos.

### CT-DOA-011 - Link WhatsApp

**Resultado esperado:** anchor aponta para
`https://wa.me/<numero>?text=<mensagem>` com `target="_blank"` e
`rel="noopener noreferrer"`.

### CT-DOA-012 - Doação financeira como terceiro

**Funções cobertas:** checkbox `isThirdParty`, `handleFinancialConfirm`.

**Resultado esperado:**

- `donorSource = "terceiro"`.
- `thirdPartyName` e `thirdPartyPhone` recebem nome/telefone digitados.
- `profileOwnerId` e `profileOwnerName` ficam com os dados do dono do perfil
  (constantes `DEMO_DONOR_ID`/`DEMO_DONOR_NAME` em `domain/storage.ts`,
  herdados para compatibilidade).

### CT-DOA-013 - Doação material válida

**Funções cobertas:** `MaterialDonation`, `handleMaterialConfirm`.

**Dados:** nome, telefone, tipoItem (`higiene`), quantidade `10 unidades`,
descrição, formaEntrega (`retirada`).

**Resultado esperado:** cria doação `kind = "material"`, `status = "pendente"`
com todos os campos preenchidos.

### CT-DOA-014 - Doação material sem campos obrigatórios

**Resultado esperado:** cada campo obrigatório vazio mostra mensagem
correspondente (definida em `MaterialDonation`).

### CT-DOA-015 - Doação material como terceiro

**Resultado esperado:** mesmo comportamento de CT-DOA-012, aplicado ao
fluxo de material.

### CT-DOA-016 - `formatPhoneBR`

**Dados e esperado:**

- `47999999999` → `(47) 99999-9999`
- `4733334444` → `(47) 3333-4444`
- caracteres não numéricos são removidos.

### CT-DOA-017 - Histórico ordenado

**Funções cobertas:** `DonorHistory`.

**Resultado esperado:** doações ordenadas por `date` decrescente.

### CT-DOA-018 - Títulos de doações

**Funções cobertas:** `renderDonationTitle`.

**Resultado esperado:**

- Financeira com campanha: remove sufixo ` 2025` e mostra
  `Doação para <campanha>`.
- Cabelo: `Doação de cabelo`.

### CT-DOA-019 - Status de material

**Funções cobertas:** `renderDonationStatus`.

**Resultado esperado:** cabelo confirmada mostra `Processada`; outro material
confirmado mostra `Recebida`.

### CT-DOA-020 - Comprovante disponível

**Funções cobertas:** `DonationReceiptModal`.

**Resultado esperado:** botão `Comprovante` habilitado para doações
financeiras com `protocol`; modal exibe protocolo, data, doador, telefone,
tipo, valor, campanha e status.

### CT-DOA-021 - Comprovante indisponível

**Resultado esperado:** doação sem `protocol` (ou material) tem o botão
desabilitado.

### CT-DOA-022 - Baixar comprovante PDF

**Funções cobertas:** `DonationReceiptModal.handleDownloadPdf`.

**Resultado esperado:** gera arquivo `comprovante-<protocolo>.pdf`.

---

## 12. Formatadores e UI Básica

### CT-UTIL-001 - `formatCurrencyBRL`

**Resultado esperado:** `0`, `50`, `1234.56` formatados em `pt-BR` BRL.

### CT-UTIL-002 - `formatDateTimeBR`

**Resultado esperado:** ISO válido → data/hora em `pt-BR`; ISO inválido
retorna texto original sem quebrar.

### CT-UTIL-003 - `formatDateBR` (`patient-utils`)

**Resultado esperado:** `2026-05-23` → `23/05/2026`.

### CT-UTIL-004 - `formatPhoneBR` / `formatCpf` / `normalizeCpf`

**Resultado esperado:** formatação correta para telefone (8 ou 9 dígitos +
DDD) e CPF (`000.000.000-00`); `normalizeCpf` remove tudo que não é dígito.

### CT-UI-001 - `cn` (merge de classes)

**Resultado esperado:** mantém apenas a última classe conflitante
(`tailwind-merge`), preserva classes condicionais.

### CT-UI-002 - `Button`

**Resultado esperado:** variantes/tamanhos/`disabled`/`asChild` funcionam
sem perder classes.

### CT-UI-003 - `Badge`

**Resultado esperado:** variantes `default/secondary/destructive/outline`.

### CT-UI-004 - `Card` e subcomponentes

**Resultado esperado:** cada subcomponente aplica suas classes e repassa
props.

### CT-UI-005 - `Dialog`

**Resultado esperado:**

- Não renderiza quando `open=false`.
- Renderiza título, descrição, conteúdo e botão de fechar quando `open=true`.
- Clique no botão de fechar invoca `onClose`.

### CT-UI-006 - `Input` / `Textarea`

**Resultado esperado:** repassam props nativas, `className` extra e estados
`disabled/required`.

### CT-UI-007 - `Select`

**Resultado esperado:** trigger abre lista; selecionar item dispara
`onValueChange`.

### CT-UI-008 - `Checkbox`

**Resultado esperado:** estado controlado, `onChange` dispara com `checked`
correto.

### CT-UI-009 - `CurrencyInput`

**Resultado esperado:** formata a entrada como `R$ X.XXX,YY`;
`parseCurrencyInput` devolve número ou `undefined` para entradas vazias.

### CT-UI-010 - `DatePicker`

**Funções cobertas:** `DatePicker` em `ui/date-time-picker.tsx`.

**Resultado esperado:**

- Abre calendário ao clicar.
- `value`/`onChange` no formato `YYYY-MM-DD`.
- `fromYear`/`toYear` limitam o seletor de ano.
- `required` evita submit do form vazio.

### CT-UI-011 - `TimePicker`

**Resultado esperado:** seleciona horário no formato `HH:mm` e dispara
`onChange`.

### CT-UI-012 - `useBodyScrollLock`

**Resultado esperado:** quando ativo, fixa o `overflow` do `body`; ao
desligar, restaura o estado anterior.

---

## 13. Backend - Rotas Protegidas (resumo de permissões)

| Endpoint                                      | Método | Quem pode chamar                                |
|-----------------------------------------------|--------|-------------------------------------------------|
| `/api/health`                                 | GET    | público                                         |
| `/api/auth/login`                             | POST   | público                                         |
| `/api/auth/register`                          | POST   | público                                         |
| `/api/auth/change-password`                   | POST   | qualquer papel autenticado                      |
| `/api/patients`                               | GET/PUT| admin, voluntaria                               |
| `/api/patients/profile` (GET)                 | GET    | paciente (próprio), admin, voluntaria           |
| `/api/patients/profile` (PUT)                 | PUT    | paciente (próprio), admin (com `userId`)        |
| `/api/appointments`                           | GET/PUT| admin, voluntaria, paciente                     |
| `/api/notifications`                          | GET    | todos os papéis                                 |
| `/api/notifications`                          | PUT    | admin, voluntaria, paciente                     |
| `/api/donations`                              | GET/PUT| admin, doador                                   |
| `/api/users`                                  | GET/PUT| admin                                           |
| `/api/users/:id`                              | GET/PUT| qualquer papel autenticado                      |
| `/api/campaigns`                              | GET    | todos os papéis                                 |
| `/api/sectors`                                | GET    | todos os papéis                                 |
| `/api/volunteer-hours`                        | GET/PUT| admin, voluntaria                               |
| `/api/volunteer-agenda`                       | GET    | admin, voluntaria                               |
| `/api/volunteer-agenda`                       | POST   | admin (broadcast para voluntárias)              |
| `/api/volunteer-agenda/:id`                   | PUT    | admin                                           |
| `/api/volunteer-agenda/:id`                   | DELETE | admin                                           |
| `/api/volunteer-agenda/:id/claim`             | POST   | voluntaria (notifica admins)                    |
| `/api/uploads`                                | POST   | qualquer papel autenticado                      |

### CT-BE-001 a CT-BE-008

Validar matriz acima: para cada combinação `(role × endpoint)`, papéis fora
da coluna `Quem pode chamar` recebem `403` com
`Você não tem permissão para esta ação.`; chamadas sem token retornam `401`.

---

## 14. Build e Qualidade

### CT-QA-001 - Typecheck

**Passos:** `npm run typecheck`.

**Resultado esperado:** comando termina com exit code `0`.

### CT-QA-002 - Build de produção

**Passos:** `npm run build`.

**Resultado esperado:** Vite gera `dist/` sem erros (incluindo o asset
`qrCodePix.png` referenciado pelo `FinancialDonation`).

### CT-QA-003 - Dev concorrente

**Passos:** `npm run dev`.

**Resultado esperado:** `concurrently` sobe Vite (`5173`) e o servidor
Fastify (`3001`); o front consegue chamar a API via proxy `/api` e
`/uploads`.

---

## 15. Itens NÃO implementados (em relação ao documento anterior)

Para evitar testes inválidos, observe que o sistema atual **não possui**:

- `npm run seed` ou script de reset de base — a base agora é MySQL e não há
  ferramenta de seed embutida no projeto.
- `ensureDataFile`, `readStore`, `writeStore`, `resetStore`,
  `buildSeedData` — removidos junto com o JSON store antigo.
- Login direto pelas contas demo `admin@exemplo.com`,
  `voluntario@exemplo.com`, `paciente@exemplo.com`, `doador@exemplo.com`
  com senha fixa `123`. Hoje o login depende dos usuários existentes na
  tabela `usuarios`. As constantes `DEMO_*` em `src/domain/storage.ts` e
  `src/domain/demo.ts` ainda existem, mas servem apenas como rótulos para
  doações criadas sem perfil real associado.
- Aba `campanhas` clicável no painel admin: o tipo `AdminTab` ainda inclui
  `"campaigns"`, porém o grid de botões só lista `Usuários`, `Doações`,
  `Atividades` e `Relatórios`.
