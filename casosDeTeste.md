# Casos de Teste - Cuidado Floral

Documento montado a partir da leitura do projeto em `src/` e `server/`.

## Premissas

- Ambiente local com `npm run dev`.
- API em `http://localhost:3001`.
- Front-end em `http://localhost:5173`.
- Base inicial restaurada com `npm run seed`, quando o caso exigir estado conhecido.
- Contas demo:
  - Admin: `admin@exemplo.com` / `123`
  - Voluntária: `voluntario@exemplo.com` / `123`
  - Paciente: `paciente@exemplo.com` / `123`
  - Doador: `doador@exemplo.com` / `123`

## Autenticação e Sessão

### CT-AUTH-001 - Login válido por perfil

**Funções cobertas:** `loginWithDemoAccount`, `/api/auth/login`, `setAuthToken`, `App`

**Pré-condições:** base seed carregada.

**Passos:**

1. Abrir a tela inicial.
2. Informar um e-mail demo válido.
3. Informar senha `123`.
4. Clicar em `Entrar`.
5. Repetir para admin, voluntária, paciente e doador.

**Resultado esperado:**

- Login retorna `200` com `token`, `role` e `name`.
- Token e role ficam em `localStorage`.
- O app renderiza a área correta conforme o papel.

### CT-AUTH-002 - Login com senha inválida

**Funções cobertas:** `loginWithDemoAccount`, `/api/auth/login`, bcrypt compare

**Dados:** `paciente@exemplo.com` / `senhaerrada`

**Resultado esperado:**

- API retorna `401`.
- Tela mostra mensagem: `E-mail ou senha incorretos...`
- Nenhum token fica salvo.

### CT-AUTH-003 - Login sem e-mail ou senha

**Funções cobertas:** `/api/auth/login`

**Passos:** chamar API com body sem `email`, sem `password` ou ambos vazios.

**Resultado esperado:**

- API retorna `400`.
- Mensagem: `Informe e-mail e senha.`

### CT-AUTH-004 - Logout limpa sessão

**Funções cobertas:** `clearSession`, `setAuthToken`, `App.handleLogout`

**Passos:**

1. Fazer login.
2. Clicar em `Sair`.

**Resultado esperado:**

- Role e token são removidos do `localStorage`.
- Usuário volta para tela de login.

### CT-AUTH-005 - Token ausente em rota protegida

**Funções cobertas:** hook `onRequest`, `requireRole`

**Passos:** chamar `GET /api/appointments` sem `Authorization`.

**Resultado esperado:**

- API retorna `401`.
- Mensagem: `Sessão expirada ou inválida.`

### CT-AUTH-006 - Papel sem permissão

**Funções cobertas:** `requireRole`

**Passos:**

1. Logar como paciente.
2. Chamar `GET /api/users` com token da paciente.

**Resultado esperado:**

- API retorna `403`.
- Mensagem: `Você não tem permissão para esta ação.`

### CT-AUTH-007 - 401 no front força logout

**Funções cobertas:** `apiRequest`, `onUnauthorized`, `App`

**Passos:**

1. Fazer login.
2. Alterar manualmente `cf:session-token` para valor inválido.
3. Executar uma ação que chame API protegida.

**Resultado esperado:**

- `apiRequest` remove token.
- Handler de `onUnauthorized` troca estado para não logado.
- Tela volta para login.

## API, Persistência e Store

### CT-API-001 - Health check

**Funções cobertas:** `/api/health`

**Passos:** chamar `GET /api/health`.

**Resultado esperado:** resposta `{ "status": "ok" }`.

### CT-STORE-001 - Criação automática do arquivo de dados

**Funções cobertas:** `ensureDataFile`, `readStore`, `buildSeedData`

**Passos:**

1. Remover temporariamente `server/data/app-data.json` em ambiente de teste.
2. Chamar `readStore`.

**Resultado esperado:**

- Diretório `server/data` e arquivo `app-data.json` são recriados.
- Conteúdo segue estrutura de `AppData`.

### CT-STORE-002 - Escrita e leitura de store

**Funções cobertas:** `writeStore`, `readStore`

**Passos:**

1. Ler store atual.
2. Inserir item controlado em `patients`.
3. Chamar `writeStore`.
4. Chamar `readStore`.

**Resultado esperado:** item inserido persiste no JSON.

### CT-STORE-003 - Reset da base

**Funções cobertas:** `resetStore`, `buildSeedData`

