# Product Scope — GlicoControl MVP

## Problema

Pacientes precisam registrar medições de glicemia ao longo do mês e apresentar um histórico claro ao profissional de saúde. O MVP reduz esquecimento, fragmentação dos registros e dificuldade de consolidar o mês.

## Usuário principal

Paciente que realiza monitoramento glicêmico e precisa organizar medições e lembretes.

## Jobs to be done

1. Registrar rapidamente uma medição.
2. Ver o que foi medido em cada dia/período.
3. Lembrar de medir nos horários configurados.
4. Lembrar de medicamentos já prescritos.
5. Gerar um demonstrativo mensal confiável para consulta médica.

## Funcionalidades MVP

- Conta/perfil.
- Unidade mg/dL por padrão; suporte a mmol/L.
- CRUD de medições.
- Contexto: jejum, pré/pós-refeições, noite, exercício e outro.
- Calendário mensal.
- Histórico/lista.
- Lembretes locais configuráveis de medição.
- Cadastro de medicamentos informados pelo paciente.
- Lembretes locais de medicação e registro de ação.
- Relatório mensal com total, dias com/sem registro, média, mínimo, máximo, agrupamento por contexto, gráfico e tabela completa.
- PDF visualizável/compartilhável.
- Histórico de relatórios por mês reconstruível a partir dos dados primários.
- Temas selecionáveis.

## Fora do MVP

- Cálculo automático de dose de insulina.
- Diagnóstico ou interpretação terapêutica.
- Chatbot médico.
- Prescrição.
- Integração com CGM/glicosímetro/Bluetooth.
- Portal médico/clínica.
- Telemedicina.
- Integração com prontuário.

## Critério de sucesso do MVP

Usuário cria conta → configura lembrete → registra glicemias → consulta calendário → gera PDF mensal → compartilha com o médico.