**Passos:**

1. Alterar dados locais.
2. Rodar `npm run seed`.

**Resultado esperado:** dados voltam ao seed original.

### CT-STORE-004 - Usuários sem hash exposto

**Funções cobertas:** `toManagedUsers`

**Passos:** chamar `GET /api/users` como admin.

**Resultado esperado:**

- Lista contém `id`, `name`, `email`, `cpf`, `type`, `status`, `date`.
- Não contém `passwordHash`.

## Utilitários de Domínio e API

### CT-DOM-001 - `getAuthToken`

**Passos:** salvar `cf:session-token` no `localStorage` e chamar função.

**Resultado esperado:** retorna token salvo; retorna `null` sem window ou sem chave.

### CT-DOM-002 - `setAuthToken`

**Passos:**

1. Chamar com string.
2. Chamar com `null`.

**Resultado esperado:**

- Com string, grava `cf:session-token`.
- Com `null`, remove a chave.

### CT-DOM-003 - `apiRequest` adiciona Authorization

**Passos:** com token salvo, chamar rota protegida.

**Resultado esperado:** request contém `Authorization: Bearer <token>`.

### CT-DOM-004 - `apiRequest` trata erro com payload

**Passos:** chamar rota protegida com papel sem permissão.

**Resultado esperado:** lança `Error` com mensagem do backend.

### CT-DOM-005 - `buildAppointmentId`

**Resultado esperado:** ID com prefixo `apt-`; duas chamadas consecutivas geram valores diferentes.

### CT-DOM-006 - `buildNotificationId`

**Resultado esperado:** ID com prefixo `nt-`; duas chamadas consecutivas geram valores diferentes.

### CT-DOM-007 - `buildDonationId`

**Resultado esperado:** ID com prefixo `don-`; duas chamadas consecutivas geram valores diferentes.

### CT-DOM-008 - `buildDonationProtocol`

**Resultado esperado:** protocolo preenchido, rastreável e diferente a cada chamada.

### CT-DOM-009 - Load/save de pacientes

**Funções cobertas:** `loadPatients`, `savePatients`, `/api/patients`

**Passos:** logar como voluntária ou admin, carregar pacientes, salvar lista alterada.

**Resultado esperado:** dados persistem; paciente/doador sem permissão recebem `403`.

### CT-DOM-010 - Load/save de atendimentos

**Funções cobertas:** `loadAppointments`, `saveAppointments`

**Resultado esperado:** admin, voluntária e paciente acessam; doador não acessa.

### CT-DOM-011 - Load/save de notificações

**Funções cobertas:** `loadNotifications`, `saveNotifications`

**Resultado esperado:** todos podem listar; admin/voluntária/paciente podem salvar; doador não deve salvar.

### CT-DOM-012 - Load/save de doações

**Funções cobertas:** `loadDonations`, `saveDonations`

**Resultado esperado:** admin e doador acessam; paciente/voluntária recebem `403`.

### CT-DOM-013 - Load de setores

**Funções cobertas:** `loadSectors`, `/api/sectors`

**Resultado esperado:** retorna setores cadastrados com `id`, `name`, `slug`, `description`.

### CT-DOM-014 - Load/save de horas voluntárias

**Funções cobertas:** `loadVolunteerHours`, `saveVolunteerHours`

**Resultado esperado:** admin e voluntária acessam; paciente/doador recebem `403`.

### CT-DOM-015 - Load agenda voluntária

**Funções cobertas:** `loadVolunteerAgenda`

**Resultado esperado:** admin e voluntária acessam agenda com data, turno e local.

## Upload e Anexos

### CT-UP-001 - Upload sem arquivos

**Funções cobertas:** `uploadAttachments`

**Passos:** chamar `uploadAttachments([])`.

**Resultado esperado:** retorna `[]` sem fazer request.

### CT-UP-002 - Upload de PDF válido

**Funções cobertas:** `uploadAttachments`, `/api/uploads`, `safeFilename`, `makeUploadId`, `isAllowedAttachment`

**Dados:** arquivo `.pdf` menor que 10 MB.

**Resultado esperado:**

- API retorna array com `id`, `filename`, `mimeType`, `size`, `url`, `uploadedAt`.
- Arquivo fica salvo em `server/data/uploads/<id>/<filename>`.

### CT-UP-003 - Upload de JPG válido

**Dados:** arquivo `.jpg` ou `.jpeg` menor que 10 MB.

**Resultado esperado:** upload aceito e anexo retornado.

### CT-UP-004 - Upload de formato inválido no front

**Funções cobertas:** `PatientRequestAppointmentModal.handleAddFiles`

**Dados:** `.txt`, `.docx`, `.png`.

**Resultado esperado:**

- Arquivo não entra na lista.
- Mensagem: `Formato inválido... Envie apenas PDF ou JPG.`

### CT-UP-005 - Upload de formato inválido na API

**Funções cobertas:** `isAllowedAttachment`, `/api/uploads`

**Passos:** chamar API diretamente com `.txt`.

**Resultado esperado:** API rejeita com erro de formato.

### CT-UP-006 - Upload maior que 10 MB

**Resultado esperado:** API retorna `413` e mensagem de limite excedido.

### CT-UP-007 - Mais de 10 arquivos

**Resultado esperado:** request multipart excede limite e API retorna erro.

### CT-UP-008 - Nome de arquivo inseguro

**Dados:** arquivo com nome `../../laudo câncer ?.pdf`.

**Resultado esperado:** `safeFilename` remove caracteres inseguros; arquivo salvo sem escapar de `uploads`.

### CT-UP-009 - `AppointmentAttachments` renderiza lista

**Funções cobertas:** `AppointmentAttachments`, `formatFileSize`, `iconFor`

**Resultado esperado:**

- PDF mostra ícone de arquivo.
- JPG mostra ícone de imagem.
- Tamanho aparece em B, KB ou MB conforme valor.

## Área da Paciente

### CT-PAC-001 - Carregamento do dashboard

**Funções cobertas:** `PatientDashboard`

**Passos:** login como paciente.

**Resultado esperado:**

- Carrega atendimentos e notificações da API.
- Exibe cards de cadastro, atendimentos e notificações.
- Lista somente atendimentos da paciente demo.

### CT-PAC-002 - Contagem de atendimentos

**Funções cobertas:** `completedCount`, `scheduledCount`, `nextAppointment`

**Dados:** atendimentos com status `agendado`, `em_andamento`, `concluido`, `cancelado`.

**Resultado esperado:**

- `scheduledCount` conta apenas `agendado` e `em_andamento`.
- `completedCount` conta apenas `concluido`.
- próximo atendimento é o menor `date` entre agendados/em andamento.

### CT-PAC-003 - Filtragem de notificações

**Funções cobertas:** `patientNotifications`

**Dados:** notificações globais para paciente e específicas para outro `recipientId`.

**Resultado esperado:** aparecem notificações sem `recipientId` ou com `recipientId` da paciente demo.

### CT-PAC-004 - Marcar uma notificação como lida

**Funções cobertas:** `handleMarkAsRead`, `saveNotifications`

**Passos:** clicar em `Marcar como lida`.

**Resultado esperado:**

- Somente a notificação escolhida vira `read: true`.
- Contador de não lidas diminui.
- Alteração persiste na API.

### CT-PAC-005 - Marcar todas como lidas

**Funções cobertas:** `handleMarkAllAsRead`

**Resultado esperado:** todas notificações ficam `read: true`.

### CT-PAC-006 - Abrir/fechar modal solicitar atendimento

**Funções cobertas:** `PatientRequestAppointmentModal`, `handleClose`, `resetForm`

**Passos:**

1. Clicar `Solicitar Atendimento`.
2. Preencher campos.
3. Clicar `Cancelar`.
4. Abrir novamente.

**Resultado esperado:** formulário abre limpo.

### CT-PAC-007 - Solicitar atendimento sem data ou hora

**Resultado esperado:** HTML required impede envio; nenhum atendimento é criado.

### CT-PAC-008 - Solicitar atendimento sem anexos

**Dados:** data `2026-06-10`, hora `14:00`, tipo `Sessão de psicologia`.

**Resultado esperado:**

- Cria atendimento com status `agendado`.
- `createdBy: "paciente"`.
- `attachments` fica `undefined`.
- Modal fecha e atendimento aparece na timeline.

### CT-PAC-009 - Solicitar atendimento com PDF

**Resultado esperado:**

- Upload é feito com token.
- Atendimento criado contém `attachments`.
- Timeline mostra anexo.

### CT-PAC-010 - Erro no upload

**Passos:** invalidar token antes de enviar com anexo.

**Resultado esperado:**

- Modal permanece aberto.
- Mostra mensagem `Sessão expirada...` ou erro retornado.
- Nenhum atendimento novo é salvo.

### CT-PAC-011 - Remover arquivo antes de enviar

**Funções cobertas:** `handleRemoveFile`

**Resultado esperado:** arquivo removido da lista; upload não envia esse arquivo.

### CT-PAC-012 - Timeline de atendimentos vazia

**Funções cobertas:** `PatientAppointmentsTimeline`

**Dados:** lista vazia.

**Resultado esperado:** mostra estado vazio sem quebrar layout.

### CT-PAC-013 - Timeline com anexos

**Resultado esperado:** exibe data, status, observações, encaminhamento e componente de anexos.

## Histórico de Paciente

### CT-HIST-001 - Abrir histórico pela voluntária

**Funções cobertas:** `PatientHistoryModal`

**Passos:** login voluntária, clicar `Histórico`.

**Resultado esperado:** modal abre com paciente correto e atendimentos vinculados.

### CT-HIST-002 - Criar atendimento no histórico

**Funções cobertas:** `PatientHistoryForm`, `todayISO`, `buildInitialState`, `handleSaveAppointment`

**Dados:** data hoje, observações preenchidas, encaminhamento opcional.

**Resultado esperado:** novo atendimento é adicionado no início da lista e persistido.

### CT-HIST-003 - Validação sem data

**Resultado esperado:** mensagem `Informe a data do atendimento.`

### CT-HIST-004 - Validação sem observações

**Resultado esperado:** mensagem `Adicione observações sobre o atendimento.`

### CT-HIST-005 - Editar atendimento existente

**Resultado esperado:**

- `id` e `createdAt` permanecem.
- `updatedAt` muda.
- Campos alterados aparecem na timeline.

### CT-HIST-006 - Excluir atendimento

**Resultado esperado:** atendimento desaparece da lista e persiste na API.

### CT-HIST-007 - Encaminhamento "Sem encaminhamento"

**Resultado esperado:** `encaminhamento: null` e `encaminhamentoDetalhe` fica `undefined`.

## Área da Voluntária

### CT-VOL-001 - Carregamento da área

**Funções cobertas:** `VolunteerArea`

**Resultado esperado:**

- Carrega pacientes, atendimentos, notificações, setores, horas e agenda.
- Cards de pendentes, encaminhados e concluídos exibem totais corretos.

### CT-VOL-002 - Busca por nome de paciente

**Resultado esperado:** filtro ignora maiúsculas/minúsculas e retorna somente nomes compatíveis.

### CT-VOL-003 - Filtro por status

**Resultado esperado:** `all` mostra todos; `pendente`, `encaminhado`, `concluido` mostram apenas o status selecionado.

### CT-VOL-004 - Badge de status

**Funções cobertas:** `StatusBadge`

**Resultado esperado:** cada status usa label e classe corretas.

### CT-VOL-005 - Badge de prioridade

**Funções cobertas:** `PriorityBadge`

**Resultado esperado:** alta, média e baixa usam label e classe corretas.

### CT-VOL-006 - Contagem de atendimentos por paciente

**Funções cobertas:** `appointmentsByPatient`

**Resultado esperado:** cada card mostra singular/plural corretamente.

### CT-VOL-007 - Abrir encaminhamento

**Funções cobertas:** `handleStartForward`, `ForwardPatientModal`

**Resultado esperado:** modal abre para paciente selecionada.

### CT-VOL-008 - Encaminhar sem setor

**Funções cobertas:** `ForwardPatientModal.handleSubmit`

**Resultado esperado:** mensagem `Selecione um setor cadastrado...`; nada é salvo.

### CT-VOL-009 - Encaminhar com setor e observação

**Funções cobertas:** `handleConfirmForward`

**Resultado esperado:**

- Paciente muda para `encaminhado`.
- Novo atendimento com status `encaminhado` e `createdBy: "voluntaria"` é criado.
- Nova notificação `read: false` é criada para a paciente.
- Dados persistem.

### CT-VOL-010 - Encaminhar com setor sem observação

**Resultado esperado:** detalhe e mensagem usam apenas nome do setor; sem espaços ou pontuação duplicada.

### CT-VOL-011 - Concluir paciente encaminhada

**Funções cobertas:** `handleComplete`

**Resultado esperado:** paciente muda para `concluido`; botão de concluir some.

### CT-VOL-012 - Salvar atendimento existente

**Funções cobertas:** `handleSaveAppointment`

**Resultado esperado:** se `id` existe, substitui item; se não existe, adiciona no início.

### CT-VOL-013 - Excluir atendimento

**Funções cobertas:** `handleDeleteAppointment`

**Resultado esperado:** atendimento removido do estado e da API.

### CT-VOL-014 - Alternar abas

**Funções cobertas:** `VolunteerAreaTabs`

**Resultado esperado:** aba pacientes mostra lista; aba horas mostra agenda e registros.

## Horas de Voluntariado

### CT-HOR-001 - Abrir modal de horas

**Funções cobertas:** `VolunteerHoursModal`

**Passos:** na aba horas, clicar `Cadastrar horas de voluntariado`.

**Resultado esperado:** modal abre com campos vazios e categoria padrão.

### CT-HOR-002 - Validação de atividade obrigatória

**Resultado esperado:** mensagem `Informe a atividade realizada.`

### CT-HOR-003 - Validação de data obrigatória

**Resultado esperado:** mensagem `Selecione a data da atividade.`

### CT-HOR-004 - Validação de horas obrigatórias

**Resultado esperado:** mensagem `Informe a quantidade de horas.`

### CT-HOR-005 - Horas zero, negativa ou texto

**Resultado esperado:** mensagem `As horas devem ser maiores que zero.`

### CT-HOR-006 - Horas acima de 24

**Resultado esperado:** mensagem `Use um valor coerente de até 24 horas.`

### CT-HOR-007 - Local obrigatório

**Resultado esperado:** mensagem `Informe o local da atividade.`

### CT-HOR-008 - Cadastro válido de horas

**Dados:** atividade `Acolhimento`, data válida, horas `3.5`, local `Sede`.

**Resultado esperado:**

- Cria item com `volunteerId`, `volunteerName`, `createdAt`.
- Lista ordena por data decrescente.
- Total acumulado atualiza.

### CT-HOR-009 - Reset ao fechar modal

**Resultado esperado:** ao cancelar e reabrir, campos e erros estão limpos.

### CT-HOR-010 - `VolunteerHoursList` vazia

**Resultado esperado:** mostra estado sem registros.

### CT-HOR-011 - `VolunteerHoursList` com registros

**Resultado esperado:** exibe data formatada, categoria traduzida, horas e observações.

### CT-HOR-012 - `VolunteerAgenda` vazia

**Resultado esperado:** mostra estado sem compromissos.

### CT-HOR-013 - `VolunteerAgenda` com itens

**Resultado esperado:** exibe data, turno, título e local.

## Área Administrativa

### CT-ADM-001 - Carregamento do painel

**Funções cobertas:** `AdminArea`, `loadManagedUsers`, `loadCampaigns`

**Resultado esperado:** cards exibem totais de pacientes, voluntárias, doadores e campanhas.

### CT-ADM-002 - Criar usuário válido

**Funções cobertas:** `AdminUserModal`, `handleSaveUser`, `getTodayDateLabel`

**Dados:** nome, e-mail válido, CPF com 11 dígitos, tipo `paciente`.

**Resultado esperado:**

- Usuário aparece no topo da lista.
- Status `Ativo`.
- Data de cadastro e data atual em pt-BR.
- API salva usuário com senha padrão hash de `123`.

### CT-ADM-003 - Editar usuário existente

**Resultado esperado:** mantém `id`, `status` e `date`; atualiza nome/e-mail/CPF/tipo.

### CT-ADM-004 - Inativar usuário

**Funções cobertas:** `handleInactivateUser`

**Resultado esperado:** status vira `Inativo`; botão de inativar fica desabilitado.

### CT-ADM-005 - Validar nome obrigatório

**Resultado esperado:** mensagem `Informe o nome do usuário.`

### CT-ADM-006 - Validar e-mail obrigatório

**Resultado esperado:** mensagem `Informe o e-mail.`

### CT-ADM-007 - Validar e-mail inválido

**Resultado esperado:** mensagem `Informe um e-mail válido.`

### CT-ADM-008 - Validar CPF obrigatório

**Resultado esperado:** mensagem `Informe o CPF.`

### CT-ADM-009 - Validar CPF com menos de 11 dígitos

**Funções cobertas:** `normalizeCpf`, `formatCpf`

**Resultado esperado:** mensagem `CPF deve conter 11 dígitos.`

### CT-ADM-010 - Validar e-mail duplicado

**Resultado esperado:** mensagem `Já existe um usuário com este e-mail.`

### CT-ADM-011 - Validar CPF duplicado

**Resultado esperado:** mensagem `Já existe um usuário com este CPF.`

### CT-ADM-012 - Exportar usuários CSV

**Funções cobertas:** `handleExportUsersCsv`, `buildCsv`, `downloadCsv`

**Resultado esperado:** arquivo `usuarios-YYYY-MM-DD.csv` contém colunas Nome, E-mail, CPF, Tipo, Status e Data.

### CT-ADM-013 - Exportar usuários PDF

**Funções cobertas:** `handleExportUsersPdf`, `downloadPdfReport`

**Resultado esperado:** PDF contém título `Relatório de Usuários`, resumo e tabela de usuários.

### CT-ADM-014 - Aba campanhas

**Resultado esperado:** mostra quantidade de campanhas cadastradas e total de doações vinculadas.

### CT-ADM-015 - Alternar abas admin

**Funções cobertas:** `TabButton`

**Resultado esperado:** botão ativo muda estilo e conteúdo renderizado muda.

## Relatórios

### CT-REL-001 - `isWithinRange` sem filtro

**Resultado esperado:** retorna `true` para qualquer data válida.

### CT-REL-002 - `isWithinRange` com início

**Dados:** range `{ from: "2026-05-01" }`.

**Resultado esperado:** datas antes de 2026-05-01 retornam `false`; iguais/depois retornam `true`.

### CT-REL-003 - `isWithinRange` com fim

**Dados:** range `{ to: "2026-05-31" }`.

**Resultado esperado:** datas até 2026-05-31 retornam `true`; depois retornam `false`.

### CT-REL-004 - `isWithinRange` com ISO datetime

**Dados:** `2026-05-10T15:30:00.000Z`.

**Resultado esperado:** compara apenas dia `2026-05-10`.

### CT-REL-005 - `summarizeAppointments`

**Dados:** lista com todos os status, pacientes repetidas e encaminhamentos.

**Resultado esperado:**

- `total` igual ao tamanho.
- `byStatus` correto.
- `withReferral` conta somente `encaminhamento` não nulo.
- `uniquePatients` conta IDs únicos.

### CT-REL-006 - `summarizeDonations`

**Dados:** doações financeiras/material, pendente/confirmada/cancelada.

**Resultado esperado:**

- `byKind`, `byStatus` corretos.
- `totalAmount` soma apenas financeiras com valor.
- `uniqueDonors` conta doadores únicos.

### CT-REL-007 - `summarizeVolunteerHours`

**Dados:** registros de categorias diferentes e atividades repetidas.

**Resultado esperado:**

- Soma total de horas.
- `uniqueActivities` remove duplicadas.
- `byCategory` soma horas por categoria.

### CT-REL-008 - `consolidateVolunteerHoursByVolunteer`

**Dados:** registros de duas voluntárias, com datas e atividades distintas.

**Resultado esperado:**

- Agrupa por `volunteerName`.
- Usa `(não atribuído)` quando nome ausente.
- Ordena por total de horas decrescente.
- Calcula período mínimo/máximo.
- Atividades ordenadas alfabeticamente.

### CT-REL-009 - `buildCsv` com dados simples

**Resultado esperado:** primeira linha contém cabeçalho separado por `;`; linhas seguintes contêm valores.

### CT-REL-010 - `buildCsv` escapa valores especiais

**Dados:** valores com aspas, ponto e vírgula e quebra de linha.

**Resultado esperado:** valor fica entre aspas e aspas internas são duplicadas.

### CT-REL-011 - `buildCsv` com null/undefined

**Resultado esperado:** células vazias.

### CT-REL-012 - `downloadCsv`

**Resultado esperado:**

- Cria Blob com BOM UTF-8.
- Dispara download.
- Remove link temporário e revoga URL.

### CT-REL-013 - `downloadPdfReport` sem seções

**Resultado esperado:** baixa PDF com cabeçalho, título e período.

### CT-REL-014 - `downloadPdfReport` com resumo

**Resultado esperado:** inclui tabela de indicadores.

### CT-REL-015 - `downloadPdfReport` com seção vazia

**Resultado esperado:** mostra `Sem registros no recorte atual.`

### CT-REL-016 - Exportar atendimentos CSV/PDF

**Funções cobertas:** `AdminReports.handleExportAppointmentsCsv/Pdf`

**Resultado esperado:** arquivos contêm atendimentos filtrados e resumo correto.

### CT-REL-017 - Exportar doações CSV/PDF

**Resultado esperado:** arquivos contêm doações filtradas, valores e status corretos.

### CT-REL-018 - Exportar horas CSV/PDF

**Resultado esperado:** arquivos contêm registros de horas e consolidado por voluntária.

### CT-REL-019 - Limpar filtros

**Funções cobertas:** `handleClearFilters`

**Resultado esperado:** período vazio, status atendimento `all`, tipo/status de doação `all`.

### CT-REL-020 - Estados vazios dos relatórios

**Resultado esperado:** cada seção mostra mensagem de nenhum registro e botões de exportar ficam desabilitados.

## Área do Doador

### CT-DOA-001 - Dashboard do doador

**Funções cobertas:** `UserArea`, `DonorDashboard`, `DonorStats`

**Resultado esperado:**

- Lista apenas doações de `DEMO_DONOR_ID`.
- Total financeiro soma somente doações financeiras.
- Total de doações conta todas as contribuições.

### CT-DOA-002 - Abrir modal de nova doação

**Funções cobertas:** `DonationModal`, `DonationChoice`

**Resultado esperado:** modal abre no passo `escolha`.

### CT-DOA-003 - Continuar sem escolher tipo

**Resultado esperado:** botão continuar fica desabilitado ou não avança.

### CT-DOA-004 - Doação financeira válida

**Funções cobertas:** `FinancialDonation`, `parseAmount`, `handleFinancialConfirm`

**Dados:** nome `Joao`, telefone `(47) 99999-9999`, valor `R$ 50,00`.

**Resultado esperado:**

- Cria doação `kind: "financeira"`, `status: "pendente"`.
- `amount: 50`.
- Gera `protocol` e `receiptIssuedAt`.
- Vai para confirmação.

### CT-DOA-005 - Doação financeira sem nome

**Resultado esperado:** mensagem `Nome é obrigatório`.

### CT-DOA-006 - Doação financeira sem telefone

**Resultado esperado:** mensagem `Telefone é obrigatório`.

### CT-DOA-007 - Valor financeiro vazio

**Resultado esperado:** doação é criada com `amount: undefined`; histórico mostra `Valor a confirmar`.

### CT-DOA-008 - Valor financeiro com vírgula

**Dados:** `123,45`.

**Resultado esperado:** `amount: 123.45`.

### CT-DOA-009 - Copiar chave PIX

**Funções cobertas:** `handleCopyPix`

**Resultado esperado:** `navigator.clipboard.writeText` é chamado; label muda para `Copiado!` temporariamente.

### CT-DOA-010 - Link WhatsApp

**Resultado esperado:** link aponta para `https://wa.me/<número>?text=<mensagem>`.

### CT-DOA-011 - Doação material válida

**Funções cobertas:** `MaterialDonation`, `handleMaterialConfirm`

**Dados:** nome, telefone, tipo `higiene`, quantidade `10 unidades`, descrição, forma entrega `retirada`.

**Resultado esperado:** cria doação material pendente com todos os campos preenchidos.

### CT-DOA-012 - Doação material sem campos obrigatórios

**Resultado esperado:** cada campo obrigatório vazio mostra `Campo obrigatório`.

### CT-DOA-013 - Formatar telefone

**Funções cobertas:** `formatPhoneBR`

**Dados e esperado:**

- `47999999999` => `(47) 99999-9999`
- `4733334444` => `(47) 3333-4444`
- letras e símbolos são removidos.

### CT-DOA-014 - Histórico ordenado

**Funções cobertas:** `DonorHistory`

**Resultado esperado:** doações ordenadas por `date` decrescente.

### CT-DOA-015 - Título de doação financeira com campanha

**Funções cobertas:** `renderDonationTitle`

**Resultado esperado:** remove sufixo ` 2025` e mostra `Doação para <campanha>`.

### CT-DOA-016 - Título de doação de cabelo

**Resultado esperado:** mostra `Doação de cabelo`.

### CT-DOA-017 - Status material confirmada

**Funções cobertas:** `renderDonationStatus`

**Resultado esperado:** cabelo confirmada mostra `Processada`; outro material confirmado mostra `Recebida`.

### CT-DOA-018 - Comprovante disponível

**Funções cobertas:** `DonationReceiptModal`

**Dados:** doação financeira com `protocol`.

**Resultado esperado:** botão `Comprovante` habilitado e modal exibe protocolo, emitido em, doador, telefone, tipo, valor, campanha e status.

### CT-DOA-019 - Comprovante indisponível

**Dados:** doação material ou financeira sem protocolo.

**Resultado esperado:** botão de comprovante fica desabilitado.

### CT-DOA-020 - Baixar comprovante PDF

**Funções cobertas:** `DonationReceiptModal.handleDownloadPdf`

**Resultado esperado:** gera PDF `comprovante-<protocolo>.pdf`.

## Formatadores e UI Básica

### CT-UTIL-001 - `formatCurrencyBRL`

**Dados:** `0`, `50`, `1234.56`.

**Resultado esperado:** valores em `pt-BR` com moeda BRL.

### CT-UTIL-002 - `formatDateTimeBR`

**Dados:** ISO válido.

**Resultado esperado:** data/hora formatada em `pt-BR`; ISO inválido retorna texto original ou não quebra.

### CT-UTIL-003 - `patient-utils.formatDateBR`

**Dados:** `2026-05-23`.

**Resultado esperado:** `23/05/2026`.

### CT-UTIL-004 - `patient-utils.formatDateTimeBR`

**Dados:** ISO datetime.

**Resultado esperado:** data e hora em formato brasileiro.

### CT-UI-001 - `cn`

**Funções cobertas:** `cn`

**Dados:** classes condicionais conflitantes, ex. `p-2`, `p-4`.

**Resultado esperado:** merge remove conflito e mantém classe final esperada.

### CT-UI-002 - `Button`

**Resultado esperado:** renderiza variantes, tamanhos, disabled e `asChild` sem perder classes.

### CT-UI-003 - `Badge`

**Resultado esperado:** renderiza variantes default/secondary/destructive/outline.

### CT-UI-004 - `Card` e subcomponentes

**Resultado esperado:** cada subcomponente aplica classes e repassa props.

### CT-UI-005 - `Dialog`

**Resultado esperado:**

- Não renderiza quando `open=false`.
- Renderiza título, descrição, conteúdo e botão fechar quando `open=true`.
- Clique no fechar chama `onClose`.

### CT-UI-006 - `Input` e `Textarea`

**Resultado esperado:** repassam props nativas, `className` extra e estados `disabled/required`.

### CT-UI-007 - `Select`

**Resultado esperado:** trigger abre lista; selecionar item chama `onValueChange`.

## Backend - Rotas Protegidas

### CT-BE-001 - `GET /api/patients`

**Resultado esperado:** admin/voluntária recebem lista; demais recebem `403`.

### CT-BE-002 - `PUT /api/patients`

**Resultado esperado:** admin/voluntária salvam; demais recebem `403`.

### CT-BE-003 - `GET/PUT /api/appointments`

**Resultado esperado:** admin/voluntária/paciente acessam; doador recebe `403`.

### CT-BE-004 - `GET/PUT /api/notifications`

**Resultado esperado:** todos listam; somente admin/voluntária/paciente salvam.

### CT-BE-005 - `GET/PUT /api/donations`

**Resultado esperado:** admin/doador acessam; paciente/voluntária recebem `403`.

### CT-BE-006 - `GET/PUT /api/users`

**Resultado esperado:** somente admin acessa; novo usuário recebe hash padrão.

### CT-BE-007 - `GET /api/campaigns`

**Resultado esperado:** usuários autenticados recebem campanhas.

### CT-BE-008 - `GET /api/sectors`

**Resultado esperado:** usuários autenticados recebem setores.

### CT-BE-009 - `GET/PUT /api/volunteer-hours`

**Resultado esperado:** admin/voluntária acessam; paciente/doador recebem `403`.

### CT-BE-010 - `GET /api/volunteer-agenda`

**Resultado esperado:** admin/voluntária acessam; paciente/doador recebem `403`.

## Build e Qualidade

### CT-QA-001 - Typecheck

**Passos:** rodar `npm run typecheck`.

**Resultado esperado:** comando termina com exit code `0`.

### CT-QA-002 - Build de produção

**Passos:** rodar `npm run build`.

**Resultado esperado:** Vite gera `dist/` sem erros.

### CT-QA-003 - Seed

**Passos:** rodar `npm run seed`.

**Resultado esperado:** `server/data/app-data.json` é recriado com dados consistentes.
