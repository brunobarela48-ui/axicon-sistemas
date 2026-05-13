import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';

// ── PALETA ÁXICON ─────────────────────────────────────────────────────────────
const VAREJO = { primary:"#001489", secondary:"#2B367B", accent:"#CCA67F", light:"#EEF0F8", dark:"#000D52" };
const ASSESS = { primary:"#713F2A", secondary:"#7C4D33", accent:"#DAB58F", light:"#F7F3EE", dark:"#4A2918" };
const SEC = "#CCA67F";
const FT = "'Cormorant Garamond','Georgia',serif";
const SN = "'Montserrat','Helvetica Neue',sans-serif";

const LOGO_FULL = "https://2_c5bat1pokohkuoehdainw25lalyo3oo5l4eq_py6a.canva-cdn.email/66b7eeec7cda66fffe0b25b4e86fe48f.png";

function AxLogo({height=40,dark=true,style={}}){
  return <img src={LOGO_FULL} alt="Áxicon" style={{height,width:"auto",objectFit:"contain",display:"block",filter:dark?"brightness(0) invert(1)":"none",...style}}/>;
}

// ── PIPES ─────────────────────────────────────────────────────────────────────
const PIPE_VAREJO = [
  { id: 'lead_captado', name: 'Lead Captado', color: '#1d4ed8' },
  { id: 'primeiro_contato', name: '1º Contato', color: '#3b82f6' },
  { id: 'primeira_reuniao', name: '1º Reunião', color: '#22d3ee' },
  { id: 'lead_qualificado', name: 'Lead Qualificado', color: '#f59e0b' },
  { id: 'negociando', name: 'Negociando', color: '#eab308' },
  { id: 'aguardando_pagamento', name: 'Aguardando Pagamento', color: '#cffafe' },
  { id: 'fechado_ganho', name: 'Ganho', color: '#2e8a4e' },
  { id: 'fechado_perdido', name: 'Perdido', color: '#b71c1c' },
];

const PIPE_ATACADO = [
  { id: 'lead_capitado', name: 'Lead Capitado', color: '#1d4ed8' },
  { id: 'primeira_reuniao', name: '1º Reunião', color: '#bfdbfe' },
  { id: 'analise_negocio', name: 'Análise do Negócio', color: '#fcd34d' },
  { id: 'apresentacao_proposta', name: 'Apresentação Proposta', color: '#1e3a8a' },
  { id: 'documentacao', name: 'Documentação', color: '#1e40af' },
  { id: 'projeto_aprovado', name: 'Projeto Aprovado', color: '#22c55e' },
  { id: 'fechado_perdido', name: 'Perdido', color: '#b71c1c' },
];

const CHECKLIST_DOCS_ATACADO = [
  { id: 'contrato_social',  nome: 'Contrato Social' },
  { id: 'cartao_cnpj',      nome: 'Cartão CNPJ' },
  { id: 'balanco_p1',       nome: 'Balanço Patrimonial (ano -1)' },
  { id: 'balanco_p2',       nome: 'Balanço Patrimonial (ano -2)' },
  { id: 'dre_p1',           nome: 'DRE (ano -1)' },
  { id: 'dre_p2',           nome: 'DRE (ano -2)' },
  { id: 'extrato_ban',      nome: 'Extratos Bancários (6 meses)' },
  { id: 'comp_endereco',    nome: 'Comprovante de Endereço' },
  { id: 'rg_socios',        nome: 'RG/CPF dos Sócios' },
  { id: 'cnd',              nome: 'Certidão Negativa de Débitos' },
];

// ── PRODUTOS E COMISSÕES ──────────────────────────────────────────────────────
// comConsultor = % pago ao consultor sobre o valor do negócio
// escritorioManual = fee do escritório não é gerado automaticamente (inclusão manual)
const PRODUTOS_COMISSAO = {
  'Home Equity / CGI':          { com: 1.0, comConsultor: 1.0, escritorioManual: true,  area: 'varejo'  },
  'Consórcio Imobiliário':      { com: 1.0, comConsultor: 1.0, escritorioManual: true,  area: 'varejo'  },
  'Consórcio Veicular':         { com: 1.0, comConsultor: 1.0, escritorioManual: true,  area: 'varejo'  },
  'Capital de Giro':            { com: 2.5,                                              area: 'atacado' },
  'Crédito Estruturado':        { com: 1.5,                                              area: 'atacado' },
  'Crédito Internacional':      { com: 1.8,                                              area: 'atacado' },
  'CRI / CRA':                  { com: 1.0,                                              area: 'atacado' },
  'Antecipação de Recebíveis':  { com: 1.5,                                              area: 'atacado' },
};
const PRODUTOS = Object.keys(PRODUTOS_COMISSAO);
const PRODUTOS_POR_AREA = {
  varejo:  ['Home Equity / CGI', 'Consórcio Imobiliário', 'Consórcio Veicular'],
  atacado: ['Capital de Giro', 'Crédito Estruturado', 'Crédito Internacional', 'CRI / CRA', 'Antecipação de Recebíveis'],
};

// ── EMPRESAS / CONTAS BANCÁRIAS ──────────────────────────────────────────────
const EMPRESAS = [
  { id: 'axicon', nome: 'Áxicon Soluções Financeiras', cor: ASSESS.primary, sigla: 'AX' },
  { id: 'tex', nome: 'Tex Consórcios', cor: VAREJO.primary, sigla: 'TX' },
  { id: 'mga', nome: 'MGA Consórcios', cor: '#2e8a4e', sigla: 'MG' },
  { id: 'mga_capital', nome: 'MGA Capital', cor: '#0369a1', sigla: 'MC' },
];

// ── PLANO DE CONTAS CONTÁBIL ──────────────────────────────────────────────────
// Estrutura DRE simplificada seguindo modelo CPC (Comitê de Pronunciamentos Contábeis)
const PLANO_CONTAS = {
  receita: {
    label: 'Receitas',
    grupos: {
      'rec_servicos': 'Receita de Serviços (Comissões/Fees)',
      'rec_recorrente': 'Receita Recorrente',
      'rec_outras': 'Outras Receitas Operacionais',
    },
  },
  deducoes: {
    label: 'Deduções da Receita',
    grupos: {
      'ded_impostos': 'Impostos sobre Serviços (ISS/PIS/COFINS)',
      'ded_devolucoes': 'Devoluções e Cancelamentos',
    },
  },
  custos: {
    label: 'Custos dos Serviços',
    grupos: {
      'cus_comissoes': 'Comissões a Consultores',
      'cus_parceiros': 'Comissões a Parceiros',
      'cus_diretos': 'Custos Diretos da Operação',
    },
  },
  despesas: {
    label: 'Despesas Operacionais',
    grupos: {
      'desp_pessoal': 'Despesas com Pessoal (Salários/Encargos)',
      'desp_marketing': 'Marketing e Publicidade',
      'desp_admin': 'Despesas Administrativas',
      'desp_aluguel': 'Aluguel e Condomínio',
      'desp_servicos': 'Serviços de Terceiros',
      'desp_tecnologia': 'Tecnologia e Software',
      'desp_viagem': 'Viagens e Representação',
    },
  },
  financeiro: {
    label: 'Resultado Financeiro',
    grupos: {
      'fin_receitas': 'Receitas Financeiras (rendimentos)',
      'fin_despesas': 'Despesas Financeiras (juros, IOF)',
    },
  },
  tributos: {
    label: 'Tributos sobre Lucro',
    grupos: {
      'trib_irpj': 'IRPJ',
      'trib_csll': 'CSLL',
    },
  },
  capital: {
    label: 'Capital dos Sócios',
    grupos: {
      'cap_aporte':      'Aporte dos Sócios',
      'cap_distribuicao':'Distribuição de Lucros',
    },
  },
};

// Achata todos os grupos para fácil acesso
const TODAS_CONTAS = Object.entries(PLANO_CONTAS).flatMap(([cat, dados]) =>
  Object.entries(dados.grupos).map(([id, nome]) => ({ id, nome, categoria: cat, catLabel: dados.label }))
);

// Categorização para determinar se é entrada (receita) ou saída (despesa) no DRE
const CATEGORIAS_RECEITA = ['receita', 'financeiro_rec'];
const CATEGORIAS_DESPESA = ['deducoes', 'custos', 'despesas', 'tributos'];

// ── DADOS SEED ────────────────────────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0];
const addDays = (d, days) => {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const seedData = {
  contatos: [],
  negocios: [],
  atividades: [],
  funcionarios: [],
  contas: [],
  mensagens: [],
  fornecedores: [],
  extratos: [],
  conciliacoes: [],
  tarefas: [],
  campos_customizados: [],
  automacoes: [],
  config_visual: { corPrimaria: '#001489', corAcento: '#CCA67F', sidebarTema: 'dark', fontePrincipal: 'montserrat', fundoApp: '#F5F4F0' },
  listas_tarefas: [
    { id: 'juridico', nome: 'Jurídico', cor: '#8b5cf6', icone: 'doc' },
    { id: 'financeiro', nome: 'Financeiro', cor: '#2e8a4e', icone: 'money' },
    { id: 'comercial', nome: 'Comercial', cor: VAREJO.primary, icone: 'briefcase' },
    { id: 'administrativo', nome: 'Administrativo', cor: '#f59e0b', icone: 'building' },
    { id: 'rh', nome: 'Recursos Humanos', cor: '#ec4899', icone: 'users' },
    { id: 'marketing', nome: 'Marketing', cor: '#06b6d4', icone: 'send' },
    { id: 'estrategico', nome: 'Estratégico', cor: ASSESS.primary, icone: 'trending' },
  ],
  formularios_publicos: [
    {
      id: 'credito-empresarial',
      slug: 'credito-empresarial',
      titulo: 'Crédito Empresarial · Solicitação',
      descricao: 'Para empresas que buscam capital de giro, crédito estruturado ou antecipação de recebíveis. Preenchimento em até 3 minutos. Nossa equipe entra em contato em até 24h.',
      categoria: 'atacado',
      ativo: true,
      cor: ASSESS.primary,
      campos: [
        { id: 'razao_social', label: 'Razão Social da Empresa', tipo: 'texto', obrigatorio: true },
        { id: 'cnpj', label: 'CNPJ', tipo: 'texto', obrigatorio: true, placeholder: '00.000.000/0001-00' },
        { id: 'nome_responsavel', label: 'Nome do Responsável', tipo: 'texto', obrigatorio: true },
        { id: 'cargo', label: 'Cargo', tipo: 'texto', obrigatorio: true, placeholder: 'Ex: CFO, Diretor Financeiro' },
        { id: 'email', label: 'E-mail Corporativo', tipo: 'email', obrigatorio: true },
        { id: 'telefone', label: 'Telefone (com DDD)', tipo: 'telefone', obrigatorio: true },
        { id: 'faturamento', label: 'Faturamento Anual Estimado', tipo: 'select', obrigatorio: true, opcoes: ['Até R$ 1MM', 'R$ 1MM a R$ 10MM', 'R$ 10MM a R$ 50MM', 'R$ 50MM a R$ 200MM', 'Acima de R$ 200MM'] },
        { id: 'valor_solicitado', label: 'Valor Solicitado (R$)', tipo: 'numero', obrigatorio: true },
        { id: 'finalidade', label: 'Finalidade do Recurso', tipo: 'select', obrigatorio: true, opcoes: ['Capital de Giro', 'Expansão / Investimento', 'Quitação de Dívidas', 'Antecipação de Recebíveis', 'Estruturação Financeira', 'Outro'] },
        { id: 'prazo_desejado', label: 'Prazo Desejado', tipo: 'select', obrigatorio: false, opcoes: ['Até 12 meses', '13 a 24 meses', '25 a 36 meses', '37 a 60 meses', 'Acima de 60 meses'] },
        { id: 'tem_garantia', label: 'Possui imóvel ou garantia disponível?', tipo: 'radio', obrigatorio: true, opcoes: ['Sim', 'Não', 'Avaliando'] },
        { id: 'observacoes', label: 'Conte-nos mais sobre seu projeto', tipo: 'textarea', obrigatorio: false, placeholder: 'Detalhes adicionais que possam ajudar nossa análise' },
      ],
    },
    {
      id: 'home-equity',
      slug: 'home-equity',
      titulo: 'Home Equity · Crédito com Garantia de Imóvel',
      descricao: 'Para pessoas físicas que possuem imóvel quitado e buscam crédito com as menores taxas do mercado. Operação 100% digital com aprovação em até 7 dias úteis.',
      categoria: 'varejo',
      ativo: true,
      cor: VAREJO.primary,
      campos: [
        { id: 'nome', label: 'Nome Completo', tipo: 'texto', obrigatorio: true },
        { id: 'cpf', label: 'CPF', tipo: 'texto', obrigatorio: true, placeholder: '000.000.000-00' },
        { id: 'data_nascimento', label: 'Data de Nascimento', tipo: 'data', obrigatorio: true },
        { id: 'email', label: 'E-mail', tipo: 'email', obrigatorio: true },
        { id: 'telefone', label: 'WhatsApp (com DDD)', tipo: 'telefone', obrigatorio: true },
        { id: 'cidade', label: 'Cidade onde reside', tipo: 'texto', obrigatorio: true },
        { id: 'profissao', label: 'Profissão', tipo: 'texto', obrigatorio: true },
        { id: 'renda', label: 'Renda Mensal', tipo: 'select', obrigatorio: true, opcoes: ['Até R$ 5 mil', 'R$ 5 mil a R$ 15 mil', 'R$ 15 mil a R$ 30 mil', 'R$ 30 mil a R$ 50 mil', 'Acima de R$ 50 mil'] },
        { id: 'valor_imovel', label: 'Valor de Mercado do Imóvel (R$)', tipo: 'numero', obrigatorio: true },
        { id: 'valor_credito', label: 'Valor de Crédito Desejado (R$)', tipo: 'numero', obrigatorio: true },
        { id: 'tipo_imovel', label: 'Tipo de Imóvel', tipo: 'select', obrigatorio: true, opcoes: ['Casa', 'Apartamento', 'Imóvel Comercial', 'Terreno', 'Sítio / Chácara'] },
        { id: 'imovel_quitado', label: 'O imóvel está totalmente quitado?', tipo: 'radio', obrigatorio: true, opcoes: ['Sim, quitado', 'Não, ainda em financiamento', 'Quase quitado'] },
        { id: 'finalidade', label: 'Finalidade do Crédito', tipo: 'select', obrigatorio: false, opcoes: ['Investimento em negócio próprio', 'Reforma', 'Quitação de dívidas', 'Investimento financeiro', 'Outro'] },
      ],
    },
    {
      id: 'consorcio',
      slug: 'consorcio',
      titulo: 'Consórcio · Imóvel ou Veículo',
      descricao: 'Realize o sonho do imóvel ou veículo novo com parcelas que cabem no bolso. Sem juros, apenas taxa de administração.',
      categoria: 'varejo',
      ativo: true,
      cor: '#2e8a4e',
      campos: [
        { id: 'nome', label: 'Nome Completo', tipo: 'texto', obrigatorio: true },
        { id: 'email', label: 'E-mail', tipo: 'email', obrigatorio: true },
        { id: 'telefone', label: 'WhatsApp', tipo: 'telefone', obrigatorio: true },
        { id: 'cidade', label: 'Cidade', tipo: 'texto', obrigatorio: true },
        { id: 'tipo_consorcio', label: 'Tipo de Consórcio', tipo: 'radio', obrigatorio: true, opcoes: ['Imóvel', 'Veículo (carro)', 'Veículo (moto)', 'Pesados / Caminhão'] },
        { id: 'valor_carta', label: 'Valor da Carta de Crédito Desejada (R$)', tipo: 'numero', obrigatorio: true },
        { id: 'prazo', label: 'Prazo (meses)', tipo: 'select', obrigatorio: true, opcoes: ['60 meses', '120 meses', '180 meses', '200 meses', '240 meses'] },
        { id: 'parcela_estimada', label: 'Quanto pode pagar de parcela mensal?', tipo: 'select', obrigatorio: false, opcoes: ['Até R$ 500', 'R$ 500 a R$ 1.500', 'R$ 1.500 a R$ 3.000', 'R$ 3.000 a R$ 5.000', 'Acima de R$ 5.000'] },
      ],
    },
    {
      id: 'investimentos',
      slug: 'investimentos',
      titulo: 'Investimentos · Assessoria Personalizada',
      descricao: 'Construa um portfólio diversificado e alinhado aos seus objetivos. CDB, LCI, Previdência, Renda Fixa Estruturada, e mais.',
      categoria: 'varejo',
      ativo: true,
      cor: SEC,
      campos: [
        { id: 'nome', label: 'Nome Completo', tipo: 'texto', obrigatorio: true },
        { id: 'email', label: 'E-mail', tipo: 'email', obrigatorio: true },
        { id: 'telefone', label: 'WhatsApp', tipo: 'telefone', obrigatorio: true },
        { id: 'patrimonio', label: 'Patrimônio Disponível para Investir', tipo: 'select', obrigatorio: true, opcoes: ['Até R$ 50 mil', 'R$ 50 mil a R$ 200 mil', 'R$ 200 mil a R$ 500 mil', 'R$ 500 mil a R$ 1MM', 'R$ 1MM a R$ 5MM', 'Acima de R$ 5MM'] },
        { id: 'perfil', label: 'Como se considera como investidor?', tipo: 'radio', obrigatorio: true, opcoes: ['Conservador (não tolera perdas)', 'Moderado (aceita oscilação para melhor retorno)', 'Arrojado (busca alto retorno, aceita risco)', 'Não sei dizer'] },
        { id: 'objetivo', label: 'Principal Objetivo', tipo: 'select', obrigatorio: true, opcoes: ['Aposentadoria', 'Reserva de emergência', 'Compra de imóvel', 'Educação dos filhos', 'Diversificação', 'Múltiplos objetivos'] },
        { id: 'prazo', label: 'Horizonte de Investimento', tipo: 'select', obrigatorio: false, opcoes: ['Curto prazo (até 2 anos)', 'Médio prazo (2-5 anos)', 'Longo prazo (5+ anos)'] },
      ],
    },
    {
      id: 'contato-geral',
      slug: 'contato',
      titulo: 'Fale Conosco',
      descricao: 'Tem outra dúvida ou demanda específica? Entre em contato e nossa equipe retornará em breve.',
      categoria: 'geral',
      ativo: true,
      cor: '#8B6340',
      campos: [
        { id: 'nome', label: 'Nome', tipo: 'texto', obrigatorio: true },
        { id: 'email', label: 'E-mail', tipo: 'email', obrigatorio: true },
        { id: 'telefone', label: 'Telefone', tipo: 'telefone', obrigatorio: false },
        { id: 'assunto', label: 'Assunto', tipo: 'texto', obrigatorio: true },
        { id: 'mensagem', label: 'Mensagem', tipo: 'textarea', obrigatorio: true },
      ],
    },
  ],
  solicitacoes: [],
};

// ── FORMATTERS ────────────────────────────────────────────────────────────────
const fmtR = v => v != null ? `R$ ${Number(v).toLocaleString("pt-BR",{maximumFractionDigits:0})}` : "—";
const fmtRD = v => v != null ? `R$ ${Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}` : "—";
const fmtMM = v => {
  if (!v && v !== 0) return "—";
  if (v >= 1000000) return `R$ ${(v/1000000).toFixed(1)}M`;
  if (v >= 1000) return `R$ ${(v/1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
  return `R$ ${Number(v).toLocaleString("pt-BR", {minimumFractionDigits:0,maximumFractionDigits:0})}`;
};
const fmtDate = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
const diasAteVencer = d => Math.ceil((new Date(d + 'T12:00:00') - new Date()) / (1000*60*60*24));

// ── ICONS ─────────────────────────────────────────────────────────────────────
const Ico = ({ d, size=14 }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={size} height={size}>{d}</svg>;
const I = {
  home: <Ico d={<><path d="M3 12L12 3l9 9"/><path d="M5 10v10h14V10"/></>}/>,
  dash: <Ico d={<><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></>}/>,
  pipe: <Ico d={<><rect x="3" y="4" width="4" height="16"/><rect x="10" y="4" width="4" height="10"/><rect x="17" y="4" width="4" height="13"/></>}/>,
  users: <Ico d={<><circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-3.5 3.5-6 7-6s7 2.5 7 6"/><circle cx="17" cy="6" r="2.5"/><path d="M22 17c0-2.5-2-4.5-5-4.5"/></>}/>,
  cal: <Ico d={<><rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 9h18M8 3v4M16 3v4"/></>}/>,
  plus: <Ico d={<><path d="M12 5v14M5 12h14"/></>}/>,
  search: <Ico d={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>}/>,
  building: <Ico d={<><rect x="4" y="3" width="16" height="18"/><path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2"/></>}/>,
  user: <Ico d={<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></>}/>,
  phone: <Ico d={<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>}/>,
  mail: <Ico d={<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></>}/>,
  whats: <Ico d={<><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></>}/>,
  trash: <Ico d={<><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14"/></>}/>,
  arrow: <Ico d={<path d="M5 12h14M13 6l6 6-6 6"/>}/>,
  check: <Ico d={<path d="M5 12l5 5L20 7"/>}/>,
  x: <Ico d={<path d="M6 6l12 12M18 6L6 18"/>}/>,
  money: <Ico d={<><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></>}/>,
  trending: <Ico d={<><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></>}/>,
  briefcase: <Ico d={<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>}/>,
  alert: <Ico d={<><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></>}/>,
  send: <Ico d={<><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></>}/>,
  edit: <Ico d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>}/>,
  doc: <Ico d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></>}/>,
  clock: <Ico d={<><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>}/>,
  bank: <Ico d={<><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></>}/>,
  link: <Ico d={<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>}/>,
  upload: <Ico d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/></>}/>,
  arrowLeft: <Ico d={<path d="M19 12H5M12 19l-7-7 7-7"/>}/>,
  paper: <Ico d={<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>}/>,
  task: <Ico d={<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 11l3 3L22 4M16 8h-6M16 12H6M16 16h-2"/></>}/>,
  tag: <Ico d={<><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1"/></>}/>,
  flag: <Ico d={<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22V15"/></>}/>,
  flame: <Ico d={<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>}/>,
  comment: <Ico d={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>}/>,
  list: <Ico d={<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>}/>,
  kanban: <Ico d={<><rect x="3" y="3" width="6" height="18"/><rect x="11" y="3" width="6" height="14"/><rect x="19" y="3" width="2" height="10"/></>}/>,
  inbox: <Ico d={<><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></>}/>,
  globe: <Ico d={<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>}/>,
  copy: <Ico d={<><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>}/>,
  star: <Ico d={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>}/>,
};

// ── TEMPLATES DE MENSAGEM (alinhados ao tom Áxicon) ───────────────────────────
const TEMPLATES_MSG = {
  // Etapas Varejo
  primeiro_contato: {
    nome: '1º Contato — Varejo',
    whatsapp: 'Olá {nome}, aqui é {consultor} da Áxicon Soluções Financeiras. Recebi seu interesse em conhecer nossas estratégias de alavancagem patrimonial. Posso te ligar rapidamente para entender melhor seu projeto?',
    email_assunto: 'Seu projeto na Áxicon · Próximos passos',
    email_corpo: 'Prezado(a) {nome},\n\nAgradeço o interesse em conhecer as soluções da Áxicon. Sou {consultor}, consultor de estratégia financeira.\n\nGostaria de agendar uma conversa breve para entender seu projeto e apresentar as alternativas mais eficientes para sua realidade.\n\nQual seria o melhor horário para você nos próximos dias?\n\nAbraço,\n{consultor}\nÁxicon Soluções Financeiras',
  },
  primeira_reuniao: {
    nome: '1º Reunião — Confirmação',
    whatsapp: 'Olá {nome}, confirmando nossa reunião. Vou apresentar um panorama completo das estratégias que mais se alinham ao seu projeto. Qualquer ajuste no horário, me avise.',
    email_assunto: 'Confirmação da nossa reunião',
    email_corpo: 'Prezado(a) {nome},\n\nConfirmando nossa reunião conforme agendado. Na ocasião, vamos abordar:\n\n• Diagnóstico do seu projeto\n• Estruturas disponíveis para sua realidade\n• Próximos passos práticos\n\nCaso precise reagendar, me avise com antecedência.\n\nAté breve,\n{consultor}',
  },
  lead_qualificado: {
    nome: 'Lead Qualificado — Apresentação',
    whatsapp: 'Olá {nome}, com base na nossa conversa, preparei uma estrutura personalizada para o {produto}. Posso te enviar a apresentação completa hoje?',
    email_assunto: 'Estratégia personalizada · {produto}',
    email_corpo: 'Prezado(a) {nome},\n\nConforme alinhado, estruturei uma proposta sob medida considerando seu perfil e objetivos.\n\nAnexo a apresentação completa com:\n• Análise do cenário atual\n• Estrutura recomendada\n• Custos e prazos detalhados\n• Cronograma de execução\n\nFico à disposição para esclarecer qualquer ponto.\n\nAbraço,\n{consultor}',
  },
  negociando: {
    nome: 'Negociando — Follow-up',
    whatsapp: 'Olá {nome}, tudo bem? Conseguiu analisar a proposta? Estou à disposição para revisarmos qualquer ponto e ajustarmos o que for necessário para fazer sentido para você.',
    email_assunto: 'Sua proposta · Próximos passos',
    email_corpo: 'Prezado(a) {nome},\n\nEspero que tenha tido tempo de avaliar a estratégia apresentada.\n\nAlguns pontos costumam gerar dúvidas — fico totalmente aberto a discutir prazos, condições ou refazermos a estrutura conforme necessário.\n\nQual seu olhar até aqui?\n\nAbraço,\n{consultor}',
  },
  aguardando_pagamento: {
    nome: 'Aguardando Pagamento',
    whatsapp: 'Olá {nome}, ótima notícia — sua operação foi aprovada! Estamos finalizando os trâmites de liberação. Já encaminhei os dados de pagamento por e-mail. Qualquer dúvida, estou aqui.',
    email_assunto: 'Operação aprovada · Próximos passos',
    email_corpo: 'Prezado(a) {nome},\n\nÉ com satisfação que confirmo a aprovação da sua operação.\n\nSeguem em anexo:\n• Contrato finalizado\n• Dados para pagamento\n• Cronograma de liberação\n\nApós a confirmação do pagamento, o processo segue automaticamente para a etapa final.\n\nAbraço,\n{consultor}',
  },
  // Etapas Atacado
  analise_negocio: {
    nome: 'Análise do Negócio',
    whatsapp: 'Olá {nome}, estamos com sua operação em fase de análise estrutural. Vou compartilhar em breve um resumo das possibilidades que se desenham. Algum dado adicional que faria sentido considerar?',
    email_assunto: 'Análise estrutural em curso',
    email_corpo: 'Prezado(a) {nome},\n\nNossa equipe está conduzindo a análise estrutural do seu projeto considerando:\n\n• Perfil de garantias\n• Capacidade de absorção de capital\n• Fits com nossos parceiros estratégicos\n\nEm breve teremos um diagnóstico consolidado. Qualquer informação adicional relevante, fico à disposição.\n\nAbraço,\n{consultor}',
  },
  apresentacao_proposta: {
    nome: 'Apresentação da Proposta',
    whatsapp: 'Olá {nome}, está pronta sua proposta estruturada. Agendamos uma reunião para apresentação detalhada? Tenho disponibilidade nos próximos dias.',
    email_assunto: 'Proposta Áxicon · {produto}',
    email_corpo: 'Prezado(a) {nome},\n\nÉ com satisfação que apresento a proposta estruturada para sua operação.\n\nO documento contempla:\n• Cenários de alocação\n• Parceiros recomendados\n• Cronograma e próximos passos\n\nProponho uma reunião para apresentação detalhada e esclarecimentos. Quando seria viável para você?\n\nAbraço,\n{consultor}',
  },
  documentacao: {
    nome: 'Documentação',
    whatsapp: 'Olá {nome}, para avançarmos com a operação, precisamos da documentação completa. Já enviei o checklist por e-mail. Qualquer dúvida sobre algum item, me chame.',
    email_assunto: 'Checklist de documentação · {produto}',
    email_corpo: 'Prezado(a) {nome},\n\nPara dar sequência à operação, segue o checklist de documentação necessária.\n\nNossa equipe está pronta para auxiliar em cada item. Quanto antes recebermos os documentos, mais ágil será o processo.\n\nFico à disposição para qualquer esclarecimento.\n\nAbraço,\n{consultor}',
  },
};

// Substitui variáveis no template
const fillTemplate = (txt, vars) => {
  let r = txt;
  Object.entries(vars).forEach(([k,v]) => { r = r.replaceAll(`{${k}}`, v || ''); });
  return r;
};

// ── SLUG ROUTING ─────────────────────────────────────────────────────────────
const TELA_SLUGS = {
  dashboard:       'dashboard',
  pipeline:        'pipeline',
  contatos:        'contatos',
  contato_detalhe: 'contato',
  negocio_detalhe: 'negocio',
  tarefas:         'tarefas',
  tarefa_detalhe:  'tarefa',
  atividades:      'atividades',
  rh:              'rh',
  financeiro:      'financeiro',
  contas_pagar:    'contas-a-pagar',
  contas_receber:  'contas-a-receber',
  fornecedores:    'fornecedores',
  calendario:      'calendario-financeiro',
  comissoes:       'comissoes',
  conciliacao:     'conciliacao',
  extrato:         'extrato',
  dre:             'dre',
  hub_solicitacoes:'solicitacoes',
  personaliz:      'personalizacao',
  importar:        'importar',
  relatorios:      'relatorios',
  automacoes:      'automacoes',
  campos_crm:      'campos-crm',
};
const SLUG_TELAS = Object.fromEntries(Object.entries(TELA_SLUGS).map(([k, v]) => [v, k]));

function telaParaSlug(tela) { return TELA_SLUGS[tela] || tela; }
function slugParaTela(slug) { return SLUG_TELAS[slug] || slug; }

// ── APP ROOT ──────────────────────────────────────────────────────────────────
// CRM component - use inline=true to embed inside another layout (no sidebar/topbar)
export default function CRM({ inline = false, telaProp, navegarProp, usuarioProp, onGerarProposta }) {
  const router = useRouter();
  const [_tela, _setTela] = useState(telaProp?.tela || 'dashboard');
  const [_telaParam, _setTelaParam] = useState(telaProp?.param || null);
  const [dados, setDados] = useState(seedData);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState(null);
  const [draggedNegocio, setDraggedNegocio] = useState(null);
  const [authInfo, setAuthInfo] = useState(inline ? { nome: 'Usuário', role: 'admin' } : null);
  const [erroSalvar, setErroSalvar] = useState(null);
  // Prevents save from firing before first successful load — avoids wiping DB on cold-start errors
  const saveEnabledRef = useRef(false);

  // Use externally-controlled nav when inline, internal state when standalone
  const tela = inline ? (telaProp?.tela || 'dashboard') : _tela;
  const telaParam = inline ? (telaProp?.param || null) : _telaParam;

  // Sync state from URL when browser back/forward is pressed
  // Reads tela from current URL (path slug or legacy ?tela= param)
  const lerTelaDaURL = () => {
    if (typeof window === 'undefined') return;
    const pathSlug = window.location.pathname.replace(/^\//, '');
    const telaFromPath = SLUG_TELAS[pathSlug];
    const params = new URLSearchParams(window.location.search);
    const qt = telaFromPath || params.get('tela');
    const qp = params.get('param');
    const newTela = (typeof qt === 'string' && qt) ? qt : 'dashboard';
    const rawParam = qp || null;
    const newParam = rawParam ? (!isNaN(rawParam) ? Number(rawParam) : rawParam) : null;
    _setTela(newTela);
    _setTelaParam(newParam);
  };

  useEffect(() => {
    if (inline || !router.isReady) return;
    lerTelaDaURL();
  }, [router.isReady, inline]);

  // Handle browser back/forward buttons
  useEffect(() => {
    if (inline) return;
    window.addEventListener('popstate', lerTelaDaURL);
    return () => window.removeEventListener('popstate', lerTelaDaURL);
  }, [inline]);

  // Auth check only in standalone mode
  useEffect(() => {
    if (inline) return;
    (async () => {
      try {
        const { createClient: cc } = await import('@supabase/supabase-js');
        const sb = cc(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          { auth: { persistSession: true, autoRefreshToken: true } }
        );
        const { data: { session } } = await sb.auth.getSession();
        if (!session) { window.location.href = '/'; return; }
        // Auth check agora usa crm_funcionarios (tabela unificada)
        const { data: userData } = await sb.from('crm_funcionarios').select('role, nome, ativo').eq('email', session.user.email).eq('empresa_id', 'axicon').single();
        if (!userData || userData.role !== 'admin' || !userData.ativo) { window.location.href = '/'; return; }
        setAuthInfo({ nome: userData?.nome || session.user.email, email: session.user.email, role: userData.role, token: session.access_token });
      } catch { window.location.href = '/'; }
    })();
  }, []);

  // Helper para navegação — atualiza URL sem reload de página
  const navegar = (novaTela, param = null) => {
    if (inline && navegarProp) { navegarProp(novaTela, param); return; }
    _setTela(novaTela);
    _setTelaParam(param);
    if (!inline && typeof window !== 'undefined') {
      const slug = telaParaSlug(novaTela);
      const qs = param !== null && param !== undefined ? `?param=${param}` : '';
      window.history.pushState(null, '', `/${slug}${qs}`);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [resM,resC,resN,resA,resF,resCo,resEx,resFo,resT] = await Promise.all([
          fetch('/api/crm-dados'),
          fetch('/api/crm-contatos'),
          fetch('/api/crm-negocios'),
          fetch('/api/crm-atividades'),
          fetch('/api/crm-funcionarios'),
          fetch('/api/fin-contas'),
          fetch('/api/fin-extratos'),
          fetch('/api/fin-fornecedores'),
          fetch('/api/crm-tarefas'),
        ]);
        const [jsonM,jsonC,jsonN,jsonA,jsonF,jsonCo,jsonEx,jsonFo,jsonT] = await Promise.all([
          resM.json(),resC.json(),resN.json(),resA.json(),resF.json(),
          resCo.json(),resEx.json(),resFo.json(),resT.json(),
        ]);

        const d = jsonM.dados || {};
        setDados({
          ...seedData,
          ...d,
          // Prefere blob (fonte mais confiável), senão tabela dedicada, senão seedData
          // Isso evita que tabelas dedicadas desatualizadas sobrescrevam dados mais recentes do blob
          contatos:     (Array.isArray(d.contatos)      && d.contatos.length      > 0) ? d.contatos      : (Array.isArray(jsonC.contatos)      && jsonC.contatos.length      > 0) ? jsonC.contatos      : seedData.contatos,
          negocios:     (Array.isArray(d.negocios)      && d.negocios.length      > 0) ? d.negocios      : (Array.isArray(jsonN.negocios)      && jsonN.negocios.length      > 0) ? jsonN.negocios      : seedData.negocios,
          atividades:   (Array.isArray(d.atividades)    && d.atividades.length    > 0) ? d.atividades    : (Array.isArray(jsonA.atividades)    && jsonA.atividades.length    > 0) ? jsonA.atividades    : seedData.atividades,
          funcionarios: (Array.isArray(d.funcionarios)  && d.funcionarios.length  > 0) ? d.funcionarios  : (Array.isArray(jsonF.funcionarios)  && jsonF.funcionarios.length  > 0) ? jsonF.funcionarios  : seedData.funcionarios,
          contas:       (Array.isArray(d.contas)        && d.contas.length        > 0) ? d.contas        : (Array.isArray(jsonCo.contas)       && jsonCo.contas.length       > 0) ? jsonCo.contas       : seedData.contas,
          extratos:     (Array.isArray(d.extratos)      && d.extratos.length      > 0) ? d.extratos      : (Array.isArray(jsonEx.extratos)     && jsonEx.extratos.length     > 0) ? jsonEx.extratos     : seedData.extratos,
          fornecedores: (Array.isArray(d.fornecedores)  && d.fornecedores.length  > 0) ? d.fornecedores  : (Array.isArray(jsonFo.fornecedores) && jsonFo.fornecedores.length > 0) ? jsonFo.fornecedores : seedData.fornecedores,
          tarefas:      (Array.isArray(d.tarefas)       && d.tarefas.length       > 0) ? d.tarefas       : (Array.isArray(jsonT.tarefas)       && jsonT.tarefas.length       > 0) ? jsonT.tarefas       : seedData.tarefas,
          // Restante do blob (config, automacoes, etc.)
          mensagens:           Array.isArray(d.mensagens)           ? d.mensagens           : seedData.mensagens,
          conciliacoes:        Array.isArray(d.conciliacoes)        ? d.conciliacoes        : seedData.conciliacoes,
          campos_customizados: Array.isArray(d.campos_customizados) ? d.campos_customizados : seedData.campos_customizados,
          automacoes:          Array.isArray(d.automacoes)          ? d.automacoes          : seedData.automacoes,
          listas_tarefas:      Array.isArray(d.listas_tarefas)      ? d.listas_tarefas      : seedData.listas_tarefas,
          formularios_publicos:Array.isArray(d.formularios_publicos)? d.formularios_publicos: seedData.formularios_publicos,
          solicitacoes:        Array.isArray(d.solicitacoes)        ? d.solicitacoes        : seedData.solicitacoes,
        });
        // Só habilita saves depois de carregar com sucesso
        saveEnabledRef.current = true;
      } catch (e) {} finally { setCarregando(false); }
    })();
  }, []);

  useEffect(() => {
    // Não salva até a carga inicial ter completado com sucesso
    if (carregando || !saveEnabledRef.current) return;
    const { contatos, negocios, atividades, funcionarios, contas, extratos, fornecedores, tarefas, ...meta } = dados;
    const checkSave = (label) => (r) => {
      if (!r.ok) r.json().catch(()=>({})).then(b => {
        const msg = b?.error || `HTTP ${r.status}`
        console.error(`[CRM] Erro ao salvar ${label}:`, msg)
        setErroSalvar(`Erro ao salvar ${label}: ${msg}`)
      })
    }
    // Salva blob completo (entidades incluídas como backup — garante recuperação mesmo se tabelas falharem)
    fetch('/api/crm-dados', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({dados:{...meta,contatos,negocios,atividades,funcionarios,contas,extratos,fornecedores,tarefas}}) }).then(checkSave('blob')).catch(()=>{});
    // Também sincroniza cada entidade na sua tabela dedicada (melhor para queries futuras)
    fetch('/api/crm-contatos',    { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({contatos})    }).then(checkSave('contatos')).catch(()=>{});
    fetch('/api/crm-negocios',    { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({negocios})    }).then(checkSave('negócios')).catch(()=>{});
    fetch('/api/crm-atividades',  { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({atividades})  }).then(checkSave('atividades')).catch(()=>{});
    fetch('/api/crm-funcionarios',{ method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({funcionarios}) }).then(checkSave('funcionários')).catch(()=>{});
    fetch('/api/fin-contas',      { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({contas})      }).then(checkSave('contas')).catch(()=>{});
    fetch('/api/fin-extratos',    { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({extratos})    }).then(checkSave('extratos')).catch(()=>{});
    fetch('/api/fin-fornecedores',{ method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({fornecedores}) }).then(checkSave('fornecedores')).catch(()=>{});
    fetch('/api/crm-tarefas',     { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({tarefas})     }).then(checkSave('tarefas')).catch(()=>{});
  }, [dados, carregando]);

  const proximoId = (lista) => Math.max(0, ...lista.map(x => x.id)) + 1;

  // CRM ops
  const adicionarContato = (c) => setDados(d => ({ ...d, contatos: [...d.contatos, { ...c, id: proximoId(d.contatos), criado: today }] }));
  const atualizarContato = (id, c) => setDados(d => ({ ...d, contatos: d.contatos.map(x => x.id === id ? { ...x, ...c } : x) }));
  const removerContato = (id) => setDados(d => ({ ...d, contatos: d.contatos.filter(c => c.id !== id), negocios: d.negocios.filter(n => n.contatoId !== id) }));
  const adicionarNegocio = (n) => setDados(d => ({ ...d, negocios: [...d.negocios, { ...n, id: proximoId(d.negocios) }] }));
  const atualizarNegocio = (id, campos) => setDados(d => ({ ...d, negocios: d.negocios.map(n => n.id === id ? { ...n, ...campos } : n) }));
  const removerNegocio = (id) => setDados(d => ({ ...d, negocios: d.negocios.filter(n => n.id !== id), atividades: d.atividades.filter(a => a.negocioId !== id) }));

  // Move negócio + valida campos obrigatórios da etapa destino + gera comissão
  const moverNegocio = (id, etapa) => {
    // Validar campos customizados obrigatórios para a etapa destino
    const negocioAtual = dados.negocios.find(n => n.id === id);
    const camposFaltando = (dados.campos_customizados || []).filter(c =>
      (c.obrigatorio_em || []).includes(etapa) &&
      (() => { const v = negocioAtual?.campos_extras?.[c.id]; return v === undefined || v === null || String(v).trim() === ''; })()
    );
    if (camposFaltando.length > 0) {
      alert(`Preencha os campos obrigatórios para avançar para esta etapa:\n• ${camposFaltando.map(c => c.label).join('\n• ')}\n\nAbra o negócio e preencha antes de mover.`);
      return;
    }
    setDados(d => {
    const negocio = d.negocios.find(n => n.id === id);
    const ETAPAS_FECHAMENTO = ['fechado_ganho', 'projeto_aprovado', 'aguardando_pagamento'];
    let novasContas = [...d.contas];

    // Se entrou em etapa de fechamento e ainda não tem comissão gerada
    if (ETAPAS_FECHAMENTO.includes(etapa) && !ETAPAS_FECHAMENTO.includes(negocio.etapa)) {
      const produto = PRODUTOS_COMISSAO[negocio.produto];
      if (produto) {
        const consultor = d.funcionarios.find(f => f.id === negocio.consultorId);
        const cliente = d.contatos.find(c => c.id === negocio.contatoId);

        // Fee do escritório: só auto-gera se não for produto com lançamento manual
        if (!produto.escritorioManual) {
          const valorFee = negocio.valor * (produto.com / 100);
          const jaTemReceita = d.contas.some(c => c.negocioId === id && c.tipo === 'receber');
          if (!jaTemReceita) {
            novasContas.push({
              id: Math.max(0, ...novasContas.map(x => x.id)) + 1,
              tipo: 'receber',
              descricao: `Fee ${negocio.produto} - ${cliente?.nome || ''}`,
              valor: valorFee,
              vencimento: addDays(today, 15),
              status: 'pendente',
              categoria: 'rec_servicos',
              recorrente: false,
              cliente: cliente?.nome,
              negocioId: id,
            });
          }
        }

        // Comissão ao consultor: usa % customizado do negócio, ou padrão do produto, ou 50% do fee
        const jaTemComissao = d.contas.some(c => c.negocioId === id && c.tipo === 'pagar' && c.categoria === 'cus_comissoes');
        if (!jaTemComissao && consultor) {
          const pctConsultor = (negocio.comConsultor !== undefined && negocio.comConsultor !== null)
            ? Number(negocio.comConsultor)
            : (produto.comConsultor ?? produto.com * 0.5);
          const valorComissao = negocio.valor * pctConsultor / 100;
          novasContas.push({
            id: Math.max(0, ...novasContas.map(x => x.id)) + 2,
            tipo: 'pagar',
            descricao: `Comissão - ${negocio.titulo}`,
            valor: valorComissao,
            vencimento: addDays(today, 30),
            status: 'pendente',
            categoria: 'cus_comissoes',
            recorrente: false,
            fornecedor: consultor.nome,
            funcionarioId: consultor.id,
            negocioId: id,
          });
        }
      }
    }

    return {
      ...d,
      negocios: d.negocios.map(n => n.id === id ? { ...n, etapa, probabilidade: ETAPAS_FECHAMENTO.includes(etapa) ? 100 : etapa === 'fechado_perdido' ? 0 : n.probabilidade } : n),
      contas: novasContas,
    };
    }); // fecha setDados
  }; // fecha moverNegocio

  // Atividades
  const adicionarAtividade = (a) => setDados(d => ({ ...d, atividades: [...d.atividades, { ...a, id: proximoId(d.atividades), concluida: false }] }));
  const toggleAtividade = (id) => setDados(d => ({ ...d, atividades: d.atividades.map(a => a.id === id ? { ...a, concluida: !a.concluida } : a) }));
  const removerAtividade = (id) => setDados(d => ({ ...d, atividades: d.atividades.filter(a => a.id !== id) }));

  // Mensagens
  const registrarMensagem = (msg) => setDados(d => {
    const novaMsg = { ...msg, id: proximoId(d.mensagens || []), data: new Date().toISOString() };
    const novaAtividade = {
      id: proximoId(d.atividades),
      tipo: msg.canal,
      titulo: `${msg.canal === 'whatsapp' ? 'WhatsApp' : 'E-mail'} enviado: ${msg.assunto || msg.preview}`,
      negocioId: msg.negocioId,
      data: today,
      concluida: true,
    };
    return { ...d, mensagens: [...(d.mensagens||[]), novaMsg], atividades: [...d.atividades, novaAtividade] };
  });

  // RH
  const adicionarFuncionario = (f) => setDados(d => ({ ...d, funcionarios: [...d.funcionarios, { ...f, id: proximoId(d.funcionarios), status: 'ativo' }] }));
  const removerFuncionario = (id) => setDados(d => ({ ...d, funcionarios: d.funcionarios.filter(f => f.id !== id) }));
  const atualizarFuncionario = (id, campos) => setDados(d => ({ ...d, funcionarios: d.funcionarios.map(f => f.id === id ? { ...f, ...campos } : f) }));
  const transferirNegocio = (id) => setDados(d => ({
    ...d,
    negocios: d.negocios.map(n => {
      if (n.id !== id) return n;
      const c = d.contatos.find(x => x.id === n.contatoId);
      const areaAtual = n.area || c?.area || 'varejo';
      const novaArea = areaAtual === 'varejo' ? 'atacado' : 'varejo';
      const novaEtapa = novaArea === 'varejo' ? 'lead_captado' : 'lead_capitado';
      return { ...n, area: novaArea, etapa: novaEtapa };
    }),
  }));

  // Financeiro
  const adicionarConta = (c) => setDados(d => ({ ...d, contas: [...d.contas, { ...c, id: proximoId(d.contas) }] }));
  const removerConta = (id) => setDados(d => ({ ...d, contas: d.contas.filter(c => c.id !== id) }));
  const atualizarConta = (id, dados) => setDados(d => ({ ...d, contas: d.contas.map(c => c.id === id ? { ...c, ...dados } : c) }));
  const marcarPago = (id) => setDados(d => ({ ...d, contas: d.contas.map(c => c.id === id ? { ...c, status: c.tipo === 'pagar' ? 'pago' : 'recebido', dataPagamento: today } : c) }));

  // Fornecedores
  const adicionarFornecedor = (f) => setDados(d => ({ ...d, fornecedores: [...(d.fornecedores||[]), { ...f, id: proximoId(d.fornecedores||[]) }] }));
  const removerFornecedor = (id) => setDados(d => ({ ...d, fornecedores: (d.fornecedores||[]).filter(f => f.id !== id) }));

  // Extrato bancário
  const importarExtrato = (lancamentos) => setDados(d => ({
    ...d,
    extratos: [...(d.extratos||[]), ...lancamentos.map(l => ({ ...l, id: Date.now() + Math.random(), conciliado: false }))],
  }));
  const conciliarExtrato = (extratoId, contaId) => setDados(d => ({
    ...d,
    extratos: (d.extratos||[]).map(e => e.id === extratoId ? { ...e, conciliado: true, contaId } : e),
    contas: contaId ? d.contas.map(c => c.id === contaId ? { ...c, status: c.tipo === 'pagar' ? 'pago' : 'recebido', dataPagamento: today } : c) : d.contas,
  }));
  const removerExtrato = (id) => setDados(d => ({ ...d, extratos: (d.extratos||[]).filter(e => e.id !== id) }));

  // ── TAREFAS ──
  const adicionarTarefa = (t) => setDados(d => ({ ...d, tarefas: [...(d.tarefas||[]), { ...t, id: proximoId(d.tarefas||[]), dataCriacao: today, dataConclusao: null, anexos: [], subtarefas: [], comentarios: [] }] }));
  const atualizarTarefa = (id, dados) => setDados(d => ({ ...d, tarefas: (d.tarefas||[]).map(t => t.id === id ? { ...t, ...dados } : t) }));
  const removerTarefa = (id) => setDados(d => ({ ...d, tarefas: (d.tarefas||[]).filter(t => t.id !== id) }));
  const moverTarefaStatus = (id, status) => setDados(d => ({
    ...d,
    tarefas: (d.tarefas||[]).map(t => t.id === id ? { ...t, status, dataConclusao: status === 'concluida' ? today : null } : t),
  }));
  const adicionarSubtarefa = (tarefaId, titulo) => setDados(d => ({
    ...d,
    tarefas: (d.tarefas||[]).map(t => t.id === tarefaId ? { ...t, subtarefas: [...(t.subtarefas||[]), { id: Date.now(), titulo, concluida: false }] } : t),
  }));
  const toggleSubtarefa = (tarefaId, subId) => setDados(d => ({
    ...d,
    tarefas: (d.tarefas||[]).map(t => t.id === tarefaId ? { ...t, subtarefas: t.subtarefas.map(s => s.id === subId ? { ...s, concluida: !s.concluida } : s) } : t),
  }));
  const removerSubtarefa = (tarefaId, subId) => setDados(d => ({
    ...d,
    tarefas: (d.tarefas||[]).map(t => t.id === tarefaId ? { ...t, subtarefas: t.subtarefas.filter(s => s.id !== subId) } : t),
  }));
  const adicionarComentarioTarefa = (tarefaId, autor, texto) => setDados(d => ({
    ...d,
    tarefas: (d.tarefas||[]).map(t => t.id === tarefaId ? { ...t, comentarios: [...(t.comentarios||[]), { id: Date.now(), autor, texto, data: new Date().toISOString() }] } : t),
  }));

  // ── SOLICITAÇÕES (Hub) ──
  const adicionarSolicitacao = (formId, dadosForm) => setDados(d => ({
    ...d,
    solicitacoes: [...(d.solicitacoes||[]), {
      id: proximoId(d.solicitacoes||[]),
      formularioId: formId,
      dados: dadosForm,
      status: 'novo',
      dataRecebimento: new Date().toISOString(),
      dataAtribuicao: null,
      responsavelId: null,
      observacoes: '',
      leadGerado: false,
    }],
  }));
  const atualizarSolicitacao = (id, dados) => setDados(d => ({
    ...d,
    solicitacoes: (d.solicitacoes||[]).map(s => s.id === id ? { ...s, ...dados } : s),
  }));
  const removerSolicitacao = (id) => setDados(d => ({
    ...d,
    solicitacoes: (d.solicitacoes||[]).filter(s => s.id !== id),
  }));
  // Converte solicitação em lead (cria contato no CRM)
  const converterSolicitacaoEmLead = (solicitacaoId) => setDados(d => {
    const sol = (d.solicitacoes||[]).find(s => s.id === solicitacaoId);
    if (!sol) return d;
    const form = (d.formularios_publicos||[]).find(f => f.id === sol.formularioId);
    const dados = sol.dados;

    const isPJ = form?.categoria === 'atacado' || dados.cnpj;
    const novoContato = {
      id: proximoId(d.contatos),
      tipo: isPJ ? 'PJ' : 'PF',
      nome: dados.razao_social || dados.nome || dados.nome_responsavel || 'Sem nome',
      documento: dados.cnpj || dados.cpf || '',
      email: dados.email || '',
      telefone: dados.telefone || '',
      cidade: dados.cidade || '',
      cargo: dados.cargo || dados.profissao || '',
      responsavel: dados.nome_responsavel || '',
      area: form?.categoria === 'atacado' ? 'atacado' : 'varejo',
      origem: 'site',
      criado: today,
      faturamento: 0,
      observacoes: `Lead recebido via formulário "${form?.titulo}" em ${fmtDate(sol.dataRecebimento.split('T')[0])}.\n\nDetalhes da solicitação:\n${Object.entries(dados).map(([k,v]) => `• ${k}: ${v}`).join('\n')}`,
    };

    return {
      ...d,
      contatos: [...d.contatos, novoContato],
      solicitacoes: d.solicitacoes.map(s => s.id === solicitacaoId ? { ...s, status: 'convertido', leadGerado: true, contatoIdGerado: novoContato.id } : s),
    };
  });
  // Formulários (CRUD admin)
  const adicionarFormulario = (f) => setDados(d => ({
    ...d,
    formularios_publicos: [...(d.formularios_publicos||[]), { ...f, id: f.slug, ativo: true }],
  }));
  const atualizarFormulario = (id, dados) => setDados(d => ({
    ...d,
    formularios_publicos: (d.formularios_publicos||[]).map(f => f.id === id ? { ...f, ...dados } : f),
  }));
  const removerFormulario = (id) => setDados(d => ({
    ...d,
    formularios_publicos: (d.formularios_publicos||[]).filter(f => f.id !== id),
  }));

  if (carregando || (!inline && !authInfo)) {
    return <div style={{height:"100vh",display:"grid",placeItems:"center",background:"#0E0E0E",color:SEC,fontFamily:SN,fontSize:14}}>Carregando sistema...</div>;
  }

  const usuario = usuarioProp || { nome: authInfo?.nome || 'Usuário', role: authInfo?.role || 'admin', email: authInfo?.email };

  // Controle de acesso por usuário
  const isAdminOuAdm = usuario.role === 'admin' || usuario.role === 'administrativo';
  const meuFuncionario = isAdminOuAdm ? null : (dados.funcionarios||[]).find(f =>
    (f.email && usuario.email && f.email.toLowerCase() === usuario.email.toLowerCase()) ||
    (f.nome && f.nome.toLowerCase() === usuario.nome.toLowerCase())
  );
  const meuFuncId = meuFuncionario?.id ?? null;

  // dadosFiltrados: consultores veem apenas os próprios registros (IIFE, sem hook após early-return)
  const dadosFiltrados = (() => {
    if (isAdminOuAdm || meuFuncId === null) return dados;
    const meusNegocios = (dados.negocios||[]).filter(n => n.consultorId === meuFuncId);
    const meusNegIds = new Set(meusNegocios.map(n => n.id));
    const meusContatoIds = new Set(meusNegocios.map(n => n.contatoId).filter(Boolean));
    return {
      ...dados,
      negocios: meusNegocios,
      contatos: (dados.contatos||[]).filter(c => meusContatoIds.has(c.id)),
      atividades: (dados.atividades||[]).filter(a => meusNegIds.has(a.negocioId)),
    };
  })();

  const atualizarCamposCustomizados = (novos) => {
    setDados(d => ({ ...d, campos_customizados: novos }));
    // Salva imediatamente — não depende do useEffect de sincronização,
    // que é pulado se o componente desmontar antes do próximo render.
    const { contatos, negocios, atividades, funcionarios, contas, extratos, fornecedores, tarefas, ...meta } = dados;
    fetch('/api/crm-dados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dados: { ...meta, campos_customizados: novos, contatos, negocios, atividades, funcionarios, contas, extratos, fornecedores, tarefas } }),
    }).then(r => {
      if (!r.ok) r.json().catch(()=>({})).then(b => {
        const msg = b?.error || `HTTP ${r.status}`
        console.error('[CRM] Erro ao salvar campos customizados:', msg)
        setErroSalvar(`Erro ao salvar campos: ${msg}`)
      })
    }).catch(e => {
      console.error('[CRM] Erro de rede ao salvar campos customizados:', e.message)
      setErroSalvar('Erro de rede ao salvar campos. Verifique sua conexão.')
    });
    // Cria coluna individual no Supabase para cada campo novo
    const idsExistentes = new Set((dados.campos_customizados || []).map(c => c.id));
    novos.filter(c => !idsExistentes.has(c.id)).forEach(c => {
      fetch('/api/crm-campos-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campo_id: c.id }),
      }).catch(() => {});
    });
  };

  const titulos = {
    dashboard: "Dashboard CRM",
    pipeline: "Pipeline de Vendas",
    contatos: "Contatos",
    contato_detalhe: "Detalhe do Contato",
    negocio_detalhe: "Detalhe do Negócio",
    atividades: "Atividades",
    agendamento: "Agendamento",
    relatorios: "Relatórios",
    campos_customizados: "Campos Customizados",
    importar: "Importar Dados",
    rh: "Recursos Humanos",
    financeiro: "Financeiro",
    contas_pagar: "Contas a Pagar",
    contas_receber: "Contas a Receber",
    fornecedores: "Fornecedores",
    calendario: "Calendário Financeiro",
    comissoes: "Comissões",
    conciliacao: "Conciliação",
    extrato: "Extrato Bancário",
    dre: "DRE Contábil",
    tarefas: "Tarefas Administrativas",
    tarefa_detalhe: "Detalhe da Tarefa",
    hub_solicitacoes: "Hub de Solicitações",
    hub_publico: "Hub Público (Preview)",
    formulario_publico: "Formulário Público",
    formularios_admin: "Gerenciar Formulários",
    personalizacao: "Personalização Visual",
    automacoes: "Automações",
  };

  // Conteúdo principal + modais (reutilizado em inline e standalone)
  const crmMainContent = (
    <main style={{overflowY:"auto",height:"100%",fontFamily:SN}}>
      {erroSalvar && (
        <div style={{position:"sticky",top:0,zIndex:9999,background:"#b91c1c",color:"#fff",padding:"10px 20px",fontSize:13,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <span>⚠️ {erroSalvar}</span>
          <button onClick={()=>setErroSalvar(null)} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>
        </div>
      )}
      {tela==='dashboard' && <Dashboard dados={dadosFiltrados} usuario={usuario} setTela={navegar}/>}
      {tela==='pipeline' && <Pipeline dados={dadosFiltrados} onMover={moverNegocio} onAtualizar={atualizarNegocio} onAdicionar={()=>setModal({tipo:'novo-negocio',defaultConsultorId:meuFuncId})} onRemover={removerNegocio} onMensagem={(d)=>setModal({tipo:'mensagem',data:d})} onAbrirNegocio={(id)=>navegar('negocio_detalhe',id)} draggedNegocio={draggedNegocio} setDraggedNegocio={setDraggedNegocio} onGerarProposta={onGerarProposta} onTransferirNegocio={transferirNegocio}/>}
      {tela==='contatos' && <Contatos dados={dadosFiltrados} onAdicionar={()=>setModal('novo-contato')} onEditar={(c)=>setModal({tipo:'editar-contato',data:c})} onRemover={removerContato} onMensagem={(d)=>setModal({tipo:'mensagem',data:d})} onAbrir={(id)=>navegar('contato_detalhe',id)}/>}
      {tela==='contato_detalhe' && <ContatoDetalhe dados={dadosFiltrados} contatoId={telaParam} onVoltar={()=>navegar('contatos')} onEditar={(c)=>setModal({tipo:'editar-contato',data:c})} onMensagem={(d)=>setModal({tipo:'mensagem',data:d})} onAbrirNegocio={(id)=>navegar('negocio_detalhe',id)}/>}
      {tela==='negocio_detalhe' && <NegocioDetalhe dados={dadosFiltrados} negocioId={telaParam} onVoltar={()=>navegar('pipeline')} onMensagem={(d)=>setModal({tipo:'mensagem',data:d})} onAbrirContato={(id)=>navegar('contato_detalhe',id)} onAtualizar={atualizarNegocio} onAdicionarAtividade={adicionarAtividade} onToggleAtividade={toggleAtividade} onRemoverAtividade={removerAtividade} onAdicionarNota={adicionarAtividade}/>}
      {tela==='atividades' && <Atividades dados={dadosFiltrados} onAdicionar={()=>setModal('nova-atividade')} onToggle={toggleAtividade} onRemover={removerAtividade}/>}
      {tela==='rh' && <RH dados={dados} onAdicionar={()=>setModal('novo-funcionario')} onRemover={removerFuncionario} onAtualizar={atualizarFuncionario} token={authInfo?.token}/>}
      {tela==='financeiro' && <FinanceiroOverview dados={dados} setTela={navegar}/>}
      {tela==='contas_pagar' && <ContasPagar dados={dados} onAdicionar={()=>setModal('nova-conta-pagar')} onEditar={(c)=>setModal({tipo:'editar-conta',data:c})} onRemover={removerConta} onPagar={marcarPago}/>}
      {tela==='contas_receber' && <ContasReceber dados={dados} onAdicionar={()=>setModal('nova-conta-receber')} onAporte={()=>setModal('aporte-socios')} onEditar={(c)=>setModal({tipo:'editar-conta',data:c})} onRemover={removerConta} onReceber={marcarPago}/>}
      {tela==='fornecedores' && <Fornecedores dados={dados} onAdicionar={()=>setModal('novo-fornecedor')} onEditar={(f)=>setModal({tipo:'editar-fornecedor',data:f})} onRemover={removerFornecedor}/>}
      {tela==='calendario' && <CalendarioFinanceiro dados={dados} onPagar={marcarPago}/>}
      {tela==='comissoes' && <Comissoes dados={dados}/>}
      {tela==='conciliacao' && <Conciliacao dados={dados} onPagar={marcarPago}/>}
      {tela==='extrato' && <ExtratoBancario dados={dados} onImportar={importarExtrato} onConciliar={conciliarExtrato} onRemover={removerExtrato}/>}
      {tela==='dre' && <DRE dados={dados}/>}
      {tela==='tarefas' && <Tarefas dados={dados} onAdicionar={()=>setModal('nova-tarefa')} onAbrir={(id)=>navegar('tarefa_detalhe',id)} onMover={moverTarefaStatus} onRemover={removerTarefa} onAtualizar={atualizarTarefa}/>}
      {tela==='tarefa_detalhe' && <TarefaDetalhe dados={dados} tarefaId={telaParam} usuario={usuario} onVoltar={()=>navegar('tarefas')} onAtualizar={atualizarTarefa} onRemover={(id)=>{removerTarefa(id);navegar('tarefas')}} onAdicionarSubtarefa={adicionarSubtarefa} onToggleSubtarefa={toggleSubtarefa} onRemoverSubtarefa={removerSubtarefa} onAdicionarComentario={adicionarComentarioTarefa}/>}
      {tela==='hub_solicitacoes' && <HubSolicitacoes dados={dados} onAtualizar={atualizarSolicitacao} onRemover={removerSolicitacao} onConverter={converterSolicitacaoEmLead} onAdicionarTarefa={adicionarTarefa} setTela={navegar} usuario={usuario}/>}
      {tela==='hub_publico' && <HubPublico dados={dados} onSelecionarForm={(slug)=>navegar('formulario_publico',slug)}/>}
      {tela==='formulario_publico' && <FormularioPublico dados={dados} slug={telaParam} onVoltar={()=>navegar('hub_publico')} onEnviar={adicionarSolicitacao}/>}
      {tela==='agendamento' && <Agendamento dados={dados} usuario={usuario}/>}
      {tela==='relatorios' && <RelatorioAvancado dados={dados}/>}
      {tela==='campos_customizados' && <CamposCustomizados dados={dados} onSalvar={atualizarCamposCustomizados}/>}
      {tela==='importar' && <ImportarDados dados={dados} onImportar={(patch)=>setDados(d=>({...d,...patch}))} token={authInfo?.token}/>}
      {tela==='personalizacao' && <PersonalizacaoVisual config={dados.config_visual} onSalvar={cfg=>setDados(d=>({...d,config_visual:cfg}))}/>}
      {tela==='automacoes' && <AutomacaoBuilder dados={dados} onSalvar={autos=>setDados(d=>({...d,automacoes:autos}))}/>}
    </main>
  );

  const crmModais = (
    <>
      {modal === 'novo-contato' && <ModalContato onSalvar={(c) => { adicionarContato(c); setModal(null); }} onFechar={() => setModal(null)} />}
      {modal?.tipo === 'editar-contato' && <ModalContato titulo="Editar Contato" initial={modal.data} onSalvar={(c) => { atualizarContato(modal.data.id, c); setModal(null); }} onFechar={() => setModal(null)} />}
      {modal?.tipo === 'novo-negocio' && <ModalNegocio dados={dados} defaultConsultorId={modal.defaultConsultorId} onSalvar={(negocio, novoContato) => {
        setDados(d => {
          let novosContatos = d.contatos;
          let contatoId = negocio.contatoId;
          if (novoContato) {
            contatoId = Math.max(0, ...d.contatos.map(c => c.id), 0) + 1;
            novosContatos = [...d.contatos, { ...novoContato, id: contatoId, criado: today }];
          }
          const negocioId = Math.max(0, ...d.negocios.map(n => n.id), 0) + 1;
          return { ...d, contatos: novosContatos, negocios: [...d.negocios, { ...negocio, id: negocioId, contatoId }] };
        });
        setModal(null);
      }} onFechar={() => setModal(null)} />}
      {modal === 'nova-atividade' && <ModalAtividade negocios={dados.negocios} contatos={dados.contatos} onSalvar={(a) => { adicionarAtividade(a); setModal(null); }} onFechar={() => setModal(null)} />}
      {modal === 'novo-funcionario' && <ModalFuncionario onSalvar={(f) => { adicionarFuncionario(f); setModal(null); }} onFechar={() => setModal(null)} />}
      {modal === 'nova-conta-pagar' && <ModalConta tipo="pagar" fornecedores={dados.fornecedores||[]} onCriarFornecedor={adicionarFornecedor} onSalvar={(c) => { adicionarConta(c); setModal(null); }} onFechar={() => setModal(null)} />}
      {modal === 'nova-conta-receber' && <ModalConta tipo="receber" contatos={dados.contatos} onSalvar={(c) => { adicionarConta(c); setModal(null); }} onFechar={() => setModal(null)} />}
      {modal === 'aporte-socios' && <ModalAporteSocios funcionarios={dados.funcionarios} onSalvar={(c) => { adicionarConta(c); setModal(null); }} onFechar={() => setModal(null)} />}
      {modal?.tipo === 'editar-conta' && <ModalConta tipo={modal.data.tipo} fornecedores={dados.fornecedores||[]} contatos={dados.contatos} initial={modal.data} onCriarFornecedor={adicionarFornecedor} onSalvar={(c) => { atualizarConta(modal.data.id, c); setModal(null); }} onFechar={() => setModal(null)} />}
      {modal === 'novo-fornecedor' && <ModalFornecedor onSalvar={(f) => { adicionarFornecedor(f); setModal(null); }} onFechar={() => setModal(null)} />}
      {modal?.tipo === 'editar-fornecedor' && <ModalFornecedor initial={modal.data} onSalvar={(f) => { setDados(d => ({...d, fornecedores: d.fornecedores.map(x => x.id === modal.data.id ? {...x, ...f} : x)})); setModal(null); }} onFechar={() => setModal(null)} />}
      {modal?.tipo === 'mensagem' && <ModalMensagem data={modal.data} usuario={usuario} onEnviar={(msg) => { registrarMensagem(msg); setModal(null); }} onFechar={() => setModal(null)} />}
      {modal === 'nova-tarefa' && <ModalTarefa funcionarios={dados.funcionarios} listas={dados.listas_tarefas||[]} onSalvar={(t) => { adicionarTarefa(t); setModal(null); }} onFechar={() => setModal(null)} />}
    </>
  );

  // Modo inline: apenas conteúdo + modais, sem sidebar/topbar próprios
  if (inline) {
    return <>{crmMainContent}{crmModais}</>;
  }

  // Modo standalone: layout completo com sidebar própria
  return (
    <div style={{height:"100vh",display:"grid",gridTemplateColumns:"248px 1fr",gridTemplateRows:"68px 1fr",fontFamily:SN,overflow:"hidden",background:"#F5F4F0"}}>

      {/* BRAND CORNER */}
      <div style={{background:"#0E0E0E",borderRight:"1px solid rgba(255,255,255,0.08)",borderBottom:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <AxLogo height={40} dark/>
      </div>

      {/* TOPBAR */}
      <div style={{background:"#FFFFFF",borderBottom:"1px solid #E6E2D8",display:"flex",alignItems:"center",gap:16,padding:"0 32px"}}>
        <div style={{fontSize:11,letterSpacing:3,textTransform:"uppercase",color:"#6B6B6B",display:"flex",alignItems:"center",gap:10}}>
          <span>Sistema</span>
          <span style={{color:"#C9C3B3"}}>/</span>
          <span style={{color:"#B8895A",fontWeight:600}}>{titulos[tela]}</span>
        </div>
        <div style={{flex:1}}/>
        <div style={{height:38,width:280,background:"#FAF8F3",border:"1px solid #E6E2D8",borderRadius:999,display:"flex",alignItems:"center",gap:10,padding:"0 14px"}}>
          <span style={{color:"#6B6B6B",display:"flex"}}>{I.search}</span>
          <span style={{fontSize:12,color:"#aaa",flex:1}}>Buscar...</span>
          <kbd style={{fontFamily:"inherit",fontSize:10,color:"#aaa",border:"1px solid #E6E2D8",background:"#fff",borderRadius:4,padding:"1px 6px"}}>⌘K</kbd>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"4px 4px 4px 14px",border:"1px solid #E6E2D8",background:"#fff",borderRadius:999}}>
          <span style={{fontSize:12,color:"#0E0E0E",fontWeight:500}}>{usuario.nome}</span>
          <div style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${SEC},#8B6340)`,color:"#fff",display:"grid",placeItems:"center",fontWeight:600,fontSize:11}}>{usuario.nome[0]}</div>
        </div>
      </div>

      {/* SIDEBAR */}
      <aside style={{background:"#0E0E0E",borderRight:"1px solid rgba(255,255,255,0.08)",padding:"20px 14px 28px",display:"flex",flexDirection:"column",gap:18,overflowY:"auto",color:"#fff"}}>

        <div>
          <NavItem icon={I.home} label="Início" onClick={() => navegar('dashboard')} active={tela==='dashboard'}/>
        </div>

        <div>
          <SectionLabel>CRM</SectionLabel>
          <NavItem icon={I.dash} label="Dashboard" active={tela==='dashboard'} onClick={()=>navegar('dashboard')}/>
          <NavItem icon={I.pipe} label="Pipeline" active={tela==='pipeline'} onClick={()=>navegar('pipeline')}/>
          <NavItem icon={I.users} label="Contatos" active={tela==='contatos'||tela==='contato_detalhe'} onClick={()=>navegar('contatos')}/>
          <NavItem icon={I.cal} label="Atividades" active={tela==='atividades'} onClick={()=>navegar('atividades')}/>
          <NavItem icon={I.cal} label="Agendamento" active={tela==='agendamento'} onClick={()=>navegar('agendamento')}/>
        </div>

        <div>
          <SectionLabel>Administrativo</SectionLabel>
          <NavItem icon={I.task} label="Tarefas" active={tela==='tarefas'||tela==='tarefa_detalhe'} onClick={()=>navegar('tarefas')}/>
          <NavItem icon={I.inbox} label="Solicitações Admin" active={tela==='hub_solicitacoes'} onClick={()=>navegar('hub_solicitacoes')} badge={(dados.solicitacoes||[]).filter(s=>s.status==='novo').length}/>
          <NavItem icon={I.trending} label="Relatórios" active={tela==='relatorios'} onClick={()=>navegar('relatorios')}/>
          <NavItem icon={I.globe} label="Hub Público" active={tela==='hub_publico'||tela==='formulario_publico'} onClick={()=>navegar('hub_publico')}/>
          {isAdminOuAdm && <NavItem icon={I.task} label="Campos CRM" active={tela==='campos_customizados'} onClick={()=>navegar('campos_customizados')}/>}
          {isAdminOuAdm && <NavItem icon={I.upload} label="Importar Dados" active={tela==='importar'} onClick={()=>navegar('importar')}/>}
          {isAdminOuAdm && <NavItem icon={I.palette||'🎨'} label="Personalização" active={tela==='personalizacao'} onClick={()=>navegar('personalizacao')}/>}
          {isAdminOuAdm && <NavItem icon={I.bolt||'⚡'} label="Automações" active={tela==='automacoes'} onClick={()=>navegar('automacoes')}/>}
        </div>

        <div>
          <SectionLabel>Financeiro</SectionLabel>
          <NavItem icon={I.dash} label="Visão Geral" active={tela==='financeiro'} onClick={()=>navegar('financeiro')}/>
          <NavItem icon={I.money} label="Contas a Pagar" active={tela==='contas_pagar'} onClick={()=>navegar('contas_pagar')}/>
          <NavItem icon={I.trending} label="Contas a Receber" active={tela==='contas_receber'} onClick={()=>navegar('contas_receber')}/>
          <NavItem icon={I.building} label="Fornecedores" active={tela==='fornecedores'} onClick={()=>navegar('fornecedores')}/>
          <NavItem icon={I.cal} label="Calendário" active={tela==='calendario'} onClick={()=>navegar('calendario')}/>
          <NavItem icon={I.briefcase} label="Comissões" active={tela==='comissoes'} onClick={()=>navegar('comissoes')}/>
          <NavItem icon={I.bank} label="Extrato Bancário" active={tela==='extrato'} onClick={()=>navegar('extrato')}/>
          <NavItem icon={I.check} label="Conciliação" active={tela==='conciliacao'} onClick={()=>navegar('conciliacao')}/>
          <NavItem icon={I.doc} label="DRE Contábil" active={tela==='dre'} onClick={()=>navegar('dre')}/>
        </div>

        <div>
          <SectionLabel>RH</SectionLabel>
          <NavItem icon={I.users} label="Equipe" active={tela==='rh'} onClick={()=>navegar('rh')}/>
        </div>

        <div>
          <SectionLabel>Marketing</SectionLabel>
        </div>

        <div style={{marginTop:"auto",padding:"14px 12px",borderTop:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",gap:10,fontSize:11,color:"rgba(255,255,255,0.55)",letterSpacing:1.5,textTransform:"uppercase"}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:"#5cd28a",boxShadow:"0 0 0 4px rgba(92,210,138,0.18)",flexShrink:0}}/>
          Sistema operando
        </div>
      </aside>

      {crmMainContent}
      {crmModais}
    </div>
  );
}

// ── COMPONENTES BASE ──────────────────────────────────────────────────────────
// Gera URL direta para um item e exibe botão de abrir em nova aba + copiar link
function SubLink({ tela, param }) {
  const [copiado, setCopiado] = useState(false);
  const slug = telaParaSlug(tela);
  const qs = param != null ? `?param=${param}` : '';
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/${slug}${qs}`
    : `/${slug}${qs}`;

  const copiar = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000); });
  };

  return (
    <div style={{display:"flex",alignItems:"center",gap:4}}>
      <a href={url} target="_blank" rel="noreferrer"
        title="Abrir em nova aba"
        onClick={e => e.stopPropagation()}
        style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:7,border:"1px solid rgba(113,63,42,0.18)",background:"white",color:"#888",fontSize:11,fontWeight:600,textDecoration:"none",fontFamily:SN,cursor:"pointer"}}
        onMouseEnter={e=>{e.currentTarget.style.color=ASSESS.primary;e.currentTarget.style.borderColor=ASSESS.primary;}}
        onMouseLeave={e=>{e.currentTarget.style.color="#888";e.currentTarget.style.borderColor="rgba(113,63,42,0.18)";}}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Nova aba
      </a>
      <button onClick={copiar} title="Copiar link"
        style={{display:"inline-flex",alignItems:"center",padding:"5px 8px",borderRadius:7,border:"1px solid rgba(113,63,42,0.18)",background:"white",color:copiado?"#2e8a4e":"#aaa",fontSize:11,cursor:"pointer",fontFamily:SN}}
        onMouseEnter={e=>{e.currentTarget.style.color=copiado?"#2e8a4e":ASSESS.primary;}}
        onMouseLeave={e=>{e.currentTarget.style.color=copiado?"#2e8a4e":"#aaa";}}>
        {copiado ? '✓ Copiado' : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
      </button>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:SEC,fontWeight:600,padding:"0 12px",marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
      {children}
      <span style={{flex:1,height:1,background:"linear-gradient(to right,rgba(204,166,127,0.45),transparent)"}}/>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, badge }) {
  const bg = active ? "rgba(204,166,127,0.14)" : "transparent";
  const color = active ? "#fff" : "rgba(255,255,255,0.78)";
  return (
    <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 12px",margin:"1px 0",borderRadius:8,fontSize:13,color,background:bg,cursor:"pointer",position:"relative",transition:"background .15s"}}>
      {active && <span style={{position:"absolute",left:-14,top:"50%",transform:"translateY(-50%)",width:3,height:20,borderRadius:"0 3px 3px 0",background:SEC}}/>}
      <span style={{display:"flex",color:active?SEC:"rgba(255,255,255,0.6)"}}>{icon}</span>
      <span style={{flex:1}}>{label}</span>
      {badge > 0 && <span style={{fontSize:10,padding:"1px 7px",borderRadius:99,background:"#dc2626",color:"white",fontWeight:700,minWidth:18,textAlign:"center"}}>{badge}</span>}
    </div>
  );
}

function KpiCard({ label, value, sub, accent }) {
  return (
    <div style={{background:"white",borderRadius:14,padding:"20px 22px",border:"1px solid rgba(113,63,42,0.10)",borderTop:`3px solid ${accent}`}}>
      <div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#888",fontWeight:600,marginBottom:10}}>{label}</div>
      <div style={{fontFamily:FT,fontWeight:300,fontSize:32,color:"#1a1a1a",lineHeight:1,marginBottom:6}}>{value}</div>
      <div style={{fontSize:11,color:"#aaa"}}>{sub}</div>
    </div>
  );
}

function SectionTitle({ label }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
      <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#888",fontWeight:600}}>{label}</div>
      <div style={{height:1,flex:1,maxWidth:60,background:"linear-gradient(to right,rgba(113,63,42,0.35),transparent)"}}/>
    </div>
  );
}

function PageHeader({ etiqueta, titulo, destaque, sub, action, palette = ASSESS }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:28}}>
      <div>
        <div style={{fontSize:10,letterSpacing:4,textTransform:"uppercase",color:palette.primary,fontWeight:600,marginBottom:10}}>{etiqueta}</div>
        <h1 style={{fontFamily:FT,fontWeight:300,fontSize:36,letterSpacing:.3,color:"#1a1a1a",margin:0}}>
          {titulo} {destaque && <em style={{fontStyle:"italic",color:palette.primary}}>{destaque}</em>}
        </h1>
        {sub && <p style={{fontSize:13,color:"#888",marginTop:6}}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function Btn({ children, onClick, variant='primary', palette = ASSESS, icon, disabled }) {
  const styles = {
    primary: { bg: palette.primary, color:'white', shadow:`0 12px 28px -12px ${palette.primary}88`, border:'none' },
    outline: { bg:'white', color:palette.primary, shadow:'none', border:`1.5px solid ${palette.primary}40` },
    ghost: { bg:'transparent', color:'#888', shadow:'none', border:'1px solid rgba(113,63,42,0.20)' },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled} style={{height:40,padding:"0 18px",borderRadius:10,border:styles.border,background:styles.bg,color:styles.color,fontSize:12,fontWeight:500,letterSpacing:1,cursor:disabled?"not-allowed":"pointer",boxShadow:styles.shadow,display:"inline-flex",alignItems:"center",gap:10,opacity:disabled?.5:1,fontFamily:SN}}>
      {icon}{children}
    </button>
  );
}

// Botões de ação rápida (WhatsApp, E-mail, Telefone)
function AcoesRapidas({ contato, negocio, onMensagem, size = 'md' }) {
  if (!contato) return null;
  const isSm = size === 'sm';
  const btnSize = isSm ? 28 : 32;
  const ico = isSm ? 12 : 14;

  const btnStyle = (color) => ({
    width: btnSize, height: btnSize, borderRadius: 8, border:'none',
    background: `${color}14`, color, cursor:'pointer',
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    transition: 'all .15s',
  });

  return (
    <div style={{display:"flex",gap:6}}>
      <button title="Enviar WhatsApp" style={btnStyle('#25D366')}
        onMouseEnter={e=>{e.currentTarget.style.background='#25D366';e.currentTarget.style.color='white'}}
        onMouseLeave={e=>{e.currentTarget.style.background='#25D36614';e.currentTarget.style.color='#25D366'}}
        onClick={e=>{e.stopPropagation();onMensagem({canal:'whatsapp', contato, negocio})}}>
        <Ico size={ico} d={<><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></>}/>
      </button>
      <button title="Enviar E-mail" style={btnStyle(VAREJO.primary)}
        onMouseEnter={e=>{e.currentTarget.style.background=VAREJO.primary;e.currentTarget.style.color='white'}}
        onMouseLeave={e=>{e.currentTarget.style.background=`${VAREJO.primary}14`;e.currentTarget.style.color=VAREJO.primary}}
        onClick={e=>{e.stopPropagation();onMensagem({canal:'email', contato, negocio})}}>
        <Ico size={ico} d={<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></>}/>
      </button>
      <a title="Ligar" href={`tel:${contato.telefone}`} style={{...btnStyle(ASSESS.primary), textDecoration:'none'}}
        onMouseEnter={e=>{e.currentTarget.style.background=ASSESS.primary;e.currentTarget.style.color='white'}}
        onMouseLeave={e=>{e.currentTarget.style.background=`${ASSESS.primary}14`;e.currentTarget.style.color=ASSESS.primary}}
        onClick={e=>e.stopPropagation()}>
        <Ico size={ico} d={<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>}/>
      </a>
    </div>
  );
}

// ── DASHBOARD CRM ─────────────────────────────────────────────────────────────
function Dashboard({ dados, usuario, setTela }) {
  const ETAPAS_GANHO = ['fechado_ganho', 'projeto_aprovado', 'aguardando_pagamento'];
  const ETAPAS_FINAIS = [...ETAPAS_GANHO, 'fechado_perdido'];

  const ativos = dados.negocios.filter(n => !ETAPAS_FINAIS.includes(n.etapa));
  const ganhos = dados.negocios.filter(n => ETAPAS_GANHO.includes(n.etapa));
  const valorPipeline = ativos.reduce((s,n) => s + n.valor, 0);
  const valorPonderado = ativos.reduce((s,n) => s + (n.valor * n.probabilidade / 100), 0);

  // KPIs Financeiros para o Dashboard
  const aReceber = dados.contas.filter(c => c.tipo === 'receber' && c.status === 'pendente').reduce((s,c) => s+c.valor, 0);
  const aPagar = dados.contas.filter(c => c.tipo === 'pagar' && (c.status === 'pendente' || c.status === 'vencido')).reduce((s,c) => s+c.valor, 0);
  const vencidas = dados.contas.filter(c => c.tipo === 'pagar' && (c.status === 'vencido' || (c.status === 'pendente' && diasAteVencer(c.vencimento) < 0))).length;

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const data = new Date().toLocaleDateString("pt-BR", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{padding:"36px 48px 60px",maxWidth:1280,margin:"0 auto"}}>
      <div style={{marginBottom:36,display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:10,letterSpacing:4,textTransform:"uppercase",color:ASSESS.primary,fontWeight:600,marginBottom:12}}>{data}</div>
          <h1 style={{fontFamily:FT,fontWeight:300,fontSize:44,letterSpacing:.3,lineHeight:1.12,color:"#1a1a1a",margin:"0 0 12px"}}>
            {saudacao}, <em style={{fontStyle:"italic",fontWeight:400,color:ASSESS.primary}}>{usuario.nome.split(" ")[0]}.</em>
          </h1>
          <p style={{fontSize:14,color:"#888",maxWidth:520,lineHeight:1.7,margin:0}}>Visão consolidada da operação: pipeline comercial e saúde financeira.</p>
        </div>
        <AxLogo height={36} dark={false} style={{filter:"none",opacity:.35}}/>
      </div>

      {/* KPIs CRM */}
      <SectionTitle label="Pipeline Comercial"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
        <KpiCard label="Pipeline Total" value={fmtMM(valorPipeline)} sub={`${ativos.length} negócios ativos`} accent={ASSESS.primary}/>
        <KpiCard label="Pipeline Ponderado" value={fmtMM(valorPonderado)} sub="por probabilidade" accent={SEC}/>
        <KpiCard label="Negócios Ganhos" value={ganhos.length} sub={fmtMM(ganhos.reduce((s,n)=>s+n.valor,0))} accent="#2e8a4e"/>
        <KpiCard label="Conversão" value={`${dados.negocios.length > 0 ? (ganhos.length / dados.negocios.length * 100).toFixed(0) : 0}%`} sub={`${dados.negocios.length} no total`} accent={VAREJO.primary}/>
      </div>

      {/* KPIs Financeiros */}
      <SectionTitle label="Saúde Financeira"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:32}}>
        <div onClick={()=>setTela('contas_receber')} style={{cursor:"pointer",background:"white",borderRadius:14,padding:"20px 22px",border:"1px solid rgba(113,63,42,0.10)",borderTop:`3px solid #2e8a4e`,transition:"transform .15s"}}
          onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
          onMouseLeave={e=>e.currentTarget.style.transform="none"}>
          <div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#888",fontWeight:600,marginBottom:10}}>A Receber</div>
          <div style={{fontFamily:FT,fontWeight:300,fontSize:32,color:"#2e8a4e",lineHeight:1,marginBottom:6}}>{fmtMM(aReceber)}</div>
          <div style={{fontSize:11,color:"#aaa"}}>{dados.contas.filter(c=>c.tipo==='receber'&&c.status==='pendente').length} contas pendentes</div>
        </div>
        <div onClick={()=>setTela('contas_pagar')} style={{cursor:"pointer",background:"white",borderRadius:14,padding:"20px 22px",border:"1px solid rgba(113,63,42,0.10)",borderTop:`3px solid #b71c1c`,transition:"transform .15s"}}
          onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
          onMouseLeave={e=>e.currentTarget.style.transform="none"}>
          <div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#888",fontWeight:600,marginBottom:10}}>A Pagar</div>
          <div style={{fontFamily:FT,fontWeight:300,fontSize:32,color:"#b71c1c",lineHeight:1,marginBottom:6}}>{fmtMM(aPagar)}</div>
          <div style={{fontSize:11,color:"#aaa"}}>{dados.contas.filter(c=>c.tipo==='pagar'&&c.status==='pendente').length} pendentes</div>
        </div>
        <div onClick={()=>setTela('calendario')} style={{cursor:"pointer",background:"white",borderRadius:14,padding:"20px 22px",border:"1px solid rgba(113,63,42,0.10)",borderTop:`3px solid #f59e0b`,transition:"transform .15s"}}
          onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
          onMouseLeave={e=>e.currentTarget.style.transform="none"}>
          <div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#888",fontWeight:600,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>Vencidas {vencidas > 0 && <span style={{color:"#b71c1c"}}>{I.alert}</span>}</div>
          <div style={{fontFamily:FT,fontWeight:300,fontSize:32,color:"#f59e0b",lineHeight:1,marginBottom:6}}>{vencidas}</div>
          <div style={{fontSize:11,color:"#aaa"}}>contas em atraso</div>
        </div>
        <div onClick={()=>setTela('dre')} style={{cursor:"pointer",background:"white",borderRadius:14,padding:"20px 22px",border:"1px solid rgba(113,63,42,0.10)",borderTop:`3px solid ${ASSESS.primary}`,transition:"transform .15s"}}
          onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
          onMouseLeave={e=>e.currentTarget.style.transform="none"}>
          <div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#888",fontWeight:600,marginBottom:10}}>Saldo Líquido</div>
          <div style={{fontFamily:FT,fontWeight:300,fontSize:32,color:ASSESS.primary,lineHeight:1,marginBottom:6}}>{fmtMM(aReceber - aPagar)}</div>
          <div style={{fontSize:11,color:"#aaa"}}>posição projetada</div>
        </div>
      </div>

      {/* Próximas Atividades + Vencimentos próximos */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div>
          <SectionTitle label="Próximas Atividades CRM"/>
          <div style={{background:"white",borderRadius:14,padding:"18px 20px",border:"1px solid rgba(113,63,42,0.10)"}}>
            {dados.atividades.filter(a => !a.concluida).slice(0,5).map(a => {
              const negocio = dados.negocios.find(n => n.id === a.negocioId);
              const contato = dados.contatos.find(c => c.id === negocio?.contatoId);
              return (
                <div key={a.id} style={{padding:"10px 0",borderBottom:"1px solid #f5f0e8"}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:2}}>{a.titulo}</div>
                  <div style={{fontSize:11,color:"#888"}}>{contato?.nome} · {fmtDate(a.data)}</div>
                </div>
              );
            })}
            {dados.atividades.filter(a => !a.concluida).length === 0 && (
              <div style={{padding:"20px 0",textAlign:"center",fontSize:13,color:"#aaa"}}>Nenhuma atividade pendente</div>
            )}
          </div>
        </div>

        <div>
          <SectionTitle label="Próximos Vencimentos"/>
          <div style={{background:"white",borderRadius:14,padding:"18px 20px",border:"1px solid rgba(113,63,42,0.10)"}}>
            {dados.contas.filter(c => c.status === 'pendente').sort((a,b) => a.vencimento.localeCompare(b.vencimento)).slice(0,5).map(c => {
              const dias = diasAteVencer(c.vencimento);
              const cor = dias < 0 ? "#b71c1c" : dias <= 3 ? "#f59e0b" : c.tipo === 'receber' ? "#2e8a4e" : "#888";
              return (
                <div key={c.id} style={{padding:"10px 0",borderBottom:"1px solid #f5f0e8",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.descricao}</div>
                    <div style={{fontSize:11,color:cor}}>
                      {c.tipo === 'receber' ? '↓ Receber' : '↑ Pagar'} · {fmtDate(c.vencimento)} {dias < 0 ? `(${Math.abs(dias)}d atraso)` : dias === 0 ? '(hoje)' : `(${dias}d)`}
                    </div>
                  </div>
                  <div style={{fontSize:13,fontWeight:600,color:cor,fontFamily:FT}}>{fmtR(c.valor)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PIPELINE ──────────────────────────────────────────────────────────────────
const COLUNAS_PIPELINE = [
  { id: 'negocio',    label: 'Negócio / Contato', always: true, width: '2fr' },
  { id: 'produto',    label: 'Produto',            width: '1.3fr' },
  { id: 'etapa',      label: 'Etapa',              width: '1.2fr' },
  { id: 'valor',      label: 'Valor',              width: '1fr' },
  { id: 'prob',       label: 'Prob.',              width: '0.8fr' },
  { id: 'fechamento', label: 'Fechamento',         width: '1fr' },
  { id: 'consultor',  label: 'Consultor',          width: '1fr' },
  { id: 'acoes',      label: 'Ações', always: true, width: '150px' },
];

function Pipeline({ dados, onMover, onAtualizar, onAdicionar, onRemover, onMensagem, onAbrirNegocio, draggedNegocio, setDraggedNegocio, onGerarProposta, onTransferirNegocio }) {
  const [pipeAtiva, setPipeAtiva] = useState('varejo');
  const [visao, setVisao] = useState('kanban'); // 'kanban' | 'lista'
  const [ordemLista, setOrdemLista] = useState('valor'); // 'valor' | 'prob' | 'fechamento' | 'etapa'
  const [colsVisiveis, setColsVisiveis] = useState(['negocio','produto','etapa','valor','prob','fechamento','acoes']);
  const [showColPanel, setShowColPanel] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const stages = pipeAtiva === 'varejo' ? PIPE_VAREJO : PIPE_ATACADO;
  const PAL = pipeAtiva === 'varejo' ? VAREJO : ASSESS;

  const getAreaNegocio = (n) => n.area || dados.contatos.find(x => x.id === n.contatoId)?.area || 'varejo';

  const negociosArea = dados.negocios.filter(n => getAreaNegocio(n) === pipeAtiva);

  const totalPipeline = negociosArea.filter(n=>n.etapa!=='fechado_perdido').reduce((s,n)=>s+n.valor,0);
  const totalFechado = negociosArea.filter(n=>n.etapa==='fechado_ganho'||n.etapa==='projeto_aprovado').reduce((s,n)=>s+n.valor,0);

  // ── KANBAN CARD ─────────────────────────────────────────────────────────────
  function KanbanCard({ n }) {
    const contato = dados.contatos.find(c => c.id === n.contatoId);
    const stage = stages.find(s => s.id === n.etapa);
    const [resumo, setResumo] = useState(n.campos_extras?.resumo_card || '');
    const [editandoResumo, setEditandoResumo] = useState(false);
    return (
      <div
        draggable
        onDragStart={() => setDraggedNegocio(n.id)}
        onClick={() => onAbrirNegocio(n.id)}
        style={{
          background: "#fff",
          border: "1px solid #EDE8E0",
          borderLeft: `3px solid ${stage?.color || PAL.primary}`,
          borderRadius: 10,
          padding: "14px 14px 12px",
          cursor: "grab",
          transition: "box-shadow .15s, transform .15s",
          userSelect: "none",
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px -8px rgba(0,0,0,0.14)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = ""; }}
      >
        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${PAL.primary}12`, display: "flex", alignItems: "center", justifyContent: "center", color: PAL.primary, flexShrink: 0 }}>
              {contato?.tipo === 'PJ' ? I.building : I.user}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.3, maxWidth: 170 }}>{n.titulo}</div>
            </div>
          </div>
          <button onClick={e => { e.stopPropagation(); onRemover(n.id); }}
            style={{ background: "none", border: "none", color: "#d0c8be", cursor: "pointer", padding: "2px 4px", borderRadius: 4, display: "flex", flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = "#b71c1c"}
            onMouseLeave={e => e.currentTarget.style.color = "#d0c8be"}>
            {I.trash}
          </button>
        </div>

        {/* Produto tag */}
        {n.produto && (
          <div style={{ fontSize: 10, letterSpacing: 1, color: PAL.secondary, background: `${PAL.primary}0A`, padding: "3px 8px", borderRadius: 20, display: "inline-block", fontWeight: 600, marginBottom: 8 }}>
            {n.produto}
          </div>
        )}

        {/* Etapa selector */}
        <div style={{ marginBottom: 8 }} onClick={e => e.stopPropagation()}>
          <select
            value={n.etapa || ''}
            onChange={e => { e.stopPropagation(); onAtualizar && onAtualizar(n.id, { etapa: e.target.value }); }}
            style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, border: "1px solid #EDE8E0", background: "white", color: "#444", fontFamily: SN, width: "100%", cursor: "pointer" }}
          >
            {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Contact info */}
        {contato && (
          <div style={{ background: "#FAFAF8", borderRadius: 7, padding: "8px 10px", marginBottom: 10, display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#2a2a2a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{contato.nome}</div>
            {contato.telefone && (
              <div style={{ fontSize: 10, color: "#777", display: "flex", alignItems: "center", gap: 4 }}>
                {I.phone} <span>{contato.telefone}</span>
              </div>
            )}
            {contato.email && (
              <div style={{ fontSize: 10, color: "#777", display: "flex", alignItems: "center", gap: 4 }}>
                {I.mail} <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 170 }}>{contato.email}</span>
              </div>
            )}
          </div>
        )}

        {/* Value + prob */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #F0EBE3" }}>
          <span style={{ fontFamily: FT, fontSize: 18, fontWeight: 400, color: PAL.primary, letterSpacing: 0.3 }}>{fmtMM(n.valor)}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#EDE8E0", overflow: "hidden" }}>
              <div style={{ width: `${n.probabilidade}%`, height: "100%", background: n.probabilidade >= 70 ? "#2e8a4e" : n.probabilidade >= 40 ? PAL.accent : "#aaa", borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 10, color: "#aaa", fontWeight: 700 }}>{n.probabilidade}%</span>
          </div>
        </div>

        {/* Fechamento */}
        {n.fechamento && (
          <div style={{ marginTop: 8, fontSize: 10, color: "#aaa", display: "flex", alignItems: "center", gap: 4 }}>
            {I.cal} {fmtDate(n.fechamento)}
          </div>
        )}

        {/* Resumo do Negócio */}
        <div style={{ marginTop: 10 }} onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.5, color: "#aaa", fontWeight: 600, textTransform: "uppercase" }}>Resumo</div>
            {!editandoResumo && (
              <button onClick={() => { setResumo(n.campos_extras?.resumo_card || ''); setEditandoResumo(true); }}
                style={{ background: "none", border: "none", color: "#bbb", cursor: "pointer", padding: "2px 4px", borderRadius: 4, display: "flex", lineHeight: 1 }}
                onMouseEnter={e => e.currentTarget.style.color = PAL.primary}
                onMouseLeave={e => e.currentTarget.style.color = "#bbb"}>
                {I.edit}
              </button>
            )}
          </div>
          {editandoResumo ? (
            <>
              <textarea
                value={resumo}
                onChange={e => setResumo(e.target.value)}
                autoFocus
                rows={3}
                style={{ width: "100%", padding: "8px 10px", border: `1.5px solid ${PAL.primary}60`, borderRadius: 7, fontSize: 11, fontFamily: SN, resize: "none", boxSizing: "border-box", color: "#555", lineHeight: 1.5, background: "#fff", outline: "none" }}
              />
              <div style={{ display: "flex", gap: 4, marginTop: 4, justifyContent: "flex-end" }}>
                <button onClick={() => setEditandoResumo(false)}
                  style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e0dbd0", background: "#fff", fontSize: 10, cursor: "pointer", fontFamily: SN, color: "#888" }}>
                  Cancelar
                </button>
                <button onClick={() => { onAtualizar && onAtualizar(n.id, { campos_extras: { ...(n.campos_extras || {}), resumo_card: resumo } }); setEditandoResumo(false); }}
                  style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: PAL.primary, color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: SN }}>
                  Salvar
                </button>
              </div>
            </>
          ) : (
            <div style={{ fontSize: 11, color: resumo ? "#555" : "#ccc", lineHeight: 1.6, fontStyle: resumo ? "normal" : "italic", background: "#FAFAF8", borderRadius: 7, padding: "8px 10px", minHeight: 38 }}>
              {resumo || "Nenhum resumo adicionado."}
            </div>
          )}
        </div>

        {/* Pré-Proposta — apenas Atacado */}
        {pipeAtiva === 'atacado' && (
          <div style={{ marginTop: 8, padding: "10px 12px", background: `${ASSESS.primary}06`, borderRadius: 8, border: `1px solid ${ASSESS.primary}18` }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 9, letterSpacing: 1.5, color: ASSESS.primary, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Pré-Proposta</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 1, color: "#888", fontWeight: 600, marginBottom: 3, textTransform: "uppercase" }}>Destinação dos Recursos</div>
                <select
                  value={n.campos_extras?.destinacao_recursos || ''}
                  onChange={e => { e.stopPropagation(); onAtualizar && onAtualizar(n.id, { campos_extras: { ...(n.campos_extras || {}), destinacao_recursos: e.target.value } }); }}
                  style={{ fontSize: 11, padding: "5px 8px", borderRadius: 6, border: "1px solid #EDE8E0", background: "white", color: n.campos_extras?.destinacao_recursos ? "#444" : "#aaa", fontFamily: SN, width: "100%", cursor: "pointer" }}>
                  <option value="">— Selecionar —</option>
                  {['Capital de Giro', 'Expansão / Investimento', 'Quitação de Dívidas', 'Antecipação de Recebíveis', 'Estruturação Financeira', 'Outro'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 1, color: "#888", fontWeight: 600, marginBottom: 3, textTransform: "uppercase" }}>Garantias</div>
                <select
                  value={n.campos_extras?.tipo_garantia || ''}
                  onChange={e => { e.stopPropagation(); onAtualizar && onAtualizar(n.id, { campos_extras: { ...(n.campos_extras || {}), tipo_garantia: e.target.value } }); }}
                  style={{ fontSize: 11, padding: "5px 8px", borderRadius: 6, border: "1px solid #EDE8E0", background: "white", color: n.campos_extras?.tipo_garantia ? "#444" : "#aaa", fontFamily: SN, width: "100%", cursor: "pointer" }}>
                  <option value="">— Selecionar —</option>
                  {['Imóvel', 'Veículo', 'Recebíveis', 'Aval / Fiança', 'Sem Garantia', 'Avaliando'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Row 1: contact actions + external link */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {contato && <AcoesRapidas contato={contato} negocio={n} onMensagem={onMensagem} size="sm" />}
            <a href={typeof window!=='undefined'?`${window.location.origin}/negocio?param=${n.id}`:'/negocio'} target="_blank" rel="noreferrer"
              onClick={e=>e.stopPropagation()} title="Abrir em nova aba"
              style={{marginLeft:"auto",padding:"6px 7px",borderRadius:7,border:"1px solid #EDE8E0",background:"white",color:"#bbb",display:"flex",alignItems:"center",textDecoration:"none"}}
              onMouseEnter={e=>e.currentTarget.style.color="#888"}
              onMouseLeave={e=>e.currentTarget.style.color="#bbb"}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          </div>
          {/* Row 2: proposta + transfer */}
          {(onGerarProposta || onTransferirNegocio) && (
            <div style={{ display: "flex", gap: 6 }}>
              {onGerarProposta && (
                <button
                  onClick={e => { e.stopPropagation(); onGerarProposta(n, contato); }}
                  style={{ flex: 1, padding: "6px 0", borderRadius: 7, border: `1.5px solid ${PAL.primary}30`, background: `${PAL.primary}06`, color: PAL.primary, fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: SN, letterSpacing: 0.5 }}>
                  {I.doc} Proposta
                </button>
              )}
              {onTransferirNegocio && (
                <button
                  onClick={e => { e.stopPropagation(); onTransferirNegocio(n.id); }}
                  title={`Transferir para ${pipeAtiva === 'varejo' ? 'Atacado' : 'Varejo'}`}
                  style={{ flex: 1, padding: "6px 0", borderRadius: 7, border: `1.5px solid ${pipeAtiva==='varejo'?ASSESS.primary:VAREJO.primary}30`, background: `${pipeAtiva==='varejo'?ASSESS.primary:VAREJO.primary}08`, color: pipeAtiva==='varejo'?ASSESS.primary:VAREJO.primary, fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontFamily: SN }}>
                  ⇄ {pipeAtiva === 'varejo' ? 'Atacado' : 'Varejo'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── LISTA VIEW ───────────────────────────────────────────────────────────────
  function ListaView() {
    const sorted = [...negociosArea].sort((a, b) => {
      if (ordemLista === 'valor') return b.valor - a.valor;
      if (ordemLista === 'prob') return b.probabilidade - a.probabilidade;
      if (ordemLista === 'fechamento') return (a.fechamento || '').localeCompare(b.fechamento || '');
      if (ordemLista === 'etapa') return stages.findIndex(s => s.id === a.etapa) - stages.findIndex(s => s.id === b.etapa);
      return 0;
    });

    const colsAtivas = COLUNAS_PIPELINE.filter(c => c.always || colsVisiveis.includes(c.id));
    const gridTpl = colsAtivas.map(c => c.width).join(' ');
    const colH = { fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#aaa", fontWeight: 700, padding: "0 10px", cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: 4 };
    const sortKey = { negocio: '', produto: '', etapa: 'etapa', valor: 'valor', prob: 'prob', fechamento: 'fechamento', consultor: '', acoes: '' };
    const inpSt = { border: "1.5px solid #ddd", borderRadius: 6, padding: "4px 8px", fontSize: 12, fontFamily: SN, background: "#fff", width: "100%", boxSizing: "border-box" };

    const iniciarEdit = (n) => {
      setEditandoId(n.id);
      setEditForm({ titulo: n.titulo, valor: n.valor, produto: n.produto || '', probabilidade: n.probabilidade, fechamento: n.fechamento || '', etapa: n.etapa });
    };
    const salvarEdit = (id) => {
      onAtualizar(id, { ...editForm, valor: parseFloat(editForm.valor) || 0, probabilidade: parseInt(editForm.probabilidade) || 0 });
      setEditandoId(null);
    };

    return (
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EDE8E0", overflow: "visible" }}>
        {/* Header row */}
        <div style={{ display: "grid", gridTemplateColumns: gridTpl, padding: "10px 0", borderBottom: "2px solid #F5F0E8", background: "#FAF8F3", borderRadius: "14px 14px 0 0", position: "relative" }}>
          {colsAtivas.map(col => (
            <div key={col.id} onClick={() => sortKey[col.id] && setOrdemLista(sortKey[col.id])}
              style={{ ...colH, color: ordemLista === sortKey[col.id] && sortKey[col.id] ? PAL.primary : "#aaa" }}>
              {col.label}
              {sortKey[col.id] && ordemLista === sortKey[col.id] && <span>↓</span>}
              {col.id === 'acoes' && (
                <button onClick={e => { e.stopPropagation(); setShowColPanel(v => !v); }}
                  style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: showColPanel ? PAL.primary : "#aaa", display: "flex", padding: 2 }}
                  title="Colunas visíveis">
                  ⚙
                </button>
              )}
            </div>
          ))}
          {/* Column visibility panel */}
          {showColPanel && (
            <div onClick={e => e.stopPropagation()}
              style={{ position: "absolute", top: "100%", right: 0, zIndex: 999, background: "#fff", border: "1px solid #EDE8E0", borderRadius: 10, padding: "14px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", minWidth: 180 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#aaa", fontWeight: 700, marginBottom: 10 }}>Colunas</div>
              {COLUNAS_PIPELINE.filter(c => !c.always).map(col => (
                <label key={col.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", cursor: "pointer", fontSize: 13, color: "#1a1a1a" }}>
                  <input type="checkbox" checked={colsVisiveis.includes(col.id)}
                    onChange={e => setColsVisiveis(v => e.target.checked ? [...v, col.id] : v.filter(x => x !== col.id))}
                    style={{ accentColor: PAL.primary }}/>
                  {col.label}
                </label>
              ))}
            </div>
          )}
        </div>

        {sorted.length === 0 && (
          <div style={{ padding: "60px 0", textAlign: "center", color: "#ccc", fontSize: 13 }}>
            Nenhum negócio nesta pipeline
          </div>
        )}

        {sorted.map((n, idx) => {
          const contato = dados.contatos.find(c => c.id === n.contatoId);
          const stage = stages.find(s => s.id === n.etapa);
          const consultor = dados.funcionarios?.find(f => f.id === n.consultorId);
          const editando = editandoId === n.id;

          const cellStyle = { padding: "0 10px", display: "flex", alignItems: "center", minHeight: 52 };

          return (
            <div key={n.id}
              style={{ display: "grid", gridTemplateColumns: gridTpl, borderBottom: idx < sorted.length - 1 ? "1px solid #F5F0E8" : "none", background: editando ? "#FDFAF6" : "white", transition: "background .12s" }}
              onMouseEnter={e => { if (!editando) e.currentTarget.style.background = "#FAF8F3"; }}
              onMouseLeave={e => { if (!editando) e.currentTarget.style.background = "white"; }}>

              {/* Negócio / Contato */}
              {colsAtivas.find(c => c.id === 'negocio') && (
                <div style={cellStyle} onClick={() => !editando && onAbrirNegocio(n.id)} css={{ cursor: editando ? "default" : "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", cursor: editando ? "default" : "pointer" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 7, background: `${PAL.primary}10`, display: "flex", alignItems: "center", justifyContent: "center", color: PAL.primary, flexShrink: 0 }}>
                      {contato?.tipo === 'PJ' ? I.building : I.user}
                    </div>
                    {editando ? (
                      <input value={editForm.titulo} onChange={e => setEditForm(v => ({...v, titulo: e.target.value}))}
                        style={{ ...inpSt, fontWeight: 600 }} onClick={e => e.stopPropagation()}/>
                    ) : (
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{n.titulo}</div>
                        {contato && <div style={{ fontSize: 11, color: "#888" }}>{contato.nome}</div>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Produto */}
              {colsAtivas.find(c => c.id === 'produto') && (
                <div style={cellStyle}>
                  {editando ? (
                    <select value={editForm.produto} onChange={e => setEditForm(v => ({...v, produto: e.target.value}))} style={inpSt}>
                      <option value="">— sem produto —</option>
                      {PRODUTOS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  ) : n.produto ? (
                    <span style={{ fontSize: 11, background: `${PAL.primary}0A`, color: PAL.secondary, padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>{n.produto}</span>
                  ) : <span style={{ color: "#ccc", fontSize: 12 }}>—</span>}
                </div>
              )}

              {/* Etapa */}
              {colsAtivas.find(c => c.id === 'etapa') && (
                <div style={cellStyle}>
                  {editando ? (
                    <select value={editForm.etapa} onChange={e => setEditForm(v => ({...v, etapa: e.target.value}))} style={inpSt}>
                      {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: `${stage?.color}18`, color: stage?.color || "#888" }}>
                      {stage?.name || n.etapa}
                    </span>
                  )}
                </div>
              )}

              {/* Valor */}
              {colsAtivas.find(c => c.id === 'valor') && (
                <div style={cellStyle}>
                  {editando ? (
                    <input type="number" value={editForm.valor} onChange={e => setEditForm(v => ({...v, valor: e.target.value}))} style={inpSt}/>
                  ) : (
                    <span style={{ fontFamily: FT, fontSize: 16, color: PAL.primary, fontWeight: 400 }}>{fmtMM(n.valor)}</span>
                  )}
                </div>
              )}

              {/* Probabilidade */}
              {colsAtivas.find(c => c.id === 'prob') && (
                <div style={cellStyle}>
                  {editando ? (
                    <input type="number" min="0" max="100" value={editForm.probabilidade} onChange={e => setEditForm(v => ({...v, probabilidade: e.target.value}))} style={inpSt}/>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 36, height: 4, borderRadius: 2, background: "#EDE8E0", overflow: "hidden" }}>
                        <div style={{ width: `${n.probabilidade}%`, height: "100%", background: n.probabilidade >= 70 ? "#2e8a4e" : n.probabilidade >= 40 ? PAL.accent : "#aaa", borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 12, color: "#666", fontWeight: 600 }}>{n.probabilidade}%</span>
                    </div>
                  )}
                </div>
              )}

              {/* Fechamento */}
              {colsAtivas.find(c => c.id === 'fechamento') && (
                <div style={cellStyle}>
                  {editando ? (
                    <input type="date" value={editForm.fechamento} onChange={e => setEditForm(v => ({...v, fechamento: e.target.value}))} style={inpSt}/>
                  ) : (
                    <span style={{ fontSize: 12, color: "#888" }}>{n.fechamento ? fmtDate(n.fechamento) : "—"}</span>
                  )}
                </div>
              )}

              {/* Consultor */}
              {colsAtivas.find(c => c.id === 'consultor') && (
                <div style={cellStyle}>
                  <span style={{ fontSize: 12, color: "#555" }}>{consultor?.nome || "—"}</span>
                </div>
              )}

              {/* Ações */}
              {colsAtivas.find(c => c.id === 'acoes') && (
                <div style={{ ...cellStyle, gap: 4 }} onClick={e => e.stopPropagation()}>
                  {editando ? (
                    <>
                      <button onClick={() => salvarEdit(n.id)}
                        style={{ padding: "5px 10px", borderRadius: 7, border: "none", background: PAL.primary, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: SN, whiteSpace: "nowrap" }}>
                        Salvar
                      </button>
                      <button onClick={() => setEditandoId(null)}
                        style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid #ddd", background: "#fff", fontSize: 11, cursor: "pointer", fontFamily: SN }}>
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => iniciarEdit(n)}
                        style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", padding: "4px", borderRadius: 5, display: "flex" }}
                        onMouseEnter={e => e.currentTarget.style.color = PAL.primary}
                        onMouseLeave={e => e.currentTarget.style.color = "#aaa"}>
                        {I.edit}
                      </button>
                      {onTransferirNegocio && (
                        <button onClick={() => onTransferirNegocio(n.id)}
                          title={`Transferir para ${pipeAtiva === 'varejo' ? 'Atacado' : 'Varejo'}`}
                          style={{ padding: "4px 6px", borderRadius: 6, border: `1.5px solid ${pipeAtiva==='varejo'?ASSESS.primary:VAREJO.primary}30`, background: `${pipeAtiva==='varejo'?ASSESS.primary:VAREJO.primary}08`, color: pipeAtiva==='varejo'?ASSESS.primary:VAREJO.primary, fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 2, fontFamily: SN, whiteSpace: "nowrap" }}>
                          ⇄
                        </button>
                      )}
                      {onGerarProposta && (
                        <button onClick={() => onGerarProposta(n, contato)}
                          style={{ padding: "4px 7px", borderRadius: 6, border: `1.5px solid ${PAL.primary}30`, background: `${PAL.primary}06`, color: PAL.primary, fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontFamily: SN }}>
                          {I.doc}
                        </button>
                      )}
                      <button onClick={() => onRemover(n.id)}
                        style={{ background: "none", border: "none", color: "#d0c8be", cursor: "pointer", padding: "4px", borderRadius: 5, display: "flex" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#b71c1c"}
                        onMouseLeave={e => e.currentTarget.style.color = "#d0c8be"}>
                        {I.trash}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 36px 60px", maxWidth: 1600, margin: "0 auto", height: "100%", display: "flex", flexDirection: "column" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: PAL.primary, fontWeight: 600, marginBottom: 8 }}>
            Pipeline · {pipeAtiva === 'varejo' ? 'Varejo' : 'Atacado'}
          </div>
          <h1 style={{ fontFamily: FT, fontWeight: 300, fontSize: 34, letterSpacing: .3, color: "#1a1a1a", margin: 0 }}>
            Negócios em <em style={{ fontStyle: "italic", color: PAL.primary }}>andamento</em>
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* View toggle */}
          <div style={{ display: "flex", background: "#F5F0E8", borderRadius: 10, padding: 3, gap: 2 }}>
            {[{ id: 'kanban', icon: I.pipe, label: 'Kanban' }, { id: 'lista', icon: I.dash, label: 'Lista' }, { id: 'pesquisa', icon: I.search, label: 'Pesquisa' }].map(v => (
              <button key={v.id} onClick={() => setVisao(v.id)}
                style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: visao === v.id ? "#fff" : "transparent", color: visao === v.id ? "#1a1a1a" : "#888", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: SN, display: "flex", alignItems: "center", gap: 6, boxShadow: visao === v.id ? "0 1px 4px rgba(0,0,0,.08)" : "none" }}>
                <span style={{ display: "flex" }}>{v.icon}</span>{v.label}
              </button>
            ))}
          </div>
          <Btn icon={I.plus} palette={PAL} onClick={onAdicionar}>Novo Negócio</Btn>
        </div>
      </div>

      {/* ── TABS VAREJO / ATACADO ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ display: "flex", background: "#F5F0E8", borderRadius: 10, padding: 3, gap: 2 }}>
          {[
            { id: 'varejo', label: 'Varejo', cor: VAREJO.primary },
            { id: 'atacado', label: 'Atacado', cor: ASSESS.primary },
          ].map(t => {
            const count = dados.negocios.filter(n => getAreaNegocio(n) === t.id).length;
            return (
              <button key={t.id} onClick={() => setPipeAtiva(t.id)}
                style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: pipeAtiva === t.id ? "#fff" : "transparent", color: pipeAtiva === t.id ? t.cor : "#888", cursor: "pointer", fontSize: 12, fontWeight: pipeAtiva === t.id ? 700 : 500, fontFamily: SN, display: "flex", alignItems: "center", gap: 8, boxShadow: pipeAtiva === t.id ? "0 1px 4px rgba(0,0,0,.08)" : "none" }}>
                {t.label}
                <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 99, background: pipeAtiva === t.id ? `${t.cor}18` : "rgba(0,0,0,0.06)", color: pipeAtiva === t.id ? t.cor : "#aaa", fontWeight: 700 }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* KPI mini pills */}
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          {[
            { label: "Em aberto", value: fmtMM(totalPipeline), color: PAL.primary },
            { label: "Fechado ganho", value: fmtMM(totalFechado), color: "#2e8a4e" },
            { label: "Negócios", value: negociosArea.filter(n => n.etapa !== 'fechado_perdido').length, color: "#888" },
          ].map(k => (
            <div key={k.label} style={{ padding: "6px 14px", background: "#fff", borderRadius: 20, border: "1px solid #EDE8E0", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: FT, fontSize: 15, color: k.color, fontWeight: 400 }}>{k.value}</span>
              <span style={{ fontSize: 10, color: "#aaa", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>{k.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── STAGE PROGRESS BAR ── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderRadius: 8, overflow: "hidden", height: 6 }}>
        {stages.map(stage => {
          const count = negociosArea.filter(n => n.etapa === stage.id).length;
          const total = negociosArea.length || 1;
          return (
            <div key={stage.id} title={`${stage.name}: ${count}`}
              style={{ flex: count || 0.2, background: count > 0 ? stage.color : "#EDE8E0", opacity: count > 0 ? 1 : 0.4, transition: "flex .3s" }} />
          );
        })}
      </div>

      {/* ── KANBAN VIEW ── */}
      {visao === 'kanban' && (
        <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden" }}>
          <div style={{ display: "flex", gap: 12, minWidth: "max-content", height: "100%", paddingBottom: 12, alignItems: "flex-start" }}>
            {stages.map(stage => {
              const negocios = negociosArea.filter(n => n.etapa === stage.id);
              const total = negocios.reduce((s, n) => s + n.valor, 0);
              return (
                <div key={stage.id}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => { if (draggedNegocio) { onMover(draggedNegocio, stage.id); setDraggedNegocio(null); } }}
                  style={{ width: 264, flexShrink: 0, display: "flex", flexDirection: "column", maxHeight: "100%", borderRadius: 12, background: "#F5F0E8" }}>

                  {/* Column header */}
                  <div style={{ padding: "12px 14px 10px", borderBottom: `2px solid ${stage.color}`, flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#1a1a1a", letterSpacing: .3 }}>{stage.name}</span>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: stage.color, color: "#fff", fontWeight: 700 }}>{negocios.length}</span>
                    </div>
                    <div style={{ fontFamily: FT, fontSize: 15, color: negocios.length ? "#1a1a1a" : "#bbb", fontWeight: 300 }}>
                      {negocios.length ? fmtMM(total) : "—"}
                    </div>
                  </div>

                  {/* Cards */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {negocios.map(n => <KanbanCard key={n.id} n={n} />)}
                    {negocios.length === 0 && (
                      <div style={{ padding: "32px 0", textAlign: "center", fontSize: 11, color: "#bbb", letterSpacing: 1.5, textTransform: "uppercase" }}>
                        Vazio
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {visao === 'lista' && <ListaView />}

      {/* ── PESQUISA VIEW ── */}
      {visao === 'pesquisa' && <PesquisaView />}
    </div>
  );

  // ── PESQUISA VIEW ─────────────────────────────────────────────────────────────
  function PesquisaView() {
    const [busca, setBusca] = useState('');
    const [filtArea, setFiltArea] = useState('todas');
    const [filtEtapa, setFiltEtapa] = useState('todas');
    const [filtProduto, setFiltProduto] = useState('todos');
    const [filtConsultor, setFiltConsultor] = useState('todos');
    const [filtValorMin, setFiltValorMin] = useState('');
    const [filtValorMax, setFiltValorMax] = useState('');
    const [filtProbMin, setFiltProbMin] = useState('');
    const [filtFechDe, setFiltFechDe] = useState('');
    const [filtFechAte, setFiltFechAte] = useState('');

    const produtos = [...new Set(dados.negocios.map(n => n.produto).filter(Boolean))];
    const todasEtapas = [...PIPE_VAREJO, ...PIPE_ATACADO].reduce((acc, e) => acc.find(x => x.id === e.id) ? acc : [...acc, e], []);

    const resultados = dados.negocios.filter(n => {
      const c = dados.contatos.find(x => x.id === n.contatoId);
      const area = getAreaNegocio(n);
      if (busca) {
        const q = busca.toLowerCase();
        const match = [n.titulo, n.produto, n.observacoes, c?.nome, c?.empresa, c?.email].some(v => v?.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (filtArea !== 'todas' && area !== filtArea) return false;
      if (filtEtapa !== 'todas' && n.etapa !== filtEtapa) return false;
      if (filtProduto !== 'todos' && n.produto !== filtProduto) return false;
      if (filtConsultor !== 'todos' && String(n.consultorId) !== filtConsultor) return false;
      if (filtValorMin && n.valor < Number(filtValorMin)) return false;
      if (filtValorMax && n.valor > Number(filtValorMax)) return false;
      if (filtProbMin && n.probabilidade < Number(filtProbMin)) return false;
      if (filtFechDe && n.fechamento && n.fechamento < filtFechDe) return false;
      if (filtFechAte && n.fechamento && n.fechamento > filtFechAte) return false;
      return true;
    }).sort((a, b) => b.valor - a.valor);

    const totalValor = resultados.reduce((s, n) => s + n.valor, 0);
    const inpF = { padding: "7px 10px", borderRadius: 8, border: "1px solid rgba(113,63,42,0.18)", fontSize: 12, fontFamily: SN, background: "white" };

    const limparFiltros = () => {
      setBusca(''); setFiltArea('todas'); setFiltEtapa('todas'); setFiltProduto('todos');
      setFiltConsultor('todos'); setFiltValorMin(''); setFiltValorMax(''); setFiltProbMin('');
      setFiltFechDe(''); setFiltFechAte('');
    };

    return (
      <div>
        {/* Barra de busca */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 12, border: "1.5px solid #EDE8E0", padding: "10px 16px", marginBottom: 16 }}>
          <span style={{ color: "#aaa", display: "flex" }}>{I.search}</span>
          <input value={busca} onChange={e => setBusca(e.target.value)} autoFocus
            placeholder="Buscar por título, contato, empresa, produto, observações..."
            style={{ border: "none", outline: "none", flex: 1, fontSize: 14, fontFamily: SN, background: "transparent" }}/>
          {busca && <button onClick={() => setBusca('')} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 16, padding: 2 }}>✕</button>}
        </div>

        {/* Filtros em grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16, background: "#FAF8F3", borderRadius: 12, border: "1px solid #EDE8E0", padding: "16px 18px" }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "#aaa", marginBottom: 5 }}>Área</div>
            <select value={filtArea} onChange={e => setFiltArea(e.target.value)} style={inpF}>
              <option value="todas">Todas</option>
              <option value="varejo">Varejo</option>
              <option value="atacado">Atacado</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "#aaa", marginBottom: 5 }}>Etapa</div>
            <select value={filtEtapa} onChange={e => setFiltEtapa(e.target.value)} style={inpF}>
              <option value="todas">Todas</option>
              {todasEtapas.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "#aaa", marginBottom: 5 }}>Produto</div>
            <select value={filtProduto} onChange={e => setFiltProduto(e.target.value)} style={inpF}>
              <option value="todos">Todos</option>
              {produtos.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "#aaa", marginBottom: 5 }}>Consultor</div>
            <select value={filtConsultor} onChange={e => setFiltConsultor(e.target.value)} style={inpF}>
              <option value="todos">Todos</option>
              {dados.funcionarios.map(f => <option key={f.id} value={String(f.id)}>{f.nome}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "#aaa", marginBottom: 5 }}>Valor mín.</div>
            <input type="number" value={filtValorMin} onChange={e => setFiltValorMin(e.target.value)} placeholder="0" style={{ ...inpF, width: "100%", boxSizing: "border-box" }}/>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "#aaa", marginBottom: 5 }}>Valor máx.</div>
            <input type="number" value={filtValorMax} onChange={e => setFiltValorMax(e.target.value)} placeholder="∞" style={{ ...inpF, width: "100%", boxSizing: "border-box" }}/>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "#aaa", marginBottom: 5 }}>Fechamento de</div>
            <input type="date" value={filtFechDe} onChange={e => setFiltFechDe(e.target.value)} style={{ ...inpF, width: "100%", boxSizing: "border-box" }}/>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "#aaa", marginBottom: 5 }}>Fechamento até</div>
            <input type="date" value={filtFechAte} onChange={e => setFiltFechAte(e.target.value)} style={{ ...inpF, width: "100%", boxSizing: "border-box" }}/>
          </div>
        </div>

        {/* Resultados header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 13, color: "#666" }}>
            <strong style={{ color: "#1a1a1a" }}>{resultados.length}</strong> negócio{resultados.length !== 1 ? 's' : ''} encontrado{resultados.length !== 1 ? 's' : ''}
            {resultados.length > 0 && <span style={{ color: "#aaa", marginLeft: 10 }}>· total {fmtMM(totalValor)}</span>}
          </div>
          <button onClick={limparFiltros} style={{ fontSize: 11, color: "#aaa", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: SN }}>
            Limpar filtros
          </button>
        </div>

        {/* Tabela de resultados */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EDE8E0", overflow: "hidden" }}>
          {resultados.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "#ccc", fontSize: 14 }}>
              Nenhum negócio encontrado com os filtros aplicados
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#FAF8F3", borderBottom: "2px solid #F0EBE3" }}>
                  {["Negócio / Contato", "Área", "Produto", "Etapa", "Consultor", "Valor", "Prob.", "Fechamento", ""].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "11px 14px", fontSize: 10, letterSpacing: 2, fontWeight: 600, color: "#aaa", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resultados.map((n, i) => {
                  const c = dados.contatos.find(x => x.id === n.contatoId);
                  const area = getAreaNegocio(n);
                  const PALn = area === 'varejo' ? VAREJO : ASSESS;
                  const etapas = area === 'varejo' ? PIPE_VAREJO : PIPE_ATACADO;
                  const etapa = etapas.find(e => e.id === n.etapa);
                  const cons = dados.funcionarios.find(f => f.id === n.consultorId);
                  const dias = n.fechamento ? diasAteVencer(n.fechamento) : null;
                  return (
                    <tr key={n.id} onClick={() => onAbrirNegocio(n.id)}
                      style={{ borderBottom: i < resultados.length - 1 ? "1px solid #F5F0E8" : "none", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#FAF8F3"}
                      onMouseLeave={e => e.currentTarget.style.background = "white"}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 700, color: "#1a1a1a", marginBottom: 2 }}>{n.titulo}</div>
                        {c && <div style={{ fontSize: 11, color: "#888" }}>{c.nome}{c.empresa ? ` · ${c.empresa}` : ''}</div>}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: `${PALn.primary}14`, color: PALn.primary, fontWeight: 700 }}>
                          {area === 'varejo' ? 'Varejo' : 'Atacado'}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#555" }}>{n.produto || '—'}</td>
                      <td style={{ padding: "12px 14px" }}>
                        {etapa && <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: `${etapa.color}14`, color: etapa.color, fontWeight: 600 }}>{etapa.name}</span>}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#555" }}>{cons ? cons.nome.split(' ')[0] : '—'}</td>
                      <td style={{ padding: "12px 14px", fontFamily: FT, fontSize: 16, color: PALn.primary, fontWeight: 400 }}>{fmtMM(n.valor)}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#EDE8E0", overflow: "hidden" }}>
                            <div style={{ width: `${n.probabilidade}%`, height: "100%", background: n.probabilidade >= 70 ? "#2e8a4e" : n.probabilidade >= 40 ? PALn.accent : "#aaa", borderRadius: 2 }}/>
                          </div>
                          <span style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>{n.probabilidade}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {n.fechamento ? (
                          <div>
                            <div style={{ fontSize: 12, color: "#555" }}>{fmtDate(n.fechamento)}</div>
                            {dias != null && n.etapa !== 'fechado_ganho' && n.etapa !== 'fechado_perdido' && (
                              <div style={{ fontSize: 10, color: dias < 0 ? "#dc2626" : dias <= 7 ? "#f59e0b" : "#aaa", fontWeight: 600 }}>
                                {dias < 0 ? `${Math.abs(dias)}d atraso` : dias === 0 ? 'hoje' : `em ${dias}d`}
                              </div>
                            )}
                          </div>
                        ) : <span style={{ color: "#ccc" }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <button onClick={e => { e.stopPropagation(); onGerarProposta && onGerarProposta(n, c); }}
                          style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${PALn.primary}30`, background: `${PALn.primary}08`, color: PALn.primary, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: SN }}>
                          {I.doc} Proposta
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }
}

// ── CONTATOS ──────────────────────────────────────────────────────────────────
const COLUNAS_CONTATOS = [
  { id:'nome',        label:'Nome',         always:true },
  { id:'email',       label:'E-mail' },
  { id:'telefone',    label:'Telefone' },
  { id:'empresa',     label:'Empresa' },
  { id:'cargo',       label:'Cargo' },
  { id:'area',        label:'Área' },
  { id:'tipo',        label:'Tipo' },
  { id:'cidade',      label:'Cidade' },
  { id:'origem',      label:'Origem' },
  { id:'faturamento', label:'Faturamento' },
  { id:'negocios',    label:'Negócios',    computed:true },
  { id:'volume',      label:'Volume',      computed:true },
  { id:'acoes',       label:'Ações',       always:true },
];

function Contatos({ dados, onAdicionar, onEditar, onRemover, onMensagem, onAbrir }) {
  const [filtro, setFiltro] = useState('todos');
  const [busca, setBusca] = useState('');
  const [visao, setVisao] = useState('cards'); // 'cards' | 'lista'
  const [colsVisiveis, setColsVisiveis] = useState(['nome','email','telefone','empresa','area','negocios','volume','acoes']);
  const [showColPanel, setShowColPanel] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const contatos = dados.contatos.filter(c => {
    if (filtro !== 'todos' && c.tipo !== filtro && c.area !== filtro) return false;
    if (busca && !`${c.nome} ${c.email} ${c.empresa}`.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const abrirEditar = (e, c) => {
    e.stopPropagation();
    setEditandoId(c.id);
    setEditForm({ nome:c.nome||'', email:c.email||'', telefone:c.telefone||'', empresa:c.empresa||'', cargo:c.cargo||'', area:c.area||'varejo', tipo:c.tipo||'PF', cidade:c.cidade||'', origem:c.origem||'', observacoes:c.observacoes||'', faturamento:c.faturamento||0 });
  };
  const salvarEditar = () => { onEditar({ ...dados.contatos.find(c=>c.id===editandoId), ...editForm }); setEditandoId(null); };
  const inpE = { padding:'5px 8px', border:'1px solid #e0dbd0', borderRadius:6, fontSize:12, fontFamily:SN, width:'100%', boxSizing:'border-box', background:'white' };

  const toggleCol = id => setColsVisiveis(v => v.includes(id) ? v.filter(x=>x!==id) : [...v, id]);
  const col = id => colsVisiveis.includes(id);

  return (
    <div style={{padding:"36px 48px 60px",maxWidth:1400,margin:"0 auto"}}>
      <PageHeader
        etiqueta="Carteira de Clientes" titulo="Contatos" destaque="cadastrados"
        sub={`${dados.contatos.length} contatos · ${contatos.length} exibidos`}
        action={<Btn icon={I.plus} onClick={onAdicionar}>Novo Contato</Btn>}
      />

      {/* Toolbar */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        {[{id:'todos',label:'Todos'},{id:'varejo',label:'Varejo',cor:VAREJO.primary},{id:'atacado',label:'Atacado',cor:ASSESS.primary},{id:'PF',label:'Pessoa Física'},{id:'PJ',label:'Pessoa Jurídica'}].map(f => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            style={{padding:"7px 14px",borderRadius:8,border:`1.5px solid ${filtro===f.id?(f.cor||"#1a1a1a"):"rgba(113,63,42,0.18)"}`,background:filtro===f.id?(f.cor?`${f.cor}14`:"#f0f0f0"):"white",color:filtro===f.id?(f.cor||"#1a1a1a"):"#888",fontSize:12,fontWeight:filtro===f.id?600:400,cursor:"pointer"}}>
            {f.label}
          </button>
        ))}
        <div style={{flex:1,minWidth:180,display:"flex",alignItems:"center",gap:10,padding:"0 14px",border:"1px solid rgba(113,63,42,0.18)",borderRadius:8,height:36,background:"#FAF8F3"}}>
          <span style={{color:"#888",display:"flex"}}>{I.search}</span>
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar nome, e-mail, empresa..." style={{border:"none",background:"transparent",outline:"none",flex:1,fontSize:13,fontFamily:SN}}/>
        </div>
        {/* Vista toggle */}
        <div style={{display:"flex",background:"#F5F0E8",borderRadius:8,padding:2,gap:1}}>
          {[{id:'cards',icon:'⊞'},{id:'lista',icon:'☰'}].map(v=>(
            <button key={v.id} onClick={()=>setVisao(v.id)} style={{padding:"6px 12px",borderRadius:6,border:"none",background:visao===v.id?"white":"transparent",cursor:"pointer",fontSize:14,color:visao===v.id?"#1a1a1a":"#888",boxShadow:visao===v.id?"0 1px 3px rgba(0,0,0,.08)":"none"}}>{v.icon}</button>
          ))}
        </div>
        {/* Colunas (só lista) */}
        {visao==='lista' && (
          <div style={{position:"relative"}}>
            <button onClick={()=>setShowColPanel(p=>!p)} style={{padding:"7px 14px",borderRadius:8,border:"1.5px solid rgba(113,63,42,0.18)",background:"white",cursor:"pointer",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
              ⚙️ Colunas
            </button>
            {showColPanel && (
              <div style={{position:"absolute",top:"110%",right:0,background:"white",border:"1px solid #e0dbd0",borderRadius:12,padding:"14px 18px",zIndex:200,minWidth:200,boxShadow:"0 8px 32px rgba(0,0,0,.12)"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#555",letterSpacing:.5,marginBottom:10}}>COLUNAS VISÍVEIS</div>
                {COLUNAS_CONTATOS.filter(c=>!c.always).map(c=>(
                  <label key={c.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",cursor:"pointer",fontSize:13}}>
                    <input type="checkbox" checked={colsVisiveis.includes(c.id)} onChange={()=>toggleCol(c.id)} style={{accentColor:ASSESS.primary}}/>
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* VISTA CARDS */}
      {visao==='cards' && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(360px, 1fr))",gap:14}}>
          {contatos.map(c => {
            const negs = dados.negocios.filter(n => n.contatoId === c.id);
            const valor = negs.reduce((s,n) => s + n.valor, 0);
            const PAL = c.area === 'varejo' ? VAREJO : ASSESS;
            const ativ = dados.atividades.filter(a => negs.some(n => n.id === a.negocioId)).length;
            return (
              <div key={c.id} onClick={()=>onAbrir(c.id)} style={{background:"white",borderRadius:14,padding:"20px 22px",border:"1px solid rgba(113,63,42,0.10)",borderLeft:`4px solid ${PAL.primary}`,cursor:"pointer",transition:"all .15s",display:"flex",flexDirection:"column",gap:14}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 12px 32px -16px ${PAL.primary}66`}}
                onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=""}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,flex:1,minWidth:0}}>
                    <div style={{width:42,height:42,borderRadius:10,background:`linear-gradient(135deg,${PAL.primary},${PAL.secondary})`,color:"#fff",display:"grid",placeItems:"center",fontWeight:700,fontSize:16,flexShrink:0,fontFamily:FT}}>{c.nome[0]?.toUpperCase()}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:FT,fontSize:17,fontWeight:500,color:"#1a1a1a",lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.nome}</div>
                      <div style={{fontSize:11,color:"#888",marginTop:2}}>{c.cargo||c.tipo} {c.cidade&&`· ${c.cidade}`}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:5,flexShrink:0}}>
                    <span style={{fontSize:9,padding:"3px 8px",borderRadius:99,fontWeight:600,background:c.tipo==='PJ'?"rgba(0,20,137,0.08)":"rgba(204,166,127,0.18)",color:c.tipo==='PJ'?VAREJO.primary:"#8B6340"}}>{c.tipo}</span>
                    <span style={{fontSize:9,padding:"3px 8px",borderRadius:99,fontWeight:600,background:`${PAL.primary}14`,color:PAL.primary,textTransform:"uppercase"}}>{c.area}</span>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,padding:"12px 0",borderTop:"1px solid #f5f0e8",borderBottom:"1px solid #f5f0e8"}}>
                  <div><div style={{fontSize:9,letterSpacing:1,color:"#aaa",textTransform:"uppercase",marginBottom:2}}>Negócios</div><div style={{fontFamily:FT,fontSize:18,fontWeight:500,color:PAL.primary}}>{negs.length}</div></div>
                  <div><div style={{fontSize:9,letterSpacing:1,color:"#aaa",textTransform:"uppercase",marginBottom:2}}>Volume</div><div style={{fontFamily:FT,fontSize:14,fontWeight:500}}>{fmtMM(valor)}</div></div>
                  <div><div style={{fontSize:9,letterSpacing:1,color:"#aaa",textTransform:"uppercase",marginBottom:2}}>Atividades</div><div style={{fontFamily:FT,fontSize:18,fontWeight:500,color:"#888"}}>{ativ}</div></div>
                </div>
                {(c.faturamento||c.origem) && <div style={{display:"flex",gap:14,fontSize:11,color:"#666"}}>
                  {c.faturamento&&<div><span style={{color:"#aaa"}}>Fat.:</span> <strong>{fmtMM(c.faturamento)}</strong></div>}
                  {c.origem&&<div><span style={{color:"#aaa"}}>Origem:</span> <strong style={{textTransform:"capitalize"}}>{c.origem}</strong></div>}
                </div>}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:6}}>
                  <AcoesRapidas contato={c} onMensagem={onMensagem} size="sm"/>
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={e=>abrirEditar(e,c)} title="Editar" style={{background:"none",border:"none",color:"#aaa",cursor:"pointer",display:"flex",padding:6}}>{I.edit}</button>
                    <button onClick={e=>{e.stopPropagation();onRemover(c.id)}} title="Remover" style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",display:"flex",padding:6}}>{I.trash}</button>
                  </div>
                </div>
              </div>
            );
          })}
          {contatos.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:60,color:"#aaa",fontSize:13,background:"white",borderRadius:14}}>Nenhum contato encontrado</div>}
        </div>
      )}

      {/* VISTA LISTA (tabela com edição inline) */}
      {visao==='lista' && (
        <div style={{background:"white",borderRadius:14,border:"1px solid rgba(113,63,42,0.10)",overflow:"hidden"}} onClick={()=>setShowColPanel(false)}>
          {/* Header */}
          <div style={{display:"grid",gridTemplateColumns:`2fr${col('email')?' 1.6fr':''}${col('telefone')?' 1.3fr':''}${col('empresa')?' 1.3fr':''}${col('cargo')?' 1.1fr':''}${col('area')?' 80px':''}${col('tipo')?' 60px':''}${col('cidade')?' 1fr':''}${col('origem')?' 1fr':''}${col('faturamento')?' 1fr':''}${col('negocios')?' 70px':''}${col('volume')?' 1fr':''} 100px`,padding:"10px 14px",background:"#FAF8F3",borderBottom:"2px solid #f0ede8"}}>
            {[['Nome',true],['E-mail',col('email')],['Telefone',col('telefone')],['Empresa',col('empresa')],['Cargo',col('cargo')],['Área',col('area')],['Tipo',col('tipo')],['Cidade',col('cidade')],['Origem',col('origem')],['Faturamento',col('faturamento')],['Neg.',col('negocios')],['Volume',col('volume')],['Ações',true]].filter(([,v])=>v).map(([l])=>(
              <div key={l} style={{fontSize:10,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,color:"#888",padding:"0 6px"}}>{l}</div>
            ))}
          </div>
          {/* Rows */}
          {contatos.map((c,idx)=>{
            const negs=dados.negocios.filter(n=>n.contatoId===c.id);
            const PAL=c.area==='varejo'?VAREJO:ASSESS;
            const isEd=editandoId===c.id;
            const gridCols=`2fr${col('email')?' 1.6fr':''}${col('telefone')?' 1.3fr':''}${col('empresa')?' 1.3fr':''}${col('cargo')?' 1.1fr':''}${col('area')?' 80px':''}${col('tipo')?' 60px':''}${col('cidade')?' 1fr':''}${col('origem')?' 1fr':''}${col('faturamento')?' 1fr':''}${col('negocios')?' 70px':''}${col('volume')?' 1fr':''} 100px`;
            return (
              <div key={c.id} style={{borderBottom:idx<contatos.length-1?"1px solid #f7f5f0":"none",background:isEd?"#faf8f3":"white",transition:"background .1s"}}>
                <div style={{display:"grid",gridTemplateColumns:gridCols,padding:"10px 14px",alignItems:"center",cursor:isEd?"default":"pointer"}}
                  onClick={!isEd?()=>onAbrir(c.id):undefined}
                  onMouseEnter={e=>{if(!isEd)e.currentTarget.style.background="#faf8f3"}}
                  onMouseLeave={e=>{if(!isEd)e.currentTarget.style.background=""}}>
                  {/* Nome */}
                  <div style={{padding:"0 6px",display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:28,height:28,borderRadius:7,background:`${PAL.primary}14`,display:"grid",placeItems:"center",color:PAL.primary,fontWeight:700,fontSize:12,flexShrink:0}}>{c.nome[0]?.toUpperCase()}</div>
                    {isEd?<input style={inpE} value={editForm.nome} onChange={e=>setEditForm(f=>({...f,nome:e.target.value}))} onClick={e=>e.stopPropagation()}/>
                    :<span style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>{c.nome}</span>}
                  </div>
                  {col('email')&&<div style={{padding:"0 6px"}}>{isEd?<input style={inpE} value={editForm.email} onChange={e=>setEditForm(f=>({...f,email:e.target.value}))} onClick={e=>e.stopPropagation()}/>:<span style={{fontSize:12,color:"#555"}}>{c.email||'—'}</span>}</div>}
                  {col('telefone')&&<div style={{padding:"0 6px"}}>{isEd?<input style={inpE} value={editForm.telefone} onChange={e=>setEditForm(f=>({...f,telefone:e.target.value}))} onClick={e=>e.stopPropagation()}/>:<span style={{fontSize:12,color:"#555"}}>{c.telefone||'—'}</span>}</div>}
                  {col('empresa')&&<div style={{padding:"0 6px"}}>{isEd?<input style={inpE} value={editForm.empresa} onChange={e=>setEditForm(f=>({...f,empresa:e.target.value}))} onClick={e=>e.stopPropagation()}/>:<span style={{fontSize:12,color:"#555"}}>{c.empresa||'—'}</span>}</div>}
                  {col('cargo')&&<div style={{padding:"0 6px"}}>{isEd?<input style={inpE} value={editForm.cargo} onChange={e=>setEditForm(f=>({...f,cargo:e.target.value}))} onClick={e=>e.stopPropagation()}/>:<span style={{fontSize:12,color:"#555"}}>{c.cargo||'—'}</span>}</div>}
                  {col('area')&&<div style={{padding:"0 6px"}}>{isEd?<select style={inpE} value={editForm.area} onChange={e=>setEditForm(f=>({...f,area:e.target.value}))} onClick={e=>e.stopPropagation()}><option value="varejo">Varejo</option><option value="atacado">Atacado</option></select>:<span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:`${PAL.primary}14`,color:PAL.primary,fontWeight:600}}>{c.area}</span>}</div>}
                  {col('tipo')&&<div style={{padding:"0 6px"}}>{isEd?<select style={inpE} value={editForm.tipo} onChange={e=>setEditForm(f=>({...f,tipo:e.target.value}))} onClick={e=>e.stopPropagation()}><option value="PF">PF</option><option value="PJ">PJ</option></select>:<span style={{fontSize:11,color:"#888"}}>{c.tipo}</span>}</div>}
                  {col('cidade')&&<div style={{padding:"0 6px"}}>{isEd?<input style={inpE} value={editForm.cidade} onChange={e=>setEditForm(f=>({...f,cidade:e.target.value}))} onClick={e=>e.stopPropagation()}/>:<span style={{fontSize:12,color:"#555"}}>{c.cidade||'—'}</span>}</div>}
                  {col('origem')&&<div style={{padding:"0 6px"}}>{isEd?<input style={inpE} value={editForm.origem} onChange={e=>setEditForm(f=>({...f,origem:e.target.value}))} onClick={e=>e.stopPropagation()}/>:<span style={{fontSize:12,color:"#555",textTransform:"capitalize"}}>{c.origem||'—'}</span>}</div>}
                  {col('faturamento')&&<div style={{padding:"0 6px"}}>{isEd?<input type="number" style={inpE} value={editForm.faturamento} onChange={e=>setEditForm(f=>({...f,faturamento:parseFloat(e.target.value)||0}))} onClick={e=>e.stopPropagation()}/>:<span style={{fontSize:12,color:"#555"}}>{c.faturamento?fmtMM(c.faturamento):'—'}</span>}</div>}
                  {col('negocios')&&<div style={{padding:"0 6px",textAlign:"center"}}><span style={{fontFamily:FT,fontSize:15,fontWeight:500,color:PAL.primary}}>{negs.length}</span></div>}
                  {col('volume')&&<div style={{padding:"0 6px"}}><span style={{fontFamily:FT,fontSize:13,color:PAL.primary}}>{fmtMM(negs.reduce((s,n)=>s+n.valor,0))}</span></div>}
                  {/* Ações */}
                  <div style={{padding:"0 6px",display:"flex",gap:4,alignItems:"center"}} onClick={e=>e.stopPropagation()}>
                    {isEd?(
                      <>
                        <button onClick={salvarEditar} style={{padding:"5px 10px",borderRadius:6,border:"none",background:ASSESS.primary,color:"white",fontSize:11,fontWeight:700,cursor:"pointer"}}>Salvar</button>
                        <button onClick={()=>setEditandoId(null)} style={{padding:"5px 8px",borderRadius:6,border:"1px solid #e0dbd0",background:"white",fontSize:11,cursor:"pointer"}}>✕</button>
                      </>
                    ):(
                      <>
                        <button onClick={e=>abrirEditar(e,c)} title="Editar" style={{background:"none",border:"none",color:"#aaa",cursor:"pointer",display:"flex",padding:4}}>{I.edit}</button>
                        <button onClick={()=>onRemover(c.id)} title="Remover" style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",display:"flex",padding:4}}>{I.trash}</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {contatos.length===0&&<div style={{padding:48,textAlign:"center",color:"#aaa",fontSize:13}}>Nenhum contato encontrado</div>}
        </div>
      )}

      {/* Modal edição rápida (ativado pelo ícone nos cards) */}
      {editandoId&&visao==='cards'&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={()=>setEditandoId(null)}>
          <div style={{background:"white",borderRadius:16,padding:28,width:"100%",maxWidth:520,boxShadow:"0 20px 60px rgba(0,0,0,.2)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{fontFamily:FT,fontWeight:300,fontSize:20,margin:0}}>Editar Contato</h3>
              <button onClick={()=>setEditandoId(null)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#aaa"}}>✕</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[['Nome','nome','text',true],['E-mail','email','email',true],['Telefone','telefone','text'],['Empresa','empresa','text'],['Cargo','cargo','text'],['Cidade','cidade','text'],['Origem','origem','text'],['Faturamento','faturamento','number']].map(([label,key,type,full])=>(
                <div key={key} style={full?{gridColumn:"1/-1"}:{}}>
                  <label style={{fontSize:11,fontWeight:700,color:"#555",display:"block",marginBottom:4}}>{label.toUpperCase()}</label>
                  <input type={type||"text"} value={editForm[key]??''} onChange={e=>setEditForm(f=>({...f,[key]:type==='number'?parseFloat(e.target.value)||0:e.target.value}))}
                    style={{width:"100%",padding:"8px 10px",border:"1px solid #e0dbd0",borderRadius:8,fontSize:13,fontFamily:SN,boxSizing:"border-box"}}/>
                </div>
              ))}
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#555",display:"block",marginBottom:4}}>ÁREA</label>
                <select value={editForm.area||'varejo'} onChange={e=>setEditForm(f=>({...f,area:e.target.value}))} style={{width:"100%",padding:"8px 10px",border:"1px solid #e0dbd0",borderRadius:8,fontSize:13,fontFamily:SN}}>
                  <option value="varejo">Varejo</option><option value="atacado">Atacado</option>
                </select>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#555",display:"block",marginBottom:4}}>TIPO</label>
                <select value={editForm.tipo||'PF'} onChange={e=>setEditForm(f=>({...f,tipo:e.target.value}))} style={{width:"100%",padding:"8px 10px",border:"1px solid #e0dbd0",borderRadius:8,fontSize:13,fontFamily:SN}}>
                  <option value="PF">Pessoa Física</option><option value="PJ">Pessoa Jurídica</option>
                </select>
              </div>
              <div style={{gridColumn:"1/-1"}}>
                <label style={{fontSize:11,fontWeight:700,color:"#555",display:"block",marginBottom:4}}>OBSERVAÇÕES</label>
                <textarea value={editForm.observacoes||''} onChange={e=>setEditForm(f=>({...f,observacoes:e.target.value}))} rows={2} style={{width:"100%",padding:"8px 10px",border:"1px solid #e0dbd0",borderRadius:8,fontSize:13,fontFamily:SN,resize:"vertical",boxSizing:"border-box"}}/>
              </div>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
              <button onClick={()=>setEditandoId(null)} style={{padding:"9px 18px",borderRadius:8,border:"1px solid #e0dbd0",background:"white",cursor:"pointer",fontSize:13}}>Cancelar</button>
              <button onClick={salvarEditar} style={{padding:"9px 20px",borderRadius:8,border:"none",background:ASSESS.primary,color:"white",cursor:"pointer",fontSize:13,fontWeight:600}}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DETALHE DE CONTATO ────────────────────────────────────────────────────────
function ContatoDetalhe({ dados, contatoId, onVoltar, onEditar, onMensagem, onAbrirNegocio }) {
  const c = dados.contatos.find(x => x.id === contatoId);
  if (!c) return <div style={{padding:48}}>Contato não encontrado.</div>;

  const PAL = c.area === 'varejo' ? VAREJO : ASSESS;
  const negs = dados.negocios.filter(n => n.contatoId === c.id);
  const stages = c.area === 'varejo' ? PIPE_VAREJO : PIPE_ATACADO;
  const ativs = dados.atividades.filter(a => negs.some(n => n.id === a.negocioId)).sort((a,b)=>b.data.localeCompare(a.data));
  const valorTotal = negs.reduce((s,n) => s + n.valor, 0);
  const ETAPAS_GANHO = ['fechado_ganho','projeto_aprovado','aguardando_pagamento'];
  const valorGanho = negs.filter(n => ETAPAS_GANHO.includes(n.etapa)).reduce((s,n)=>s+n.valor, 0);
  const contasReceber = dados.contas.filter(c2 => negs.some(n => n.id === c2.negocioId) && c2.tipo === 'receber');
  const totalReceitaCliente = contasReceber.reduce((s,c2)=>s+c2.valor, 0);

  return (
    <div style={{padding:"36px 48px 60px",maxWidth:1280,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <button onClick={onVoltar} style={{background:"none",border:"none",color:"#888",cursor:"pointer",fontSize:12,letterSpacing:1.5,textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}}>
          {I.arrowLeft} Voltar para Contatos
        </button>
        <SubLink tela="contato_detalhe" param={contatoId}/>
      </div>

      {/* HEADER */}
      <div style={{background:"white",borderRadius:18,padding:"28px 32px",border:"1px solid rgba(113,63,42,0.10)",borderLeft:`5px solid ${PAL.primary}`,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:24,marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:18,flex:1,minWidth:0}}>
            <div style={{width:64,height:64,borderRadius:14,background:`linear-gradient(135deg,${PAL.primary},${PAL.secondary})`,color:"#fff",display:"grid",placeItems:"center",fontWeight:700,fontSize:24,flexShrink:0,fontFamily:FT}}>
              {c.nome[0]?.toUpperCase()}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <span style={{fontSize:9,padding:"3px 10px",borderRadius:99,fontWeight:600,letterSpacing:.5,background:c.tipo==='PJ'?"rgba(0,20,137,0.08)":"rgba(204,166,127,0.18)",color:c.tipo==='PJ'?VAREJO.primary:"#8B6340"}}>{c.tipo}</span>
                <span style={{fontSize:9,padding:"3px 10px",borderRadius:99,fontWeight:600,letterSpacing:1,background:`${PAL.primary}14`,color:PAL.primary,textTransform:"uppercase"}}>{c.area}</span>
              </div>
              <h1 style={{fontFamily:FT,fontWeight:300,fontSize:32,color:"#1a1a1a",margin:0,letterSpacing:.3}}>{c.nome}</h1>
              <div style={{fontSize:13,color:"#888",marginTop:4}}>{c.cargo} · {c.cidade}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <AcoesRapidas contato={c} onMensagem={onMensagem}/>
            {onEditar && (
              <button onClick={() => onEditar(c)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:8,border:`1.5px solid ${PAL.primary}30`,background:"white",color:PAL.primary,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:SN}}>
                {I.edit} Editar
              </button>
            )}
          </div>
        </div>

        {/* Dados */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:20,paddingTop:20,borderTop:"1px solid #f5f0e8"}}>
          <DadoMini label={c.tipo === 'PJ' ? 'CNPJ' : 'CPF'} value={c.documento} mono/>
          <DadoMini label="E-mail" value={c.email}/>
          <DadoMini label="Telefone" value={c.telefone}/>
          <DadoMini label="Cliente desde" value={fmtDate(c.criado)}/>
          <DadoMini label="Origem do Lead" value={c.origem || '—'} capitalize/>
          {c.responsavel && <DadoMini label="Contato direto" value={c.responsavel}/>}
          {c.faturamento && <DadoMini label="Faturamento" value={fmtMM(c.faturamento)}/>}
          {c.tempoEmpresa && <DadoMini label="Tempo no mercado" value={`${c.tempoEmpresa} anos`}/>}
          {c.endereco && <div style={{gridColumn:"span 4"}}><DadoMini label="Endereço" value={c.endereco}/></div>}
        </div>

        {c.observacoes && (
          <div style={{marginTop:20,padding:"14px 18px",background:"#FAF8F3",borderRadius:10,fontSize:13,color:"#555",lineHeight:1.7}}>
            <div style={{fontSize:9,letterSpacing:2,color:"#aaa",fontWeight:600,marginBottom:6,textTransform:"uppercase"}}>Observações</div>
            {c.observacoes}
          </div>
        )}
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
        <KpiCard label="Negócios" value={negs.length} sub={`${negs.filter(n=>!ETAPAS_GANHO.includes(n.etapa)&&n.etapa!=='fechado_perdido').length} ativos`} accent={PAL.primary}/>
        <KpiCard label="Volume Total" value={fmtMM(valorTotal)} sub="todas operações" accent={SEC}/>
        <KpiCard label="Volume Fechado" value={fmtMM(valorGanho)} sub={`${negs.filter(n=>ETAPAS_GANHO.includes(n.etapa)).length} ganhos`} accent="#2e8a4e"/>
        <KpiCard label="Receita Áxicon" value={fmtMM(totalReceitaCliente)} sub="fees gerados" accent={ASSESS.primary}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        {/* Negócios */}
        <div>
          <SectionTitle label={`Negócios (${negs.length})`}/>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {negs.map(n => {
              const stage = stages.find(s => s.id === n.etapa);
              return (
                <div key={n.id} onClick={()=>onAbrirNegocio(n.id)} style={{background:"white",borderRadius:12,padding:"16px 18px",border:"1px solid rgba(113,63,42,0.10)",cursor:"pointer",transition:"all .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=PAL.primary}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(113,63,42,0.10)"}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600,color:"#1a1a1a",marginBottom:2}}>{n.titulo}</div>
                      <div style={{fontSize:11,color:"#888"}}>{n.produto}</div>
                    </div>
                    <span style={{fontSize:9,padding:"3px 8px",borderRadius:99,background:`${stage?.color}28`,color:"#1a1a1a",fontWeight:600,letterSpacing:.5}}>{stage?.name}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,borderTop:"1px solid #f5f0e8"}}>
                    <span style={{fontFamily:FT,fontSize:18,fontWeight:500,color:PAL.primary}}>{fmtMM(n.valor)}</span>
                    <span style={{fontSize:11,color:"#888"}}>{n.probabilidade}% · prev. {fmtDate(n.fechamento)}</span>
                  </div>
                </div>
              );
            })}
            {negs.length === 0 && <div style={{textAlign:"center",padding:30,color:"#aaa",fontSize:13,background:"white",borderRadius:12,border:"1px solid rgba(113,63,42,0.10)"}}>Nenhum negócio ainda</div>}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <SectionTitle label="Timeline de Atividades"/>
          <div style={{background:"white",borderRadius:12,padding:"18px 20px",border:"1px solid rgba(113,63,42,0.10)"}}>
            {ativs.slice(0,15).map(a => {
              const negocio = dados.negocios.find(n => n.id === a.negocioId);
              const icones = { ligacao: I.phone, reuniao: I.cal, email: I.mail, whatsapp: I.whats };
              return (
                <div key={a.id} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:"1px solid #f5f0e8"}}>
                  <div style={{width:30,height:30,borderRadius:"50%",background:a.concluida?"#dcfce7":"#FAF8F3",color:a.concluida?"#2e8a4e":PAL.primary,display:"grid",placeItems:"center",flexShrink:0}}>
                    {icones[a.tipo] || I.cal}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,color:a.concluida?"#888":"#1a1a1a",fontWeight:600,textDecoration:a.concluida?"line-through":"none"}}>{a.titulo}</div>
                    <div style={{fontSize:11,color:"#aaa",marginTop:2}}>{negocio?.titulo} · {fmtDate(a.data)}</div>
                  </div>
                </div>
              );
            })}
            {ativs.length === 0 && <div style={{padding:"30px 0",textAlign:"center",fontSize:13,color:"#aaa"}}>Nenhuma atividade ainda</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function DadoMini({ label, value, mono, capitalize }) {
  return (
    <div>
      <div style={{fontSize:9,letterSpacing:1.5,color:"#aaa",fontWeight:600,marginBottom:4,textTransform:"uppercase"}}>{label}</div>
      <div style={{fontSize:13,color:"#1a1a1a",fontWeight:500,fontFamily:mono?"monospace":SN,textTransform:capitalize?"capitalize":"none",wordBreak:"break-word"}}>{value || '—'}</div>
    </div>
  );
}

// ── DETALHE DE NEGÓCIO ────────────────────────────────────────────────────────
function NegocioDetalhe({ dados, negocioId, onVoltar, onMensagem, onAbrirContato, onAdicionarAtividade, onToggleAtividade, onRemoverAtividade, onAdicionarNota, onAtualizar }) {
  const n = dados.negocios.find(x => x.id === negocioId);

  // Hooks must be before any conditional early return (Rules of Hooks)
  const [novaAtv, setNovaAtv] = useState({ tipo: 'ligacao', titulo: '', data: today });
  const [showFormAtv, setShowFormAtv] = useState(false);
  const [novaNota, setNovaNota] = useState('');
  const [editando, setEditando] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [abaDetalhe, setAbaDetalhe] = useState('visao_geral');

  const switchTab = (tab) => {
    if (tab === 'edicao_rapida' && n) {
      setEditForm({ titulo: n.titulo, valor: n.valor, produto: n.produto || '', probabilidade: n.probabilidade, prazo: n.prazo || '', taxaJuros: n.taxaJuros || '', origem: n.origem || '', fechamento: n.fechamento || '', proximaAcao: n.proximaAcao || '', observacoes: n.observacoes || '', consultorId: n.consultorId || null });
    }
    setAbaDetalhe(tab);
  };

  const cliente = n ? dados.contatos.find(c => c.id === n.contatoId) : null;
  const consultor = n ? dados.funcionarios.find(f => f.id === n.consultorId) : null;
  const areaNegocio = n?.area || cliente?.area || 'varejo';
  const PAL = areaNegocio === 'varejo' ? VAREJO : ASSESS;
  const stages = areaNegocio === 'varejo' ? PIPE_VAREJO : PIPE_ATACADO;
  const stageAtual = n ? stages.find(s => s.id === n.etapa) : null;
  const stageIdx = n ? stages.findIndex(s => s.id === n.etapa) : -1;
  const ativs = n ? dados.atividades.filter(a => a.negocioId === n.id) : [];
  const mensagens = n ? (dados.mensagens || []).filter(m => m.negocioId === n.id) : [];
  const contas = n ? dados.contas.filter(c => c.negocioId === n.id) : [];
  const prodInfo = n ? PRODUTOS_COMISSAO[n.produto] : null;
  const pctConsultorPadrao = prodInfo ? (prodInfo.comConsultor ?? prodInfo.com * 0.5) : 0;
  const pctConsultorDetalhe = (n?.comConsultor !== undefined && n?.comConsultor !== null) ? Number(n.comConsultor) : pctConsultorPadrao;
  const comissaoEstimada = n ? n.valor * pctConsultorDetalhe / 100 : 0;

  const timeline = useMemo(() => {
    if (!n) return [];
    const eventos = [];

    eventos.push({
      id: `criacao-${n.id}`,
      tipo: 'criacao',
      titulo: 'Negócio criado',
      data: n.criado || today,
      ordem: new Date(n.criado || today).getTime(),
    });

    ativs.forEach(a => {
      eventos.push({
        ...a,
        ordem: new Date(a.data).getTime() + a.id,
        eventoTipo: 'atividade',
      });
    });

    mensagens.forEach(m => {
      eventos.push({
        id: `msg-${m.id}`,
        tipo: m.canal,
        titulo: `${m.canal === 'whatsapp' ? 'WhatsApp' : 'E-mail'} enviado`,
        descricao: m.assunto || m.preview,
        mensagem: m.mensagem,
        data: m.data?.split('T')[0] || today,
        dataCompleta: m.data,
        concluida: true,
        ordem: new Date(m.data || today).getTime(),
        eventoTipo: 'mensagem',
      });
    });

    (n.campos_extras?.propostas || []).forEach(p => {
      eventos.push({
        id: `proposta-${p.code}`,
        tipo: 'proposta',
        titulo: `Proposta gerada · ${p.code}`,
        descricao: p.link ? null : null,
        link: p.link,
        data: p.data || today,
        concluida: true,
        ordem: new Date(p.data || today).getTime() + 1,
        eventoTipo: 'proposta',
        code: p.code,
        credito: p.credito,
      });
    });

    return eventos.sort((a,b) => b.ordem - a.ordem);
  }, [ativs, mensagens, n]);

  if (!n) return <div style={{padding:48}}>Negócio não encontrado.</div>;

  const handleAddAtividade = () => {
    if (!novaAtv.titulo.trim()) {
      alert('Adicione uma descrição para a atividade');
      return;
    }
    onAdicionarAtividade({ ...novaAtv, negocioId: n.id });
    setNovaAtv({ tipo: 'ligacao', titulo: '', data: today });
    setShowFormAtv(false);
  };

  const handleAddNota = () => {
    if (!novaNota.trim()) return;
    onAdicionarNota({
      tipo: 'nota',
      titulo: novaNota,
      negocioId: n.id,
      data: today,
    });
    setNovaNota('');
  };

  const tiposAtividade = [
    { id: 'ligacao', label: 'Ligação', icon: I.phone, cor: '#3b82f6' },
    { id: 'reuniao', label: 'Reunião', icon: I.cal, cor: '#8b5cf6' },
    { id: 'email', label: 'E-mail', icon: I.mail, cor: VAREJO.primary },
    { id: 'whatsapp', label: 'WhatsApp', icon: I.whats, cor: '#25D366' },
    { id: 'nota', label: 'Nota', icon: I.doc, cor: '#888' },
    { id: 'proposta', label: 'Proposta', icon: I.task, cor: '#f59e0b' },
  ];

  return (
    <div style={{padding:"36px 48px 60px",maxWidth:1280,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <button onClick={onVoltar} style={{background:"none",border:"none",color:"#888",cursor:"pointer",fontSize:12,letterSpacing:1.5,textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}}>
          {I.arrowLeft} Voltar
        </button>
        <SubLink tela="negocio_detalhe" param={negocioId}/>
      </div>

      {/* MODAL DE EDIÇÃO */}
      {editando && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={()=>setEditando(false)}>
          <div style={{background:"white",borderRadius:18,padding:"32px",width:"100%",maxWidth:620,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(0,0,0,0.25)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <h3 style={{fontFamily:FT,fontWeight:300,fontSize:22,margin:0,color:"#1a1a1a"}}>Editar Negócio</h3>
              <button onClick={()=>setEditando(false)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#aaa"}}>✕</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {[
                {label:"Título",key:"titulo",full:true},
                {label:"Valor (R$)",key:"valor",type:"number"},
                {label:"Probabilidade (%)",key:"probabilidade",type:"number"},
                {label:"Prazo (meses)",key:"prazo",type:"number"},
                {label:"Taxa de Juros (% a.m.)",key:"taxaJuros",type:"number"},
                {label:"Origem",key:"origem"},
                {label:"Previsão de Fechamento",key:"fechamento",type:"date"},
                {label:"Próxima Ação",key:"proximaAcao",full:true},
              ].map(({label,key,type,full})=>(
                <div key={key} style={full?{gridColumn:"1/-1"}:{}}>
                  <label style={{fontSize:11,fontWeight:700,color:"#555",letterSpacing:.5,display:"block",marginBottom:4}}>{label.toUpperCase()}</label>
                  <input type={type||"text"} value={editForm[key]??''} onChange={e=>setEditForm(f=>({...f,[key]:type==='number'?parseFloat(e.target.value)||0:e.target.value}))}
                    style={{width:"100%",padding:"9px 12px",border:"1px solid #e0dbd0",borderRadius:8,fontSize:13,fontFamily:SN,boxSizing:"border-box"}}/>
                </div>
              ))}
              <div style={{gridColumn:"1/-1"}}>
                <label style={{fontSize:11,fontWeight:700,color:"#555",letterSpacing:.5,display:"block",marginBottom:4}}>PRODUTO</label>
                <select value={editForm.produto||''} onChange={e=>setEditForm(f=>({...f,produto:e.target.value}))} style={{width:"100%",padding:"9px 12px",border:"1px solid #e0dbd0",borderRadius:8,fontSize:13,fontFamily:SN}}>
                  {Object.keys(PRODUTOS_COMISSAO).map(p=><option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div style={{gridColumn:"1/-1"}}>
                <label style={{fontSize:11,fontWeight:700,color:"#555",letterSpacing:.5,display:"block",marginBottom:4}}>CONSULTOR</label>
                <select value={editForm.consultorId||''} onChange={e=>setEditForm(f=>({...f,consultorId:Number(e.target.value)||null}))} style={{width:"100%",padding:"9px 12px",border:"1px solid #e0dbd0",borderRadius:8,fontSize:13,fontFamily:SN}}>
                  <option value="">— Sem consultor —</option>
                  {dados.funcionarios.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
              <div style={{gridColumn:"1/-1"}}>
                <label style={{fontSize:11,fontWeight:700,color:"#555",letterSpacing:.5,display:"block",marginBottom:4}}>OBSERVAÇÕES</label>
                <textarea value={editForm.observacoes||''} onChange={e=>setEditForm(f=>({...f,observacoes:e.target.value}))} rows={3}
                  style={{width:"100%",padding:"9px 12px",border:"1px solid #e0dbd0",borderRadius:8,fontSize:13,fontFamily:SN,resize:"vertical",boxSizing:"border-box"}}/>
              </div>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:24}}>
              <button onClick={()=>setEditando(false)} style={{padding:"10px 20px",borderRadius:8,border:"1px solid #e0dbd0",background:"white",cursor:"pointer",fontSize:13}}>Cancelar</button>
              <button onClick={()=>{onAtualizar(n.id,editForm);setEditando(false);}} style={{padding:"10px 24px",borderRadius:8,border:"none",background:PAL.primary,color:"white",cursor:"pointer",fontSize:13,fontWeight:600}}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{background:"white",borderRadius:18,padding:"28px 32px",border:"1px solid rgba(113,63,42,0.10)",borderLeft:`5px solid ${PAL.primary}`,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:24}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <span style={{fontSize:9,padding:"3px 10px",borderRadius:99,fontWeight:600,letterSpacing:1,background:`${PAL.primary}14`,color:PAL.primary,textTransform:"uppercase"}}>{areaNegocio}</span>
              <span style={{fontSize:9,padding:"3px 10px",borderRadius:99,fontWeight:600,letterSpacing:.5,background:`${stageAtual?.color}28`,color:"#1a1a1a"}}>{stageAtual?.name}</span>
            </div>
            <h1 style={{fontFamily:FT,fontWeight:300,fontSize:32,color:"#1a1a1a",margin:0,letterSpacing:.3,marginBottom:6}}>{n.titulo}</h1>
            <div style={{fontSize:13,color:"#888"}}>
              <span style={{cursor:"pointer",color:PAL.primary,textDecoration:"underline"}} onClick={()=>onAbrirContato(cliente.id)}>{cliente?.nome}</span>
              {' · '}{n.produto}{' · '}consultor: <strong>{consultor?.nome}</strong>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:12}}>
            {onAtualizar && (
              <button onClick={()=>switchTab('edicao_rapida')}
                style={{padding:"8px 18px",borderRadius:8,border:`1.5px solid ${PAL.primary}`,background:"white",color:PAL.primary,cursor:"pointer",fontSize:12,fontWeight:700,letterSpacing:.5,display:"flex",alignItems:"center",gap:6}}>
                {I.edit} Edição Rápida
              </button>
            )}
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:9,letterSpacing:1.5,color:"#aaa",fontWeight:600,textTransform:"uppercase"}}>Valor da Operação</div>
              <div style={{fontFamily:FT,fontSize:36,fontWeight:300,color:PAL.primary,lineHeight:1,marginTop:4}}>{fmtMM(n.valor)}</div>
              <div style={{fontSize:11,color:"#888",marginTop:6}}>{n.probabilidade}% probabilidade</div>
            </div>
          </div>
        </div>

        {/* Pipe Progress — clicável para mover o negócio */}
        <div style={{marginTop:24,paddingTop:20,borderTop:"1px solid #f5f0e8"}}>
          <div style={{fontSize:9,letterSpacing:2,color:"#aaa",fontWeight:600,marginBottom:10,textTransform:"uppercase"}}>Estágio na Pipeline · clique para mover</div>
          <div style={{display:"flex",gap:4}}>
            {stages.filter(s => !['fechado_ganho','fechado_perdido','projeto_aprovado'].includes(s.id) || s.id === n.etapa).map((s, i) => {
              const isAtual = s.id === n.etapa;
              const isPassada = i < stageIdx;
              return (
                <div key={s.id}
                  onClick={()=>onAtualizar&&onAtualizar(n.id,{etapa:s.id})}
                  title={`Mover para: ${s.name}`}
                  style={{flex:1,padding:"10px 8px",borderRadius:6,background:isAtual?s.color:isPassada?`${s.color}66`:"#f0ede5",textAlign:"center",fontSize:10,fontWeight:600,color:isAtual||isPassada?"white":"#aaa",letterSpacing:.3,cursor:onAtualizar?"pointer":"default",transition:"opacity .15s",outline:isAtual?`2px solid ${s.color}`:"none",outlineOffset:1}}>
                  {s.name}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ABAS */}
      <div style={{display:"flex",gap:4,marginBottom:20,background:"white",borderRadius:12,padding:4,border:"1px solid #f0ede5"}}>
        {[{id:'visao_geral',label:'Visão Geral'},{id:'pre_proposta',label:'Pré-Proposta'},{id:'edicao_rapida',label:'Edição Rápida'}].map(t=>(
          <button key={t.id} onClick={()=>switchTab(t.id)}
            style={{flex:1,padding:"10px 0",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:abaDetalhe===t.id?700:400,background:abaDetalhe===t.id?PAL.primary:"transparent",color:abaDetalhe===t.id?"white":"#888",transition:"all .15s",fontFamily:SN}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* GRID PRINCIPAL */}
      <div style={{display:abaDetalhe==='visao_geral'?"grid":"none",gridTemplateColumns:"1.5fr 1fr",gap:20,alignItems:"start"}}>
        {/* COLUNA ESQUERDA */}
        <div>
          {/* Detalhes financeiros */}
          <SectionTitle label="Detalhes da Operação"/>
          <div style={{background:"white",borderRadius:14,padding:"22px 24px",border:"1px solid rgba(113,63,42,0.10)",marginBottom:20}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
              <DadoMini label="Produto" value={n.produto}/>
              <DadoMini label="Valor" value={fmtR(n.valor)}/>
              <div>
                <div style={{fontSize:9,letterSpacing:2,color:"#aaa",fontWeight:600,marginBottom:6,textTransform:"uppercase"}}>Comissão Consultor</div>
                {onAtualizar ? (
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <input
                      type="number" min="0" max="100" step="0.01"
                      value={pctConsultorDetalhe}
                      onChange={e => onAtualizar(n.id, { comConsultor: e.target.value === '' ? null : Number(e.target.value) })}
                      style={{width:64,padding:"4px 8px",border:"1.5px solid rgba(113,63,42,0.2)",borderRadius:7,fontSize:14,fontFamily:"inherit",background:"white",color:"#1a1a1a",textAlign:"right"}}
                    />
                    <span style={{fontSize:13,color:"#555"}}>%</span>
                    {n.comConsultor !== undefined && n.comConsultor !== null && (
                      <button onClick={() => onAtualizar(n.id, { comConsultor: null })}
                        title="Restaurar padrão do produto"
                        style={{marginLeft:2,fontSize:10,color:"#aaa",background:"none",border:"none",cursor:"pointer",padding:0}}>
                        ↩ {pctConsultorPadrao}%
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{fontSize:14,fontWeight:500,color:"#1a1a1a"}}>{pctConsultorDetalhe}%</div>
                )}
              </div>
              <DadoMini label="Comissão Estimada" value={fmtR(comissaoEstimada)}/>
              <DadoMini label="Prazo" value={n.prazo ? `${n.prazo} meses` : '—'}/>
              <DadoMini label="Taxa de Juros" value={n.taxaJuros ? `${n.taxaJuros}% a.m.` : '—'}/>
              <DadoMini label="Origem do Lead" value={n.origem || '—'} capitalize/>
              <DadoMini label="Criado em" value={fmtDate(n.criado)}/>
              <DadoMini label="Previsão Fechamento" value={fmtDate(n.fechamento)}/>
            </div>
            {n.observacoes && (
              <div style={{marginTop:16,padding:"14px 18px",background:"#FAF8F3",borderRadius:10}}>
                <div style={{fontSize:9,letterSpacing:2,color:"#aaa",fontWeight:600,marginBottom:6,textTransform:"uppercase"}}>Observações</div>
                <div style={{fontSize:13,color:"#555",lineHeight:1.7}}>{n.observacoes}</div>
              </div>
            )}
            {n.proximaAcao && (
              <div style={{marginTop:12,padding:"12px 16px",background:`${PAL.primary}0d`,borderRadius:10,borderLeft:`3px solid ${PAL.primary}`}}>
                <div style={{fontSize:9,letterSpacing:2,color:PAL.primary,fontWeight:600,marginBottom:4,textTransform:"uppercase"}}>Próxima Ação</div>
                <div style={{fontSize:13,color:"#1a1a1a",fontWeight:500}}>{n.proximaAcao}</div>
              </div>
            )}
          </div>

          {/* Pré-Proposta — apenas Atacado */}
          {areaNegocio === 'atacado' && (
            <>
              <SectionTitle label="Pré-Proposta"/>
              <div style={{background:"white",borderRadius:14,padding:"22px 24px",border:"1px solid rgba(113,63,42,0.10)",marginBottom:20}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                  <div>
                    <label style={{fontSize:9,letterSpacing:2,color:"#aaa",fontWeight:600,marginBottom:6,textTransform:"uppercase",display:"block"}}>Destinação dos Recursos</label>
                    <select
                      value={n.campos_extras?.destinacao_recursos || ''}
                      onChange={e => onAtualizar && onAtualizar(n.id, { campos_extras: { ...(n.campos_extras || {}), destinacao_recursos: e.target.value } })}
                      style={{width:"100%",padding:"9px 12px",border:"1px solid #e0dbd0",borderRadius:8,fontSize:13,fontFamily:SN,background:"white",color:n.campos_extras?.destinacao_recursos ? "#1a1a1a" : "#aaa"}}>
                      <option value="">— Selecionar —</option>
                      {['Capital de Giro','Expansão / Investimento','Quitação de Dívidas','Antecipação de Recebíveis','Estruturação Financeira','Outro'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:9,letterSpacing:2,color:"#aaa",fontWeight:600,marginBottom:6,textTransform:"uppercase",display:"block"}}>Tipo de Garantia</label>
                    <select
                      value={n.campos_extras?.tipo_garantia || ''}
                      onChange={e => onAtualizar && onAtualizar(n.id, { campos_extras: { ...(n.campos_extras || {}), tipo_garantia: e.target.value } })}
                      style={{width:"100%",padding:"9px 12px",border:"1px solid #e0dbd0",borderRadius:8,fontSize:13,fontFamily:SN,background:"white",color:n.campos_extras?.tipo_garantia ? "#1a1a1a" : "#aaa"}}>
                      <option value="">— Selecionar —</option>
                      {['Imóvel','Veículo','Recebíveis','Aval / Fiança','Sem Garantia','Avaliando'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* CAMPOS CUSTOMIZADOS — agrupados por seção, expansíveis */}
          {onAtualizar && (dados.campos_customizados||[]).length > 0 && (() => {
            const secoes = {};
            (dados.campos_customizados||[]).forEach(c => {
              const s = c.secao || 'Geral';
              if (!secoes[s]) secoes[s] = [];
              secoes[s].push(c);
            });
            return (
              <div style={{marginBottom:20}}>
                <SectionTitle label="Campos do Negócio"/>
                {Object.entries(secoes).map(([secao, campos]) => (
                  <details key={secao} open style={{background:"white",borderRadius:14,border:"1px solid rgba(113,63,42,0.10)",marginBottom:8,overflow:"hidden"}}>
                    <summary style={{padding:"13px 18px",fontSize:12,fontWeight:700,color:"#555",letterSpacing:.5,cursor:"pointer",display:"flex",alignItems:"center",gap:8,userSelect:"none"}}>
                      <span style={{display:"flex",color:PAL.primary}}>{I.task}</span>
                      {secao}
                      <span style={{marginLeft:"auto",fontSize:10,color:"#aaa",fontWeight:400}}>{campos.length} campo{campos.length!==1?'s':''}</span>
                    </summary>
                    <div style={{padding:"4px 18px 16px",borderTop:"1px solid #f5f0e8"}}>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:12}}>
                        {campos.map(campo => {
                          const val = n.campos_extras?.[campo.id] ?? '';
                          const obrig = (campo.obrigatorio_em||[]).includes(n.etapa);
                          const inpSt2 = {padding:"7px 10px",border:`1px solid ${obrig&&!String(val).trim()?'#dc2626':'rgba(113,63,42,0.18)'}`,borderRadius:7,fontSize:13,fontFamily:SN,background:"white",width:"100%",boxSizing:"border-box"};
                          const update = v => onAtualizar(n.id, { campos_extras: { ...(n.campos_extras||{}), [campo.id]: v } });
                          return (
                            <div key={campo.id}>
                              <label style={{fontSize:11,fontWeight:700,color:obrig&&!String(val).trim()?'#dc2626':PAL.primary,letterSpacing:.7,display:"block",marginBottom:4}}>
                                {campo.label.toUpperCase()}{obrig?' *':''}
                              </label>
                              {campo.tipo==='select'
                                ? <select style={inpSt2} value={val} onChange={e=>update(e.target.value)}>
                                    <option value="">— Selecionar —</option>
                                    {(Array.isArray(campo.opcoes) ? campo.opcoes : (campo.opcoes||'').split(',').map(s=>s.trim()).filter(Boolean)).map(o=><option key={o} value={o}>{o}</option>)}
                                  </select>
                                : campo.tipo==='checkbox'
                                  ? <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
                                      <input type="checkbox" checked={!!val} onChange={e=>update(e.target.checked)} style={{accentColor:PAL.primary,width:16,height:16}}/>
                                      <span style={{fontSize:13,color:"#555"}}>{val?'Sim':'Não'}</span>
                                    </label>
                                  : campo.tipo==='data'
                                    ? <input type="date" style={inpSt2} value={val} onChange={e=>update(e.target.value)}/>
                                    : campo.tipo==='numero'||campo.tipo==='moeda'
                                      ? <input type="number" style={inpSt2} value={val} onChange={e=>update(e.target.value)} placeholder={campo.tipo==='moeda'?'R$ 0,00':'0'}/>
                                      : <input type="text" style={inpSt2} value={val} onChange={e=>update(e.target.value)} placeholder={campo.label}/>
                              }
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            );
          })()}

          {/* ANEXOS */}
          {onAtualizar && (
            <div style={{background:"white",borderRadius:14,padding:"14px 16px",border:"1px solid rgba(113,63,42,0.10)",marginBottom:20}}>
              <div style={{fontSize:12,fontWeight:700,color:"#555",letterSpacing:.5,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>{I.upload} Anexos</div>
              <AnexoUpload
                contexto="negocios"
                refId={n.id}
                anexos={n.anexos || []}
                onAnexosChange={novos => onAtualizar(n.id, { anexos: novos })}
              />
            </div>
          )}

          {/* Contas vinculadas */}
          {contas.length > 0 && (
            <>
              <div style={{marginTop:24}}>
                <SectionTitle label="Contas Vinculadas"/>
              </div>
              <div style={{background:"white",borderRadius:14,padding:"22px 24px",border:"1px solid rgba(113,63,42,0.10)"}}>
                {contas.map(c => {
                  const cor = c.tipo === 'pagar' ? '#b71c1c' : '#2e8a4e';
                  const cfg = c.status === 'pago' || c.status === 'recebido' ? {bg:'#dcfce7',color:'#2e8a4e',label:'Quitado'} : {bg:'#fef3c7',color:'#f59e0b',label:'Pendente'};
                  return (
                    <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f5f0e8"}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>{c.descricao}</div>
                        <div style={{fontSize:11,color:"#888",marginTop:2}}>{c.tipo === 'pagar' ? 'Comissão a pagar' : 'Receita a receber'} · compet. {fmtDate(c.vencimento)}</div>
                      </div>
                      <span style={{fontSize:9,padding:"3px 8px",borderRadius:99,background:cfg.bg,color:cfg.color,fontWeight:600,marginRight:12}}>{cfg.label}</span>
                      <div style={{fontFamily:FT,fontSize:16,fontWeight:500,color:cor,minWidth:90,textAlign:"right"}}>{fmtR(c.valor)}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* COLUNA DIREITA — Timeline + Info */}
        <div>
          {/* TIMELINE INTERATIVA */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <SectionTitle label={`Timeline (${timeline.length})`}/>
            <Btn icon={I.plus} palette={PAL} onClick={()=>setShowFormAtv(!showFormAtv)}>
              {showFormAtv ? 'Cancelar' : 'Nova Atividade'}
            </Btn>
          </div>

          {/* Form de Nova Atividade */}
          {showFormAtv && (
            <div style={{background:"white",borderRadius:14,padding:"20px 22px",border:`2px solid ${PAL.primary}30`,marginBottom:14,boxShadow:`0 12px 32px -16px ${PAL.primary}40`}}>
              <div style={{fontSize:10,letterSpacing:2,color:PAL.primary,fontWeight:600,marginBottom:14,textTransform:"uppercase"}}>Registrar nova atividade</div>
              <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
                {tiposAtividade.filter(t => t.id !== 'nota' && t.id !== 'proposta').map(t => (
                  <button key={t.id} onClick={()=>setNovaAtv({...novaAtv, tipo: t.id})}
                    style={{padding:"8px 14px",borderRadius:8,border:`1.5px solid ${novaAtv.tipo===t.id?t.cor:"rgba(113,63,42,0.18)"}`,background:novaAtv.tipo===t.id?`${t.cor}14`:"white",color:novaAtv.tipo===t.id?t.cor:"#888",fontSize:12,fontWeight:novaAtv.tipo===t.id?700:500,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6}}>
                    <span style={{display:"flex"}}>{t.icon}</span> {t.label}
                  </button>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr auto",gap:10,alignItems:"end"}}>
                <div>
                  <label style={lblStyle}>Descrição</label>
                  <input style={inpStyle} value={novaAtv.titulo} onChange={e=>setNovaAtv({...novaAtv,titulo:e.target.value})}
                    placeholder="O que foi/será feito?"
                    onKeyDown={e => e.key === 'Enter' && handleAddAtividade()}
                    autoFocus/>
                </div>
                <div>
                  <label style={lblStyle}>Data</label>
                  <input style={inpStyle} type="date" value={novaAtv.data} onChange={e=>setNovaAtv({...novaAtv,data:e.target.value})}/>
                </div>
                <button onClick={handleAddAtividade} style={{height:40,padding:"0 18px",borderRadius:8,border:"none",background:PAL.primary,color:"white",fontSize:12,fontWeight:600,letterSpacing:.5,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}>
                  Salvar
                </button>
              </div>
            </div>
          )}

          {/* Notas Rápidas */}
          <div style={{background:"white",borderRadius:14,padding:"14px 16px",border:"1px solid rgba(113,63,42,0.10)",marginBottom:14,display:"flex",gap:10,alignItems:"center"}}>
            <span style={{display:"flex",color:"#aaa"}}>{I.doc}</span>
            <MencaoInput
              value={novaNota}
              onChange={setNovaNota}
              funcionarios={dados.funcionarios||[]}
              placeholder="Nota rápida... @ para mencionar"
              multiline={false}
              style={{flex:1,border:"none",outline:"none",fontSize:13,fontFamily:SN,background:"transparent"}}
            />
            {novaNota && (
              <button onClick={()=>{handleAddNota();enviarMencoes(novaNota,'Sistema',`Negócio: ${n.titulo}`,dados.funcionarios||[]);}} style={{padding:"6px 14px",background:PAL.primary,color:"white",border:"none",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                Salvar
              </button>
            )}
          </div>

          {/* Timeline events */}
          <div style={{position:"relative",marginBottom:24}}>
            {timeline.length === 0 && (
              <div style={{background:"white",borderRadius:14,padding:40,border:"1px dashed rgba(113,63,42,0.30)",textAlign:"center",color:"#aaa",fontSize:13}}>
                Nenhum registro ainda. Adicione a primeira atividade.
              </div>
            )}
            {timeline.map((ev, idx) => {
              const tipo = tiposAtividade.find(t => t.id === ev.tipo) || { icon: I.cal, cor: '#888', label: ev.tipo };
              const isCriacao = ev.tipo === 'criacao';
              const isMensagem = ev.eventoTipo === 'mensagem';
              const isAtividade = ev.eventoTipo === 'atividade';
              const isProposta = ev.eventoTipo === 'proposta';
              const isLast = idx === timeline.length - 1;
              const corItem = isCriacao ? PAL.primary : isProposta ? '#f59e0b' : tipo.cor;
              return (
                <div key={ev.id || `${ev.tipo}-${idx}`} style={{display:"flex",gap:14,position:"relative",paddingBottom:isLast?0:18}}>
                  {!isLast && (
                    <div style={{position:"absolute",left:17,top:36,bottom:0,width:2,background:"#f0ede5"}}/>
                  )}
                  <div style={{
                    width:36,height:36,borderRadius:"50%",
                    background: isProposta ? "#fef3c7" : ev.concluida ? "#dcfce7" : `${corItem}14`,
                    color: isProposta ? "#d97706" : ev.concluida ? "#2e8a4e" : corItem,
                    display:"grid",placeItems:"center",
                    flexShrink:0, zIndex:1, position:"relative",
                    border: `2px solid ${isProposta ? "#fcd34d" : ev.concluida ? "#86efac" : `${corItem}30`}`,
                  }}>
                    {isProposta ? I.task : ev.concluida ? I.check : tipo.icon}
                  </div>
                  <div style={{flex:1,minWidth:0,background:"white",borderRadius:12,padding:"14px 18px",border:"1px solid rgba(113,63,42,0.10)",borderLeft:`3px solid ${corItem}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:6}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                          <span style={{fontSize:9,letterSpacing:1.5,color:corItem,fontWeight:700,textTransform:"uppercase"}}>{isProposta ? 'Proposta' : tipo.label}</span>
                          {ev.concluida && !isProposta && <span style={{fontSize:9,padding:"2px 8px",borderRadius:99,background:"#dcfce7",color:"#2e8a4e",fontWeight:600}}>✓ Concluída</span>}
                          {isMensagem && <span style={{fontSize:9,padding:"2px 8px",borderRadius:99,background:`${corItem}14`,color:corItem,fontWeight:600}}>Enviada</span>}
                          {isProposta && <span style={{fontSize:9,padding:"2px 8px",borderRadius:99,background:"#fef3c7",color:"#d97706",fontWeight:600}}>Gerada</span>}
                        </div>
                        <div style={{fontSize:13,fontWeight:600,color:ev.concluida&&isAtividade?"#888":"#1a1a1a",lineHeight:1.4,textDecoration:ev.concluida&&isAtividade?"line-through":"none"}}>
                          {ev.titulo}
                        </div>
                        {ev.descricao && <div style={{fontSize:11,color:"#888",marginTop:4,lineHeight:1.5}}>{ev.descricao}</div>}
                        {isProposta && ev.credito && (
                          <div style={{fontSize:11,color:"#888",marginTop:4}}>Crédito: {fmtR(ev.credito)}</div>
                        )}
                      </div>
                      {isAtividade && !isCriacao && (
                        <div style={{display:"flex",gap:4,flexShrink:0}}>
                          <button onClick={()=>onToggleAtividade(ev.id)} title={ev.concluida ? "Marcar como pendente" : "Marcar como concluída"}
                            style={{width:24,height:24,borderRadius:"50%",border:`1.5px solid ${ev.concluida ? "#2e8a4e" : "rgba(113,63,42,0.25)"}`,background:ev.concluida ? "#2e8a4e" : "white",cursor:"pointer",display:"grid",placeItems:"center",color:"white",padding:0}}>
                            {ev.concluida && <Ico size={11} d={<path d="M5 12l5 5L20 7"/>}/>}
                          </button>
                          <button onClick={()=>onRemoverAtividade(ev.id)} title="Remover" style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",display:"flex",padding:4}}>{I.trash}</button>
                        </div>
                      )}
                      {isProposta && (
                        <a href={`/proposta/${ev.code}`} target="_blank" rel="noreferrer"
                          style={{fontSize:10,padding:"4px 10px",borderRadius:6,background:"#fef3c7",color:"#d97706",fontWeight:700,textDecoration:"none",flexShrink:0,whiteSpace:"nowrap"}}>
                          🔗 Ver
                        </a>
                      )}
                    </div>
                    {isMensagem && ev.mensagem && (
                      <details style={{marginTop:8}}>
                        <summary style={{fontSize:11,color:corItem,cursor:"pointer",fontWeight:500,padding:"4px 0"}}>Ver mensagem completa</summary>
                        <div style={{marginTop:8,padding:"10px 14px",background:"#FAF8F3",borderRadius:8,fontSize:12,color:"#555",lineHeight:1.6,whiteSpace:"pre-wrap"}}>
                          {ev.mensagem}
                        </div>
                      </details>
                    )}
                    <div style={{fontSize:10,color:"#aaa",marginTop:8,letterSpacing:.3}}>
                      {fmtDate(ev.data)}
                      {ev.dataCompleta && ` · ${new Date(ev.dataCompleta).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cliente Card */}
          <SectionTitle label="Cliente"/>
          <div style={{background:"white",borderRadius:14,padding:"20px 22px",border:"1px solid rgba(113,63,42,0.10)",marginBottom:20,cursor:"pointer"}} onClick={()=>onAbrirContato(cliente.id)}>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
              <div style={{width:48,height:48,borderRadius:12,background:`linear-gradient(135deg,${PAL.primary},${PAL.secondary})`,color:"#fff",display:"grid",placeItems:"center",fontWeight:700,fontSize:18,fontFamily:FT}}>
                {cliente?.nome[0]}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:FT,fontSize:17,fontWeight:500,color:"#1a1a1a"}}>{cliente?.nome}</div>
                <div style={{fontSize:11,color:"#888",marginTop:2}}>{cliente?.cargo || cliente?.tipo} {cliente?.cidade && `· ${cliente.cidade}`}</div>
              </div>
            </div>
            <AcoesRapidas contato={cliente} negocio={n} onMensagem={onMensagem}/>
          </div>

          {/* Estatísticas de Engajamento */}
          <SectionTitle label="Engajamento"/>
          <div style={{background:"white",borderRadius:14,padding:"20px 22px",border:"1px solid rgba(113,63,42,0.10)",marginBottom:20}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <EngajamentoStat label="Atividades" valor={ativs.length} sub={`${ativs.filter(a=>a.concluida).length} concluídas`} cor={ASSESS.primary}/>
              <EngajamentoStat label="Mensagens" valor={mensagens.length} sub="WhatsApp + E-mail" cor={'#25D366'}/>
              <EngajamentoStat label="Pendentes" valor={ativs.filter(a=>!a.concluida).length} sub="a fazer" cor={'#f59e0b'}/>
              <EngajamentoStat label="Dias ativos" valor={Math.max(1, Math.floor((new Date() - new Date(n.criado || today)) / (1000*60*60*24)))} sub="desde criação" cor={SEC}/>
            </div>
            {ativs.length > 0 && (
              <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid #f5f0e8"}}>
                <div style={{fontSize:9,letterSpacing:1.5,color:"#aaa",fontWeight:600,marginBottom:8,textTransform:"uppercase"}}>Último Contato</div>
                <div style={{fontSize:12,color:"#1a1a1a",fontWeight:500}}>
                  {fmtDate(timeline.find(e => e.eventoTipo === 'atividade' || e.eventoTipo === 'mensagem')?.data || n.criado)}
                </div>
              </div>
            )}
          </div>

          {/* Atividades Pendentes */}
          {ativs.filter(a => !a.concluida).length > 0 && (
            <>
              <SectionTitle label={`Pendentes (${ativs.filter(a => !a.concluida).length})`}/>
              <div style={{background:"white",borderRadius:14,padding:"18px 20px",border:"1px solid rgba(113,63,42,0.10)",marginBottom:20}}>
                {ativs.filter(a => !a.concluida).map(a => {
                  const tipo = tiposAtividade.find(t => t.id === a.tipo) || { icon: I.cal, cor: '#888' };
                  return (
                    <div key={a.id} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:"1px solid #f5f0e8",alignItems:"center"}}>
                      <button onClick={()=>onToggleAtividade(a.id)} style={{width:18,height:18,borderRadius:"50%",border:"1.5px solid rgba(113,63,42,0.25)",background:"white",cursor:"pointer",flexShrink:0,padding:0}}/>
                      <span style={{display:"flex",color:tipo.cor}}>{tipo.icon}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a"}}>{a.titulo}</div>
                        <div style={{fontSize:10,color:"#aaa"}}>{fmtDate(a.data)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Checklist de Documentação — apenas Atacado */}
          {areaNegocio === 'atacado' && (() => {
            const checklist = n.campos_extras?.checklist_docs || {};
            const total = CHECKLIST_DOCS_ATACADO.length;
            const feitos = CHECKLIST_DOCS_ATACADO.filter(d => checklist[d.id]?.checked).length;
            const salvarChecklist = (id, patch) => {
              const updated = { ...checklist, [id]: { ...(checklist[id] || {}), ...patch } };
              onAtualizar && onAtualizar(n.id, { campos_extras: { ...n.campos_extras, checklist_docs: updated } });
            };
            const onUpload = (id, e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = ev => salvarChecklist(id, { checked: true, arquivo: { nome: file.name, tipo: file.type, url: ev.target.result } });
              reader.readAsDataURL(file);
              e.target.value = '';
            };
            return (
              <>
                <SectionTitle label={`Documentação (${feitos}/${total})`}/>
                <div style={{background:"white",borderRadius:14,padding:"18px 20px",border:"1px solid rgba(113,63,42,0.10)"}}>
                  <div style={{marginBottom:12,height:4,borderRadius:2,background:"#f0ede5",overflow:"hidden"}}>
                    <div style={{width:`${(feitos/total)*100}%`,height:"100%",background:"#2e8a4e",borderRadius:2,transition:"width .3s"}}/>
                  </div>
                  {CHECKLIST_DOCS_ATACADO.map(doc => {
                    const item = checklist[doc.id] || {};
                    return (
                      <div key={doc.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid #f5f0e8"}}>
                        <div onClick={()=>salvarChecklist(doc.id, {checked:!item.checked})}
                          style={{width:18,height:18,borderRadius:4,border:`1.5px solid ${item.checked?'#2e8a4e':'#d0c8be'}`,background:item.checked?'#2e8a4e':'white',display:"grid",placeItems:"center",cursor:"pointer",flexShrink:0,transition:"all .15s"}}>
                          {item.checked && <Ico size={10} d={<path d="M4 12l5 5L20 7"/>}/>}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:600,color:item.checked?"#2e8a4e":"#1a1a1a",textDecoration:item.checked?"line-through":"none",transition:"color .15s"}}>{doc.nome}</div>
                          {item.arquivo && <div style={{fontSize:10,color:"#888",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.arquivo.nome}</div>}
                        </div>
                        {item.arquivo?.url ? (
                          <a href={item.arquivo.url} download={item.arquivo.nome} title="Baixar"
                            style={{padding:"4px 8px",borderRadius:6,border:"1px solid #d0c8be",background:"white",color:"#555",fontSize:10,fontWeight:600,textDecoration:"none",display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Baixar
                          </a>
                        ) : null}
                        <label style={{padding:"4px 10px",borderRadius:6,border:`1.5px solid ${ASSESS.primary}30`,background:`${ASSESS.primary}08`,color:ASSESS.primary,fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4}}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          {item.arquivo ? 'Trocar' : 'Enviar'}
                          <input type="file" style={{display:"none"}} onChange={e=>onUpload(doc.id,e)} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"/>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* ABA: PRÉ-PROPOSTA */}
      {abaDetalhe === 'pre_proposta' && (
        <div style={{maxWidth:700}}>
          <div style={{background:"white",borderRadius:14,padding:"28px 32px",border:"1px solid rgba(113,63,42,0.10)"}}>
            <div style={{fontSize:10,letterSpacing:2,color:PAL.primary,fontWeight:700,textTransform:"uppercase",marginBottom:24}}>Informações para Proposta</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div>
                <label style={lblStyle}>DESTINAÇÃO DOS RECURSOS</label>
                <select value={n.campos_extras?.destinacao_recursos||''} onChange={e=>onAtualizar&&onAtualizar(n.id,{campos_extras:{...(n.campos_extras||{}),destinacao_recursos:e.target.value}})} style={inpStyle}>
                  <option value="">— Selecionar —</option>
                  {['Capital de Giro','Expansão / Investimento','Quitação de Dívidas','Antecipação de Recebíveis','Estruturação Financeira','Outro'].map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={lblStyle}>TIPO DE GARANTIA</label>
                <select value={n.campos_extras?.tipo_garantia||''} onChange={e=>onAtualizar&&onAtualizar(n.id,{campos_extras:{...(n.campos_extras||{}),tipo_garantia:e.target.value}})} style={inpStyle}>
                  <option value="">— Selecionar —</option>
                  {['Imóvel','Veículo','Recebíveis','Aval / Fiança','Sem Garantia','Avaliando'].map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={lblStyle}>VALOR DA GARANTIA (R$)</label>
                <input type="number" value={n.campos_extras?.valor_garantia||''} onChange={e=>onAtualizar&&onAtualizar(n.id,{campos_extras:{...(n.campos_extras||{}),valor_garantia:e.target.value}})} style={inpStyle} placeholder="0"/>
              </div>
              <div>
                <label style={lblStyle}>FATURAMENTO MÉDIO MENSAL (R$)</label>
                <input type="number" value={n.campos_extras?.faturamento_mensal||''} onChange={e=>onAtualizar&&onAtualizar(n.id,{campos_extras:{...(n.campos_extras||{}),faturamento_mensal:e.target.value}})} style={inpStyle} placeholder="0"/>
              </div>
              <div style={{gridColumn:"1/-1"}}>
                <label style={lblStyle}>HISTÓRICO DE CRÉDITO</label>
                <select value={n.campos_extras?.historico_credito||''} onChange={e=>onAtualizar&&onAtualizar(n.id,{campos_extras:{...(n.campos_extras||{}),historico_credito:e.target.value}})} style={inpStyle}>
                  <option value="">— Selecionar —</option>
                  {['Limpo (sem restrições)','Negativado (em tratativa)','Score baixo','Score médio','Score alto','Recuperando'].map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div style={{gridColumn:"1/-1"}}>
                <label style={lblStyle}>OBSERVAÇÕES DA PRÉ-PROPOSTA</label>
                <textarea rows={4} value={n.campos_extras?.obs_pre_proposta||''} onChange={e=>onAtualizar&&onAtualizar(n.id,{campos_extras:{...(n.campos_extras||{}),obs_pre_proposta:e.target.value}})} style={{...inpStyle,resize:"vertical"}} placeholder="Informações relevantes para a proposta..."/>
              </div>
            </div>
            <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid #f5f0e8"}}>
              {n.campos_extras?.destinacao_recursos && n.campos_extras?.tipo_garantia ? (
                <div style={{fontSize:12,color:"#2e8a4e",display:"flex",alignItems:"center",gap:6}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Campos principais preenchidos — pronto para gerar proposta
                </div>
              ) : (
                <div style={{fontSize:12,color:"#f59e0b"}}>Preencha Destinação e Garantia para avançar com a proposta</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABA: EDIÇÃO RÁPIDA */}
      {abaDetalhe === 'edicao_rapida' && (
        <div style={{maxWidth:700}}>
          <div style={{background:"white",borderRadius:14,padding:"28px 32px",border:"1px solid rgba(113,63,42,0.10)"}}>
            <div style={{fontSize:10,letterSpacing:2,color:PAL.primary,fontWeight:700,textTransform:"uppercase",marginBottom:24}}>Editar Negócio</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {[
                {label:"TÍTULO",key:"titulo",full:true},
                {label:"VALOR (R$)",key:"valor",type:"number"},
                {label:"PROBABILIDADE (%)",key:"probabilidade",type:"number"},
                {label:"PRAZO (MESES)",key:"prazo",type:"number"},
                {label:"TAXA DE JUROS (% A.M.)",key:"taxaJuros",type:"number"},
                {label:"ORIGEM",key:"origem"},
                {label:"PREVISÃO DE FECHAMENTO",key:"fechamento",type:"date"},
                {label:"PRÓXIMA AÇÃO",key:"proximaAcao",full:true},
              ].map(({label,key,type,full})=>(
                <div key={key} style={full?{gridColumn:"1/-1"}:{}}>
                  <label style={lblStyle}>{label}</label>
                  <input type={type||"text"} value={editForm[key]??''} onChange={e=>setEditForm(f=>({...f,[key]:type==='number'?parseFloat(e.target.value)||0:e.target.value}))} style={inpStyle}/>
                </div>
              ))}
              <div style={{gridColumn:"1/-1"}}>
                <label style={lblStyle}>PRODUTO</label>
                <select value={editForm.produto||''} onChange={e=>setEditForm(f=>({...f,produto:e.target.value}))} style={inpStyle}>
                  {Object.keys(PRODUTOS_COMISSAO).map(p=><option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div style={{gridColumn:"1/-1"}}>
                <label style={lblStyle}>CONSULTOR</label>
                <select value={editForm.consultorId||''} onChange={e=>setEditForm(f=>({...f,consultorId:Number(e.target.value)||null}))} style={inpStyle}>
                  <option value="">— Sem consultor —</option>
                  {dados.funcionarios.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
              <div style={{gridColumn:"1/-1"}}>
                <label style={lblStyle}>OBSERVAÇÕES</label>
                <textarea value={editForm.observacoes||''} onChange={e=>setEditForm(f=>({...f,observacoes:e.target.value}))} rows={3} style={{...inpStyle,resize:"vertical"}}/>
              </div>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:24}}>
              <button onClick={()=>setAbaDetalhe('visao_geral')} style={{padding:"10px 20px",borderRadius:8,border:"1px solid #e0dbd0",background:"white",cursor:"pointer",fontSize:13,fontFamily:SN}}>Cancelar</button>
              <button onClick={()=>{onAtualizar(n.id,editForm);setAbaDetalhe('visao_geral');}} style={{padding:"10px 24px",borderRadius:8,border:"none",background:PAL.primary,color:"white",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:SN}}>Salvar Alterações</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EngajamentoStat({ label, valor, sub, cor }) {
  return (
    <div style={{padding:"12px 14px",background:"#FAF8F3",borderRadius:10,borderLeft:`3px solid ${cor}`}}>
      <div style={{fontSize:9,letterSpacing:1.5,color:"#aaa",fontWeight:600,textTransform:"uppercase",marginBottom:4}}>{label}</div>
      <div style={{fontFamily:FT,fontSize:22,fontWeight:300,color:cor,lineHeight:1}}>{valor}</div>
      <div style={{fontSize:10,color:"#888",marginTop:3}}>{sub}</div>
    </div>
  );
}

// ── ATIVIDADES ────────────────────────────────────────────────────────────────
function Atividades({ dados, onAdicionar, onToggle, onRemover }) {
  const pendentes = dados.atividades.filter(a => !a.concluida);
  const concluidas = dados.atividades.filter(a => a.concluida);

  const renderAtv = (a) => {
    const negocio = dados.negocios.find(n => n.id === a.negocioId);
    const contato = dados.contatos.find(c => c.id === negocio?.contatoId);
    const icones = { ligacao: I.phone, reuniao: I.cal, email: I.mail, whatsapp: I.whats };
    const PAL = contato?.area === 'varejo' ? VAREJO : ASSESS;
    return (
      <div key={a.id} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",background:"white",border:"1px solid rgba(113,63,42,0.10)",borderRadius:12,marginBottom:8,borderLeft:`3px solid ${a.concluida?"#ddd":PAL.primary}`}}>
        <button onClick={() => onToggle(a.id)} style={{width:22,height:22,borderRadius:"50%",border:`1.5px solid ${a.concluida?"#2e8a4e":"rgba(113,63,42,0.25)"}`,background:a.concluida?"#2e8a4e":"white",cursor:"pointer",display:"grid",placeItems:"center",color:"white",padding:0,flexShrink:0}}>
          {a.concluida && I.check}
        </button>
        <span style={{display:"flex",color:a.concluida?"#bbb":PAL.primary}}>{icones[a.tipo] || I.cal}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,color:a.concluida?"#aaa":"#1a1a1a",textDecoration:a.concluida?"line-through":"none"}}>{a.titulo}</div>
          <div style={{fontSize:11,color:"#888",marginTop:2}}>{negocio?.titulo} · {contato?.nome} · {fmtDate(a.data)}</div>
        </div>
        <button onClick={() => onRemover(a.id)} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",display:"flex",padding:6}}>{I.trash}</button>
      </div>
    );
  };

  return (
    <div style={{padding:"36px 48px 60px",maxWidth:900,margin:"0 auto"}}>
      <PageHeader
        etiqueta="Agenda Comercial"
        titulo="Suas"
        destaque="atividades"
        sub={`${pendentes.length} pendentes · ${concluidas.length} concluídas`}
        action={<Btn icon={I.plus} onClick={onAdicionar}>Nova Atividade</Btn>}
      />

      <SectionTitle label={`Pendentes (${pendentes.length})`}/>
      <div style={{marginBottom:24}}>
        {pendentes.map(renderAtv)}
        {pendentes.length === 0 && (
          <div style={{background:"white",borderRadius:14,padding:32,textAlign:"center",border:"1px solid rgba(113,63,42,0.10)"}}>
            <div style={{fontSize:13,color:"#aaa"}}>Nada pendente.</div>
          </div>
        )}
      </div>

      {concluidas.length > 0 && (
        <>
          <SectionTitle label={`Concluídas (${concluidas.length})`}/>
          <div>{concluidas.slice(0,10).map(renderAtv)}</div>
        </>
      )}
    </div>
  );
}

// ── RH ────────────────────────────────────────────────────────────────────────
function RH({ dados, onAdicionar, onRemover, onAtualizar, token }) {
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [criandoLoginId, setCriandoLoginId] = useState(null);
  const [loginMsg, setLoginMsg] = useState({});
  const [novoRole, setNovoRole] = useState({});

  const totalFolha = dados.funcionarios.filter(f => f.status === 'ativo').reduce((s,f) => s + f.salario, 0);
  const ativos = dados.funcionarios.filter(f => f.status === 'ativo').length;

  const comissaoPorFunc = (funcId) =>
    dados.contas.filter(c => c.funcionarioId === funcId && c.categoria === 'cus_comissoes' && c.status === 'pendente').reduce((s,c) => s+c.valor, 0);

  const iniciarEdit = (f) => {
    setEditandoId(f.id);
    setEditForm({ nome: f.nome, cargo: f.cargo, salario: f.salario, tipo: f.tipo, status: f.status, role: f.role || '' });
  };

  const salvarEdit = (id) => {
    onAtualizar(id, { ...editForm, salario: parseFloat(editForm.salario) || 0 });
    setEditandoId(null);
  };

  const criarLogin = async (f) => {
    if (!f.email) { setLoginMsg(m => ({ ...m, [f.id]: 'Funcionário sem e-mail.' })); return; }
    setCriandoLoginId(f.id);
    try {
      const resp = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ email: f.email, nome: f.nome, role: novoRole[f.id] || 'consultor_varejo', ativo: true }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Erro ao criar acesso');
      setLoginMsg(m => ({ ...m, [f.id]: 'Acesso criado!' }));
      onAtualizar(f.id, { temAcesso: true, role: novoRole[f.id] || 'consultor_varejo' });
    } catch(e) {
      setLoginMsg(m => ({ ...m, [f.id]: e.message }));
    } finally {
      setCriandoLoginId(null);
    }
  };

  return (
    <div style={{padding:"36px 48px 60px",maxWidth:1200,margin:"0 auto"}}>
      <PageHeader
        etiqueta="Recursos Humanos"
        titulo="Equipe"
        destaque="Áxicon"
        sub={`${ativos} colaboradores ativos`}
        action={<Btn icon={I.plus} onClick={onAdicionar}>Novo Colaborador</Btn>}
      />

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:32}}>
        <KpiCard label="Colaboradores Ativos" value={ativos} sub="todos os tipos" accent={ASSESS.primary}/>
        <KpiCard label="Folha Mensal" value={fmtMM(totalFolha)} sub="salários base" accent={VAREJO.primary}/>
        <KpiCard label="Folha + Encargos" value={fmtMM(totalFolha * 1.7)} sub="estimativa CLT (~70%)" accent={SEC}/>
        <KpiCard label="Comissões Pendentes" value={fmtMM(dados.funcionarios.filter(f=>f.status==='ativo').reduce((s,f) => s + comissaoPorFunc(f.id), 0))} sub="a pagar este mês" accent="#2e8a4e"/>
      </div>

      <SectionTitle label="Colaboradores"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
        {dados.funcionarios.map(f => {
          const comissao = comissaoPorFunc(f.id);
          const tempoEmpresa = Math.floor((new Date() - new Date(f.dataAdmissao)) / (1000*60*60*24*30));
          const editando = editandoId === f.id;
          const temLogin = f.temAcesso || false;

          return (
            <div key={f.id} style={{background:"white",borderRadius:14,padding:"22px 24px",border:"1px solid rgba(113,63,42,0.10)",borderLeft:`4px solid ${f.tipo === 'socio' ? SEC : ASSESS.primary}`}}>
              {/* Header */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div style={{display:"flex",gap:14,alignItems:"center",flex:1}}>
                  <div style={{width:48,height:48,borderRadius:"50%",background:`linear-gradient(135deg,${SEC},#8B6340)`,color:"#fff",display:"grid",placeItems:"center",fontWeight:600,fontSize:18,flexShrink:0}}>{(editando ? editForm.nome : f.nome)[0] || '?'}</div>
                  {editando ? (
                    <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                      <input value={editForm.nome} onChange={e=>setEditForm(v=>({...v,nome:e.target.value}))}
                        placeholder="Nome" style={{border:"1.5px solid #ddd",borderRadius:7,padding:"5px 10px",fontSize:14,fontWeight:600,width:"100%",fontFamily:SN}}/>
                      <input value={editForm.cargo} onChange={e=>setEditForm(v=>({...v,cargo:e.target.value}))}
                        placeholder="Cargo" style={{border:"1.5px solid #ddd",borderRadius:7,padding:"5px 10px",fontSize:12,width:"100%",fontFamily:SN}}/>
                    </div>
                  ) : (
                    <div>
                      <div style={{fontFamily:FT,fontSize:18,fontWeight:500,color:"#1a1a1a"}}>{f.nome}</div>
                      <div style={{fontSize:12,color:"#888",marginTop:2}}>{f.cargo}</div>
                    </div>
                  )}
                </div>
                <div style={{display:"flex",gap:4}}>
                  {editando ? (
                    <>
                      <button onClick={()=>salvarEdit(f.id)} style={{padding:"5px 10px",borderRadius:7,border:"none",background:ASSESS.primary,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:SN}}>Salvar</button>
                      <button onClick={()=>setEditandoId(null)} style={{padding:"5px 10px",borderRadius:7,border:"1px solid #ddd",background:"#fff",fontSize:11,cursor:"pointer",fontFamily:SN}}>Cancelar</button>
                    </>
                  ) : (
                    <button onClick={()=>iniciarEdit(f)} style={{background:"none",border:"none",color:"#aaa",cursor:"pointer",display:"flex",padding:6}}
                      onMouseEnter={e=>e.currentTarget.style.color=ASSESS.primary}
                      onMouseLeave={e=>e.currentTarget.style.color="#aaa"}>{I.edit}</button>
                  )}
                  <button onClick={()=>onRemover(f.id)} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",display:"flex",padding:6}}
                    onMouseEnter={e=>e.currentTarget.style.color="#b71c1c"}
                    onMouseLeave={e=>e.currentTarget.style.color="#ccc"}>{I.trash}</button>
                </div>
              </div>

              {/* Fields */}
              {editando ? (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                  <div>
                    <div style={{fontSize:9,letterSpacing:1.5,textTransform:"uppercase",color:"#aaa",marginBottom:4}}>Salário</div>
                    <input type="number" value={editForm.salario} onChange={e=>setEditForm(v=>({...v,salario:e.target.value}))}
                      style={{border:"1.5px solid #ddd",borderRadius:7,padding:"5px 10px",fontSize:13,width:"100%",fontFamily:SN}}/>
                  </div>
                  <div>
                    <div style={{fontSize:9,letterSpacing:1.5,textTransform:"uppercase",color:"#aaa",marginBottom:4}}>Tipo</div>
                    <select value={editForm.tipo} onChange={e=>setEditForm(v=>({...v,tipo:e.target.value}))}
                      style={{border:"1.5px solid #ddd",borderRadius:7,padding:"5px 10px",fontSize:13,width:"100%",fontFamily:SN}}>
                      <option value="socio">Sócio</option>
                      <option value="clt">CLT</option>
                      <option value="pj">PJ</option>
                    </select>
                  </div>
                  <div>
                    <div style={{fontSize:9,letterSpacing:1.5,textTransform:"uppercase",color:"#aaa",marginBottom:4}}>Status</div>
                    <select value={editForm.status} onChange={e=>setEditForm(v=>({...v,status:e.target.value}))}
                      style={{border:"1.5px solid #ddd",borderRadius:7,padding:"5px 10px",fontSize:13,width:"100%",fontFamily:SN}}>
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                      <option value="ferias">Férias</option>
                      <option value="afastado">Afastado</option>
                    </select>
                  </div>
                  <div style={{gridColumn:"1/-1"}}>
                    <div style={{fontSize:9,letterSpacing:1.5,textTransform:"uppercase",color:"#aaa",marginBottom:4}}>Acesso ao sistema</div>
                    <select value={editForm.role} onChange={e=>setEditForm(v=>({...v,role:e.target.value}))}
                      style={{border:"1.5px solid #ddd",borderRadius:7,padding:"5px 10px",fontSize:13,width:"100%",fontFamily:SN}}>
                      <option value="">— Sem acesso —</option>
                      <option value="admin">Admin</option>
                      <option value="administrativo">Administrativo</option>
                      <option value="consultor_varejo">Consultor Varejo</option>
                      <option value="consultor_atacado">Consultor Atacado</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                  <Mini label="Tipo" value={f.tipo === 'socio' ? 'Sócio' : f.tipo === 'clt' ? 'CLT' : 'PJ'}/>
                  <Mini label="Tempo na empresa" value={`${tempoEmpresa} meses`}/>
                  <Mini label="Salário base" value={fmtR(f.salario)}/>
                  <Mini label="Comissão pendente" value={fmtR(comissao)} highlight={comissao > 0}/>
                </div>
              )}

              {/* Footer: contatos + login */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:12,borderTop:"1px solid #f5f0e8",flexWrap:"wrap",gap:6}}>
                <div style={{display:"flex",gap:6}}>
                  {f.email && <a href={`mailto:${f.email}`} style={{fontSize:11,color:VAREJO.primary,textDecoration:"none",padding:"4px 8px",borderRadius:6,background:"#EEF0F8"}}>{f.email}</a>}
                  {f.telefone && <a href={`tel:${f.telefone}`} style={{fontSize:11,color:ASSESS.primary,textDecoration:"none",padding:"4px 8px",borderRadius:6,background:ASSESS.light}}>{f.telefone}</a>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  {loginMsg[f.id] && <span style={{fontSize:10,color:loginMsg[f.id]==='Acesso criado!'?"#2e8a4e":"#b71c1c"}}>{loginMsg[f.id]}</span>}
                  {temLogin ? (
                    <span style={{fontSize:10,padding:"3px 10px",borderRadius:99,background:"#dcfce7",color:"#166534",fontWeight:600}}>
                      ✓ {f.role === 'admin' ? 'Admin' : f.role === 'administrativo' ? 'Administrativo' : f.role === 'consultor_atacado' ? 'Consultor Atacado' : f.role === 'consultor_varejo' ? 'Consultor Varejo' : 'Acesso ativo'}
                    </span>
                  ) : (
                    <>
                      <select value={novoRole[f.id]||'consultor_varejo'} onChange={e=>setNovoRole(r=>({...r,[f.id]:e.target.value}))}
                        style={{fontSize:10,padding:"3px 6px",borderRadius:6,border:"1px solid #ddd",background:"#fafafa",color:"#555",fontFamily:SN}}>
                        <option value="consultor_varejo">Consultor Varejo</option>
                        <option value="consultor_atacado">Consultor Atacado</option>
                        <option value="administrativo">Administrativo</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button onClick={()=>criarLogin(f)} disabled={criandoLoginId === f.id}
                        style={{fontSize:10,padding:"4px 10px",borderRadius:99,border:`1.5px solid ${VAREJO.primary}40`,background:criandoLoginId===f.id?"#f0f0f0":"#EEF0F8",color:VAREJO.primary,cursor:"pointer",fontWeight:600,fontFamily:SN}}>
                        {criandoLoginId === f.id ? '...' : '+ Criar acesso'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Mini({ label, value, highlight }) {
  return (
    <div>
      <div style={{fontSize:9,letterSpacing:1.5,textTransform:"uppercase",color:"#aaa",marginBottom:3}}>{label}</div>
      <div style={{fontSize:13,fontWeight:600,color:highlight ? "#2e8a4e" : "#1a1a1a"}}>{value}</div>
    </div>
  );
}

// ── FINANCEIRO OVERVIEW ───────────────────────────────────────────────────────
function FinanceiroOverview({ dados, setTela }) {
  const [periodo, setPeriodo] = useState('mes');

  const agora = new Date();
  const periodoStart = periodo === 'mes'  ? new Date(agora.getFullYear(), agora.getMonth(), 1)
                     : periodo === '3m'   ? new Date(agora.getFullYear(), agora.getMonth() - 2, 1)
                     : periodo === '6m'   ? new Date(agora.getFullYear(), agora.getMonth() - 5, 1)
                     : periodo === 'ano'  ? new Date(agora.getFullYear(), 0, 1)
                     : null;

  const inPeriodo = (c) => {
    if (!periodoStart) return true;
    const d = new Date((c.vencimento || '') + 'T12:00:00');
    return d >= periodoStart;
  };

  const contas = dados.contas.filter(inPeriodo);

  const aReceber = contas.filter(c => c.tipo === 'receber' && c.status === 'pendente').reduce((s,c) => s+c.valor, 0);
  const aPagar   = contas.filter(c => c.tipo === 'pagar' && (c.status === 'pendente' || c.status === 'vencido')).reduce((s,c) => s+c.valor, 0);
  const recebido = contas.filter(c => c.tipo === 'receber' && c.status === 'recebido').reduce((s,c) => s+c.valor, 0);
  const pago     = contas.filter(c => c.tipo === 'pagar' && c.status === 'pago').reduce((s,c) => s+c.valor, 0);
  const vencidas = dados.contas.filter(c => c.tipo === 'pagar' && (c.status === 'vencido' || (c.status === 'pendente' && diasAteVencer(c.vencimento) < 0)));

  // Dados mensais para gráfico (últimos 6 meses, sempre all-time)
  const NOMES_MES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const meses6 = Array.from({length:6},(_,i) => {
    const d = new Date(agora.getFullYear(), agora.getMonth() - (5-i), 1);
    return { ano: d.getFullYear(), mes: d.getMonth(), label: NOMES_MES[d.getMonth()] };
  });
  const monthlyData = meses6.map(({ ano, mes, label }) => {
    const inM = (c) => { const d = new Date((c.vencimento||'')+'T12:00:00'); return d.getFullYear()===ano && d.getMonth()===mes; };
    const rec  = dados.contas.filter(c => c.tipo==='receber' && c.status==='recebido' && inM(c)).reduce((s,c)=>s+c.valor,0);
    const desp = dados.contas.filter(c => c.tipo==='pagar'   && c.status==='pago'     && inM(c)).reduce((s,c)=>s+c.valor,0);
    return { label, rec, desp };
  });
  const maxBar = Math.max(...monthlyData.flatMap(m=>[m.rec,m.desp]), 1);

  // Saldo acumulado (linha)
  let acc = 0;
  const saldoLine = monthlyData.map(m => { acc += (m.rec - m.desp); return acc; });
  const sMin = Math.min(...saldoLine, 0), sMax = Math.max(...saldoLine, 1);
  const sRange = sMax - sMin || 1;
  const SVG_W = 400, SVG_H = 80;
  const pts = saldoLine.map((v,i) => {
    const x = (i / Math.max(saldoLine.length-1,1)) * (SVG_W-20) + 10;
    const y = SVG_H - 10 - ((v - sMin) / sRange) * (SVG_H-20);
    return `${x},${y}`;
  }).join(' ');

  // Top categorias (período selecionado)
  const despPorCat = {}, recPorCat = {};
  contas.filter(c => c.tipo==='pagar'   && c.status==='pago'    ).forEach(c => { despPorCat[c.categoria]=(despPorCat[c.categoria]||0)+c.valor; });
  contas.filter(c => c.tipo==='receber' && c.status==='recebido').forEach(c => { recPorCat[c.categoria]=(recPorCat[c.categoria]||0)+c.valor; });
  const topDesp = Object.entries(despPorCat).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const topRec  = Object.entries(recPorCat).sort((a,b)=>b[1]-a[1]).slice(0,5);

  // Breakdown por empresa (período selecionado)
  const porEmpresa = EMPRESAS.map(emp => {
    const r = contas.filter(c => c.empresaId===emp.id && c.tipo==='receber' && c.status==='recebido').reduce((s,c)=>s+c.valor,0);
    const d = contas.filter(c => c.empresaId===emp.id && c.tipo==='pagar'   && c.status==='pago'    ).reduce((s,c)=>s+c.valor,0);
    return { ...emp, rec: r, desp: d, saldo: r-d };
  }).filter(e => e.rec > 0 || e.desp > 0);
  const maxEmp = Math.max(...porEmpresa.flatMap(e=>[e.rec,e.desp]), 1);

  const BarH = ({ pct, cor }) => (
    <div style={{height:5,background:"#EFE9E0",borderRadius:99,overflow:"hidden",marginTop:4}}>
      <div style={{height:"100%",width:`${pct}%`,background:cor,borderRadius:99,transition:"width .4s"}}/>
    </div>
  );

  return (
    <div style={{padding:"36px 48px 60px",maxWidth:1280,margin:"0 auto"}}>
      <PageHeader etiqueta="Financeiro" titulo="Visão" destaque="geral" sub="Posição consolidada de caixa, contas e DRE."/>

      {/* Filtro de período */}
      <div style={{display:"flex",gap:8,marginBottom:28}}>
        {[['mes','Este mês'],['3m','3 meses'],['6m','6 meses'],['ano','Este ano'],['tudo','Tudo']].map(([v,l]) => (
          <button key={v} onClick={()=>setPeriodo(v)} style={{padding:"6px 16px",borderRadius:99,border:"1px solid",cursor:"pointer",fontSize:12,fontWeight:600,transition:"all .15s",
            background: periodo===v ? ASSESS.primary : "white",
            color: periodo===v ? "white" : "#888",
            borderColor: periodo===v ? ASSESS.primary : "rgba(113,63,42,0.20)"}}>
            {l}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <SectionTitle label="Posição no Período"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14,marginBottom:24}}>
        <KpiCard label="Receitas"   value={fmtMM(recebido)}        sub="confirmadas"        accent="#2e8a4e"/>
        <KpiCard label="Despesas"   value={fmtMM(pago)}            sub="pagas"              accent="#b71c1c"/>
        <KpiCard label="Saldo"      value={fmtMM(recebido-pago)}   sub="resultado"          accent={recebido-pago>=0?ASSESS.primary:"#b71c1c"}/>
        <KpiCard label="A Receber"  value={fmtMM(aReceber)}        sub="pendentes"          accent={SEC}/>
        <KpiCard label="A Pagar"    value={fmtMM(aPagar)}          sub="pendentes+vencidas" accent="#f59e0b"/>
      </div>

      {/* Alerta vencidas */}
      {vencidas.length > 0 && (
        <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:14,padding:"16px 22px",marginBottom:24,display:"flex",alignItems:"center",gap:14}}>
          <div style={{color:"#b71c1c",display:"flex"}}>{I.alert}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,color:"#b71c1c"}}>{vencidas.length} {vencidas.length===1?'conta vencida':'contas vencidas'} totalizando {fmtR(vencidas.reduce((s,c)=>s+c.valor,0))}</div>
            <div style={{fontSize:11,color:"#888",marginTop:2}}>Resolva o quanto antes para evitar juros e multas.</div>
          </div>
          <Btn variant="outline" palette={{primary:'#b71c1c'}} onClick={()=>setTela('contas_pagar')}>Ver vencidas</Btn>
        </div>
      )}

      {/* Gráfico barras + linha saldo */}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:20,marginBottom:20}}>
        <div>
          <SectionTitle label="Receitas vs Despesas — últimos 6 meses"/>
          <div style={{background:"white",borderRadius:14,padding:"20px 22px",border:"1px solid rgba(113,63,42,0.10)"}}>
            <div style={{display:"flex",gap:6,alignItems:"flex-end",height:120,marginBottom:8}}>
              {monthlyData.map((m,i) => (
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                  <div style={{width:"100%",display:"flex",gap:2,alignItems:"flex-end",height:100}}>
                    <div title={`Receitas: ${fmtR(m.rec)}`}  style={{flex:1,height:`${(m.rec/maxBar)*100}%`, background:"#2e8a4e",borderRadius:"3px 3px 0 0",minHeight:m.rec>0?2:0,transition:"height .4s"}}/>
                    <div title={`Despesas: ${fmtR(m.desp)}`} style={{flex:1,height:`${(m.desp/maxBar)*100}%`,background:"#b71c1c",borderRadius:"3px 3px 0 0",minHeight:m.desp>0?2:0,transition:"height .4s"}}/>
                  </div>
                  <div style={{fontSize:9,color:"#aaa",fontWeight:600,letterSpacing:.5}}>{m.label}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:16,justifyContent:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#666"}}><div style={{width:10,height:10,borderRadius:2,background:"#2e8a4e"}}/> Receitas</div>
              <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#666"}}><div style={{width:10,height:10,borderRadius:2,background:"#b71c1c"}}/> Despesas</div>
            </div>
          </div>
        </div>

        <div>
          <SectionTitle label="Evolução do Saldo Acumulado"/>
          <div style={{background:"white",borderRadius:14,padding:"20px 22px",border:"1px solid rgba(113,63,42,0.10)",display:"flex",flexDirection:"column",justifyContent:"center"}}>
            <svg width="100%" height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="none" style={{display:"block"}}>
              <polyline points={pts} fill="none" stroke={ASSESS.primary} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
              {saldoLine.map((v,i) => {
                const x = (i/Math.max(saldoLine.length-1,1))*(SVG_W-20)+10;
                const y = SVG_H-10-((v-sMin)/sRange)*(SVG_H-20);
                return <circle key={i} cx={x} cy={y} r="3" fill={ASSESS.primary}/>;
              })}
            </svg>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
              {monthlyData.map((m,i) => <div key={i} style={{fontSize:9,color:"#bbb",textAlign:"center"}}>{m.label}</div>)}
            </div>
            <div style={{marginTop:12,textAlign:"center",fontSize:12,fontWeight:700,color:saldoLine[saldoLine.length-1]>=0?"#2e8a4e":"#b71c1c"}}>
              Saldo acumulado: {fmtR(saldoLine[saldoLine.length-1]||0)}
            </div>
          </div>
        </div>
      </div>

      {/* Top Despesas / Top Receitas / Por Empresa */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20,marginBottom:24}}>
        <div>
          <SectionTitle label="Top Despesas"/>
          <div style={{background:"white",borderRadius:14,padding:"20px 22px",border:"1px solid rgba(113,63,42,0.10)"}}>
            {topDesp.map(([cat,val]) => {
              const ct = TODAS_CONTAS.find(c=>c.id===cat);
              return (
                <div key={cat} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:2}}>
                    <span style={{color:"#1a1a1a",fontWeight:500}}>{ct?.nome||cat}</span>
                    <span style={{color:"#888"}}>{fmtR(val)}</span>
                  </div>
                  <BarH pct={(val/(topDesp[0]?.[1]||1))*100} cor="#b71c1c"/>
                </div>
              );
            })}
            {topDesp.length===0 && <div style={{padding:"20px 0",textAlign:"center",fontSize:13,color:"#aaa"}}>Nenhuma despesa no período</div>}
          </div>
        </div>

        <div>
          <SectionTitle label="Top Receitas"/>
          <div style={{background:"white",borderRadius:14,padding:"20px 22px",border:"1px solid rgba(113,63,42,0.10)"}}>
            {topRec.map(([cat,val]) => {
              const ct = TODAS_CONTAS.find(c=>c.id===cat);
              return (
                <div key={cat} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:2}}>
                    <span style={{color:"#1a1a1a",fontWeight:500}}>{ct?.nome||cat}</span>
                    <span style={{color:"#888"}}>{fmtR(val)}</span>
                  </div>
                  <BarH pct={(val/(topRec[0]?.[1]||1))*100} cor="#2e8a4e"/>
                </div>
              );
            })}
            {topRec.length===0 && <div style={{padding:"20px 0",textAlign:"center",fontSize:13,color:"#aaa"}}>Nenhuma receita no período</div>}
          </div>
        </div>

        <div>
          <SectionTitle label="Por Empresa"/>
          <div style={{background:"white",borderRadius:14,padding:"20px 22px",border:"1px solid rgba(113,63,42,0.10)"}}>
            {porEmpresa.map(emp => (
              <div key={emp.id} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <div style={{width:20,height:20,borderRadius:5,background:emp.cor,color:"white",display:"grid",placeItems:"center",fontSize:8,fontWeight:700,fontFamily:FT}}>{emp.sigla}</div>
                    <span style={{fontSize:11,fontWeight:500,color:"#1a1a1a"}}>{emp.nome}</span>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,color:emp.saldo>=0?"#2e8a4e":"#b71c1c"}}>{fmtR(emp.saldo)}</span>
                </div>
                <div style={{position:"relative",height:5,background:"#EFE9E0",borderRadius:99,overflow:"hidden"}}>
                  <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${(emp.rec/maxEmp)*100}%`,background:"#2e8a4e66",borderRadius:99}}/>
                  <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${(emp.desp/maxEmp)*100}%`,background:"#b71c1c55",borderRadius:99}}/>
                </div>
              </div>
            ))}
            {porEmpresa.length===0 && <div style={{padding:"20px 0",textAlign:"center",fontSize:13,color:"#aaa"}}>Nenhum dado no período</div>}
          </div>
        </div>
      </div>

      {/* Atalhos */}
      <SectionTitle label="Atalhos"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10}}>
        {[
          {id:'contas_pagar',   label:'Contas a Pagar',   ic:I.money,    cor:'#b71c1c'},
          {id:'contas_receber', label:'Contas a Receber', ic:I.trending, cor:'#2e8a4e'},
          {id:'calendario',     label:'Calendário',       ic:I.cal,      cor:VAREJO.primary},
          {id:'comissoes',      label:'Comissões',        ic:I.briefcase,cor:SEC},
          {id:'conciliacao',    label:'Conciliação',      ic:I.check,    cor:ASSESS.primary},
          {id:'dre',            label:'DRE Contábil',     ic:I.doc,      cor:ASSESS.secondary},
        ].map(a => (
          <div key={a.id} onClick={()=>setTela(a.id)}
            style={{background:"white",borderRadius:12,padding:"18px 16px",border:"1px solid rgba(113,63,42,0.10)",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:10,transition:"all .15s",textAlign:"center"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.borderColor=a.cor}}
            onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.borderColor="rgba(113,63,42,0.10)"}}>
            <div style={{width:36,height:36,borderRadius:10,background:`${a.cor}14`,color:a.cor,display:"grid",placeItems:"center"}}>{a.ic}</div>
            <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a"}}>{a.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CONTAS A PAGAR ────────────────────────────────────────────────────────────
function ContasPagar({ dados, onAdicionar, onEditar, onRemover, onPagar }) {
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroCat, setFiltroCat] = useState('todas');
  const [filtroEmpresa, setFiltroEmpresa] = useState('todas');

  let contas = dados.contas.filter(c => c.tipo === 'pagar');
  if (filtroStatus !== 'todos') contas = contas.filter(c => c.status === filtroStatus);
  if (filtroCat !== 'todas') contas = contas.filter(c => c.categoria === filtroCat);
  if (filtroEmpresa !== 'todas') contas = contas.filter(c => c.empresaId === filtroEmpresa);

  contas = contas.sort((a,b) => a.vencimento.localeCompare(b.vencimento));

  const baseFilter = (c) => filtroEmpresa === 'todas' || c.empresaId === filtroEmpresa;
  const totalPendente = dados.contas.filter(c => c.tipo === 'pagar' && c.status === 'pendente' && diasAteVencer(c.vencimento) >= 0 && baseFilter(c)).reduce((s,c) => s+c.valor, 0);
  const totalVencido = dados.contas.filter(c => c.tipo === 'pagar' && (c.status === 'vencido' || (c.status === 'pendente' && diasAteVencer(c.vencimento) < 0)) && baseFilter(c)).reduce((s,c) => s+c.valor, 0);
  const totalPago = dados.contas.filter(c => c.tipo === 'pagar' && c.status === 'pago' && baseFilter(c)).reduce((s,c) => s+c.valor, 0);

  const categoriasComContas = [...new Set(dados.contas.filter(c => c.tipo === 'pagar').map(c => c.categoria))];

  return (
    <div style={{padding:"36px 48px 60px",maxWidth:1400,margin:"0 auto"}}>
      <PageHeader
        etiqueta="Financeiro"
        titulo="Contas a"
        destaque="Pagar"
        sub="Despesas, comissões, fornecedores — agrupadas por empresa e plano de contas."
        action={<Btn icon={I.plus} onClick={onAdicionar}>Nova Despesa</Btn>}
      />

      {/* FILTRO POR EMPRESA */}
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        <button onClick={()=>setFiltroEmpresa('todas')}
          style={{padding:"8px 14px",borderRadius:8,border:`1.5px solid ${filtroEmpresa==='todas'?ASSESS.primary:"rgba(113,63,42,0.18)"}`,background:filtroEmpresa==='todas'?`${ASSESS.primary}14`:"white",color:filtroEmpresa==='todas'?ASSESS.primary:"#888",fontSize:12,fontWeight:filtroEmpresa==='todas'?700:400,cursor:"pointer"}}>
          Todas as empresas
        </button>
        {EMPRESAS.map(emp => (
          <button key={emp.id} onClick={()=>setFiltroEmpresa(emp.id)}
            style={{padding:"8px 14px",borderRadius:8,border:`1.5px solid ${filtroEmpresa===emp.id?emp.cor:"rgba(113,63,42,0.18)"}`,background:filtroEmpresa===emp.id?`${emp.cor}14`:"white",color:filtroEmpresa===emp.id?emp.cor:"#888",fontSize:12,fontWeight:filtroEmpresa===emp.id?700:400,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6}}>
            <div style={{width:18,height:18,borderRadius:4,background:emp.cor,color:"white",display:"grid",placeItems:"center",fontSize:9,fontWeight:700,fontFamily:FT}}>{emp.sigla}</div>
            {emp.nome}
          </button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
        <KpiCard label="Pendentes" value={fmtMM(totalPendente)} sub="aguardando pagamento" accent="#f59e0b"/>
        <KpiCard label="Vencidas" value={fmtMM(totalVencido)} sub="atenção urgente" accent="#b71c1c"/>
        <KpiCard label="Pagas (acumulado)" value={fmtMM(totalPago)} sub="histórico" accent="#2e8a4e"/>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {[{id:'todos',label:'Todos'},{id:'pendente',label:'Pendentes'},{id:'vencido',label:'Vencidas'},{id:'pago',label:'Pagas'}].map(f => (
          <button key={f.id} onClick={() => setFiltroStatus(f.id)}
            style={{padding:"7px 14px",borderRadius:8,border:`1.5px solid ${filtroStatus===f.id?ASSESS.primary:"rgba(113,63,42,0.18)"}`,background:filtroStatus===f.id?`${ASSESS.primary}14`:"white",color:filtroStatus===f.id?ASSESS.primary:"#888",fontSize:12,fontWeight:filtroStatus===f.id?600:400,cursor:"pointer"}}>
            {f.label}
          </button>
        ))}
        <select value={filtroCat} onChange={e=>setFiltroCat(e.target.value)} style={{padding:"7px 12px",borderRadius:8,border:"1px solid rgba(113,63,42,0.18)",fontSize:12,fontFamily:SN,background:"white",cursor:"pointer"}}>
          <option value="todas">Todas categorias</option>
          {categoriasComContas.map(cat => {
            const c = TODAS_CONTAS.find(x => x.id === cat);
            return <option key={cat} value={cat}>{c?.nome || cat}</option>;
          })}
        </select>
      </div>

      <div style={{background:"white",borderRadius:14,border:"1px solid rgba(113,63,42,0.10)",overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr style={{background:"#FAF8F3",borderBottom:"1px solid rgba(113,63,42,0.10)"}}>
              {["Empresa","Status","Descrição","Categoria","Fornecedor","NF","Competência","Valor",""].map(h => (
                <th key={h} style={{textAlign:"left",padding:"12px 14px",fontSize:10,letterSpacing:2,fontWeight:600,color:"#888",textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contas.map(c => {
              const dias = diasAteVencer(c.vencimento);
              const realStatus = c.status === 'pendente' && dias < 0 ? 'vencido' : c.status;
              const statusCfg = {
                pendente: {cor:'#f59e0b', bg:'#fef3c7', label:'Pendente'},
                vencido: {cor:'#b71c1c', bg:'#fee2e2', label:'Vencida'},
                pago: {cor:'#2e8a4e', bg:'#dcfce7', label:'Paga'},
              }[realStatus];
              const cat = TODAS_CONTAS.find(x => x.id === c.categoria);
              const emp = EMPRESAS.find(e => e.id === c.empresaId);
              return (
                <tr key={c.id} style={{borderBottom:"1px solid #f5f0e8"}}>
                  <td style={{padding:"14px 14px"}}>
                    {emp && <div title={emp.nome} style={{width:24,height:24,borderRadius:6,background:emp.cor,color:"white",display:"grid",placeItems:"center",fontSize:10,fontWeight:700,fontFamily:FT}}>{emp.sigla}</div>}
                  </td>
                  <td style={{padding:"14px 14px"}}>
                    <span style={{fontSize:10,padding:"3px 10px",borderRadius:99,fontWeight:600,letterSpacing:.5,background:statusCfg.bg,color:statusCfg.cor}}>{statusCfg.label}</span>
                  </td>
                  <td style={{padding:"14px 14px"}}>
                    <div style={{fontWeight:600,color:"#1a1a1a",display:"flex",alignItems:"center",gap:6}}>
                      {c.descricao}
                      {c.anexo && <span title={`Anexo: ${c.anexo.nome}`} style={{color:ASSESS.primary,display:"flex"}}>{I.paper}</span>}
                    </div>
                    {c.recorrente && <div style={{fontSize:10,color:"#888",marginTop:2}}>↻ Recorrente</div>}
                  </td>
                  <td style={{padding:"14px 14px"}}>
                    <div style={{fontSize:11,color:"#666"}}>{cat?.nome}</div>
                  </td>
                  <td style={{padding:"14px 14px",fontSize:12,color:"#666"}}>{c.fornecedor}</td>
                  <td style={{padding:"14px 14px",fontSize:11,color:"#888",fontFamily:"monospace"}}>{c.numeroNF || '—'}</td>
                  <td style={{padding:"14px 14px"}}>
                    <div style={{fontSize:12,color:"#666"}}>{fmtDate(c.vencimento)}</div>
                    {realStatus !== 'pago' && (
                      <div style={{fontSize:10,color:dias < 0 ? "#b71c1c" : dias <= 3 ? "#f59e0b" : "#aaa"}}>
                        {dias < 0 ? `${Math.abs(dias)}d atraso` : dias === 0 ? 'hoje' : `em ${dias}d`}
                      </div>
                    )}
                  </td>
                  <td style={{padding:"14px 14px"}}>
                    <div style={{fontFamily:FT,fontSize:16,fontWeight:500,color:"#1a1a1a"}}>{fmtR(c.valor)}</div>
                  </td>
                  <td style={{padding:"14px 14px",textAlign:"right"}}>
                    <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                      {realStatus !== 'pago' && <button onClick={()=>onPagar(c.id)} style={{padding:"5px 12px",background:`#2e8a4e14`,color:"#2e8a4e",border:"1px solid #2e8a4e30",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600}}>✓ Pagar</button>}
                      <button onClick={()=>onEditar(c)} title="Editar" style={{background:"none",border:"none",color:"#888",cursor:"pointer",display:"inline-flex",padding:6}}>{I.edit}</button>
                      <button onClick={() => onRemover(c.id)} title="Remover" style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",display:"inline-flex",padding:6}}>{I.trash}</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {contas.length === 0 && (
              <tr><td colSpan={9} style={{textAlign:"center",padding:40,color:"#aaa",fontSize:13}}>Nenhuma conta encontrada</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── CONTAS A RECEBER ──────────────────────────────────────────────────────────
function ContasReceber({ dados, onAdicionar, onAporte, onEditar, onRemover, onReceber }) {
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroEmpresa, setFiltroEmpresa] = useState('todas');

  let contas = dados.contas.filter(c => c.tipo === 'receber');
  if (filtroStatus !== 'todos') contas = contas.filter(c => c.status === filtroStatus);
  if (filtroEmpresa !== 'todas') contas = contas.filter(c => c.empresaId === filtroEmpresa);
  contas = contas.sort((a,b) => a.vencimento.localeCompare(b.vencimento));

  const baseFilter = (c) => filtroEmpresa === 'todas' || c.empresaId === filtroEmpresa;
  const totalPendente = dados.contas.filter(c => c.tipo === 'receber' && c.status === 'pendente' && baseFilter(c)).reduce((s,c) => s+c.valor, 0);
  const totalRecebido = dados.contas.filter(c => c.tipo === 'receber' && c.status === 'recebido' && baseFilter(c)).reduce((s,c) => s+c.valor, 0);

  return (
    <div style={{padding:"36px 48px 60px",maxWidth:1400,margin:"0 auto"}}>
      <PageHeader
        etiqueta="Financeiro"
        titulo="Contas a"
        destaque="Receber"
        sub="Fees, comissões e receitas a entrar no caixa, separadas por empresa."
        action={
          <div style={{display:"flex",gap:8}}>
            <Btn icon={I.plus} variant="outline" palette={ASSESS} onClick={onAporte}>Aporte dos Sócios</Btn>
            <Btn icon={I.plus} onClick={onAdicionar}>Nova Receita</Btn>
          </div>
        }
      />

      {/* FILTRO POR EMPRESA */}
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        <button onClick={()=>setFiltroEmpresa('todas')}
          style={{padding:"8px 14px",borderRadius:8,border:`1.5px solid ${filtroEmpresa==='todas'?ASSESS.primary:"rgba(113,63,42,0.18)"}`,background:filtroEmpresa==='todas'?`${ASSESS.primary}14`:"white",color:filtroEmpresa==='todas'?ASSESS.primary:"#888",fontSize:12,fontWeight:filtroEmpresa==='todas'?700:400,cursor:"pointer"}}>
          Todas as empresas
        </button>
        {EMPRESAS.map(emp => (
          <button key={emp.id} onClick={()=>setFiltroEmpresa(emp.id)}
            style={{padding:"8px 14px",borderRadius:8,border:`1.5px solid ${filtroEmpresa===emp.id?emp.cor:"rgba(113,63,42,0.18)"}`,background:filtroEmpresa===emp.id?`${emp.cor}14`:"white",color:filtroEmpresa===emp.id?emp.cor:"#888",fontSize:12,fontWeight:filtroEmpresa===emp.id?700:400,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6}}>
            <div style={{width:18,height:18,borderRadius:4,background:emp.cor,color:"white",display:"grid",placeItems:"center",fontSize:9,fontWeight:700,fontFamily:FT}}>{emp.sigla}</div>
            {emp.nome}
          </button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16,marginBottom:24}}>
        <KpiCard label="A Receber" value={fmtMM(totalPendente)} sub="pendentes" accent={SEC}/>
        <KpiCard label="Recebido (acumulado)" value={fmtMM(totalRecebido)} sub="entrou no caixa" accent="#2e8a4e"/>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[{id:'todos',label:'Todos'},{id:'pendente',label:'Pendentes'},{id:'recebido',label:'Recebidos'}].map(f => (
          <button key={f.id} onClick={() => setFiltroStatus(f.id)}
            style={{padding:"7px 14px",borderRadius:8,border:`1.5px solid ${filtroStatus===f.id?ASSESS.primary:"rgba(113,63,42,0.18)"}`,background:filtroStatus===f.id?`${ASSESS.primary}14`:"white",color:filtroStatus===f.id?ASSESS.primary:"#888",fontSize:12,fontWeight:filtroStatus===f.id?600:400,cursor:"pointer"}}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{background:"white",borderRadius:14,border:"1px solid rgba(113,63,42,0.10)",overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr style={{background:"#FAF8F3",borderBottom:"1px solid rgba(113,63,42,0.10)"}}>
              {["Empresa","Status","Descrição","Cliente","NF","Competência","Valor",""].map(h => (
                <th key={h} style={{textAlign:"left",padding:"12px 14px",fontSize:10,letterSpacing:2,fontWeight:600,color:"#888",textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contas.map(c => {
              const dias = diasAteVencer(c.vencimento);
              const cfg = c.status === 'recebido' ? {cor:'#2e8a4e', bg:'#dcfce7', label:'Recebido'} : {cor:'#f59e0b', bg:'#fef3c7', label:'Pendente'};
              const emp = EMPRESAS.find(e => e.id === c.empresaId);
              return (
                <tr key={c.id} style={{borderBottom:"1px solid #f5f0e8"}}>
                  <td style={{padding:"14px 14px"}}>
                    {emp && <div title={emp.nome} style={{width:24,height:24,borderRadius:6,background:emp.cor,color:"white",display:"grid",placeItems:"center",fontSize:10,fontWeight:700,fontFamily:FT}}>{emp.sigla}</div>}
                  </td>
                  <td style={{padding:"14px 14px"}}>
                    <span style={{fontSize:10,padding:"3px 10px",borderRadius:99,fontWeight:600,letterSpacing:.5,background:cfg.bg,color:cfg.cor}}>{cfg.label}</span>
                  </td>
                  <td style={{padding:"14px 14px"}}>
                    <div style={{fontWeight:600,color:"#1a1a1a",display:"flex",alignItems:"center",gap:6}}>
                      {c.descricao}
                      {c.anexo && <span title={`Anexo: ${c.anexo.nome}`} style={{color:ASSESS.primary,display:"flex"}}>{I.paper}</span>}
                    </div>
                  </td>
                  <td style={{padding:"14px 14px",fontSize:12,color:"#666"}}>{c.cliente}</td>
                  <td style={{padding:"14px 14px",fontSize:11,color:"#888",fontFamily:"monospace"}}>{c.numeroNF || '—'}</td>
                  <td style={{padding:"14px 14px"}}>
                    <div style={{fontSize:12,color:"#666"}}>{fmtDate(c.vencimento)}</div>
                    {c.status === 'pendente' && (
                      <div style={{fontSize:10,color:dias < 0 ? "#b71c1c" : dias <= 3 ? "#f59e0b" : "#aaa"}}>
                        {dias < 0 ? `${Math.abs(dias)}d atraso` : dias === 0 ? 'hoje' : `em ${dias}d`}
                      </div>
                    )}
                  </td>
                  <td style={{padding:"14px 14px",fontFamily:FT,fontSize:16,fontWeight:500,color:"#2e8a4e"}}>{fmtR(c.valor)}</td>
                  <td style={{padding:"14px 14px",textAlign:"right"}}>
                    <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                      {c.status === 'pendente' && <button onClick={()=>onReceber(c.id)} style={{padding:"5px 12px",background:`#2e8a4e14`,color:"#2e8a4e",border:"1px solid #2e8a4e30",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600}}>✓ Recebido</button>}
                      <button onClick={()=>onEditar(c)} title="Editar" style={{background:"none",border:"none",color:"#888",cursor:"pointer",display:"inline-flex",padding:6}}>{I.edit}</button>
                      <button onClick={() => onRemover(c.id)} title="Remover" style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",display:"inline-flex",padding:6}}>{I.trash}</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {contas.length === 0 && (
              <tr><td colSpan={8} style={{textAlign:"center",padding:40,color:"#aaa",fontSize:13}}>Nenhuma conta encontrada</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── CALENDÁRIO FINANCEIRO ─────────────────────────────────────────────────────
function CalendarioFinanceiro({ dados, onPagar }) {
  const [mesAno, setMesAno] = useState(() => {
    const d = new Date();
    return { mes: d.getMonth(), ano: d.getFullYear() };
  });

  const primeiroDia = new Date(mesAno.ano, mesAno.mes, 1);
  const ultimoDia = new Date(mesAno.ano, mesAno.mes + 1, 0);
  const diasNoMes = ultimoDia.getDate();
  const diaDaSemanaInicio = primeiroDia.getDay();

  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  // Contas por dia
  const contasPorDia = {};
  dados.contas.forEach(c => {
    const d = new Date(c.vencimento + 'T12:00:00');
    if (d.getMonth() === mesAno.mes && d.getFullYear() === mesAno.ano) {
      const dia = d.getDate();
      if (!contasPorDia[dia]) contasPorDia[dia] = [];
      contasPorDia[dia].push(c);
    }
  });

  const hoje = new Date();
  const isHoje = (dia) => hoje.getDate() === dia && hoje.getMonth() === mesAno.mes && hoje.getFullYear() === mesAno.ano;

  const navegarMes = (dir) => {
    setMesAno(p => {
      let novoMes = p.mes + dir;
      let novoAno = p.ano;
      if (novoMes < 0) { novoMes = 11; novoAno--; }
      if (novoMes > 11) { novoMes = 0; novoAno++; }
      return { mes: novoMes, ano: novoAno };
    });
  };

  return (
    <div style={{padding:"36px 48px 60px",maxWidth:1200,margin:"0 auto"}}>
      <PageHeader
        etiqueta="Financeiro"
        titulo="Calendário"
        destaque="financeiro"
        sub="Visão mensal de vencimentos e recebimentos."
      />

      <div style={{background:"white",borderRadius:14,border:"1px solid rgba(113,63,42,0.10)",overflow:"hidden"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 22px",borderBottom:"1px solid rgba(113,63,42,0.08)"}}>
          <button onClick={()=>navegarMes(-1)} style={{background:"none",border:"1px solid rgba(113,63,42,0.18)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>← Anterior</button>
          <div style={{fontFamily:FT,fontSize:22,fontWeight:300,color:"#1a1a1a"}}>{meses[mesAno.mes]} <em style={{color:ASSESS.primary,fontStyle:"italic"}}>{mesAno.ano}</em></div>
          <button onClick={()=>navegarMes(1)} style={{background:"none",border:"1px solid rgba(113,63,42,0.18)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>Próximo →</button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,background:"#f5f0e8",padding:1}}>
          {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d => (
            <div key={d} style={{background:"#FAF8F3",padding:"8px",fontSize:10,letterSpacing:2,fontWeight:600,color:"#888",textTransform:"uppercase",textAlign:"center"}}>{d}</div>
          ))}
          {[...Array(diaDaSemanaInicio)].map((_,i) => <div key={`empty-${i}`} style={{background:"white",minHeight:90}}/>)}
          {[...Array(diasNoMes)].map((_,i) => {
            const dia = i + 1;
            const contas = contasPorDia[dia] || [];
            const totalPagar = contas.filter(c => c.tipo === 'pagar' && c.status !== 'pago').reduce((s,c) => s+c.valor, 0);
            const totalReceber = contas.filter(c => c.tipo === 'receber' && c.status !== 'recebido').reduce((s,c) => s+c.valor, 0);
            return (
              <div key={dia} style={{background:"white",minHeight:90,padding:"6px 8px",position:"relative",borderTop:isHoje(dia)?`3px solid ${ASSESS.primary}`:"none"}}>
                <div style={{fontSize:12,fontWeight:isHoje(dia)?700:500,color:isHoje(dia)?ASSESS.primary:"#1a1a1a",marginBottom:4}}>{dia}</div>
                {contas.slice(0,2).map(c => (
                  <div key={c.id} style={{fontSize:9,padding:"2px 5px",borderRadius:4,marginBottom:2,background:c.tipo==='pagar'?'#fee2e2':'#dcfce7',color:c.tipo==='pagar'?'#b71c1c':'#2e8a4e',fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                    {c.tipo === 'pagar' ? '↑' : '↓'} {fmtMM(c.valor)}
                  </div>
                ))}
                {contas.length > 2 && <div style={{fontSize:9,color:"#888"}}>+{contas.length - 2}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista do dia */}
      <SectionTitle label="Próximos eventos do mês"/>
      <div style={{background:"white",borderRadius:14,padding:"18px 22px",border:"1px solid rgba(113,63,42,0.10)"}}>
        {Object.entries(contasPorDia).sort((a,b) => Number(a[0]) - Number(b[0])).slice(0,10).map(([dia, contas]) => (
          <div key={dia} style={{padding:"10px 0",borderBottom:"1px solid #f5f0e8"}}>
            <div style={{fontSize:10,letterSpacing:2,color:ASSESS.primary,fontWeight:600,marginBottom:6,textTransform:"uppercase"}}>{dia} de {meses[mesAno.mes]}</div>
            {contas.map(c => (
              <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:c.tipo==='pagar'?'#fee2e2':'#dcfce7',color:c.tipo==='pagar'?'#b71c1c':'#2e8a4e',fontWeight:600}}>
                    {c.tipo === 'pagar' ? 'PAGAR' : 'RECEBER'}
                  </span>
                  <span style={{fontSize:13,fontWeight:600}}>{c.descricao}</span>
                </div>
                <div style={{fontSize:13,fontWeight:600,color:c.tipo==='pagar'?'#b71c1c':'#2e8a4e'}}>{fmtR(c.valor)}</div>
              </div>
            ))}
          </div>
        ))}
        {Object.keys(contasPorDia).length === 0 && <div style={{textAlign:"center",padding:30,color:"#aaa",fontSize:13}}>Nenhum vencimento neste mês</div>}
      </div>
    </div>
  );
}

// ── COMISSÕES ─────────────────────────────────────────────────────────────────
function Comissoes({ dados }) {
  // Calcula comissões por funcionário com base em negócios fechados
  const ETAPAS_GANHO = ['fechado_ganho', 'projeto_aprovado', 'aguardando_pagamento'];

  const comissoesPorFunc = dados.funcionarios.map(f => {
    const negocios = dados.negocios.filter(n => n.consultorId === f.id && ETAPAS_GANHO.includes(n.etapa));
    const contasPagar = dados.contas.filter(c => c.funcionarioId === f.id && c.categoria === 'cus_comissoes');
    const totalGerado = negocios.reduce((s,n) => {
      const prod = PRODUTOS_COMISSAO[n.produto];
      return s + (n.valor * (prod?.com || 0) / 100);
    }, 0);
    const totalAPagar = contasPagar.filter(c => c.status === 'pendente').reduce((s,c) => s+c.valor, 0);
    const totalPago = contasPagar.filter(c => c.status === 'pago').reduce((s,c) => s+c.valor, 0);
    return { ...f, negocios, totalGerado, totalAPagar, totalPago, contasPagar };
  }).filter(f => f.totalGerado > 0 || f.totalAPagar > 0 || f.totalPago > 0);

  return (
    <div style={{padding:"36px 48px 60px",maxWidth:1200,margin:"0 auto"}}>
      <PageHeader
        etiqueta="Financeiro"
        titulo="Gestão de"
        destaque="comissões"
        sub="Cálculo automático com base nos negócios fechados no CRM."
      />

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
        <KpiCard label="Total Gerado" value={fmtMM(comissoesPorFunc.reduce((s,f)=>s+f.totalGerado,0))} sub="fees Áxicon" accent={SEC}/>
        <KpiCard label="A Pagar" value={fmtMM(comissoesPorFunc.reduce((s,f)=>s+f.totalAPagar,0))} sub="comissões pendentes" accent="#f59e0b"/>
        <KpiCard label="Pago" value={fmtMM(comissoesPorFunc.reduce((s,f)=>s+f.totalPago,0))} sub="histórico" accent="#2e8a4e"/>
      </div>

      <SectionTitle label="Comissões por Consultor"/>
      <div style={{display:"grid",gap:14}}>
        {comissoesPorFunc.map(f => (
          <div key={f.id} style={{background:"white",borderRadius:14,padding:"22px 24px",border:"1px solid rgba(113,63,42,0.10)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${SEC},#8B6340)`,color:"#fff",display:"grid",placeItems:"center",fontWeight:600,fontSize:16}}>{f.nome[0]}</div>
                <div>
                  <div style={{fontFamily:FT,fontSize:18,fontWeight:500,color:"#1a1a1a"}}>{f.nome}</div>
                  <div style={{fontSize:12,color:"#888"}}>{f.cargo}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:20,textAlign:"right"}}>
                <div>
                  <div style={{fontSize:9,letterSpacing:1.5,color:"#aaa",textTransform:"uppercase"}}>Gerado</div>
                  <div style={{fontFamily:FT,fontSize:18,fontWeight:500,color:SEC}}>{fmtR(f.totalGerado)}</div>
                </div>
                <div>
                  <div style={{fontSize:9,letterSpacing:1.5,color:"#aaa",textTransform:"uppercase"}}>A Pagar</div>
                  <div style={{fontFamily:FT,fontSize:18,fontWeight:500,color:"#f59e0b"}}>{fmtR(f.totalAPagar)}</div>
                </div>
                <div>
                  <div style={{fontSize:9,letterSpacing:1.5,color:"#aaa",textTransform:"uppercase"}}>Pago</div>
                  <div style={{fontFamily:FT,fontSize:18,fontWeight:500,color:"#2e8a4e"}}>{fmtR(f.totalPago)}</div>
                </div>
              </div>
            </div>

            <div style={{borderTop:"1px solid #f5f0e8",paddingTop:14}}>
              <div style={{fontSize:10,letterSpacing:2,color:"#888",fontWeight:600,marginBottom:10,textTransform:"uppercase"}}>Negócios fechados ({f.negocios.length})</div>
              {f.negocios.map(n => {
                const cliente = dados.contatos.find(c => c.id === n.contatoId);
                const prod = PRODUTOS_COMISSAO[n.produto];
                const com = n.valor * (prod?.com || 0) / 100;
                return (
                  <div key={n.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",fontSize:12,borderBottom:"1px solid #f5f0e8"}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,color:"#1a1a1a"}}>{n.titulo}</div>
                      <div style={{color:"#888",fontSize:11,marginTop:2}}>{cliente?.nome} · {n.produto} · {prod?.com}% comissão</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{color:"#1a1a1a",fontWeight:500}}>{fmtR(com)}</div>
                      <div style={{fontSize:10,color:"#aaa"}}>sobre {fmtMM(n.valor)}</div>
                    </div>
                  </div>
                );
              })}
              {f.negocios.length === 0 && <div style={{padding:"10px 0",fontSize:12,color:"#aaa",textAlign:"center"}}>Nenhum negócio fechado ainda</div>}
            </div>
          </div>
        ))}
        {comissoesPorFunc.length === 0 && (
          <div style={{background:"white",borderRadius:14,padding:40,textAlign:"center",border:"1px solid rgba(113,63,42,0.10)"}}>
            <div style={{fontSize:13,color:"#aaa"}}>Nenhuma comissão gerada ainda. Feche negócios no Pipeline para começar.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── CONCILIAÇÃO ───────────────────────────────────────────────────────────────
function Conciliacao({ dados, onPagar }) {
  const [tipo, setTipo] = useState('pagar');
  const [busca, setBusca] = useState('');

  const contas = dados.contas.filter(c => c.tipo === tipo && c.status !== (tipo === 'pagar' ? 'pago' : 'recebido'))
    .filter(c => !busca || c.descricao.toLowerCase().includes(busca.toLowerCase()) || (c.fornecedor||c.cliente||'').toLowerCase().includes(busca.toLowerCase()))
    .sort((a,b) => a.vencimento.localeCompare(b.vencimento));

  return (
    <div style={{padding:"36px 48px 60px",maxWidth:1200,margin:"0 auto"}}>
      <PageHeader
        etiqueta="Financeiro"
        titulo="Conciliação"
        destaque="financeira"
        sub="Marque pagamentos e recebimentos quando confirmados no extrato bancário."
      />

      <div style={{background:"white",borderRadius:14,padding:"20px 22px",border:"1px solid rgba(113,63,42,0.10)",marginBottom:20,display:"flex",alignItems:"center",gap:14}}>
        <div style={{display:"flex",background:"#FAF8F3",padding:4,borderRadius:8,gap:2}}>
          {[{id:'pagar',label:'A Pagar'},{id:'receber',label:'A Receber'}].map(t => (
            <button key={t.id} onClick={()=>setTipo(t.id)}
              style={{padding:"7px 16px",borderRadius:6,fontSize:12,fontWeight:tipo===t.id?700:400,background:tipo===t.id?ASSESS.primary:"transparent",color:tipo===t.id?"white":"#888",border:"none",cursor:"pointer"}}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:10,padding:"0 14px",border:"1px solid rgba(113,63,42,0.18)",borderRadius:8,height:38,background:"#FAF8F3"}}>
          <span style={{color:"#888",display:"flex"}}>{I.search}</span>
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar lançamento..." style={{border:"none",background:"transparent",outline:"none",flex:1,fontSize:13,fontFamily:SN}}/>
        </div>
      </div>

      <div style={{background:"white",borderRadius:14,border:"1px solid rgba(113,63,42,0.10)",overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr style={{background:"#FAF8F3",borderBottom:"1px solid rgba(113,63,42,0.10)"}}>
              {["✓","Competência","Descrição","Categoria","Valor",""].map(h => (
                <th key={h} style={{textAlign:"left",padding:"12px 16px",fontSize:10,letterSpacing:2,fontWeight:600,color:"#888",textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contas.map(c => {
              const cat = TODAS_CONTAS.find(x => x.id === c.categoria);
              return (
                <tr key={c.id} style={{borderBottom:"1px solid #f5f0e8"}}>
                  <td style={{padding:"14px 16px"}}>
                    <button onClick={()=>onPagar(c.id)} style={{width:24,height:24,borderRadius:"50%",border:`1.5px solid rgba(113,63,42,0.3)`,background:"white",cursor:"pointer",display:"grid",placeItems:"center",padding:0,transition:"all .15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.background="#2e8a4e";e.currentTarget.style.borderColor="#2e8a4e";e.currentTarget.style.color="white"}}
                      onMouseLeave={e=>{e.currentTarget.style.background="white";e.currentTarget.style.borderColor="rgba(113,63,42,0.3)";e.currentTarget.style.color="inherit"}}>
                      <Ico size={12} d={<path d="M5 12l5 5L20 7"/>}/>
                    </button>
                  </td>
                  <td style={{padding:"14px 16px",fontSize:12,color:"#666"}}>{fmtDate(c.vencimento)}</td>
                  <td style={{padding:"14px 16px"}}>
                    <div style={{fontWeight:600,color:"#1a1a1a"}}>{c.descricao}</div>
                    <div style={{fontSize:11,color:"#888",marginTop:2}}>{c.fornecedor || c.cliente}</div>
                  </td>
                  <td style={{padding:"14px 16px",fontSize:11,color:"#666"}}>{cat?.nome || c.categoria}</td>
                  <td style={{padding:"14px 16px",fontFamily:FT,fontSize:16,fontWeight:500,color:tipo==='pagar'?'#b71c1c':'#2e8a4e'}}>{fmtR(c.valor)}</td>
                  <td style={{padding:"14px 16px",textAlign:"right"}}>
                    <button onClick={()=>onPagar(c.id)} style={{padding:"6px 14px",background:`#2e8a4e`,color:"white",border:"none",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600}}>Conciliar</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {contas.length === 0 && (
          <div style={{padding:40,textAlign:"center",color:"#aaa",fontSize:13}}>Nenhum lançamento pendente</div>
        )}
      </div>
    </div>
  );
}

// ── DRE CONTÁBIL ──────────────────────────────────────────────────────────────
function DRE({ dados }) {
  const [periodo, setPeriodo] = useState(() => {
    const d = new Date();
    return { mes: d.getMonth(), ano: d.getFullYear() };
  });
  const [empresaFiltro, setEmpresaFiltro] = useState('todas');
  const [regime, setRegime] = useState('caixa');

  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  const filtrarPeriodo = (conta, regimeUsado) => {
    const data = regimeUsado === 'caixa' ? conta.dataPagamento : conta.vencimento;
    if (!data) return false;
    const d = new Date(data + 'T12:00:00');
    return d.getMonth() === periodo.mes && d.getFullYear() === periodo.ano;
  };

  const contasFiltradas = dados.contas.filter(c => {
    if (empresaFiltro !== 'todas' && c.empresaId !== empresaFiltro) return false;
    if (regime === 'caixa') {
      return (c.status === 'pago' || c.status === 'recebido') && filtrarPeriodo(c, 'caixa');
    } else {
      return filtrarPeriodo(c, 'competencia');
    }
  });

  const totalCategoria = (catId) => contasFiltradas.filter(c => c.categoria === catId).reduce((s,c) => s+c.valor, 0);
  const totalGrupo = (grupoKey) => Object.keys(PLANO_CONTAS[grupoKey]?.grupos || {}).reduce((s,catId) => s + totalCategoria(catId), 0);

  const receitaBruta = totalGrupo('receita');
  const deducoes = totalGrupo('deducoes');
  const receitaLiquida = receitaBruta - deducoes;
  const custos = totalGrupo('custos');
  const lucroBruto = receitaLiquida - custos;
  const despesas = totalGrupo('despesas');
  const ebitda = lucroBruto - despesas;
  const resultadoFinanceiro = totalCategoria('fin_receitas') - totalCategoria('fin_despesas');
  const lair = ebitda + resultadoFinanceiro;
  const tributos = totalGrupo('tributos');
  const lucroLiquido = lair - tributos;

  const navegarMes = (dir) => {
    setPeriodo(p => {
      let novoMes = p.mes + dir;
      let novoAno = p.ano;
      if (novoMes < 0) { novoMes = 11; novoAno--; }
      if (novoMes > 11) { novoMes = 0; novoAno++; }
      return { mes: novoMes, ano: novoAno };
    });
  };

  const empSelecionada = empresaFiltro === 'todas' ? null : EMPRESAS.find(e => e.id === empresaFiltro);
  const tituloEmp = empSelecionada ? empSelecionada.nome : 'Consolidado (todas as empresas)';
  const corEmp = empSelecionada ? empSelecionada.cor : ASSESS.primary;

  return (
    <div style={{padding:"36px 48px 60px",maxWidth:1100,margin:"0 auto"}}>
      <PageHeader
        etiqueta="Demonstração Contábil"
        titulo="DRE"
        destaque="contábil"
        sub="Demonstração do Resultado do Exercício (modelo CPC)"
      />

      {/* SELETOR DE EMPRESA */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <button onClick={()=>setEmpresaFiltro('todas')}
          style={{padding:"10px 18px",borderRadius:10,border:`1.5px solid ${empresaFiltro==='todas'?ASSESS.primary:"rgba(113,63,42,0.18)"}`,background:empresaFiltro==='todas'?`${ASSESS.primary}14`:"white",color:empresaFiltro==='todas'?ASSESS.primary:"#888",fontSize:12,fontWeight:empresaFiltro==='todas'?700:400,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
          <span style={{display:"flex"}}>{I.dash}</span> Consolidado
        </button>
        {EMPRESAS.map(emp => (
          <button key={emp.id} onClick={()=>setEmpresaFiltro(emp.id)}
            style={{padding:"10px 18px",borderRadius:10,border:`1.5px solid ${empresaFiltro===emp.id?emp.cor:"rgba(113,63,42,0.18)"}`,background:empresaFiltro===emp.id?`${emp.cor}14`:"white",color:empresaFiltro===emp.id?emp.cor:"#888",fontSize:12,fontWeight:empresaFiltro===emp.id?700:400,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:22,height:22,borderRadius:6,background:emp.cor,color:"white",display:"grid",placeItems:"center",fontSize:10,fontWeight:700,fontFamily:FT}}>{emp.sigla}</div>
            {emp.nome}
          </button>
        ))}
      </div>

      {/* Controles */}
      <div style={{background:"white",borderRadius:14,padding:"18px 22px",border:"1px solid rgba(113,63,42,0.10)",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center",gap:20}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={()=>navegarMes(-1)} style={{background:"none",border:"1px solid rgba(113,63,42,0.18)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>←</button>
          <div style={{fontFamily:FT,fontSize:20,fontWeight:300,color:"#1a1a1a"}}>{meses[periodo.mes]} <em style={{color:corEmp,fontStyle:"italic"}}>{periodo.ano}</em></div>
          <button onClick={()=>navegarMes(1)} style={{background:"none",border:"1px solid rgba(113,63,42,0.18)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>→</button>
        </div>
        <div style={{display:"flex",background:"#FAF8F3",padding:4,borderRadius:8,gap:2}}>
          {[{id:'caixa',label:'Regime de Caixa'},{id:'competencia',label:'Regime de Competência'}].map(t => (
            <button key={t.id} onClick={()=>setRegime(t.id)}
              style={{padding:"7px 14px",borderRadius:6,fontSize:11,fontWeight:regime===t.id?700:400,background:regime===t.id?ASSESS.primary:"transparent",color:regime===t.id?"white":"#888",border:"none",cursor:"pointer"}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* DRE Estruturada */}
      <div style={{background:"white",borderRadius:14,border:"1px solid rgba(113,63,42,0.10)",overflow:"hidden"}}>
        <div style={{padding:"20px 28px",borderBottom:"1px solid rgba(113,63,42,0.10)",background:`linear-gradient(135deg, ${corEmp}, ${corEmp}dd)`,color:"white"}}>
          <div style={{fontSize:10,letterSpacing:3,opacity:.8,marginBottom:6}}>DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO</div>
          <div style={{fontFamily:FT,fontSize:24,fontWeight:300}}>{tituloEmp}</div>
          <div style={{fontSize:12,opacity:.7,marginTop:4}}>{meses[periodo.mes]} de {periodo.ano} · {regime === 'caixa' ? 'Regime de Caixa' : 'Regime de Competência'}</div>
        </div>

        <div style={{padding:"24px 28px"}}>
          <DRELinha label="(=) RECEITA BRUTA" valor={receitaBruta} bold size="lg"/>
          {Object.entries(PLANO_CONTAS.receita.grupos).map(([catId, nome]) => {
            const v = totalCategoria(catId);
            if (v === 0) return null;
            return <DRELinha key={catId} label={nome} valor={v} indent/>;
          })}

          <DRELinha label="(–) Deduções da Receita" valor={-deducoes} negativo/>
          {Object.entries(PLANO_CONTAS.deducoes.grupos).map(([catId, nome]) => {
            const v = totalCategoria(catId);
            if (v === 0) return null;
            return <DRELinha key={catId} label={nome} valor={-v} indent negativo/>;
          })}

          <DRELinha label="(=) RECEITA LÍQUIDA" valor={receitaLiquida} bold separador/>

          <DRELinha label="(–) Custos dos Serviços" valor={-custos} negativo/>
          {Object.entries(PLANO_CONTAS.custos.grupos).map(([catId, nome]) => {
            const v = totalCategoria(catId);
            if (v === 0) return null;
            return <DRELinha key={catId} label={nome} valor={-v} indent negativo/>;
          })}

          <DRELinha label="(=) LUCRO BRUTO" valor={lucroBruto} bold separador/>

          <DRELinha label="(–) Despesas Operacionais" valor={-despesas} negativo/>
          {Object.entries(PLANO_CONTAS.despesas.grupos).map(([catId, nome]) => {
            const v = totalCategoria(catId);
            if (v === 0) return null;
            return <DRELinha key={catId} label={nome} valor={-v} indent negativo/>;
          })}

          <DRELinha label="(=) EBITDA" valor={ebitda} bold separador/>
          <div style={{padding:"6px 0",fontSize:10,color:"#aaa",fontStyle:"italic"}}>Margem EBITDA: {receitaLiquida > 0 ? ((ebitda/receitaLiquida)*100).toFixed(1) : 0}%</div>

          <DRELinha label="(±) Resultado Financeiro" valor={resultadoFinanceiro}/>
          {totalCategoria('fin_receitas') > 0 && <DRELinha label="(+) Receitas Financeiras" valor={totalCategoria('fin_receitas')} indent/>}
          {totalCategoria('fin_despesas') > 0 && <DRELinha label="(–) Despesas Financeiras" valor={-totalCategoria('fin_despesas')} indent negativo/>}

          <DRELinha label="(=) LUCRO ANTES DO IR (LAIR)" valor={lair} bold separador/>

          <DRELinha label="(–) Tributos sobre o Lucro" valor={-tributos} negativo/>
          {Object.entries(PLANO_CONTAS.tributos.grupos).map(([catId, nome]) => {
            const v = totalCategoria(catId);
            if (v === 0) return null;
            return <DRELinha key={catId} label={nome} valor={-v} indent negativo/>;
          })}

          <div style={{marginTop:14,padding:"18px 22px",background:lucroLiquido >= 0 ? "linear-gradient(135deg,#dcfce7,#86efac)" : "linear-gradient(135deg,#fee2e2,#fecaca)",borderRadius:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:10,letterSpacing:3,fontWeight:700,color:lucroLiquido >= 0 ? "#16a34a" : "#dc2626",textTransform:"uppercase"}}>Lucro Líquido do Exercício</div>
              <div style={{fontSize:11,color:"#888",marginTop:2}}>Margem líquida: {receitaLiquida > 0 ? ((lucroLiquido/receitaLiquida)*100).toFixed(1) : 0}%</div>
            </div>
            <div style={{fontFamily:FT,fontSize:30,fontWeight:300,color:lucroLiquido >= 0 ? "#16a34a" : "#dc2626"}}>{fmtRD(lucroLiquido)}</div>
          </div>
        </div>
      </div>

      {/* Comparativo entre empresas (apenas no consolidado) */}
      {empresaFiltro === 'todas' && (
        <div style={{marginTop:24}}>
          <SectionTitle label="Comparativo por Empresa"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
            {EMPRESAS.map(emp => {
              const contasEmp = dados.contas.filter(c => c.empresaId === emp.id && (regime === 'caixa' ? (c.status === 'pago' || c.status === 'recebido') && filtrarPeriodo(c, 'caixa') : filtrarPeriodo(c, 'competencia')));
              const recEmp = contasEmp.filter(c => c.tipo === 'receber').reduce((s,c) => s+c.valor, 0);
              const despEmp = contasEmp.filter(c => c.tipo === 'pagar').reduce((s,c) => s+c.valor, 0);
              const resEmp = recEmp - despEmp;
              return (
                <div key={emp.id} style={{background:"white",borderRadius:12,padding:"18px 20px",border:"1px solid rgba(113,63,42,0.10)",borderTop:`3px solid ${emp.cor}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                    <div style={{width:32,height:32,borderRadius:8,background:emp.cor,color:"white",display:"grid",placeItems:"center",fontSize:11,fontWeight:700,fontFamily:FT}}>{emp.sigla}</div>
                    <div style={{fontFamily:FT,fontSize:15,fontWeight:500,color:"#1a1a1a",lineHeight:1.2}}>{emp.nome}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8,fontSize:12}}>
                    <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"#888"}}>Receitas</span><strong style={{color:"#2e8a4e"}}>{fmtR(recEmp)}</strong></div>
                    <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"#888"}}>Despesas</span><strong style={{color:"#b71c1c"}}>{fmtR(despEmp)}</strong></div>
                    <div style={{display:"flex",justifyContent:"space-between",paddingTop:8,borderTop:"1px solid #f5f0e8"}}>
                      <span style={{color:"#1a1a1a",fontWeight:600}}>Resultado</span>
                      <strong style={{color:resEmp>=0?"#2e8a4e":"#b71c1c",fontFamily:FT,fontSize:15}}>{fmtR(resEmp)}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{marginTop:14,fontSize:11,color:"#888",fontStyle:"italic",padding:"0 8px"}}>
        💡 <strong>Regime de Caixa</strong>: considera apenas movimentações efetivamente pagas/recebidas no período. <strong>Regime de Competência</strong>: considera todas as contas com vencimento no período, independente do pagamento.
      </div>
    </div>
  );
}

function DRELinha({ label, valor, bold, indent, negativo, separador, size = 'md' }) {
  const fontSize = size === 'lg' ? 14 : indent ? 12 : 13;
  return (
    <div style={{display:"flex",justifyContent:"space-between",padding:`${bold?10:6}px 0`,paddingLeft: indent ? 24 : 0,borderTop: separador ? `2px solid ${ASSESS.primary}30` : "none",marginTop: separador ? 6 : 0}}>
      <span style={{fontSize,fontWeight:bold ? 700 : indent ? 400 : 500, color: indent ? "#888" : "#1a1a1a", letterSpacing: bold ? .3 : 0}}>{label}</span>
      <span style={{fontFamily:FT, fontSize: bold ? fontSize+3 : fontSize+1, fontWeight: bold ? 500 : 400, color: negativo ? "#b71c1c" : valor < 0 ? "#b71c1c" : indent ? "#666" : "#1a1a1a"}}>{fmtRD(valor)}</span>
    </div>
  );
}

// ── FORNECEDORES ──────────────────────────────────────────────────────────────
function Fornecedores({ dados, onAdicionar, onEditar, onRemover }) {
  const [busca, setBusca] = useState('');
  const fornecedores = (dados.fornecedores||[]).filter(f =>
    !busca || f.nome.toLowerCase().includes(busca.toLowerCase()) || f.cnpj?.includes(busca)
  );

  // Calcula gasto por fornecedor
  const gastoPorFornecedor = (forn) => {
    return dados.contas
      .filter(c => c.tipo === 'pagar' && (c.fornecedorId === forn.id || c.fornecedor === forn.nome))
      .reduce((acc, c) => {
        if (c.status === 'pago') acc.pago += c.valor;
        else acc.pendente += c.valor;
        acc.total += c.valor;
        acc.contas.push(c);
        return acc;
      }, { pago: 0, pendente: 0, total: 0, contas: [] });
  };

  const totalGasto = (dados.fornecedores||[]).reduce((s,f) => s + gastoPorFornecedor(f).total, 0);

  return (
    <div style={{padding:"36px 48px 60px",maxWidth:1280,margin:"0 auto"}}>
      <PageHeader
        etiqueta="Cadastros"
        titulo="Gestão de"
        destaque="fornecedores"
        sub={`${(dados.fornecedores||[]).length} fornecedores · ${fmtMM(totalGasto)} em gastos consolidados`}
        action={<Btn icon={I.plus} onClick={onAdicionar}>Novo Fornecedor</Btn>}
      />

      <div style={{display:"flex",gap:8,marginBottom:16,alignItems:"center"}}>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:10,padding:"0 14px",border:"1px solid rgba(113,63,42,0.18)",borderRadius:8,height:38,background:"#FAF8F3"}}>
          <span style={{color:"#888",display:"flex"}}>{I.search}</span>
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar por nome ou CNPJ..." style={{border:"none",background:"transparent",outline:"none",flex:1,fontSize:13,fontFamily:SN}}/>
        </div>
      </div>

      {/* Cards de fornecedores com gasto */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(380px, 1fr))",gap:14}}>
        {fornecedores.map(f => {
          const gasto = gastoPorFornecedor(f);
          const cat = TODAS_CONTAS.find(x => x.id === f.categoria);
          return (
            <div key={f.id} style={{background:"white",borderRadius:14,padding:"22px 24px",border:"1px solid rgba(113,63,42,0.10)",borderLeft:`4px solid ${ASSESS.primary}`,display:"flex",flexDirection:"column",gap:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                <div style={{display:"flex",alignItems:"center",gap:14,flex:1,minWidth:0}}>
                  <div style={{width:42,height:42,borderRadius:10,background:`${ASSESS.primary}14`,color:ASSESS.primary,display:"grid",placeItems:"center",flexShrink:0}}>{I.building}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:FT,fontSize:17,fontWeight:500,color:"#1a1a1a",lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{f.nome}</div>
                    {f.cnpj && <div style={{fontSize:11,color:"#888",fontFamily:"monospace",marginTop:2}}>{f.cnpj}</div>}
                  </div>
                </div>
                <button onClick={() => onEditar(f)} style={{background:"none",border:"none",color:"#aaa",cursor:"pointer",display:"flex",padding:6}}>{I.edit}</button>
              </div>

              {cat && (
                <div style={{fontSize:11,padding:"4px 10px",borderRadius:99,background:`${ASSESS.primary}10`,color:ASSESS.primary,fontWeight:600,letterSpacing:.5,alignSelf:"flex-start"}}>
                  {cat.nome}
                </div>
              )}

              {/* Gasto consolidado */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,padding:"14px 16px",background:"#FAF8F3",borderRadius:10}}>
                <div>
                  <div style={{fontSize:9,letterSpacing:1,color:"#aaa",textTransform:"uppercase",marginBottom:3}}>Total</div>
                  <div style={{fontFamily:FT,fontSize:16,fontWeight:500,color:"#1a1a1a"}}>{fmtMM(gasto.total)}</div>
                </div>
                <div>
                  <div style={{fontSize:9,letterSpacing:1,color:"#aaa",textTransform:"uppercase",marginBottom:3}}>Pago</div>
                  <div style={{fontFamily:FT,fontSize:16,fontWeight:500,color:"#2e8a4e"}}>{fmtMM(gasto.pago)}</div>
                </div>
                <div>
                  <div style={{fontSize:9,letterSpacing:1,color:"#aaa",textTransform:"uppercase",marginBottom:3}}>Pendente</div>
                  <div style={{fontFamily:FT,fontSize:16,fontWeight:500,color:"#f59e0b"}}>{fmtMM(gasto.pendente)}</div>
                </div>
              </div>

              {/* Contato */}
              <div style={{display:"flex",flexDirection:"column",gap:6,fontSize:11,color:"#666"}}>
                {f.contato && <div><span style={{color:"#aaa"}}>Contato:</span> <strong>{f.contato}</strong></div>}
                {f.email && <div><span style={{color:"#aaa"}}>E-mail:</span> {f.email}</div>}
                {f.telefone && <div><span style={{color:"#aaa"}}>Tel:</span> {f.telefone}</div>}
              </div>

              {f.observacoes && (
                <div style={{fontSize:11,color:"#888",fontStyle:"italic",lineHeight:1.5,padding:"10px 12px",background:"#FAF8F3",borderRadius:8}}>
                  "{f.observacoes}"
                </div>
              )}

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11,color:"#aaa",paddingTop:8,borderTop:"1px solid #f5f0e8"}}>
                <span>{gasto.contas.length} contas registradas</span>
                <button onClick={() => { if(confirm(`Remover fornecedor ${f.nome}?`)) onRemover(f.id); }} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",display:"flex",padding:4}}>{I.trash}</button>
              </div>
            </div>
          );
        })}
        {fornecedores.length === 0 && (
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:60,color:"#aaa",fontSize:13,background:"white",borderRadius:14,border:"1px solid rgba(113,63,42,0.10)"}}>Nenhum fornecedor cadastrado</div>
        )}
      </div>
    </div>
  );
}

// ── EXTRATO BANCÁRIO ──────────────────────────────────────────────────────────
function ExtratoBancario({ dados, onImportar, onConciliar, onRemover }) {
  const [importando, setImportando] = useState(false);
  const [confirmacao, setConfirmacao] = useState(null);
  const fileInputRef = React.useRef();

  const extratos = dados.extratos || [];

  // Parse de CSV simples
  const parseCSV = (text) => {
    const linhas = text.split(/\r?\n/).filter(l => l.trim());
    if (linhas.length < 2) return [];
    const header = linhas[0].toLowerCase().split(/[,;\t]/).map(h => h.trim().replace(/"/g, ''));
    const dataIdx = header.findIndex(h => h.includes('data'));
    const descIdx = header.findIndex(h => h.includes('desc') || h.includes('histórico') || h.includes('historic'));
    const valorIdx = header.findIndex(h => h.includes('valor') || h.includes('amount'));

    return linhas.slice(1).map((linha, i) => {
      const cols = linha.split(/[,;\t]/).map(c => c.trim().replace(/"/g, ''));
      const dataStr = cols[dataIdx >= 0 ? dataIdx : 0];
      const desc = cols[descIdx >= 0 ? descIdx : 1];
      const valorStr = cols[valorIdx >= 0 ? valorIdx : 2];

      // Tenta parsear data DD/MM/YYYY ou YYYY-MM-DD
      let data = today;
      if (dataStr) {
        if (dataStr.includes('/')) {
          const [d,m,y] = dataStr.split('/');
          data = `${y.length===2?'20'+y:y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
        } else if (dataStr.includes('-')) {
          data = dataStr.length === 10 ? dataStr : today;
        }
      }

      // Parse valor (positivo = entrada, negativo = saída)
      const valor = parseFloat(valorStr.replace(/\./g,'').replace(',','.').replace(/[^\d.-]/g,'')) || 0;

      return { data, descricao: desc || `Lançamento ${i+1}`, valor, tipo: valor > 0 ? 'credito' : 'debito' };
    }).filter(l => l.valor !== 0);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportando(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lancamentos = parseCSV(text);
      if (lancamentos.length === 0) {
        alert('Nenhum lançamento válido encontrado. Verifique o formato (CSV com colunas Data, Descrição, Valor).');
        setImportando(false);
        return;
      }
      onImportar(lancamentos);
      setImportando(false);
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  // Gera CSV de exemplo
  const downloadExemplo = () => {
    const csv = `Data,Descrição,Valor
01/05/2026,FEE OPERAÇÃO TECHFLOW,27000.00
03/05/2026,PAGAMENTO ALUGUEL,-8500.00
05/05/2026,FOLHA DE PAGAMENTO,-49500.00
10/05/2026,FEE CONSORCIO ROBERTO,18000.00
15/05/2026,CONTABILIDADE,-3200.00`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'extrato_exemplo.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Sugestão de match automático
  const sugerirConta = (extrato) => {
    const tipo = extrato.tipo === 'credito' ? 'receber' : 'pagar';
    const valorAbs = Math.abs(extrato.valor);
    return dados.contas.filter(c =>
      c.tipo === tipo &&
      c.status !== (tipo === 'pagar' ? 'pago' : 'recebido') &&
      Math.abs(c.valor - valorAbs) < 0.01
    );
  };

  const totalCredito = extratos.filter(e => e.tipo === 'credito').reduce((s,e) => s + Math.abs(e.valor), 0);
  const totalDebito = extratos.filter(e => e.tipo === 'debito').reduce((s,e) => s + Math.abs(e.valor), 0);
  const conciliados = extratos.filter(e => e.conciliado).length;

  return (
    <div style={{padding:"36px 48px 60px",maxWidth:1280,margin:"0 auto"}}>
      <PageHeader
        etiqueta="Financeiro"
        titulo="Extrato"
        destaque="bancário"
        sub="Importe o extrato em CSV e concilie automaticamente com as contas a pagar/receber."
        action={
          <div style={{display:"flex",gap:10}}>
            <Btn variant="ghost" onClick={downloadExemplo} icon={I.doc}>Modelo CSV</Btn>
            <Btn icon={I.upload} onClick={()=>fileInputRef.current?.click()} disabled={importando}>{importando ? 'Importando...' : 'Importar Extrato'}</Btn>
            <input ref={fileInputRef} type="file" accept=".csv,.txt" style={{display:"none"}} onChange={handleFile}/>
          </div>
        }
      />

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
        <KpiCard label="Lançamentos" value={extratos.length} sub={`${conciliados} conciliados`} accent={ASSESS.primary}/>
        <KpiCard label="Créditos" value={fmtMM(totalCredito)} sub="entradas" accent="#2e8a4e"/>
        <KpiCard label="Débitos" value={fmtMM(totalDebito)} sub="saídas" accent="#b71c1c"/>
        <KpiCard label="Saldo Período" value={fmtMM(totalCredito - totalDebito)} sub="líquido" accent={SEC}/>
      </div>

      {/* Box de instrução quando vazio */}
      {extratos.length === 0 && (
        <div style={{background:"white",borderRadius:14,padding:48,border:"1px dashed rgba(113,63,42,0.30)",textAlign:"center"}}>
          <div style={{display:"inline-flex",width:60,height:60,borderRadius:14,background:`${ASSESS.primary}14`,color:ASSESS.primary,alignItems:"center",justifyContent:"center",marginBottom:16}}>
            {I.bank}
          </div>
          <div style={{fontFamily:FT,fontSize:22,fontWeight:300,color:"#1a1a1a",marginBottom:8}}>Importe seu extrato bancário</div>
          <div style={{fontSize:13,color:"#888",lineHeight:1.7,maxWidth:480,margin:"0 auto 20px"}}>
            Faça download do extrato em <strong>CSV</strong> direto do internet banking (Itaú, Bradesco, BB, Santander, Nubank etc.) e importe aqui. O sistema identifica automaticamente créditos e débitos e sugere a conciliação com contas pendentes.
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"center"}}>
            <Btn variant="ghost" onClick={downloadExemplo} icon={I.doc}>Baixar modelo CSV</Btn>
            <Btn icon={I.upload} onClick={()=>fileInputRef.current?.click()}>Importar Extrato</Btn>
          </div>
          <div style={{fontSize:11,color:"#aaa",marginTop:18}}>
            💡 O CSV deve ter colunas: <strong>Data, Descrição, Valor</strong>. Valores positivos = entradas, negativos = saídas.
          </div>
        </div>
      )}

      {/* Tabela de extratos */}
      {extratos.length > 0 && (
        <div style={{background:"white",borderRadius:14,border:"1px solid rgba(113,63,42,0.10)",overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr style={{background:"#FAF8F3",borderBottom:"1px solid rgba(113,63,42,0.10)"}}>
                {["Data","Descrição","Tipo","Valor","Status","Ação",""].map(h => (
                  <th key={h} style={{textAlign:"left",padding:"12px 16px",fontSize:10,letterSpacing:2,fontWeight:600,color:"#888",textTransform:"uppercase"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {extratos.sort((a,b)=>b.data.localeCompare(a.data)).map(ext => {
                const sugestoes = !ext.conciliado ? sugerirConta(ext) : [];
                const contaConciliada = ext.contaId ? dados.contas.find(c => c.id === ext.contaId) : null;
                return (
                  <tr key={ext.id} style={{borderBottom:"1px solid #f5f0e8",background:ext.conciliado?"#f0fdf4":"white"}}>
                    <td style={{padding:"14px 16px",fontSize:12,color:"#666"}}>{fmtDate(ext.data)}</td>
                    <td style={{padding:"14px 16px"}}>
                      <div style={{fontWeight:600,color:"#1a1a1a",fontSize:12}}>{ext.descricao}</div>
                      {contaConciliada && <div style={{fontSize:10,color:"#2e8a4e",marginTop:2}}>↗ Conciliado com: {contaConciliada.descricao}</div>}
                    </td>
                    <td style={{padding:"14px 16px"}}>
                      <span style={{fontSize:10,padding:"3px 10px",borderRadius:99,fontWeight:600,letterSpacing:.5,background:ext.tipo==='credito'?'#dcfce7':'#fee2e2',color:ext.tipo==='credito'?'#2e8a4e':'#b71c1c'}}>
                        {ext.tipo === 'credito' ? '↓ ENTRADA' : '↑ SAÍDA'}
                      </span>
                    </td>
                    <td style={{padding:"14px 16px",fontFamily:FT,fontSize:15,fontWeight:500,color:ext.tipo==='credito'?'#2e8a4e':'#b71c1c'}}>{fmtR(Math.abs(ext.valor))}</td>
                    <td style={{padding:"14px 16px"}}>
                      {ext.conciliado ? (
                        <span style={{fontSize:10,padding:"3px 10px",borderRadius:99,background:"#dcfce7",color:"#2e8a4e",fontWeight:600}}>✓ Conciliado</span>
                      ) : (
                        <span style={{fontSize:10,padding:"3px 10px",borderRadius:99,background:"#fef3c7",color:"#f59e0b",fontWeight:600}}>Pendente</span>
                      )}
                    </td>
                    <td style={{padding:"14px 16px"}}>
                      {!ext.conciliado && sugestoes.length > 0 && (
                        <select onChange={(e) => { if(e.target.value) onConciliar(ext.id, Number(e.target.value)); }}
                          style={{padding:"4px 10px",fontSize:11,border:`1px solid ${ASSESS.primary}40`,borderRadius:6,background:`${ASSESS.primary}08`,color:ASSESS.primary,cursor:"pointer",fontFamily:SN,minWidth:200}}>
                          <option value="">Conciliar com...</option>
                          {sugestoes.map(c => <option key={c.id} value={c.id}>{c.descricao} ({fmtR(c.valor)})</option>)}
                        </select>
                      )}
                      {!ext.conciliado && sugestoes.length === 0 && (
                        <span style={{fontSize:11,color:"#aaa"}}>Sem match automático</span>
                      )}
                    </td>
                    <td style={{padding:"14px 16px",textAlign:"right"}}>
                      <button onClick={() => onRemover(ext.id)} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",display:"inline-flex",padding:6}}>{I.trash}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
const lblStyle = {fontSize:10,letterSpacing:2,textTransform:"uppercase",color:ASSESS.primary,fontWeight:600,display:"block",marginBottom:6};

// ── MODAIS ────────────────────────────────────────────────────────────────────
const inpStyle = {width:"100%",padding:"10px 14px",border:"1px solid rgba(113,63,42,0.22)",borderRadius:8,fontSize:13,fontFamily:SN,background:"#EFE9E0",outline:"none",boxSizing:"border-box"};

function Modal({ titulo, children, onFechar, large }) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:5000,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:SN,padding:20}}>
      <div style={{background:"white",borderRadius:18,width:"100%",maxWidth:large ? 640 : 480,boxShadow:"0 40px 80px -30px rgba(0,0,0,.4)",overflow:"hidden",maxHeight:"90vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"22px 28px",borderBottom:"1px solid rgba(113,63,42,0.10)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontFamily:FT,fontWeight:300,fontSize:22,color:"#1a1a1a"}}>{titulo}</div>
          <button onClick={onFechar} style={{background:"none",border:"none",color:"#aaa",cursor:"pointer",display:"flex",padding:0}}>{I.x}</button>
        </div>
        <div style={{padding:"24px 28px",overflowY:"auto"}}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div style={{marginBottom:14}}><label style={lblStyle}>{label}</label>{children}</div>;
}

function SubmitBtn({ children, onClick, disabled }) {
  const busy = React.useRef(false);
  const handleClick = () => {
    if (busy.current || disabled) return;
    busy.current = true;
    onClick();
    setTimeout(() => { busy.current = false; }, 800);
  };
  return (
    <button onClick={handleClick} disabled={disabled} style={{width:"100%",height:44,marginTop:8,borderRadius:10,border:"none",background:ASSESS.primary,color:"white",fontSize:12,fontWeight:500,letterSpacing:1,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,boxShadow:disabled?"none":`0 12px 28px -12px ${ASSESS.primary}88`,textTransform:"uppercase"}}>
      {children}
    </button>
  );
}

function ModalContato({ onSalvar, onFechar, initial = null, titulo = 'Novo Contato' }) {
  const [tipo, setTipo] = useState(initial?.tipo || 'PF');
  const [area, setArea] = useState(initial?.area || 'varejo');
  const [nome, setNome] = useState(initial?.nome || '');
  const [documento, setDocumento] = useState(initial?.documento || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [telefone, setTelefone] = useState(initial?.telefone || '');
  const [cidade, setCidade] = useState(initial?.cidade || '');
  const [endereco, setEndereco] = useState(initial?.endereco || '');
  const [cargo, setCargo] = useState(initial?.cargo || '');
  const [responsavel, setResponsavel] = useState(initial?.responsavel || '');
  const [origem, setOrigem] = useState(initial?.origem || '');
  const [faturamento, setFaturamento] = useState(initial?.faturamento ? String(initial.faturamento) : '');
  const [tempoEmpresa, setTempoEmpresa] = useState(initial?.tempoEmpresa ? String(initial.tempoEmpresa) : '');
  const [observacoes, setObservacoes] = useState(initial?.observacoes || '');
  const [buscandoCNPJ, setBuscandoCNPJ] = useState(false);
  const [erroCNPJ, setErroCNPJ] = useState('');

  const buscarCNPJ = async () => {
    const cnpjLimpo = documento.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) {
      setErroCNPJ('CNPJ deve ter 14 dígitos');
      return;
    }
    setBuscandoCNPJ(true);
    setErroCNPJ('');
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      if (!res.ok) {
        setErroCNPJ(res.status === 404 ? 'CNPJ não encontrado' : 'Erro ao consultar');
        setBuscandoCNPJ(false);
        return;
      }
      const data = await res.json();
      setNome(data.razao_social || data.nome_fantasia || '');
      setCidade(data.municipio || '');
      const enderecoMontado = [data.logradouro, data.numero, data.complemento, data.bairro].filter(Boolean).join(', ');
      setEndereco(enderecoMontado);
      if (data.ddd_telefone_1) setTelefone(data.ddd_telefone_1);
      if (data.email) setEmail(data.email);
      const formatado = cnpjLimpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
      setDocumento(formatado);
      // Calcula tempo de empresa pela data de abertura
      if (data.data_inicio_atividade) {
        const anos = Math.floor((new Date() - new Date(data.data_inicio_atividade)) / (1000*60*60*24*365));
        setTempoEmpresa(String(anos));
      }
      setObservacoes(prev => prev || `${data.cnae_fiscal_descricao || ''}${data.descricao_situacao_cadastral ? ` · Situação: ${data.descricao_situacao_cadastral}` : ''}`);
    } catch (e) {
      setErroCNPJ('Falha na conexão');
    }
    setBuscandoCNPJ(false);
  };

  const submit = () => {
    if (!nome.trim()) return alert('Nome é obrigatório');
    onSalvar({ tipo, area, nome, documento, email, telefone, cidade, endereco, cargo, responsavel, origem, faturamento: Number(faturamento)||0, tempoEmpresa: Number(tempoEmpresa)||0, observacoes });
  };

  return (
    <Modal titulo={titulo} onFechar={onFechar} large>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <div>
          <label style={lblStyle}>Tipo</label>
          <div style={{display:"flex",gap:8}}>
            {['PF','PJ'].map(t => (
              <button key={t} onClick={() => setTipo(t)} style={{flex:1,padding:"10px",borderRadius:8,border:`1.5px solid ${tipo===t?ASSESS.primary:"rgba(113,63,42,0.18)"}`,background:tipo===t?`${ASSESS.primary}14`:"white",color:tipo===t?ASSESS.primary:"#888",fontSize:12,fontWeight:tipo===t?700:400,cursor:"pointer"}}>
                {t === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={lblStyle}>Área</label>
          <div style={{display:"flex",gap:8}}>
            {[{v:'varejo',l:'Varejo',c:VAREJO.primary},{v:'atacado',l:'Atacado',c:ASSESS.primary}].map(a => (
              <button key={a.v} onClick={() => setArea(a.v)} style={{flex:1,padding:"10px",borderRadius:8,border:`1.5px solid ${area===a.v?a.c:"rgba(113,63,42,0.18)"}`,background:area===a.v?`${a.c}14`:"white",color:area===a.v?a.c:"#888",fontSize:12,fontWeight:area===a.v?700:400,cursor:"pointer"}}>
                {a.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CNPJ com busca automática (apenas PJ) */}
      {tipo === 'PJ' ? (
        <Field label="CNPJ (busca automática via Receita Federal)">
          <div style={{display:"flex",gap:8}}>
            <input style={{...inpStyle,flex:1}} value={documento} onChange={e=>setDocumento(e.target.value)} placeholder="00.000.000/0001-00"/>
            <button onClick={buscarCNPJ} disabled={buscandoCNPJ || !documento} style={{
              padding:"10px 18px",background:ASSESS.primary,color:"white",border:"none",borderRadius:8,
              cursor:buscandoCNPJ||!documento?"not-allowed":"pointer",fontSize:12,fontWeight:600,
              opacity:buscandoCNPJ||!documento?.5:1,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:8,
            }}>
              {buscandoCNPJ ? 'Buscando...' : <>{I.search} Buscar</>}
            </button>
          </div>
          {erroCNPJ && <div style={{fontSize:11,color:"#b71c1c",marginTop:6,padding:"4px 10px",background:"#fee2e2",borderRadius:6}}>⚠ {erroCNPJ}</div>}
          {!erroCNPJ && !buscandoCNPJ && nome && documento.includes('/') && (
            <div style={{fontSize:11,color:"#2e8a4e",marginTop:6,padding:"4px 10px",background:"#dcfce7",borderRadius:6}}>✓ Dados preenchidos automaticamente</div>
          )}
        </Field>
      ) : (
        <Field label="CPF">
          <input style={inpStyle} value={documento} onChange={e=>setDocumento(e.target.value)} placeholder="000.000.000-00"/>
        </Field>
      )}

      <Field label={tipo === 'PF' ? 'Nome completo' : 'Razão social'}>
        <input style={inpStyle} value={nome} onChange={e=>setNome(e.target.value)}/>
      </Field>

      <Field label={tipo === 'PJ' ? 'Cargo do contato' : 'Profissão'}>
        <input style={inpStyle} value={cargo} onChange={e=>setCargo(e.target.value)} placeholder={tipo === 'PJ' ? 'Ex: CFO' : 'Ex: Médico'}/>
      </Field>

      {tipo === 'PJ' && (
        <Field label="Responsável pelo contato">
          <input style={inpStyle} value={responsavel} onChange={e=>setResponsavel(e.target.value)} placeholder="Nome da pessoa que conduz a operação"/>
        </Field>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field label="E-mail"><input style={inpStyle} type="email" value={email} onChange={e=>setEmail(e.target.value)}/></Field>
        <Field label="Telefone (DDI+DDD)"><input style={inpStyle} value={telefone} onChange={e=>setTelefone(e.target.value)} placeholder="5544991147236"/></Field>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:14}}>
        <Field label="Cidade"><input style={inpStyle} value={cidade} onChange={e=>setCidade(e.target.value)}/></Field>
        <Field label="Endereço"><input style={inpStyle} value={endereco} onChange={e=>setEndereco(e.target.value)}/></Field>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
        <Field label="Origem do Lead">
          <select style={inpStyle} value={origem} onChange={e=>setOrigem(e.target.value)}>
            <option value="">—</option>
            <option value="indicacao">Indicação</option>
            <option value="mídia paga">Mídia Paga</option>
            <option value="site">Site</option>
            <option value="parceiro">Parceiro</option>
            <option value="evento">Evento</option>
            <option value="outbound">Outbound</option>
            <option value="outro">Outro</option>
          </select>
        </Field>
        <Field label={tipo === 'PJ' ? 'Faturamento Anual' : 'Renda Anual'}>
          <input style={inpStyle} type="number" value={faturamento} onChange={e=>setFaturamento(e.target.value)} placeholder="R$"/>
        </Field>
        {tipo === 'PJ' && (
          <Field label="Tempo de Empresa (anos)">
            <input style={inpStyle} type="number" value={tempoEmpresa} onChange={e=>setTempoEmpresa(e.target.value)}/>
          </Field>
        )}
      </div>

      <Field label="Observações">
        <textarea style={{...inpStyle, minHeight:80, fontFamily:SN, lineHeight:1.6, resize:'vertical'}} value={observacoes} onChange={e=>setObservacoes(e.target.value)} placeholder="Contexto adicional, histórico, perfil..."/>
      </Field>

      <SubmitBtn onClick={submit}>{initial ? 'Salvar alterações' : 'Salvar contato'}</SubmitBtn>
    </Modal>
  );
}

function ModalNegocio({ dados, defaultConsultorId, onSalvar, onFechar }) {
  const [titulo, setTitulo] = useState('');
  const [valor, setValor] = useState('');
  const [probabilidade, setProbabilidade] = useState(20);
  const [fechamento, setFechamento] = useState('');
  const [consultorId, setConsultorId] = useState(defaultConsultorId ?? dados.funcionarios[0]?.id ?? '');

  // Contato: busca ou criação inline
  const [busca, setBusca] = useState('');
  const [contatoId, setContatoId] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [criandoContato, setCriandoContato] = useState(false);
  const [ncNome, setNcNome] = useState('');
  const [ncTipo, setNcTipo] = useState('PF');
  const [ncArea, setNcArea] = useState('varejo');

  const contatoSelecionado = dados.contatos.find(c => c.id === Number(contatoId));
  const areaAtiva = criandoContato ? ncArea : (contatoSelecionado?.area || 'varejo');
  const produtosDisponiveis = PRODUTOS_POR_AREA[areaAtiva] || PRODUTOS_POR_AREA.varejo;
  const [produto, setProduto] = useState(produtosDisponiveis[0]);

  const stagesDisponiveis = areaAtiva === 'varejo' ? PIPE_VAREJO : PIPE_ATACADO;
  const [etapa, setEtapa] = useState(stagesDisponiveis[0].id);

  // Sincroniza produto e etapa quando área muda
  useEffect(() => {
    const lista = PRODUTOS_POR_AREA[areaAtiva] || PRODUTOS_POR_AREA.varejo;
    if (!lista.includes(produto)) setProduto(lista[0]);
    setEtapa((areaAtiva === 'varejo' ? PIPE_VAREJO : PIPE_ATACADO)[0].id);
  }, [areaAtiva]);

  const prodInfo = PRODUTOS_COMISSAO[produto];
  const pctConsultor = prodInfo ? (prodInfo.comConsultor ?? prodInfo.com * 0.5) : 0;
  const comissaoEstimada = valor && pctConsultor ? Number(valor) * pctConsultor / 100 : 0;

  const contatosFiltrados = dados.contatos.filter(c =>
    busca.length > 0 && c.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const selecionarContato = (c) => {
    setContatoId(c.id);
    setBusca(c.nome);
    setShowDropdown(false);
    setCriandoContato(false);
  };

  const iniciarCriacao = () => {
    setNcNome(busca);
    setCriandoContato(true);
    setShowDropdown(false);
    setContatoId('');
  };

  const cancelarCriacao = () => {
    setCriandoContato(false);
    setBusca('');
    setContatoId('');
  };

  const submit = () => {
    if (!titulo.trim()) return alert('Título obrigatório');
    if (!valor) return alert('Valor obrigatório');
    if (criandoContato) {
      if (!ncNome.trim()) return alert('Nome do contato obrigatório');
      const novoContato = { nome: ncNome.trim(), tipo: ncTipo, area: ncArea, telefone: '', email: '', cargo: '', empresa: '' };
      onSalvar({ titulo, contatoId: null, produto, valor: Number(valor), etapa, probabilidade: Number(probabilidade), fechamento: fechamento || addDays(today, 30), consultorId: Number(consultorId) }, novoContato);
    } else {
      if (!contatoId) return alert('Selecione ou crie um contato');
      onSalvar({ titulo, contatoId: Number(contatoId), produto, valor: Number(valor), etapa, probabilidade: Number(probabilidade), fechamento: fechamento || addDays(today, 30), consultorId: Number(consultorId) }, null);
    }
  };

  return (
    <Modal titulo="Novo Negócio" onFechar={onFechar}>
      <Field label="Título">
        <input style={inpStyle} value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Ex: Consórcio Imobiliário - João Silva"/>
      </Field>

      <Field label="Contato">
        {criandoContato ? (
          <div style={{border:`1px solid ${SEC}60`,borderRadius:10,padding:"14px 16px",background:`${SEC}0a`,marginBottom:4}}>
            <div style={{fontSize:11,fontWeight:700,color:ASSESS.primary,marginBottom:10,letterSpacing:.5}}>NOVO CONTATO</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr",gap:8}}>
              <input style={inpStyle} value={ncNome} onChange={e=>setNcNome(e.target.value)} placeholder="Nome completo *"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <select style={inpStyle} value={ncTipo} onChange={e=>setNcTipo(e.target.value)}>
                  <option value="PF">Pessoa Física</option>
                  <option value="PJ">Pessoa Jurídica</option>
                </select>
                <select style={inpStyle} value={ncArea} onChange={e=>setNcArea(e.target.value)}>
                  <option value="varejo">Varejo</option>
                  <option value="atacado">Atacado</option>
                </select>
              </div>
            </div>
            <button onClick={cancelarCriacao} style={{marginTop:10,fontSize:11,color:"#999",background:"none",border:"none",cursor:"pointer",padding:0}}>
              ← Buscar contato existente
            </button>
          </div>
        ) : (
          <div style={{position:"relative"}}>
            <input
              style={{...inpStyle, paddingRight:36}}
              value={busca}
              onChange={e => { setBusca(e.target.value); setContatoId(''); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="Buscar contato existente..."
            />
            {contatoId && (
              <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:12,color:areaAtiva==='varejo'?VAREJO.primary:ASSESS.primary,fontWeight:700}}>
                {areaAtiva === 'varejo' ? 'Varejo' : 'Atacado'}
              </span>
            )}
            {showDropdown && busca.length > 0 && (
              <div style={{position:"absolute",top:"100%",left:0,right:0,background:"white",border:`1px solid ${SEC}50`,borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,.10)",zIndex:100,maxHeight:200,overflowY:"auto",marginTop:2}}>
                {contatosFiltrados.map(c => (
                  <div key={c.id} onMouseDown={()=>selecionarContato(c)} style={{padding:"9px 14px",cursor:"pointer",fontSize:13,borderBottom:`1px solid #F5F0E8`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span>{c.nome}</span>
                    <span style={{fontSize:11,color:"#aaa"}}>{c.tipo} · {c.area}</span>
                  </div>
                ))}
                <div onMouseDown={iniciarCriacao} style={{padding:"9px 14px",cursor:"pointer",fontSize:13,color:ASSESS.primary,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
                  <span>+</span> Criar "{busca}" como novo contato
                </div>
              </div>
            )}
            {!contatoId && busca.length === 0 && (
              <button onClick={iniciarCriacao} style={{marginTop:6,fontSize:11,color:ASSESS.primary,background:"none",border:"none",cursor:"pointer",padding:0,fontWeight:600}}>
                + Criar novo contato
              </button>
            )}
          </div>
        )}
      </Field>

      {!defaultConsultorId && (
        <Field label="Consultor responsável">
          <select style={inpStyle} value={consultorId} onChange={e=>setConsultorId(e.target.value)}>
            {dados.funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome} · {f.cargo}</option>)}
          </select>
        </Field>
      )}

      <Field label="Produto">
        <select style={inpStyle} value={produto} onChange={e=>setProduto(e.target.value)}>
          {produtosDisponiveis.map(p => {
            const pi = PRODUTOS_COMISSAO[p];
            const label = pi.comConsultor ? `${p} (${pi.comConsultor}% consultor)` : `${p} (${pi.com}%)`;
            return <option key={p} value={p}>{label}</option>;
          })}
        </select>
      </Field>

      <Field label="Valor (R$)">
        <input style={inpStyle} type="number" value={valor} onChange={e=>setValor(e.target.value)} placeholder="0"/>
      </Field>

      {comissaoEstimada > 0 && (
        <div style={{padding:"10px 14px",background:`${SEC}18`,border:`1px solid ${SEC}40`,borderRadius:8,marginBottom:14,fontSize:12,color:"#8B6340"}}>
          Comissão do consultor estimada: <strong>{fmtR(comissaoEstimada)}</strong> ({pctConsultor}% sobre {fmtR(Number(valor))})
          {prodInfo?.escritorioManual && <span style={{display:"block",marginTop:3,color:"#aaa",fontSize:11}}>Fee do escritório: lançamento manual</span>}
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="Etapa">
          <select style={inpStyle} value={etapa} onChange={e=>setEtapa(e.target.value)}>
            {stagesDisponiveis.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Probabilidade %">
          <input style={inpStyle} type="number" min="0" max="100" value={probabilidade} onChange={e=>setProbabilidade(e.target.value)}/>
        </Field>
      </div>

      <Field label="Previsão de Fechamento">
        <input style={inpStyle} type="date" value={fechamento} onChange={e=>setFechamento(e.target.value)}/>
      </Field>

      <SubmitBtn onClick={submit}>Salvar negócio</SubmitBtn>
    </Modal>
  );
}

function ModalAtividade({ negocios, contatos, onSalvar, onFechar }) {
  const [tipo, setTipo] = useState('ligacao');
  const [titulo, setTitulo] = useState('');
  const [negocioId, setNegocioId] = useState(negocios[0]?.id || '');
  const [data, setData] = useState(today);

  const submit = () => {
    if (!titulo.trim()) return alert('Título obrigatório');
    if (!negocioId) return alert('Selecione um negócio');
    onSalvar({ tipo, titulo, negocioId: Number(negocioId), data });
  };

  return (
    <Modal titulo="Nova Atividade" onFechar={onFechar}>
      <Field label="Tipo">
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {[{id:'ligacao',l:'Ligação',ic:I.phone},{id:'reuniao',l:'Reunião',ic:I.cal},{id:'email',l:'E-mail',ic:I.mail}].map(t => (
            <button key={t.id} onClick={() => setTipo(t.id)} style={{padding:"12px 8px",borderRadius:8,border:`1.5px solid ${tipo===t.id?ASSESS.primary:"rgba(113,63,42,0.18)"}`,background:tipo===t.id?`${ASSESS.primary}14`:"white",color:tipo===t.id?ASSESS.primary:"#888",fontSize:11,fontWeight:tipo===t.id?700:400,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              {t.ic} {t.l}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Descrição"><input style={inpStyle} value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Ex: Follow-up proposta"/></Field>
      <Field label="Negócio">
        <select style={inpStyle} value={negocioId} onChange={e=>setNegocioId(e.target.value)}>
          {negocios.map(n => {
            const c = contatos.find(x => x.id === n.contatoId);
            return <option key={n.id} value={n.id}>{n.titulo} ({c?.nome})</option>;
          })}
        </select>
      </Field>
      <Field label="Data"><input style={inpStyle} type="date" value={data} onChange={e=>setData(e.target.value)}/></Field>
      <SubmitBtn onClick={submit}>Salvar atividade</SubmitBtn>
    </Modal>
  );
}

function ModalFuncionario({ onSalvar, onFechar }) {
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [salario, setSalario] = useState('');
  const [tipo, setTipo] = useState('clt');
  const [dataAdmissao, setDataAdmissao] = useState(today);

  const submit = () => {
    if (!nome || !cargo) return alert('Nome e cargo são obrigatórios');
    onSalvar({ nome, cargo, email, telefone, cpf, salario: Number(salario)||0, tipo, dataAdmissao });
  };

  return (
    <Modal titulo="Novo Colaborador" onFechar={onFechar}>
      <Field label="Nome completo"><input style={inpStyle} value={nome} onChange={e=>setNome(e.target.value)}/></Field>
      <Field label="Cargo"><input style={inpStyle} value={cargo} onChange={e=>setCargo(e.target.value)} placeholder="Ex: Consultor"/></Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="E-mail"><input style={inpStyle} type="email" value={email} onChange={e=>setEmail(e.target.value)}/></Field>
        <Field label="Telefone"><input style={inpStyle} value={telefone} onChange={e=>setTelefone(e.target.value)}/></Field>
      </div>
      <Field label="CPF"><input style={inpStyle} value={cpf} onChange={e=>setCpf(e.target.value)}/></Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="Tipo">
          <select style={inpStyle} value={tipo} onChange={e=>setTipo(e.target.value)}>
            <option value="socio">Sócio</option>
            <option value="clt">CLT</option>
            <option value="pj">PJ</option>
          </select>
        </Field>
        <Field label="Salário base"><input style={inpStyle} type="number" value={salario} onChange={e=>setSalario(e.target.value)}/></Field>
      </div>
      <Field label="Data de admissão"><input style={inpStyle} type="date" value={dataAdmissao} onChange={e=>setDataAdmissao(e.target.value)}/></Field>
      <SubmitBtn onClick={submit}>Salvar colaborador</SubmitBtn>
    </Modal>
  );
}

function ModalAporteSocios({ funcionarios = [], onSalvar, onFechar }) {
  const socios = funcionarios.filter(f => f.tipo === 'socio' || f.cargo?.toLowerCase().includes('sócio') || f.cargo?.toLowerCase().includes('socio'));
  const [empresaId, setEmpresaId]   = useState('axicon');
  const [socio, setSocio]           = useState(socios[0]?.nome || '');
  const [valor, setValor]           = useState('');
  const [data, setData]             = useState(today);
  const [obs, setObs]               = useState('');

  const submit = () => {
    if (!valor || !socio) return alert('Preencha o sócio e o valor');
    onSalvar({
      tipo:       'receber',
      categoria:  'cap_aporte',
      empresaId,
      descricao:  `Aporte dos Sócios — ${socio}`,
      cliente:    socio,
      valor:      parseFloat(String(valor).replace(',','.')) || 0,
      vencimento: data,
      status:     'pendente',
      recorrente: false,
      observacoes: obs,
    });
  };

  return (
    <Modal titulo="Registrar Aporte dos Sócios" onFechar={onFechar}>
      <Field label="Empresa">
        <select style={inpStyle} value={empresaId} onChange={e=>setEmpresaId(e.target.value)}>
          {EMPRESAS.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
      </Field>
      <Field label="Sócio que realizou o aporte">
        {socios.length > 0 ? (
          <select style={inpStyle} value={socio} onChange={e=>setSocio(e.target.value)}>
            {socios.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
            <option value="__outro">Outro…</option>
          </select>
        ) : (
          <input style={inpStyle} value={socio} onChange={e=>setSocio(e.target.value)} placeholder="Nome do sócio"/>
        )}
        {(socio === '__outro' || socios.length === 0) && (
          <input style={{...inpStyle,marginTop:6}} placeholder="Nome do sócio" value={socio==='__outro'?'':socio} onChange={e=>setSocio(e.target.value)}/>
        )}
      </Field>
      <Field label="Valor (R$)">
        <input style={inpStyle} type="number" min="0" step="0.01" value={valor} onChange={e=>setValor(e.target.value)} placeholder="0,00"/>
      </Field>
      <Field label="Data do aporte">
        <input style={inpStyle} type="date" value={data} onChange={e=>setData(e.target.value)}/>
      </Field>
      <Field label="Observações (opcional)">
        <textarea style={{...inpStyle,resize:"vertical"}} rows={2} value={obs} onChange={e=>setObs(e.target.value)} placeholder="Ex: aporte para capital de giro"/>
      </Field>
      <SubmitBtn onClick={submit}>Registrar Aporte</SubmitBtn>
    </Modal>
  );
}

function ModalConta({ tipo, fornecedores = [], contatos = [], initial, onSalvar, onFechar, onCriarFornecedor }) {
  const [empresaId, setEmpresaId] = useState(initial?.empresaId || 'axicon');
  const [descricao, setDescricao] = useState(initial?.descricao || '');
  const [valor, setValor] = useState(initial?.valor || '');
  const [vencimento, setVencimento] = useState(initial?.vencimento || addDays(today, 7));
  const [categoria, setCategoria] = useState(initial?.categoria || (tipo === 'pagar' ? 'desp_admin' : 'rec_servicos'));
  const [recorrente, setRecorrente] = useState(initial?.recorrente || false);
  const [terceiro, setTerceiro] = useState(initial?.fornecedor || initial?.cliente || '');
  const [fornecedorId, setFornecedorId] = useState(initial?.fornecedorId || '');
  const [numeroNF, setNumeroNF] = useState(initial?.numeroNF || '');
  const [anexo, setAnexo] = useState(initial?.anexo || null);
  const [buscaForn, setBuscaForn] = useState(initial?.fornecedor || '');
  const [showFornDrop, setShowFornDrop] = useState(false);

  const fornFiltrados = fornecedores.filter(f =>
    !buscaForn || f.nome.toLowerCase().includes(buscaForn.toLowerCase()) || f.cnpj?.includes(buscaForn)
  );

  const selecionarFornecedor = (f) => {
    setFornecedorId(f.id);
    setBuscaForn(f.nome);
    setTerceiro(f.nome);
    if (f.categoria) setCategoria(f.categoria);
    setShowFornDrop(false);
  };

  const criarNovoFornecedor = () => {
    if (!buscaForn.trim()) return;
    const novo = { nome: buscaForn.trim(), cnpj: '', email: '', telefone: '', categoria: categoria };
    const novoComId = onCriarFornecedor ? onCriarFornecedor(novo) : null;
    setTerceiro(buscaForn.trim());
    setShowFornDrop(false);
  };

  const categoriasDisponiveis = TODAS_CONTAS.filter(c => {
    if (tipo === 'pagar') return ['deducoes','custos','despesas','tributos'].includes(c.categoria) || c.id === 'fin_despesas';
    return c.categoria === 'receita' || c.id === 'fin_receitas';
  });

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Arquivo muito grande (máx 5MB)'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAnexo({ nome: file.name, tipo: file.type, tamanho: file.size, data: ev.target.result });
    };
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!descricao || !valor) return alert('Descrição e valor obrigatórios');
    const data = {
      ...(initial || {}),
      tipo, empresaId, descricao, valor: Number(valor), vencimento,
      status: initial?.status || 'pendente',
      categoria, recorrente, numeroNF, anexo,
    };
    if (tipo === 'pagar') { data.fornecedor = terceiro; data.fornecedorId = fornecedorId ? Number(fornecedorId) : undefined; }
    else { data.cliente = terceiro; }

    onSalvar(data);
  };

  const empSelecionada = EMPRESAS.find(e => e.id === empresaId);

  return (
    <Modal titulo={initial ? 'Editar Conta' : (tipo === 'pagar' ? "Nova Despesa" : "Nova Receita")} onFechar={onFechar} large>
      {/* SELEÇÃO DE EMPRESA */}
      <Field label="Empresa / Conta">
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {EMPRESAS.map(emp => (
            <button key={emp.id} onClick={()=>setEmpresaId(emp.id)} style={{
              padding:"12px 10px",borderRadius:10,
              border:`1.5px solid ${empresaId===emp.id?emp.cor:"rgba(113,63,42,0.18)"}`,
              background:empresaId===emp.id?`${emp.cor}14`:"white",
              color:empresaId===emp.id?emp.cor:"#888",cursor:"pointer",
              fontFamily:SN,display:"flex",flexDirection:"column",alignItems:"center",gap:6,
            }}>
              <div style={{width:30,height:30,borderRadius:8,background:emp.cor,color:"white",display:"grid",placeItems:"center",fontSize:11,fontWeight:700,fontFamily:FT}}>{emp.sigla}</div>
              <div style={{fontSize:11,fontWeight:empresaId===emp.id?700:500,textAlign:"center",lineHeight:1.2}}>{emp.nome}</div>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Descrição">
        <input style={inpStyle} value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder={tipo === 'pagar' ? "Ex: Aluguel Maio" : "Ex: Fee Cliente XYZ"}/>
      </Field>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field label="Valor (R$)"><input style={inpStyle} type="number" step="0.01" value={valor} onChange={e=>setValor(e.target.value)}/></Field>
        <Field label="Data de Competência"><input style={inpStyle} type="date" value={vencimento} onChange={e=>setVencimento(e.target.value)}/></Field>
      </div>

      {tipo === 'pagar' ? (
        <Field label="Fornecedor">
          <div style={{position:"relative"}}>
            <input style={inpStyle} value={buscaForn}
              onChange={e => { setBuscaForn(e.target.value); setTerceiro(e.target.value); setFornecedorId(''); setShowFornDrop(true); }}
              onFocus={() => setShowFornDrop(true)}
              onBlur={() => setTimeout(() => setShowFornDrop(false), 200)}
              placeholder="Buscar fornecedor cadastrado ou digitar novo..."/>
            {showFornDrop && (
              <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:999,background:"#fff",border:"1px solid rgba(113,63,42,0.18)",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,0.10)",overflow:"hidden",maxHeight:220,overflowY:"auto"}}>
                {fornFiltrados.map(f => (
                  <div key={f.id} onMouseDown={() => selecionarFornecedor(f)}
                    style={{padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid #f5f0e8",display:"flex",justifyContent:"space-between",alignItems:"center"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#FAF8F3"}
                    onMouseLeave={e=>e.currentTarget.style.background="white"}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>{f.nome}</div>
                      {f.cnpj && <div style={{fontSize:11,color:"#888"}}>{f.cnpj}</div>}
                    </div>
                    {fornecedorId === f.id && <span style={{color:"#22c55e",fontSize:12}}>✓</span>}
                  </div>
                ))}
                {buscaForn.trim() && (
                  <div onMouseDown={criarNovoFornecedor}
                    style={{padding:"10px 14px",cursor:"pointer",color:ASSESS.primary,fontWeight:600,fontSize:12,display:"flex",alignItems:"center",gap:8,background:"#FAFAF5"}}
                    onMouseEnter={e=>e.currentTarget.style.background=`${ASSESS.primary}08`}
                    onMouseLeave={e=>e.currentTarget.style.background="#FAFAF5"}>
                    {I.plus} Criar "{buscaForn.trim()}" como novo fornecedor
                  </div>
                )}
                {fornFiltrados.length === 0 && !buscaForn.trim() && (
                  <div style={{padding:"12px 14px",fontSize:12,color:"#aaa",textAlign:"center"}}>Nenhum fornecedor cadastrado</div>
                )}
              </div>
            )}
          </div>
        </Field>
      ) : (
        <Field label="Cliente">
          <input style={inpStyle} value={terceiro} onChange={e=>setTerceiro(e.target.value)} placeholder="Nome do cliente"/>
        </Field>
      )}

      <Field label="Categoria contábil (plano de contas)">
        <select style={inpStyle} value={categoria} onChange={e=>setCategoria(e.target.value)}>
          {Object.entries(PLANO_CONTAS).map(([catKey, catData]) => {
            const grupos = Object.entries(catData.grupos).filter(([gid]) => categoriasDisponiveis.find(c => c.id === gid));
            if (grupos.length === 0) return null;
            return (
              <optgroup key={catKey} label={catData.label}>
                {grupos.map(([gid, gname]) => <option key={gid} value={gid}>{gname}</option>)}
              </optgroup>
            );
          })}
        </select>
      </Field>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <Field label="Número da Nota Fiscal / Recibo">
          <input style={inpStyle} value={numeroNF} onChange={e=>setNumeroNF(e.target.value)} placeholder="Ex: NF-12345 ou REC-001"/>
        </Field>
        <Field label="Anexo (NF, recibo, comprovante)">
          {!anexo ? (
            <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px 14px",border:"1px dashed rgba(113,63,42,0.30)",borderRadius:8,background:"#FAF8F3",cursor:"pointer",fontSize:12,color:ASSESS.primary,fontWeight:600,height:40,boxSizing:"border-box"}}>
              {I.upload} Anexar arquivo
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.xml" onChange={handleFile} style={{display:"none"}}/>
            </label>
          ) : (
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:`${ASSESS.primary}10`,border:`1px solid ${ASSESS.primary}30`,borderRadius:8}}>
              <span style={{color:ASSESS.primary,display:"flex"}}>{I.paper}</span>
              <div style={{flex:1,minWidth:0,fontSize:11}}>
                <div style={{fontWeight:600,color:"#1a1a1a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{anexo.nome}</div>
                <div style={{color:"#aaa"}}>{(anexo.tamanho/1024).toFixed(0)} KB</div>
              </div>
              <button onClick={()=>setAnexo(null)} style={{background:"none",border:"none",color:"#aaa",cursor:"pointer",display:"flex",padding:4}}>{I.x}</button>
            </div>
          )}
        </Field>
      </div>

      <Field label="">
        <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:"#555"}}>
          <input type="checkbox" checked={recorrente} onChange={e=>setRecorrente(e.target.checked)} style={{width:18,height:18,cursor:"pointer",accentColor:ASSESS.primary}}/>
          Conta recorrente (gerada mensalmente)
        </label>
      </Field>

      <SubmitBtn onClick={submit}>{initial ? 'Salvar alterações' : 'Salvar conta'}</SubmitBtn>
    </Modal>
  );
}

// ── MODAL FORNECEDOR ──────────────────────────────────────────────────────────
function ModalFornecedor({ initial, onSalvar, onFechar }) {
  const [nome, setNome] = useState(initial?.nome || '');
  const [cnpj, setCnpj] = useState(initial?.cnpj || '');
  const [categoria, setCategoria] = useState(initial?.categoria || 'desp_admin');
  const [email, setEmail] = useState(initial?.email || '');
  const [telefone, setTelefone] = useState(initial?.telefone || '');
  const [contato, setContato] = useState(initial?.contato || '');
  const [endereco, setEndereco] = useState(initial?.endereco || '');
  const [observacoes, setObservacoes] = useState(initial?.observacoes || '');
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState('');

  const buscarCNPJ = async () => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) {
      setErroBusca('CNPJ deve ter 14 dígitos');
      return;
    }
    setBuscando(true);
    setErroBusca('');
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      if (!res.ok) {
        if (res.status === 404) setErroBusca('CNPJ não encontrado');
        else setErroBusca('Erro ao consultar. Tente novamente.');
        setBuscando(false);
        return;
      }
      const data = await res.json();
      setNome(data.razao_social || data.nome_fantasia || '');
      const enderecoMontado = [
        data.logradouro,
        data.numero,
        data.complemento,
        data.bairro,
        data.municipio,
        data.uf,
        data.cep,
      ].filter(Boolean).join(', ');
      setEndereco(enderecoMontado);
      if (data.ddd_telefone_1) setTelefone(data.ddd_telefone_1);
      if (data.email) setEmail(data.email);
      // Formata o CNPJ
      const formatado = cnpjLimpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
      setCnpj(formatado);
      setObservacoes(prev => {
        const info = `${data.cnae_fiscal_descricao || ''}${data.situacao_cadastral ? ` · Situação: ${data.descricao_situacao_cadastral}` : ''}`;
        return prev || info;
      });
    } catch (e) {
      setErroBusca('Falha na conexão. Verifique sua internet.');
    }
    setBuscando(false);
  };

  const submit = () => {
    if (!nome.trim()) return alert('Nome obrigatório');
    onSalvar({ nome, cnpj, categoria, email, telefone, contato, endereco, observacoes });
  };

  return (
    <Modal titulo={initial ? "Editar Fornecedor" : "Novo Fornecedor"} onFechar={onFechar} large>
      {/* CAMPO CNPJ COM BUSCA */}
      <Field label="CNPJ (busca automática via Receita Federal)">
        <div style={{display:"flex",gap:8}}>
          <input style={{...inpStyle,flex:1}} value={cnpj} onChange={e=>setCnpj(e.target.value)} placeholder="00.000.000/0001-00 ou apenas números"/>
          <button onClick={buscarCNPJ} disabled={buscando || !cnpj} style={{
            padding:"10px 18px",background:ASSESS.primary,color:"white",border:"none",borderRadius:8,
            cursor:buscando||!cnpj?"not-allowed":"pointer",fontSize:12,fontWeight:600,
            opacity:buscando||!cnpj?.5:1,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:8,
          }}>
            {buscando ? 'Buscando...' : <>{I.search} Buscar dados</>}
          </button>
        </div>
        {erroBusca && <div style={{fontSize:11,color:"#b71c1c",marginTop:6,padding:"4px 10px",background:"#fee2e2",borderRadius:6}}>⚠ {erroBusca}</div>}
        {!erroBusca && !buscando && nome && cnpj.includes('/') && (
          <div style={{fontSize:11,color:"#2e8a4e",marginTop:6,padding:"4px 10px",background:"#dcfce7",borderRadius:6}}>✓ Dados preenchidos automaticamente — revise e ajuste se necessário</div>
        )}
        <div style={{fontSize:10,color:"#aaa",marginTop:6,fontStyle:"italic"}}>
          💡 Os dados são buscados via BrasilAPI (Receita Federal). Funciona apenas com CNPJs válidos.
        </div>
      </Field>

      <Field label="Razão social ou Nome">
        <input style={inpStyle} value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Imobiliária Central Ltda"/>
      </Field>

      <Field label="Endereço">
        <input style={inpStyle} value={endereco} onChange={e=>setEndereco(e.target.value)} placeholder="Endereço completo"/>
      </Field>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field label="Categoria padrão de despesa">
          <select style={inpStyle} value={categoria} onChange={e=>setCategoria(e.target.value)}>
            {Object.entries(PLANO_CONTAS).filter(([k]) => ['custos','despesas','deducoes','tributos'].includes(k)).map(([catKey, catData]) => (
              <optgroup key={catKey} label={catData.label}>
                {Object.entries(catData.grupos).map(([gid, gname]) => <option key={gid} value={gid}>{gname}</option>)}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label="Pessoa de contato"><input style={inpStyle} value={contato} onChange={e=>setContato(e.target.value)} placeholder="Nome do responsável"/></Field>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field label="E-mail"><input style={inpStyle} type="email" value={email} onChange={e=>setEmail(e.target.value)}/></Field>
        <Field label="Telefone"><input style={inpStyle} value={telefone} onChange={e=>setTelefone(e.target.value)}/></Field>
      </div>

      <Field label="Observações">
        <textarea style={{...inpStyle, minHeight:60, fontFamily:SN, lineHeight:1.6, resize:'vertical'}} value={observacoes} onChange={e=>setObservacoes(e.target.value)} placeholder="O que esse fornecedor entrega, condições de pagamento, etc."/>
      </Field>

      <SubmitBtn onClick={submit}>{initial ? 'Salvar alterações' : 'Salvar fornecedor'}</SubmitBtn>
    </Modal>
  );
}

// ── TAREFAS (estilo ClickUp) ──────────────────────────────────────────────────
const STATUS_TAREFA = [
  { id: 'pendente', label: 'A Fazer', cor: '#94a3b8' },
  { id: 'em_andamento', label: 'Em Andamento', cor: '#3b82f6' },
  { id: 'em_revisao', label: 'Em Revisão', cor: '#a855f7' },
  { id: 'bloqueada', label: 'Bloqueada', cor: '#ef4444' },
  { id: 'concluida', label: 'Concluída', cor: '#22c55e' },
];

const PRIORIDADES = [
  { id: 'urgente', label: 'Urgente', cor: '#dc2626', icone: I.flame },
  { id: 'alta', label: 'Alta', cor: '#f59e0b', icone: I.flag },
  { id: 'media', label: 'Média', cor: '#3b82f6', icone: I.flag },
  { id: 'baixa', label: 'Baixa', cor: '#94a3b8', icone: I.flag },
];

function Tarefas({ dados, onAdicionar, onAbrir, onMover, onRemover, onAtualizar }) {
  const [view, setView] = useState('kanban'); // kanban, lista
  const [filtroLista, setFiltroLista] = useState('todas');
  const [filtroResp, setFiltroResp] = useState('todos');
  const [filtroPrior, setFiltroPrior] = useState('todas');
  const [filtroStatus, setFiltroStatus] = useState('todas');
  const [busca, setBusca] = useState('');
  const [draggedTarefa, setDraggedTarefa] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const iniciarEditLista = (t, e) => {
    e.stopPropagation();
    setEditandoId(t.id);
    setEditForm({ titulo: t.titulo, responsavelId: t.responsavelId||'', prioridade: t.prioridade, dataLimite: t.dataLimite||'', status: t.status });
  };
  const salvarEditLista = (e) => {
    e.stopPropagation();
    onAtualizar(editandoId, { ...editForm, responsavelId: editForm.responsavelId ? Number(editForm.responsavelId) : null });
    setEditandoId(null);
  };

  const tarefas = (dados.tarefas||[]).filter(t => {
    if (filtroLista !== 'todas' && t.lista !== filtroLista) return false;
    if (filtroResp !== 'todos' && t.responsavelId !== Number(filtroResp)) return false;
    if (filtroPrior !== 'todas' && t.prioridade !== filtroPrior) return false;
    if (filtroStatus === 'para_fazer' && !['pendente','em_andamento'].includes(t.status)) return false;
    if (filtroStatus === 'ativas' && t.status === 'concluida') return false;
    if (filtroStatus === 'concluidas' && t.status !== 'concluida') return false;
    if (busca && !t.titulo.toLowerCase().includes(busca.toLowerCase()) && !t.descricao?.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const totalAtivas = tarefas.filter(t => t.status !== 'concluida').length;
  const totalConcluidas = tarefas.filter(t => t.status === 'concluida').length;
  const atrasadas = tarefas.filter(t => t.status !== 'concluida' && t.dataLimite && diasAteVencer(t.dataLimite) < 0).length;
  const semResp = tarefas.filter(t => !t.responsavelId).length;

  return (
    <div style={{padding:"36px 32px 60px",maxWidth:1600,margin:"0 auto",height:"100%",display:"flex",flexDirection:"column"}}>
      <PageHeader
        etiqueta="Operação"
        titulo="Tarefas"
        destaque="administrativas"
        sub={`${totalAtivas} tarefas ativas · ${totalConcluidas} concluídas · ${atrasadas} atrasadas`}
        action={<Btn icon={I.plus} onClick={onAdicionar}>Nova Tarefa</Btn>}
      />

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        <KpiCard label="Total Ativas" value={totalAtivas} sub="em aberto" accent={ASSESS.primary}/>
        <KpiCard label="Atrasadas" value={atrasadas} sub="prazo vencido" accent="#dc2626"/>
        <KpiCard label="Sem Responsável" value={semResp} sub="precisam atribuição" accent="#f59e0b"/>
        <KpiCard label="Concluídas" value={totalConcluidas} sub="finalizadas" accent="#22c55e"/>
      </div>

      {/* Toggle de visão */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,gap:12,flexWrap:"wrap"}}>
        <div style={{display:"flex",background:"white",padding:4,borderRadius:10,border:"1px solid rgba(113,63,42,0.10)",gap:2}}>
          {[{id:'kanban',label:'Kanban',ic:I.kanban},{id:'lista',label:'Lista',ic:I.list}].map(v => (
            <button key={v.id} onClick={()=>setView(v.id)}
              style={{padding:"8px 14px",borderRadius:7,fontSize:12,fontWeight:view===v.id?700:500,background:view===v.id?ASSESS.primary:"transparent",color:view===v.id?"white":"#888",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontFamily:SN}}>
              {v.ic} {v.label}
            </button>
          ))}
        </div>

        <div style={{display:"flex",gap:8,alignItems:"center",flex:1,justifyContent:"flex-end",flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:4,background:"white",padding:4,borderRadius:10,border:"1px solid rgba(113,63,42,0.10)"}}>
            {[
              {id:'todas', label:'Todas'},
              {id:'para_fazer', label:'Para Fazer'},
              {id:'ativas', label:'Ativas'},
              {id:'concluidas', label:'Concluídas'},
            ].map(f => (
              <button key={f.id} onClick={()=>setFiltroStatus(f.id)}
                style={{padding:"7px 12px",borderRadius:7,fontSize:12,fontWeight:filtroStatus===f.id?700:500,
                  background:filtroStatus===f.id?ASSESS.primary:"transparent",
                  color:filtroStatus===f.id?"white":"#888",border:"none",cursor:"pointer",fontFamily:SN}}>
                {f.label}
              </button>
            ))}
          </div>
          <select value={filtroLista} onChange={e=>setFiltroLista(e.target.value)} style={{padding:"7px 12px",borderRadius:8,border:"1px solid rgba(113,63,42,0.18)",fontSize:12,fontFamily:SN,background:"white",cursor:"pointer"}}>
            <option value="todas">Todas as listas</option>
            {(dados.listas_tarefas||[]).map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
          <select value={filtroResp} onChange={e=>setFiltroResp(e.target.value)} style={{padding:"7px 12px",borderRadius:8,border:"1px solid rgba(113,63,42,0.18)",fontSize:12,fontFamily:SN,background:"white",cursor:"pointer"}}>
            <option value="todos">Todos responsáveis</option>
            {dados.funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
          <select value={filtroPrior} onChange={e=>setFiltroPrior(e.target.value)} style={{padding:"7px 12px",borderRadius:8,border:"1px solid rgba(113,63,42,0.18)",fontSize:12,fontFamily:SN,background:"white",cursor:"pointer"}}>
            <option value="todas">Todas prioridades</option>
            {PRIORIDADES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"0 12px",border:"1px solid rgba(113,63,42,0.18)",borderRadius:8,height:34,background:"white",minWidth:200}}>
            <span style={{color:"#888",display:"flex"}}>{I.search}</span>
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar..." style={{border:"none",background:"transparent",outline:"none",flex:1,fontSize:12,fontFamily:SN}}/>
          </div>
        </div>
      </div>

      {view === 'kanban' && (
        <div style={{flex:1,overflowX:"auto"}}>
          <div style={{display:"flex",gap:12,minWidth:"max-content",height:"100%",paddingBottom:8}}>
            {STATUS_TAREFA.map(status => {
              const tarefasStatus = tarefas.filter(t => t.status === status.id);
              return (
                <div key={status.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (draggedTarefa) { onMover(draggedTarefa, status.id); setDraggedTarefa(null); } }}
                  style={{width:300,background:"#FAF8F3",borderRadius:12,border:"1px solid rgba(113,63,42,0.10)",display:"flex",flexDirection:"column",borderTop:`3px solid ${status.cor}`}}>
                  <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(113,63,42,0.08)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{width:8,height:8,borderRadius:"50%",background:status.cor}}/>
                      <span style={{fontSize:12,fontWeight:700,color:"#1a1a1a"}}>{status.label}</span>
                    </div>
                    <span style={{fontSize:11,padding:"2px 8px",borderRadius:99,background:`${status.cor}18`,color:status.cor,fontWeight:700}}>{tarefasStatus.length}</span>
                  </div>
                  <div style={{flex:1,padding:10,overflowY:"auto",display:"flex",flexDirection:"column",gap:8,minHeight:200}}>
                    {tarefasStatus.map(t => <CardTarefa key={t.id} tarefa={t} dados={dados} onClick={()=>onAbrir(t.id)} onDragStart={()=>setDraggedTarefa(t.id)}/>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'lista' && (
        <div style={{flex:1,overflowY:"auto",background:"white",borderRadius:12,border:"1px solid rgba(113,63,42,0.10)"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead style={{position:"sticky",top:0,background:"#FAF8F3",zIndex:1}}>
              <tr style={{borderBottom:"1px solid rgba(113,63,42,0.10)"}}>
                {["Status","Tarefa","Lista","Responsável","Prioridade","Prazo","Tags",""].map(h => (
                  <th key={h} style={{textAlign:"left",padding:"12px 14px",fontSize:10,letterSpacing:2,fontWeight:600,color:"#888",textTransform:"uppercase"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tarefas.map(t => {
                const status = STATUS_TAREFA.find(s => s.id === t.status);
                const prior = PRIORIDADES.find(p => p.id === t.prioridade);
                const lista = (dados.listas_tarefas||[]).find(l => l.id === t.lista);
                const resp = dados.funcionarios.find(f => f.id === t.responsavelId);
                const dias = t.dataLimite ? diasAteVencer(t.dataLimite) : null;
                const inpSt = {border:"1.5px solid #ddd",borderRadius:6,padding:"4px 8px",fontSize:12,fontFamily:SN,width:"100%"};
                const isEditing = editandoId === t.id;
                if (isEditing) {
                  return (
                    <tr key={t.id} style={{borderBottom:"1px solid #f5f0e8",background:"#FFFBF6"}}>
                      <td style={{padding:"8px 14px"}}>
                        <select value={editForm.status} onChange={e=>setEditForm(f=>({...f,status:e.target.value}))} style={inpSt}>
                          {STATUS_TAREFA.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                      </td>
                      <td style={{padding:"8px 14px"}}>
                        <input value={editForm.titulo} onChange={e=>setEditForm(f=>({...f,titulo:e.target.value}))} style={inpSt}/>
                      </td>
                      <td style={{padding:"8px 14px"}}>
                        {lista && <span style={{fontSize:11,padding:"3px 8px",borderRadius:6,background:`${lista.cor}14`,color:lista.cor,fontWeight:600}}>{lista.nome}</span>}
                      </td>
                      <td style={{padding:"8px 14px"}}>
                        <select value={editForm.responsavelId} onChange={e=>setEditForm(f=>({...f,responsavelId:e.target.value}))} style={inpSt}>
                          <option value="">Sem responsável</option>
                          {dados.funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                        </select>
                      </td>
                      <td style={{padding:"8px 14px"}}>
                        <select value={editForm.prioridade} onChange={e=>setEditForm(f=>({...f,prioridade:e.target.value}))} style={inpSt}>
                          {PRIORIDADES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                        </select>
                      </td>
                      <td style={{padding:"8px 14px"}}>
                        <input type="date" value={editForm.dataLimite} onChange={e=>setEditForm(f=>({...f,dataLimite:e.target.value}))} style={inpSt}/>
                      </td>
                      <td style={{padding:"8px 14px"}}>
                        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                          {t.tags?.slice(0,2).map((tag,i) => (
                            <span key={i} style={{fontSize:9,padding:"2px 7px",borderRadius:4,background:"#f1f5f9",color:"#475569",fontWeight:600}}>#{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{padding:"8px 14px",textAlign:"right",whiteSpace:"nowrap"}}>
                        <button onClick={salvarEditLista} style={{background:ASSESS.primary,border:"none",color:"white",cursor:"pointer",padding:"5px 10px",borderRadius:6,fontSize:12,fontFamily:SN,marginRight:4}}>Salvar</button>
                        <button onClick={(e)=>{e.stopPropagation();setEditandoId(null);}} style={{background:"none",border:"1px solid #ddd",color:"#888",cursor:"pointer",padding:"5px 8px",borderRadius:6,fontSize:13,fontFamily:SN}}>✕</button>
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={t.id} onClick={()=>onAbrir(t.id)} style={{borderBottom:"1px solid #f5f0e8",cursor:"pointer"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#FAF8F3"}
                    onMouseLeave={e=>e.currentTarget.style.background="white"}>
                    <td style={{padding:"12px 14px"}}>
                      <span style={{fontSize:10,padding:"3px 8px",borderRadius:99,background:`${status?.cor}18`,color:status?.cor,fontWeight:700,letterSpacing:.3}}>{status?.label}</span>
                    </td>
                    <td style={{padding:"12px 14px"}}>
                      <div style={{fontWeight:600,color:"#1a1a1a"}}>{t.titulo}</div>
                      {t.subtarefas?.length > 0 && (
                        <div style={{fontSize:10,color:"#888",marginTop:3,display:"flex",alignItems:"center",gap:4}}>
                          <Ico size={11} d={<rect x="3" y="3" width="18" height="18" rx="2"/>}/> {t.subtarefas.filter(s=>s.concluida).length}/{t.subtarefas.length}
                        </div>
                      )}
                    </td>
                    <td style={{padding:"12px 14px"}}>
                      {lista && <span style={{fontSize:11,padding:"3px 8px",borderRadius:6,background:`${lista.cor}14`,color:lista.cor,fontWeight:600}}>{lista.nome}</span>}
                    </td>
                    <td style={{padding:"12px 14px"}}>
                      {resp ? (
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{width:24,height:24,borderRadius:"50%",background:`linear-gradient(135deg,${SEC},#8B6340)`,color:"white",display:"grid",placeItems:"center",fontSize:10,fontWeight:600}}>{resp.nome[0]}</div>
                          <span style={{fontSize:12,color:"#666"}}>{resp.nome.split(' ')[0]}</span>
                        </div>
                      ) : <span style={{fontSize:11,color:"#aaa"}}>—</span>}
                    </td>
                    <td style={{padding:"12px 14px"}}>
                      {prior && (
                        <span style={{fontSize:11,color:prior.cor,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}>
                          {prior.icone} {prior.label}
                        </span>
                      )}
                    </td>
                    <td style={{padding:"12px 14px"}}>
                      {t.dataLimite && (
                        <div>
                          <div style={{fontSize:12,color:"#666"}}>{fmtDate(t.dataLimite)}</div>
                          {t.status !== 'concluida' && dias != null && (
                            <div style={{fontSize:10,color:dias < 0 ? "#dc2626" : dias <= 2 ? "#f59e0b" : "#aaa",fontWeight:600}}>
                              {dias < 0 ? `${Math.abs(dias)}d atraso` : dias === 0 ? 'hoje' : `em ${dias}d`}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{padding:"12px 14px"}}>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        {t.tags?.slice(0,2).map((tag,i) => (
                          <span key={i} style={{fontSize:9,padding:"2px 7px",borderRadius:4,background:"#f1f5f9",color:"#475569",fontWeight:600}}>#{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{padding:"12px 14px",textAlign:"right",whiteSpace:"nowrap"}}>
                      <button onClick={(e)=>iniciarEditLista(t,e)} style={{background:"none",border:"none",color:"#aaa",cursor:"pointer",display:"inline-flex",padding:6}}>{I.edit}</button>
                      <button onClick={(e)=>{e.stopPropagation();if(confirm('Remover tarefa?'))onRemover(t.id)}} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",display:"inline-flex",padding:6}}>{I.trash}</button>
                    </td>
                  </tr>
                );
              })}
              {tarefas.length === 0 && (
                <tr><td colSpan={8} style={{textAlign:"center",padding:40,color:"#aaa",fontSize:13}}>Nenhuma tarefa encontrada</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CardTarefa({ tarefa, dados, onClick, onDragStart }) {
  const prior = PRIORIDADES.find(p => p.id === tarefa.prioridade);
  const lista = (dados.listas_tarefas||[]).find(l => l.id === tarefa.lista);
  const resp = dados.funcionarios.find(f => f.id === tarefa.responsavelId);
  const dias = tarefa.dataLimite ? diasAteVencer(tarefa.dataLimite) : null;
  const subConcluidas = (tarefa.subtarefas||[]).filter(s => s.concluida).length;
  const totalSub = (tarefa.subtarefas||[]).length;
  const progresso = totalSub > 0 ? (subConcluidas / totalSub) * 100 : 0;

  return (
    <div draggable onDragStart={onDragStart} onClick={onClick}
      style={{background:"white",borderRadius:10,padding:"12px 14px",border:"1px solid rgba(113,63,42,0.10)",cursor:"grab",borderLeft:`3px solid ${prior?.cor || '#94a3b8'}`,transition:"box-shadow .15s"}}
      onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 8px 20px -10px rgba(0,0,0,0.15)`}
      onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>

      {/* Tags + Lista */}
      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8,alignItems:"center"}}>
        {lista && <span style={{fontSize:9,padding:"2px 7px",borderRadius:4,background:`${lista.cor}14`,color:lista.cor,fontWeight:700,letterSpacing:.3}}>{lista.nome}</span>}
        {tarefa.tags?.map((tag,i) => (
          <span key={i} style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"#f1f5f9",color:"#64748b",fontWeight:600}}>#{tag}</span>
        ))}
      </div>

      {/* Título */}
      <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",lineHeight:1.4,marginBottom:8}}>{tarefa.titulo}</div>

      {/* Progresso (subtarefas) */}
      {totalSub > 0 && (
        <div style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#888",marginBottom:4}}>
            <span>Subtarefas</span>
            <span style={{fontWeight:600}}>{subConcluidas}/{totalSub}</span>
          </div>
          <div style={{height:4,background:"#f1f5f9",borderRadius:99,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${progresso}%`,background:progresso === 100 ? "#22c55e" : "#3b82f6",borderRadius:99,transition:"width .3s"}}/>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#888"}}>
          {prior && <span title={prior.label} style={{color:prior.cor,display:"flex"}}>{prior.icone}</span>}
          {tarefa.dataLimite && (
            <span style={{color:dias < 0 && tarefa.status !== 'concluida' ? "#dc2626" : "#888",fontWeight: dias < 0 ? 600 : 400}}>
              {fmtDate(tarefa.dataLimite)}
              {dias != null && tarefa.status !== 'concluida' && dias < 0 && ` (${Math.abs(dias)}d)`}
            </span>
          )}
          {tarefa.comentarios?.length > 0 && (
            <span style={{display:"flex",alignItems:"center",gap:3}}>{I.comment} {tarefa.comentarios.length}</span>
          )}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {resp && (
            <div title={resp.nome} style={{width:24,height:24,borderRadius:"50%",background:`linear-gradient(135deg,${SEC},#8B6340)`,color:"white",display:"grid",placeItems:"center",fontSize:10,fontWeight:600,border:"2px solid white"}}>{resp.nome[0]}</div>
          )}
          <a href={typeof window!=='undefined'?`${window.location.origin}/crm?tela=tarefa_detalhe&param=${tarefa.id}`:'/crm'} target="_blank" rel="noreferrer"
            onClick={e=>e.stopPropagation()} title="Abrir em nova aba"
            style={{display:"flex",color:"#ccc",padding:2,textDecoration:"none"}}
            onMouseEnter={e=>e.currentTarget.style.color="#888"}
            onMouseLeave={e=>e.currentTarget.style.color="#ccc"}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
      </div>
    </div>
  );
}

// ── RICH TEXT EDITOR ──────────────────────────────────────────────────────────
function RichEditor({ value, onChange, placeholder = 'Clique para editar...' }) {
  const editorRef = React.useRef(null);
  const [showTablePicker, setShowTablePicker] = React.useState(false);
  const [hoveredCell, setHoveredCell] = React.useState({ r: 0, c: 0 });
  const [showImgDlg, setShowImgDlg] = React.useState(false);
  const [imgUrl, setImgUrl] = React.useState('');
  const [showLinkDlg, setShowLinkDlg] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState('');
  const [linkText, setLinkText] = React.useState('');
  const savedRange = React.useRef(null);

  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || '';
    }
  }, []); // só na montagem

  const saveRange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreRange = () => {
    const sel = window.getSelection();
    if (savedRange.current && sel) { sel.removeAllRanges(); sel.addRange(savedRange.current); }
  };

  const exec = (cmd, val = null) => {
    editorRef.current.focus();
    document.execCommand(cmd, false, val);
    onChange(editorRef.current.innerHTML);
  };

  const insertHTML = (html) => {
    editorRef.current.focus();
    restoreRange();
    document.execCommand('insertHTML', false, html);
    onChange(editorRef.current.innerHTML);
  };

  const insertTable = (rows, cols) => {
    let html = '<table style="border-collapse:collapse;width:100%;margin:12px 0"><tbody>';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        const isHead = r === 0;
        const tag = isHead ? 'th' : 'td';
        html += `<${tag} style="border:1px solid #d1d5db;padding:8px 12px;text-align:left;background:${isHead?'#f8f5f0':'white'};font-size:13px;">&nbsp;</${tag}>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table><p><br></p>';
    insertHTML(html);
    setShowTablePicker(false);
  };

  const insertImage = () => {
    if (!imgUrl.trim()) return;
    insertHTML(`<img src="${imgUrl.trim()}" style="max-width:100%;border-radius:8px;margin:8px 0;" alt="imagem"/>`);
    setImgUrl(''); setShowImgDlg(false);
  };

  const insertLink = () => {
    if (!linkUrl.trim()) return;
    insertHTML(`<a href="${linkUrl.trim()}" target="_blank" rel="noreferrer" style="color:#001489;text-decoration:underline;">${linkText || linkUrl}</a>`);
    setLinkUrl(''); setLinkText(''); setShowLinkDlg(false);
  };

  const TBtns = [
    { icon: 'B', cmd: 'bold', title: 'Negrito (Ctrl+B)', style: { fontWeight: 'bold' } },
    { icon: 'I', cmd: 'italic', title: 'Itálico (Ctrl+I)', style: { fontStyle: 'italic' } },
    { icon: 'U', cmd: 'underline', title: 'Sublinhado', style: { textDecoration: 'underline' } },
    { icon: 'S', cmd: 'strikeThrough', title: 'Tachado', style: { textDecoration: 'line-through' } },
  ];
  const HBtns = [
    { icon: 'H1', cmd: 'formatBlock', val: 'H1', title: 'Título 1' },
    { icon: 'H2', cmd: 'formatBlock', val: 'H2', title: 'Título 2' },
    { icon: 'H3', cmd: 'formatBlock', val: 'H3', title: 'Título 3' },
    { icon: '¶', cmd: 'formatBlock', val: 'P', title: 'Parágrafo' },
  ];

  const btnSt = { background: 'none', border: '1px solid transparent', borderRadius: 5, width: 28, height: 26, cursor: 'pointer', fontSize: 11, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SN, fontWeight: 600 };
  const divSt = { width: 1, height: 20, background: '#e5e0d8', margin: '0 4px' };

  return (
    <div style={{ border: '1px solid rgba(113,63,42,0.15)', borderRadius: 12, overflow: 'visible', background: 'white', position: 'relative' }}>
      {/* TOOLBAR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '8px 12px', borderBottom: '1px solid rgba(113,63,42,0.10)', background: '#faf8f5', borderRadius: '12px 12px 0 0', flexWrap: 'wrap', position: 'relative', zIndex: 10 }}>
        {TBtns.map(b => (
          <button key={b.cmd} title={b.title} onMouseDown={e => { e.preventDefault(); exec(b.cmd); }}
            style={{ ...btnSt, ...b.style }}
            onMouseEnter={e => e.currentTarget.style.background = '#ede8df'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            {b.icon}
          </button>
        ))}
        <div style={divSt}/>
        {HBtns.map(b => (
          <button key={b.icon} title={b.title} onMouseDown={e => { e.preventDefault(); exec(b.cmd, b.val); }}
            style={btnSt}
            onMouseEnter={e => e.currentTarget.style.background = '#ede8df'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            {b.icon}
          </button>
        ))}
        <div style={divSt}/>
        <button title="Lista com marcadores" onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }}
          style={btnSt} onMouseEnter={e=>e.currentTarget.style.background='#ede8df'} onMouseLeave={e=>e.currentTarget.style.background='none'}>≡</button>
        <button title="Lista numerada" onMouseDown={e => { e.preventDefault(); exec('insertOrderedList'); }}
          style={btnSt} onMouseEnter={e=>e.currentTarget.style.background='#ede8df'} onMouseLeave={e=>e.currentTarget.style.background='none'}>1.</button>
        <button title="Citação" onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'BLOCKQUOTE'); }}
          style={btnSt} onMouseEnter={e=>e.currentTarget.style.background='#ede8df'} onMouseLeave={e=>e.currentTarget.style.background='none'}>"</button>
        <button title="Código" onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'PRE'); }}
          style={{...btnSt,fontFamily:'monospace'}} onMouseEnter={e=>e.currentTarget.style.background='#ede8df'} onMouseLeave={e=>e.currentTarget.style.background='none'}>{'</>'}</button>
        <div style={divSt}/>
        {/* TABLE PICKER */}
        <div style={{ position: 'relative' }}>
          <button title="Inserir tabela" onMouseDown={e => { e.preventDefault(); saveRange(); setShowTablePicker(v => !v); }}
            style={btnSt} onMouseEnter={e=>e.currentTarget.style.background='#ede8df'} onMouseLeave={e=>e.currentTarget.style.background='none'}>▦</button>
          {showTablePicker && (
            <div style={{ position: 'absolute', top: '100%', left: 0, background: 'white', border: '1px solid #e5e0d8', borderRadius: 8, padding: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 999 }}>
              <div style={{ fontSize: 10, color: '#888', marginBottom: 6, textAlign: 'center' }}>
                {hoveredCell.r > 0 ? `${hoveredCell.r} × ${hoveredCell.c}` : 'Selecione o tamanho'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,18px)', gap: 2 }}>
                {Array.from({ length: 36 }, (_, i) => {
                  const r = Math.floor(i / 6) + 1, c = (i % 6) + 1;
                  const active = r <= hoveredCell.r && c <= hoveredCell.c;
                  return (
                    <div key={i}
                      style={{ width: 18, height: 18, border: `1px solid ${active ? ASSESS.primary : '#d1d5db'}`, borderRadius: 2, background: active ? `${ASSESS.primary}20` : 'white', cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredCell({ r, c })}
                      onClick={() => insertTable(r, c)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {/* IMAGE */}
        <button title="Inserir imagem" onMouseDown={e => { e.preventDefault(); saveRange(); setShowImgDlg(true); }}
          style={btnSt} onMouseEnter={e=>e.currentTarget.style.background='#ede8df'} onMouseLeave={e=>e.currentTarget.style.background='none'}>🖼</button>
        {/* LINK */}
        <button title="Inserir link" onMouseDown={e => { e.preventDefault(); saveRange(); setShowLinkDlg(true); }}
          style={btnSt} onMouseEnter={e=>e.currentTarget.style.background='#ede8df'} onMouseLeave={e=>e.currentTarget.style.background='none'}>🔗</button>
        <div style={divSt}/>
        {/* COLOR */}
        <button title="Destacar texto" onMouseDown={e => { e.preventDefault(); exec('hiliteColor', '#fef3c7'); }}
          style={{...btnSt,background:'#fef3c7'}} onMouseEnter={e=>e.currentTarget.style.opacity='.7'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>A</button>
        <button title="Cor do texto" onMouseDown={e => { e.preventDefault(); exec('foreColor', ASSESS.primary); }}
          style={{...btnSt,color:ASSESS.primary}} onMouseEnter={e=>e.currentTarget.style.background='#ede8df'} onMouseLeave={e=>e.currentTarget.style.background='none'}>A</button>
        <div style={{ flex: 1 }}/>
        <button title="Limpar formatação" onMouseDown={e => { e.preventDefault(); exec('removeFormat'); }}
          style={{ ...btnSt, fontSize: 10, width: 'auto', padding: '0 8px', color: '#aaa' }}>Limpar</button>
      </div>

      {/* EDITOR AREA */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={e => onChange(e.currentTarget.innerHTML)}
        onBlur={() => onChange(editorRef.current?.innerHTML || '')}
        style={{
          minHeight: 220, padding: '16px 20px', outline: 'none', fontSize: 14,
          lineHeight: 1.8, color: '#1a1a1a', fontFamily: SN, borderRadius: '0 0 12px 12px',
        }}
      />

      {/* IMAGE DIALOG */}
      {showImgDlg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowImgDlg(false)}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, marginBottom: 14 }}>Inserir Imagem</div>
            <input style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(113,63,42,0.2)', borderRadius: 8, fontSize: 13, marginBottom: 12, boxSizing: 'border-box' }}
              placeholder="URL da imagem (https://...)" value={imgUrl} onChange={e => setImgUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && insertImage()} autoFocus/>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowImgDlg(false)} style={{ padding: '7px 16px', border: '1px solid #ddd', borderRadius: 7, cursor: 'pointer', background: 'white' }}>Cancelar</button>
              <button onClick={insertImage} style={{ padding: '7px 16px', border: 'none', borderRadius: 7, cursor: 'pointer', background: ASSESS.primary, color: 'white', fontWeight: 600 }}>Inserir</button>
            </div>
          </div>
        </div>
      )}

      {/* LINK DIALOG */}
      {showLinkDlg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowLinkDlg(false)}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, marginBottom: 14 }}>Inserir Link</div>
            <input style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(113,63,42,0.2)', borderRadius: 8, fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }}
              placeholder="URL (https://...)" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} autoFocus/>
            <input style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(113,63,42,0.2)', borderRadius: 8, fontSize: 13, marginBottom: 14, boxSizing: 'border-box' }}
              placeholder="Texto do link (opcional)" value={linkText} onChange={e => setLinkText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && insertLink()}/>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowLinkDlg(false)} style={{ padding: '7px 16px', border: '1px solid #ddd', borderRadius: 7, cursor: 'pointer', background: 'white' }}>Cancelar</button>
              <button onClick={insertLink} style={{ padding: '7px 16px', border: 'none', borderRadius: 7, cursor: 'pointer', background: ASSESS.primary, color: 'white', fontWeight: 600 }}>Inserir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ANEXO UPLOAD ──────────────────────────────────────────────────────────────
function AnexoUpload({ contexto, refId, anexos = [], onAnexosChange }) {
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef();

  const upload = async (files) => {
    if (!files.length) return;
    setUploading(true);
    const novos = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('contexto', contexto);
      fd.append('id', String(refId));
      try {
        const res = await fetch('/api/anexos', { method: 'POST', body: fd });
        if (res.ok) { const data = await res.json(); novos.push(data); }
      } catch (e) { console.warn('Upload falhou:', e); }
    }
    setUploading(false);
    if (novos.length) onAnexosChange([...anexos, ...novos]);
  };

  const remover = async (idx) => {
    const a = anexos[idx];
    if (a?.path) await fetch(`/api/anexos?path=${encodeURIComponent(a.path)}`, { method: 'DELETE' }).catch(() => {});
    onAnexosChange(anexos.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div
        onClick={() => fileRef.current.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); upload(e.dataTransfer.files); }}
        style={{ border:'2px dashed rgba(113,63,42,0.2)', borderRadius:10, padding:'14px', textAlign:'center', cursor:'pointer', background:'#faf8f5', marginBottom:10 }}
        onMouseEnter={e => e.currentTarget.style.borderColor = ASSESS.primary}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(113,63,42,0.2)'}
      >
        <input ref={fileRef} type="file" multiple style={{display:'none'}} onChange={e => upload(e.target.files)}/>
        <span style={{display:'flex',justifyContent:'center',color:'#bbb',marginBottom:4}}>{I.upload}</span>
        <span style={{fontSize:11,color:'#999'}}>{uploading ? 'Enviando...' : 'Clique ou arraste arquivos'}</span>
      </div>
      {anexos.length > 0 && (
        <div style={{display:'flex',flexDirection:'column',gap:5}}>
          {anexos.map((a, idx) => (
            <div key={idx} style={{display:'flex',alignItems:'center',gap:8,background:'white',borderRadius:7,padding:'7px 10px',border:'1px solid rgba(113,63,42,0.10)'}}>
              <span style={{display:'flex',color:ASSESS.primary,flexShrink:0}}>{I.doc}</span>
              <a href={a.url} target="_blank" rel="noreferrer" style={{flex:1,fontSize:12,color:ASSESS.primary,textDecoration:'none',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.nome || 'Arquivo'}</a>
              {a.tamanho && <span style={{fontSize:10,color:'#aaa',flexShrink:0}}>{Math.round(a.tamanho/1024)}KB</span>}
              <button onClick={() => remover(idx)} style={{background:'none',border:'none',cursor:'pointer',color:'#dc2626',display:'flex',padding:2,flexShrink:0}}>{I.trash}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── @ MENÇÃO ──────────────────────────────────────────────────────────────────
async function enviarMencoes(texto, remetenteNome, contexto, funcionarios) {
  const matchs = [...texto.matchAll(/@([^\s@,!.?\n]+)/g)];
  for (const m of matchs) {
    const nomeAlvo = m[1];
    const func = funcionarios.find(f => f.nome.toLowerCase() === nomeAlvo.toLowerCase());
    if (func?.email) {
      await fetch('/api/notificacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinatario_email: func.email, remetente_nome: remetenteNome, mensagem: texto, contexto }),
      }).catch(() => {});
    }
  }
}

function MencaoInput({ value, onChange, funcionarios = [], placeholder, style, multiline = true }) {
  const [showMen, setShowMen] = React.useState(false);
  const [buscaMen, setBuscaMen] = React.useState('');
  const [posAt, setPosAt] = React.useState(0);
  const ref = React.useRef(null);

  const handleChange = (e) => {
    const v = e.target.value;
    const pos = e.target.selectionStart;
    onChange(v);
    const antes = v.slice(0, pos);
    const lastAt = antes.lastIndexOf('@');
    if (lastAt >= 0) {
      const apos = antes.slice(lastAt + 1);
      if (!/[\s\n]/.test(apos)) {
        setBuscaMen(apos);
        setPosAt(lastAt);
        setShowMen(true);
        return;
      }
    }
    setShowMen(false);
  };

  const inserir = (func) => {
    const antes = value.slice(0, posAt);
    const depois = value.slice(posAt + 1 + buscaMen.length);
    onChange(`${antes}@${func.nome} ${depois}`);
    setShowMen(false);
    setTimeout(() => ref.current?.focus(), 0);
  };

  const filtrados = funcionarios.filter(f =>
    buscaMen === '' || f.nome.toLowerCase().includes(buscaMen.toLowerCase())
  ).slice(0, 6);

  const Tag = multiline ? 'textarea' : 'input';

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <Tag ref={ref} value={value} onChange={handleChange} placeholder={placeholder}
        style={style}
        onBlur={() => setTimeout(() => setShowMen(false), 150)}
        onFocus={() => {}}
      />
      {showMen && filtrados.length > 0 && (
        <div style={{ position: 'absolute', bottom: multiline ? '100%' : 'calc(100% + 4px)', left: 0, width: 220, background: 'white', border: `1px solid ${SEC}50`, borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden' }}>
          <div style={{ padding: '6px 12px', fontSize: 10, letterSpacing: 1, color: '#aaa', borderBottom: '1px solid #f5f0e8', textTransform: 'uppercase', fontWeight: 600 }}>Mencionar</div>
          {filtrados.map(f => (
            <div key={f.id} onMouseDown={() => inserir(f)}
              style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #f5f0e8', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: `linear-gradient(135deg,${ASSESS.primary},${SEC})`, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {f.nome[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{f.nome}</div>
                {f.cargo && <div style={{ fontSize: 10, color: '#aaa' }}>{f.cargo}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── DETALHE DA TAREFA ─────────────────────────────────────────────────────────
function TarefaDetalhe({ dados, tarefaId, usuario, onVoltar, onAtualizar, onRemover, onAdicionarSubtarefa, onToggleSubtarefa, onRemoverSubtarefa, onAdicionarComentario }) {
  const t = (dados.tarefas||[]).find(x => x.id === tarefaId);
  if (!t) return <div style={{padding:48}}>Tarefa não encontrada.</div>;

  const status = STATUS_TAREFA.find(s => s.id === t.status);
  const prior = PRIORIDADES.find(p => p.id === t.prioridade);
  const lista = (dados.listas_tarefas||[]).find(l => l.id === t.lista);
  const resp = dados.funcionarios.find(f => f.id === t.responsavelId);
  const criador = dados.funcionarios.find(f => f.id === t.criadorId);

  const [novaSub, setNovaSub] = useState('');
  const [novoComentario, setNovoComentario] = useState('');
  const [editandoTitulo, setEditandoTitulo] = useState(false);
  const [tituloTemp, setTituloTemp] = useState(t.titulo);
  const [editandoDesc, setEditandoDesc] = useState(false);
  const [descTemp, setDescTemp] = useState(t.descricao || '');

  const subConcluidas = (t.subtarefas||[]).filter(s => s.concluida).length;
  const totalSub = (t.subtarefas||[]).length;
  const progresso = totalSub > 0 ? (subConcluidas / totalSub) * 100 : 0;

  return (
    <div style={{padding:"36px 48px 60px",maxWidth:1100,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <button onClick={onVoltar} style={{background:"none",border:"none",color:"#888",cursor:"pointer",fontSize:12,letterSpacing:1.5,textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}}>
          {I.arrowLeft} Voltar para Tarefas
        </button>
        <SubLink tela="tarefa_detalhe" param={tarefaId}/>
      </div>

      {/* HEADER */}
      <div style={{background:"white",borderRadius:18,padding:"28px 32px",border:"1px solid rgba(113,63,42,0.10)",borderLeft:`5px solid ${prior?.cor || '#94a3b8'}`,marginBottom:20}}>
        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
          {lista && <span style={{fontSize:10,padding:"4px 12px",borderRadius:99,background:`${lista.cor}14`,color:lista.cor,fontWeight:700,letterSpacing:.5}}>{lista.nome}</span>}
          <select value={t.status} onChange={e=>onAtualizar(t.id,{status:e.target.value, dataConclusao: e.target.value === 'concluida' ? today : null})}
            style={{fontSize:11,padding:"4px 12px",borderRadius:99,border:"none",background:`${status?.cor}18`,color:status?.cor,fontWeight:700,letterSpacing:.5,cursor:"pointer",fontFamily:SN}}>
            {STATUS_TAREFA.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          {t.tags?.map((tag,i) => (
            <span key={i} style={{fontSize:10,padding:"3px 8px",borderRadius:6,background:"#f1f5f9",color:"#64748b",fontWeight:600}}>#{tag}</span>
          ))}
        </div>

        {/* Título editável */}
        {editandoTitulo ? (
          <div style={{display:"flex",gap:8,marginBottom:6}}>
            <input style={{...inpStyle,fontFamily:FT,fontSize:24,fontWeight:300,padding:"8px 12px"}} value={tituloTemp} onChange={e=>setTituloTemp(e.target.value)} autoFocus
              onKeyDown={e=>{if(e.key==='Enter'){onAtualizar(t.id,{titulo:tituloTemp});setEditandoTitulo(false)}if(e.key==='Escape'){setTituloTemp(t.titulo);setEditandoTitulo(false)}}}/>
            <button onClick={()=>{onAtualizar(t.id,{titulo:tituloTemp});setEditandoTitulo(false)}} style={{padding:"0 14px",background:ASSESS.primary,color:"white",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:12}}>Salvar</button>
          </div>
        ) : (
          <h1 onClick={()=>setEditandoTitulo(true)} style={{fontFamily:FT,fontWeight:300,fontSize:32,color:"#1a1a1a",margin:"0 0 6px",letterSpacing:.3,cursor:"pointer",padding:"4px 0"}} title="Clique para editar">{t.titulo}</h1>
        )}

        <div style={{fontSize:12,color:"#888"}}>
          Criada por <strong>{criador?.nome || '—'}</strong> em {fmtDate(t.dataCriacao)}
          {t.dataConclusao && <> · Concluída em <strong>{fmtDate(t.dataConclusao)}</strong></>}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:20}}>
        {/* COLUNA ESQUERDA */}
        <div>
          {/* Descrição Rica */}
          <SectionTitle label="Descrição / Observações"/>
          <div style={{marginBottom:20}}>
            <RichEditor
              value={t.descricaoRich || (t.descricao ? `<p>${t.descricao}</p>` : '')}
              onChange={html => onAtualizar(t.id, { descricaoRich: html })}
              placeholder="Clique para escrever... Use a barra de ferramentas para formatar, criar tabelas, inserir imagens e links."
            />
          </div>

          {/* Subtarefas */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <SectionTitle label={`Subtarefas ${totalSub > 0 ? `(${subConcluidas}/${totalSub})` : ''}`}/>
            {totalSub > 0 && <span style={{fontSize:11,color:"#888"}}>{Math.round(progresso)}% concluído</span>}
          </div>

          {totalSub > 0 && (
            <div style={{height:6,background:"#f1f5f9",borderRadius:99,overflow:"hidden",marginBottom:14}}>
              <div style={{height:"100%",width:`${progresso}%`,background:progresso === 100 ? "#22c55e" : "#3b82f6",borderRadius:99,transition:"width .3s"}}/>
            </div>
          )}

          <div style={{background:"white",borderRadius:12,padding:"16px 20px",border:"1px solid rgba(113,63,42,0.10)",marginBottom:20}}>
            {(t.subtarefas||[]).map(s => (
              <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #f5f0e8"}}>
                <button onClick={()=>onToggleSubtarefa(t.id,s.id)} style={{width:18,height:18,borderRadius:4,border:`1.5px solid ${s.concluida?"#22c55e":"rgba(113,63,42,0.25)"}`,background:s.concluida?"#22c55e":"white",cursor:"pointer",display:"grid",placeItems:"center",color:"white",padding:0,flexShrink:0}}>
                  {s.concluida && <Ico size={11} d={<path d="M5 12l5 5L20 7"/>}/>}
                </button>
                <span style={{flex:1,fontSize:13,color:s.concluida?"#aaa":"#1a1a1a",textDecoration:s.concluida?"line-through":"none"}}>{s.titulo}</span>
                <button onClick={()=>onRemoverSubtarefa(t.id,s.id)} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",display:"flex",padding:4}}>{I.trash}</button>
              </div>
            ))}
            <div style={{display:"flex",gap:8,paddingTop:totalSub > 0 ? 12 : 0,marginTop:totalSub > 0 ? 4 : 0}}>
              <input style={{...inpStyle,padding:"8px 12px",fontSize:13}} value={novaSub} onChange={e=>setNovaSub(e.target.value)}
                placeholder="+ Adicionar subtarefa..."
                onKeyDown={e=>{if(e.key==='Enter'&&novaSub.trim()){onAdicionarSubtarefa(t.id,novaSub);setNovaSub('')}}}/>
              <button onClick={()=>{if(novaSub.trim()){onAdicionarSubtarefa(t.id,novaSub);setNovaSub('')}}} disabled={!novaSub.trim()}
                style={{padding:"0 14px",background:ASSESS.primary,color:"white",border:"none",borderRadius:8,cursor:novaSub.trim()?"pointer":"not-allowed",fontWeight:600,fontSize:12,opacity:novaSub.trim()?1:.5}}>Adicionar</button>
            </div>
          </div>

          {/* Comentários */}
          <SectionTitle label={`Comentários (${(t.comentarios||[]).length})`}/>
          <div style={{background:"white",borderRadius:12,padding:"18px 22px",border:"1px solid rgba(113,63,42,0.10)"}}>
            {(t.comentarios||[]).map(c => (
              <div key={c.id} style={{display:"flex",gap:12,padding:"12px 0",borderBottom:"1px solid #f5f0e8"}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${SEC},#8B6340)`,color:"white",display:"grid",placeItems:"center",fontSize:12,fontWeight:600,flexShrink:0}}>{c.autor[0]}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <strong style={{fontSize:12,color:"#1a1a1a"}}>{c.autor}</strong>
                    <span style={{fontSize:10,color:"#aaa"}}>{new Date(c.data).toLocaleString('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
                  </div>
                  <div style={{fontSize:13,color:"#555",lineHeight:1.6}}>{c.texto}</div>
                </div>
              </div>
            ))}
            <div style={{display:"flex",gap:8,paddingTop:(t.comentarios||[]).length > 0 ? 14 : 0,marginTop:(t.comentarios||[]).length > 0 ? 4 : 0}}>
              <MencaoInput
                value={novoComentario}
                onChange={setNovoComentario}
                funcionarios={dados.funcionarios||[]}
                placeholder="Adicione um comentário... Use @ para mencionar alguém"
                style={{...inpStyle,minHeight:60,resize:'vertical',fontFamily:SN,fontSize:13,lineHeight:1.5,width:'100%',boxSizing:'border-box'}}
              />
            </div>
            {novoComentario.trim() && (
              <div style={{display:"flex",gap:8,marginTop:8,justifyContent:"flex-end"}}>
                <button onClick={()=>setNovoComentario('')} style={{padding:"6px 14px",background:"transparent",border:"1px solid rgba(113,63,42,0.18)",borderRadius:6,cursor:"pointer",fontSize:11}}>Cancelar</button>
                <button onClick={()=>{
                  onAdicionarComentario(t.id,usuario.nome,novoComentario);
                  enviarMencoes(novoComentario, usuario.nome, `Tarefa: ${t.titulo}`, dados.funcionarios||[]);
                  setNovoComentario('');
                }} style={{padding:"6px 14px",background:ASSESS.primary,color:"white",border:"none",borderRadius:6,cursor:"pointer",fontWeight:600,fontSize:11}}>Comentar</button>
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div>
          <SectionTitle label="Detalhes"/>
          <div style={{background:"white",borderRadius:12,padding:"20px 22px",border:"1px solid rgba(113,63,42,0.10)",marginBottom:20}}>
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div>
                <label style={{...lblStyle,marginBottom:6}}>Responsável</label>
                <select value={t.responsavelId || ''} onChange={e=>onAtualizar(t.id,{responsavelId: e.target.value ? Number(e.target.value) : null})} style={inpStyle}>
                  <option value="">— Não atribuído —</option>
                  {dados.funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>

              <div>
                <label style={{...lblStyle,marginBottom:6}}>Lista</label>
                <select value={t.lista || ''} onChange={e=>onAtualizar(t.id,{lista:e.target.value})} style={inpStyle}>
                  {(dados.listas_tarefas||[]).map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                </select>
              </div>

              <div>
                <label style={{...lblStyle,marginBottom:6}}>Prioridade</label>
                <select value={t.prioridade || 'media'} onChange={e=>onAtualizar(t.id,{prioridade:e.target.value})} style={inpStyle}>
                  {PRIORIDADES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <label style={{...lblStyle,marginBottom:6}}>Início</label>
                  <input type="date" value={t.dataInicio || ''} onChange={e=>onAtualizar(t.id,{dataInicio:e.target.value})} style={inpStyle}/>
                </div>
                <div>
                  <label style={{...lblStyle,marginBottom:6}}>Prazo</label>
                  <input type="date" value={t.dataLimite || ''} onChange={e=>onAtualizar(t.id,{dataLimite:e.target.value})} style={inpStyle}/>
                </div>
              </div>

              <div>
                <label style={{...lblStyle,marginBottom:6}}>Tags (separadas por vírgula)</label>
                <input type="text" value={(t.tags||[]).join(', ')} onChange={e=>onAtualizar(t.id,{tags:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} style={inpStyle} placeholder="contrato, urgente, mensal"/>
              </div>
            </div>

            <div style={{borderTop:"1px solid #f5f0e8",marginTop:18,paddingTop:14}}>
              <button onClick={()=>{if(confirm('Tem certeza que deseja remover esta tarefa?'))onRemover(t.id)}} style={{background:"#fee2e2",color:"#dc2626",border:"none",padding:"10px 16px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {I.trash} Excluir tarefa
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── HUB DE SOLICITAÇÕES (admin) ───────────────────────────────────────────────
const STATUS_SOL = [
  { id: 'novo', label: 'Novo', cor: '#3b82f6' },
  { id: 'em_atendimento', label: 'Em Atendimento', cor: '#f59e0b' },
  { id: 'qualificado', label: 'Qualificado', cor: '#a855f7' },
  { id: 'convertido', label: 'Convertido', cor: '#22c55e' },
  { id: 'descartado', label: 'Descartado', cor: '#94a3b8' },
];

const TIPOS_SOLICITACAO = [
  { id: 'compras',     label: 'Compras / Materiais' },
  { id: 'rh',         label: 'Recursos Humanos' },
  { id: 'financeiro', label: 'Financeiro / Pagamento' },
  { id: 'ti',         label: 'TI / Sistemas' },
  { id: 'juridico',   label: 'Jurídico / Contratos' },
  { id: 'facilities', label: 'Infraestrutura / Facilities' },
  { id: 'outros',     label: 'Outros' },
];

function FormSolicitacaoAdmin({ dados, onAdicionarTarefa, usuario }) {
  const [tipo, setTipo] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState('media');
  const [dataLimite, setDataLimite] = useState(addDays(today, 3));
  const [enviado, setEnviado] = useState(false);

  const admins = dados.funcionarios.filter(f => f.role === 'admin' || f.role === 'administrativo');
  const responsavelId = admins[0]?.id || dados.funcionarios[0]?.id || null;

  const submit = (e) => {
    e.preventDefault();
    if (!tipo) return alert('Selecione o tipo de solicitação');
    if (!titulo.trim()) return alert('Informe o assunto');

    const tipoLabel = TIPOS_SOLICITACAO.find(t => t.id === tipo)?.label || tipo;
    onAdicionarTarefa({
      titulo:       `[${tipoLabel}] ${titulo}`,
      descricao:    descricao + (usuario?.nome ? `\n\nSolicitado por: ${usuario.nome}` : ''),
      lista:        'administrativo',
      prioridade,
      dataInicio:   today,
      dataLimite,
      responsavelId,
      criadorId:    dados.funcionarios.find(f => f.email === usuario?.email)?.id || null,
      status:       'pendente',
      tags:         ['solicitacao-admin', tipo],
    });
    setEnviado(true);
  };

  if (enviado) return (
    <div style={{background:"white",borderRadius:14,border:"1px solid rgba(113,63,42,0.10)",padding:"80px 40px",textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16}}>✅</div>
      <h2 style={{fontFamily:FT,fontWeight:300,fontSize:28,color:"#1a1a1a",marginBottom:8}}>Solicitação enviada!</h2>
      <p style={{color:"#888",fontSize:14,marginBottom:32}}>Sua tarefa foi criada e encaminhada para o time administrativo.</p>
      <button onClick={()=>{setEnviado(false);setTipo('');setTitulo('');setDescricao('');setPrioridade('media');setDataLimite(addDays(today,3));}}
        style={{padding:"10px 28px",borderRadius:8,border:"none",background:ASSESS.primary,color:"white",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:SN}}>
        Nova Solicitação
      </button>
    </div>
  );

  return (
    <div style={{background:"white",borderRadius:14,border:"1px solid rgba(113,63,42,0.10)",padding:"36px 40px",maxWidth:700}}>
      <h3 style={{fontFamily:FT,fontWeight:300,fontSize:22,color:"#1a1a1a",marginBottom:6}}>Nova Solicitação Administrativa</h3>
      <p style={{fontSize:13,color:"#888",marginBottom:28}}>Preencha o formulário e sua solicitação será encaminhada automaticamente como tarefa para o time ADM.</p>

      <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:18}}>
        <div>
          <div style={{fontSize:11,letterSpacing:1.5,textTransform:"uppercase",color:"#aaa",marginBottom:8}}>Tipo de solicitação *</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {TIPOS_SOLICITACAO.map(t => (
              <button type="button" key={t.id} onClick={()=>setTipo(t.id)}
                style={{padding:"10px 8px",borderRadius:8,border:`1.5px solid ${tipo===t.id?ASSESS.primary:"rgba(113,63,42,0.18)"}`,background:tipo===t.id?`${ASSESS.primary}14`:"white",color:tipo===t.id?ASSESS.primary:"#666",fontSize:12,fontWeight:tipo===t.id?700:400,cursor:"pointer",textAlign:"center",fontFamily:SN}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{fontSize:11,letterSpacing:1.5,textTransform:"uppercase",color:"#aaa",marginBottom:6}}>Assunto *</div>
          <input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Descreva brevemente o que precisa"
            style={{width:"100%",padding:"10px 14px",border:"1.5px solid #e5e7eb",borderRadius:8,fontSize:13,fontFamily:SN,boxSizing:"border-box"}}/>
        </div>

        <div>
          <div style={{fontSize:11,letterSpacing:1.5,textTransform:"uppercase",color:"#aaa",marginBottom:6}}>Detalhes</div>
          <textarea value={descricao} onChange={e=>setDescricao(e.target.value)} rows={4}
            placeholder="Contexto, links, valores, anexos necessários..."
            style={{width:"100%",padding:"10px 14px",border:"1.5px solid #e5e7eb",borderRadius:8,fontSize:13,fontFamily:SN,resize:"vertical",lineHeight:1.6,boxSizing:"border-box"}}/>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div>
            <div style={{fontSize:11,letterSpacing:1.5,textTransform:"uppercase",color:"#aaa",marginBottom:8}}>Prioridade</div>
            <div style={{display:"flex",gap:6}}>
              {PRIORIDADES.map(p => (
                <button type="button" key={p.id} onClick={()=>setPrioridade(p.id)}
                  style={{flex:1,padding:"8px 4px",borderRadius:7,border:`1.5px solid ${prioridade===p.id?p.cor:"rgba(113,63,42,0.18)"}`,background:prioridade===p.id?`${p.cor}14`:"white",color:prioridade===p.id?p.cor:"#888",fontSize:11,fontWeight:prioridade===p.id?700:400,cursor:"pointer",fontFamily:SN}}>
                  {p.icone}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:11,letterSpacing:1.5,textTransform:"uppercase",color:"#aaa",marginBottom:6}}>Preciso até</div>
            <input type="date" value={dataLimite} onChange={e=>setDataLimite(e.target.value)}
              style={{width:"100%",padding:"9px 12px",border:"1.5px solid #e5e7eb",borderRadius:8,fontSize:13,fontFamily:SN,boxSizing:"border-box"}}/>
          </div>
        </div>

        <button type="submit"
          style={{padding:"12px 32px",borderRadius:9,border:"none",background:ASSESS.primary,color:"white",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:SN,alignSelf:"flex-start",marginTop:4}}>
          Enviar Solicitação
        </button>
      </form>
    </div>
  );
}

function HubSolicitacoes({ dados, onAtualizar, onRemover, onConverter, onAdicionarTarefa, setTela, usuario }) {
  const [aba, setAba] = useState('formulario');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [solSelecionada, setSolSelecionada] = useState(null);

  const solicitacoes = (dados.solicitacoes||[]).filter(s => {
    if (filtroStatus !== 'todos' && s.status !== filtroStatus) return false;
    return true;
  }).sort((a,b) => b.dataRecebimento.localeCompare(a.dataRecebimento));

  const novas = (dados.solicitacoes||[]).filter(s => s.status === 'novo').length;
  const emAtendimento = (dados.solicitacoes||[]).filter(s => s.status === 'em_atendimento').length;
  const resolvidas = (dados.solicitacoes||[]).filter(s => s.status === 'convertido').length;

  const tabStyle = (id) => ({
    padding:"9px 22px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:aba===id?700:400,
    background:aba===id?ASSESS.primary:"transparent", color:aba===id?"white":"#888", fontFamily:SN, transition:"all .15s",
  });

  return (
    <div style={{padding:"36px 48px 60px",maxWidth:1200,margin:"0 auto"}}>
      <PageHeader
        etiqueta="Administrativo"
        titulo="Solicitações"
        destaque="Internas"
        sub="Central de solicitações administrativas da equipe."
      />

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:28}}>
        <KpiCard label="Novas" value={novas} sub="aguardando atendimento" accent="#3b82f6"/>
        <KpiCard label="Em Atendimento" value={emAtendimento} sub="sendo trabalhadas" accent="#f59e0b"/>
        <KpiCard label="Resolvidas" value={resolvidas} sub="concluídas" accent="#22c55e"/>
      </div>

      {/* Abas */}
      <div style={{display:"flex",gap:6,marginBottom:20,background:"#F5F0E8",borderRadius:10,padding:4,width:"fit-content"}}>
        <button style={tabStyle('formulario')} onClick={()=>setAba('formulario')}>Nova Solicitação</button>
        <button style={tabStyle('lista')} onClick={()=>setAba('lista')}>
          Solicitações{novas>0?` (${novas} novas)`:''}
        </button>
      </div>

      {/* Aba: Formulário */}
      {aba === 'formulario' && <FormSolicitacaoAdmin dados={dados} onAdicionarTarefa={onAdicionarTarefa} usuario={usuario}/>}

      {/* Aba: Lista de solicitações */}
      {aba === 'lista' && (
        <>
          <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
            {[{id:'todos',label:'Todos'},...STATUS_SOL].map(s => (
              <button key={s.id} onClick={()=>setFiltroStatus(s.id)}
                style={{padding:"7px 14px",borderRadius:8,border:`1.5px solid ${filtroStatus===s.id?(s.cor||ASSESS.primary):"rgba(113,63,42,0.18)"}`,background:filtroStatus===s.id?`${s.cor||ASSESS.primary}14`:"white",color:filtroStatus===s.id?(s.cor||ASSESS.primary):"#888",fontSize:12,fontWeight:filtroStatus===s.id?700:400,cursor:"pointer"}}>
                {s.label}
              </button>
            ))}
          </div>

          <div style={{display:"grid",gridTemplateColumns:solSelecionada ? "1fr 1.5fr" : "1fr",gap:14,minHeight:400}}>
            <div style={{background:"white",borderRadius:14,border:"1px solid rgba(113,63,42,0.10)",overflow:"hidden",height:"fit-content",maxHeight:"calc(100vh - 380px)",overflowY:"auto"}}>
              {solicitacoes.length === 0 && (
                <div style={{padding:60,textAlign:"center",color:"#aaa",fontSize:13}}>Nenhuma solicitação encontrada</div>
              )}
              {solicitacoes.map(sol => {
                const form = (dados.formularios_publicos||[]).find(f => f.id === sol.formularioId);
                const status = STATUS_SOL.find(s => s.id === sol.status);
                const nome = sol.dados.razao_social || sol.dados.nome || sol.dados.nome_responsavel || '—';
                const isSelected = solSelecionada?.id === sol.id;
                return (
                  <div key={sol.id} onClick={()=>setSolSelecionada(sol)}
                    style={{padding:"16px 20px",borderBottom:"1px solid #f5f0e8",cursor:"pointer",background:isSelected?`${ASSESS.primary}08`:"transparent",borderLeft:isSelected?`3px solid ${ASSESS.primary}`:"3px solid transparent",transition:"all .15s"}}
                    onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.background="#FAF8F3"}}
                    onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.background="transparent"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                      <span style={{fontSize:9,padding:"3px 8px",borderRadius:99,background:`${status?.cor}18`,color:status?.cor,fontWeight:700,letterSpacing:.5}}>{status?.label}</span>
                      <span style={{fontSize:10,color:"#aaa"}}>{new Date(sol.dataRecebimento).toLocaleString('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
                    </div>
                    <div style={{fontSize:14,fontWeight:600,color:"#1a1a1a",marginBottom:4}}>{nome}</div>
                    {form && <div style={{fontSize:11,color:"#888",marginBottom:6}}>{form.titulo}</div>}
                    <div style={{fontSize:11,color:"#666",display:"flex",gap:10,flexWrap:"wrap"}}>
                      {sol.dados.email && <span>📧 {sol.dados.email}</span>}
                      {sol.dados.telefone && <span>📱 {sol.dados.telefone}</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {solSelecionada && (
              <div style={{background:"white",borderRadius:14,border:"1px solid rgba(113,63,42,0.10)",padding:"24px 28px",height:"fit-content"}}>
                <DetalheSolicitacao sol={solSelecionada} dados={dados} onAtualizar={onAtualizar} onRemover={(id)=>{onRemover(id);setSolSelecionada(null)}} onConverter={onConverter} onFechar={()=>setSolSelecionada(null)}/>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function DetalheSolicitacao({ sol, dados, onAtualizar, onRemover, onConverter, onFechar }) {
  const form = (dados.formularios_publicos||[]).find(f => f.id === sol.formularioId);
  const status = STATUS_SOL.find(s => s.id === sol.status);
  const resp = dados.funcionarios.find(f => f.id === sol.responsavelId);
  const nome = sol.dados.razao_social || sol.dados.nome || sol.dados.nome_responsavel || '—';

  const [obsTemp, setObsTemp] = useState(sol.observacoes || '');

  const handleConverter = () => {
    if (sol.leadGerado) { alert('Lead já foi gerado para esta solicitação.'); return; }
    if (confirm('Converter solicitação em lead no CRM? Será criado um novo contato.')) {
      onConverter(sol.id);
    }
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:form?.cor || ASSESS.primary,fontWeight:600,marginBottom:8}}>{form?.titulo}</div>
          <h2 style={{fontFamily:FT,fontWeight:300,fontSize:26,color:"#1a1a1a",margin:0}}>{nome}</h2>
          <div style={{fontSize:11,color:"#888",marginTop:4}}>Recebida em {new Date(sol.dataRecebimento).toLocaleString('pt-BR')}</div>
        </div>
        <button onClick={onFechar} style={{background:"none",border:"none",color:"#aaa",cursor:"pointer",display:"flex",padding:6}}>{I.x}</button>
      </div>

      {/* Status + Atribuição */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20,padding:"16px 18px",background:"#FAF8F3",borderRadius:10}}>
        <div>
          <label style={{...lblStyle,marginBottom:6}}>Status</label>
          <select value={sol.status} onChange={e=>onAtualizar(sol.id,{status:e.target.value})} style={inpStyle}>
            {STATUS_SOL.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{...lblStyle,marginBottom:6}}>Responsável</label>
          <select value={sol.responsavelId || ''} onChange={e=>onAtualizar(sol.id,{responsavelId: e.target.value ? Number(e.target.value) : null, dataAtribuicao: e.target.value ? new Date().toISOString() : null})} style={inpStyle}>
            <option value="">— Não atribuído —</option>
            {dados.funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </div>
      </div>

      {/* Dados do formulário */}
      <SectionTitle label="Dados Recebidos"/>
      <div style={{background:"#FAF8F3",borderRadius:10,padding:"18px 20px",marginBottom:20,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {(form?.campos || []).map(campo => {
          const valor = sol.dados[campo.id];
          if (valor === undefined || valor === '') return null;
          return (
            <div key={campo.id} style={{gridColumn: campo.tipo === 'textarea' ? "span 2" : "span 1"}}>
              <div style={{fontSize:9,letterSpacing:1.5,color:"#aaa",fontWeight:600,marginBottom:4,textTransform:"uppercase"}}>{campo.label}</div>
              <div style={{fontSize:13,color:"#1a1a1a",fontWeight:500,wordBreak:"break-word"}}>{typeof valor === 'number' ? fmtR(valor) : valor}</div>
            </div>
          );
        })}
      </div>

      {/* Observações internas */}
      <SectionTitle label="Observações Internas"/>
      <textarea
        value={obsTemp}
        onChange={e=>setObsTemp(e.target.value)}
        onBlur={()=>onAtualizar(sol.id,{observacoes:obsTemp})}
        style={{...inpStyle,minHeight:80,resize:'vertical',fontFamily:SN,lineHeight:1.6,marginBottom:20}}
        placeholder="Anotações sobre o atendimento..."
      />

      {/* Ações */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        {sol.dados.telefone && (
          <a href={`https://wa.me/${sol.dados.telefone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
            style={{padding:"10px 16px",background:"#25D366",color:"white",borderRadius:8,textDecoration:"none",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:8}}>
            {I.whats} WhatsApp
          </a>
        )}
        {sol.dados.email && (
          <a href={`mailto:${sol.dados.email}`}
            style={{padding:"10px 16px",background:VAREJO.primary,color:"white",borderRadius:8,textDecoration:"none",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:8}}>
            {I.mail} E-mail
          </a>
        )}
        {!sol.leadGerado && (
          <button onClick={handleConverter}
            style={{padding:"10px 16px",background:"#22c55e",color:"white",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
            {I.users} Converter em Lead
          </button>
        )}
        {sol.leadGerado && (
          <div style={{padding:"10px 16px",background:"#dcfce7",color:"#16a34a",borderRadius:8,fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:8}}>
            {I.check} Lead criado no CRM
          </div>
        )}
        <button onClick={()=>{if(confirm('Remover solicitação?'))onRemover(sol.id)}}
          style={{padding:"10px 16px",background:"transparent",color:"#dc2626",border:"1px solid #fee2e2",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:8,marginLeft:"auto"}}>
          {I.trash} Excluir
        </button>
      </div>
    </div>
  );
}

// ── HUB PÚBLICO (preview) ─────────────────────────────────────────────────────
function HubPublico({ dados, onSelecionarForm }) {
  const formsAtivos = (dados.formularios_publicos||[]).filter(f => f.ativo);

  return (
    <div style={{minHeight:"100%",background:"#0E0E0E",color:"white"}}>
      {/* PREVIEW BANNER */}
      <div style={{background:"linear-gradient(135deg, #f59e0b, #fbbf24)",padding:"12px 24px",fontSize:12,color:"#1a1a1a",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
        {I.alert} <strong>Preview do Hub Público</strong> — esta é a página que seus clientes verão. Cada formulário é compartilhável por link.
      </div>

      <div style={{padding:"60px 32px 80px",maxWidth:1100,margin:"0 auto"}}>
        {/* HERO */}
        <div style={{textAlign:"center",marginBottom:60}}>
          <AxLogo height={48} dark style={{margin:"0 auto",marginBottom:32}}/>
          <div style={{fontSize:11,letterSpacing:6,color:SEC,fontWeight:600,marginBottom:18,textTransform:"uppercase"}}>Hub de Soluções Financeiras</div>
          <h1 style={{fontFamily:FT,fontWeight:300,fontSize:54,color:"white",margin:0,lineHeight:1.1,marginBottom:20,letterSpacing:.3}}>
            Como podemos te <em style={{color:SEC,fontStyle:"italic"}}>ajudar?</em>
          </h1>
          <p style={{fontSize:15,color:"rgba(255,255,255,0.7)",maxWidth:600,margin:"0 auto",lineHeight:1.7}}>
            Selecione abaixo o tipo de solução que mais se adequa ao seu objetivo. Sua solicitação chegará à nossa equipe em tempo real.
          </p>
        </div>

        {/* CARDS DE FORMULÁRIOS */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))",gap:16,marginBottom:60}}>
          {formsAtivos.map(form => (
            <div key={form.id} onClick={()=>onSelecionarForm(form.slug)}
              style={{
                background:"rgba(255,255,255,0.03)",
                backdropFilter:"blur(10px)",
                border:"1px solid rgba(255,255,255,0.08)",
                borderRadius:18,
                padding:"32px 28px",
                cursor:"pointer",
                transition:"all .25s",
                position:"relative",
                overflow:"hidden",
              }}
              onMouseEnter={e=>{
                e.currentTarget.style.borderColor = form.cor;
                e.currentTarget.style.background = `linear-gradient(135deg, ${form.cor}14, rgba(255,255,255,0.03))`;
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={e=>{
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                e.currentTarget.style.transform = "none";
              }}>
              <div style={{position:"absolute",top:-30,right:-30,width:100,height:100,borderRadius:"50%",background:`${form.cor}30`,filter:"blur(40px)",pointerEvents:"none"}}/>
              <div style={{position:"relative",zIndex:1}}>
                <div style={{display:"inline-flex",width:48,height:48,borderRadius:14,background:form.cor,color:"white",alignItems:"center",justifyContent:"center",marginBottom:18,boxShadow:`0 12px 30px -12px ${form.cor}88`}}>
                  {form.categoria === 'atacado' ? I.briefcase : form.categoria === 'varejo' ? I.user : I.mail}
                </div>
                <div style={{fontSize:10,letterSpacing:3,color:form.cor,fontWeight:700,marginBottom:10,textTransform:"uppercase"}}>{form.categoria}</div>
                <h3 style={{fontFamily:FT,fontWeight:300,fontSize:24,color:"white",margin:"0 0 12px",lineHeight:1.2}}>{form.titulo}</h3>
                <p style={{fontSize:13,color:"rgba(255,255,255,0.65)",lineHeight:1.7,marginBottom:20}}>{form.descricao}</p>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:16,borderTop:"1px solid rgba(255,255,255,0.08)"}}>
                  <span style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>{form.campos.length} campos</span>
                  <span style={{fontSize:12,color:form.cor,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
                    Iniciar {I.arrow}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div style={{textAlign:"center",padding:"40px 0",borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{display:"flex",justifyContent:"center",gap:24,marginBottom:20,flexWrap:"wrap"}}>
            <a href="#" style={{fontSize:11,color:"rgba(255,255,255,0.5)",textDecoration:"none",letterSpacing:2,textTransform:"uppercase"}}>Política de Privacidade</a>
            <a href="#" style={{fontSize:11,color:"rgba(255,255,255,0.5)",textDecoration:"none",letterSpacing:2,textTransform:"uppercase"}}>LGPD</a>
            <a href="#" style={{fontSize:11,color:"rgba(255,255,255,0.5)",textDecoration:"none",letterSpacing:2,textTransform:"uppercase"}}>Termos</a>
          </div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",letterSpacing:1}}>
            © 2026 Áxicon Soluções Financeiras · Todos os direitos reservados
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FORMULÁRIO PÚBLICO (preview) ──────────────────────────────────────────────
function FormularioPublico({ dados, slug, onVoltar, onEnviar }) {
  const form = (dados.formularios_publicos||[]).find(f => f.slug === slug);
  const [respostas, setRespostas] = useState({});
  const [enviado, setEnviado] = useState(false);
  const [step, setStep] = useState(0);

  if (!form) {
    return (
      <div style={{minHeight:"100%",background:"#0E0E0E",color:"white",padding:60,textAlign:"center"}}>
        <div style={{fontSize:18,marginBottom:16}}>Formulário não encontrado</div>
        <Btn onClick={onVoltar}>Voltar ao Hub</Btn>
      </div>
    );
  }

  const camposPorPagina = 5;
  const totalPaginas = Math.ceil(form.campos.length / camposPorPagina);
  const camposAtuais = form.campos.slice(step * camposPorPagina, (step + 1) * camposPorPagina);
  const isUltimaPagina = step === totalPaginas - 1;
  const progresso = ((step + 1) / totalPaginas) * 100;

  // Validação dos campos da página atual
  const podeAvancar = camposAtuais.every(c => !c.obrigatorio || (respostas[c.id] && respostas[c.id].toString().trim()));

  const submit = () => {
    const camposFaltantes = form.campos.filter(c => c.obrigatorio && (!respostas[c.id] || respostas[c.id].toString().trim() === ''));
    if (camposFaltantes.length > 0) {
      alert(`Preencha os campos obrigatórios: ${camposFaltantes.map(c => c.label).join(', ')}`);
      return;
    }
    onEnviar(form.id, respostas);
    setEnviado(true);
  };

  if (enviado) {
    return (
      <div style={{minHeight:"100%",background:"#0E0E0E",color:"white",display:"flex",alignItems:"center",justifyContent:"center",padding:40}}>
        <div style={{textAlign:"center",maxWidth:540}}>
          <div style={{display:"inline-flex",width:80,height:80,borderRadius:"50%",background:`${form.cor}20`,color:form.cor,alignItems:"center",justifyContent:"center",marginBottom:28,fontSize:32}}>
            <Ico size={40} d={<path d="M5 12l5 5L20 7"/>}/>
          </div>
          <h1 style={{fontFamily:FT,fontWeight:300,fontSize:42,margin:"0 0 16px",letterSpacing:.3}}>
            Solicitação <em style={{color:SEC,fontStyle:"italic"}}>recebida.</em>
          </h1>
          <p style={{fontSize:15,color:"rgba(255,255,255,0.7)",lineHeight:1.7,marginBottom:32}}>
            Sua solicitação foi recebida com sucesso. Nossa equipe da Áxicon entrará em contato em até <strong style={{color:"white"}}>24 horas úteis</strong> para conduzir os próximos passos.
          </p>
          <div style={{padding:"20px 24px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,marginBottom:32,textAlign:"left"}}>
            <div style={{fontSize:10,letterSpacing:3,color:SEC,fontWeight:600,marginBottom:10,textTransform:"uppercase"}}>Próximos Passos</div>
            <ol style={{margin:0,paddingLeft:20,fontSize:13,color:"rgba(255,255,255,0.75)",lineHeight:2}}>
              <li>Análise inicial da solicitação pelo nosso time especializado</li>
              <li>Contato direto via WhatsApp ou e-mail para alinhamento</li>
              <li>Estruturação personalizada da operação</li>
            </ol>
          </div>
          <Btn onClick={onVoltar} icon={I.arrowLeft}>Voltar ao Hub</Btn>
        </div>
      </div>
    );
  }

  const renderCampo = (campo) => {
    const valor = respostas[campo.id] || '';
    const onChange = (v) => setRespostas(r => ({...r, [campo.id]: v}));

    const baseStyle = {
      width: "100%",
      padding: "14px 18px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 10,
      color: "white",
      fontSize: 14,
      fontFamily: SN,
      outline: "none",
      transition: "all .2s",
      boxSizing: "border-box",
    };

    switch (campo.tipo) {
      case 'textarea':
        return <textarea style={{...baseStyle,minHeight:100,resize:"vertical",lineHeight:1.6}} value={valor} onChange={e=>onChange(e.target.value)} placeholder={campo.placeholder}/>;
      case 'select':
        return (
          <select style={{...baseStyle,cursor:"pointer"}} value={valor} onChange={e=>onChange(e.target.value)}>
            <option value="" style={{background:"#1a1a1a"}}>— Selecione uma opção —</option>
            {(Array.isArray(campo.opcoes) ? campo.opcoes : (campo.opcoes||'').split(',').map(s=>s.trim()).filter(Boolean)).map(opt => <option key={opt} value={opt} style={{background:"#1a1a1a"}}>{opt}</option>)}
          </select>
        );
      case 'radio':
        return (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {(Array.isArray(campo.opcoes) ? campo.opcoes : (campo.opcoes||'').split(',').map(s=>s.trim()).filter(Boolean)).map(opt => (
              <label key={opt} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",background:valor === opt ? `${form.cor}18` : "rgba(255,255,255,0.04)",border:`1px solid ${valor === opt ? form.cor : "rgba(255,255,255,0.12)"}`,borderRadius:10,cursor:"pointer",transition:"all .2s",fontSize:14}}>
                <span style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${valor === opt ? form.cor : "rgba(255,255,255,0.4)"}`,background:valor === opt ? form.cor : "transparent",flexShrink:0,position:"relative"}}>
                  {valor === opt && <span style={{position:"absolute",top:3,left:3,width:8,height:8,borderRadius:"50%",background:"white"}}/>}
                </span>
                <span style={{color:valor === opt ? "white" : "rgba(255,255,255,0.85)"}}>{opt}</span>
                <input type="radio" name={campo.id} value={opt} checked={valor === opt} onChange={e=>onChange(e.target.value)} style={{display:"none"}}/>
              </label>
            ))}
          </div>
        );
      case 'numero':
        return <input type="number" style={baseStyle} value={valor} onChange={e=>onChange(e.target.value)} placeholder={campo.placeholder}/>;
      case 'email':
        return <input type="email" style={baseStyle} value={valor} onChange={e=>onChange(e.target.value)} placeholder={campo.placeholder || "seu@email.com"}/>;
      case 'telefone':
        return <input type="tel" style={baseStyle} value={valor} onChange={e=>onChange(e.target.value)} placeholder={campo.placeholder || "(00) 00000-0000"}/>;
      case 'data':
        return <input type="date" style={baseStyle} value={valor} onChange={e=>onChange(e.target.value)}/>;
      default:
        return <input type="text" style={baseStyle} value={valor} onChange={e=>onChange(e.target.value)} placeholder={campo.placeholder}/>;
    }
  };

  return (
    <div style={{minHeight:"100%",background:"#0E0E0E",color:"white"}}>
      {/* Banner Preview */}
      <div style={{background:"linear-gradient(135deg, #f59e0b, #fbbf24)",padding:"10px 24px",fontSize:11,color:"#1a1a1a",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
        {I.alert} Preview do Formulário Público — esta é a experiência do cliente
      </div>

      {/* HEADER */}
      <div style={{padding:"32px 24px 24px",borderBottom:"1px solid rgba(255,255,255,0.08)",background:"rgba(0,0,0,0.5)"}}>
        <div style={{maxWidth:720,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={onVoltar} style={{background:"none",border:"none",color:"rgba(255,255,255,0.6)",cursor:"pointer",fontSize:11,letterSpacing:2,textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}}>
            {I.arrowLeft} Voltar
          </button>
          <AxLogo height={28} dark/>
        </div>
      </div>

      {/* FORMULÁRIO */}
      <div style={{padding:"40px 24px 60px",maxWidth:720,margin:"0 auto"}}>
        <div style={{marginBottom:32}}>
          <div style={{fontSize:10,letterSpacing:4,color:form.cor,fontWeight:700,marginBottom:14,textTransform:"uppercase"}}>{form.categoria === 'atacado' ? 'Pessoa Jurídica' : form.categoria === 'varejo' ? 'Pessoa Física' : 'Geral'}</div>
          <h1 style={{fontFamily:FT,fontWeight:300,fontSize:38,margin:"0 0 14px",lineHeight:1.15,letterSpacing:.3}}>{form.titulo}</h1>
          <p style={{fontSize:14,color:"rgba(255,255,255,0.65)",lineHeight:1.7,margin:0}}>{form.descricao}</p>
        </div>

        {/* Progresso */}
        {totalPaginas > 1 && (
          <div style={{marginBottom:32}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"rgba(255,255,255,0.5)",marginBottom:8,letterSpacing:1.5,textTransform:"uppercase",fontWeight:600}}>
              <span>Etapa {step + 1} de {totalPaginas}</span>
              <span>{Math.round(progresso)}% completo</span>
            </div>
            <div style={{height:4,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${progresso}%`,background:`linear-gradient(90deg, ${form.cor}, ${SEC})`,borderRadius:99,transition:"width .4s"}}/>
            </div>
          </div>
        )}

        {/* Campos */}
        <div style={{display:"flex",flexDirection:"column",gap:24}}>
          {camposAtuais.map(campo => (
            <div key={campo.id}>
              <label style={{display:"block",fontSize:13,fontWeight:500,color:"rgba(255,255,255,0.85)",marginBottom:10}}>
                {campo.label} {campo.obrigatorio && <span style={{color:form.cor}}>*</span>}
              </label>
              {renderCampo(campo)}
            </div>
          ))}
        </div>

        {/* Botões */}
        <div style={{display:"flex",justifyContent:"space-between",marginTop:40,gap:12}}>
          {step > 0 ? (
            <button onClick={()=>setStep(s => s-1)} style={{padding:"14px 28px",background:"transparent",border:"1px solid rgba(255,255,255,0.2)",borderRadius:10,color:"white",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:SN,letterSpacing:1}}>
              {I.arrowLeft} Voltar
            </button>
          ) : <div/>}

          {!isUltimaPagina ? (
            <button onClick={()=>setStep(s => s+1)} disabled={!podeAvancar}
              style={{padding:"14px 32px",background:podeAvancar?form.cor:"rgba(255,255,255,0.08)",border:"none",borderRadius:10,color:"white",fontSize:13,fontWeight:600,cursor:podeAvancar?"pointer":"not-allowed",display:"flex",alignItems:"center",gap:8,fontFamily:SN,letterSpacing:1,boxShadow:podeAvancar?`0 12px 30px -10px ${form.cor}88`:"none",opacity:podeAvancar?1:.5}}>
              Continuar {I.arrow}
            </button>
          ) : (
            <button onClick={submit} disabled={!podeAvancar}
              style={{padding:"14px 32px",background:podeAvancar?`linear-gradient(135deg, ${form.cor}, ${SEC})`:"rgba(255,255,255,0.08)",border:"none",borderRadius:10,color:"white",fontSize:13,fontWeight:600,cursor:podeAvancar?"pointer":"not-allowed",display:"flex",alignItems:"center",gap:8,fontFamily:SN,letterSpacing:1,boxShadow:podeAvancar?`0 12px 30px -10px ${form.cor}88`:"none",opacity:podeAvancar?1:.5}}>
              {I.send} Enviar Solicitação
            </button>
          )}
        </div>

        {/* Info de privacidade */}
        <div style={{marginTop:32,padding:"16px 20px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,fontSize:11,color:"rgba(255,255,255,0.55)",lineHeight:1.7}}>
          🔒 Suas informações são protegidas pela LGPD. Utilizamos os dados apenas para entrar em contato e estruturar a melhor solução para você.
        </div>
      </div>
    </div>
  );
}

// ── MODAL NOVA TAREFA ─────────────────────────────────────────────────────────
function ModalTarefa({ funcionarios, listas, onSalvar, onFechar }) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [lista, setLista] = useState(listas[0]?.id || 'administrativo');
  const [responsavelId, setResponsavelId] = useState(funcionarios[0]?.id || '');
  const [prioridade, setPrioridade] = useState('media');
  const [dataInicio, setDataInicio] = useState(today);
  const [dataLimite, setDataLimite] = useState(addDays(today, 7));
  const [tags, setTags] = useState('');

  const submit = () => {
    if (!titulo.trim()) return alert('Título obrigatório');
    onSalvar({
      titulo, descricao, lista, prioridade, dataInicio, dataLimite,
      responsavelId: responsavelId ? Number(responsavelId) : null,
      criadorId: funcionarios[0]?.id || 1,
      status: 'pendente',
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });
  };

  return (
    <Modal titulo="Nova Tarefa" onFechar={onFechar} large>
      <Field label="Título"><input style={inpStyle} value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Ex: Revisar contrato cliente XYZ" autoFocus/></Field>
      <Field label="Descrição">
        <textarea style={{...inpStyle,minHeight:80,fontFamily:SN,resize:'vertical',lineHeight:1.6}} value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder="Detalhes sobre a tarefa, contexto, links importantes..."/>
      </Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field label="Lista">
          <select style={inpStyle} value={lista} onChange={e=>setLista(e.target.value)}>
            {listas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        </Field>
        <Field label="Responsável">
          <select style={inpStyle} value={responsavelId} onChange={e=>setResponsavelId(e.target.value)}>
            <option value="">— Não atribuído —</option>
            {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Prioridade">
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {PRIORIDADES.map(p => (
            <button key={p.id} onClick={()=>setPrioridade(p.id)} style={{padding:"10px 8px",borderRadius:8,border:`1.5px solid ${prioridade===p.id?p.cor:"rgba(113,63,42,0.18)"}`,background:prioridade===p.id?`${p.cor}14`:"white",color:prioridade===p.id?p.cor:"#888",fontSize:12,fontWeight:prioridade===p.id?700:500,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              {p.icone} {p.label}
            </button>
          ))}
        </div>
      </Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field label="Data Início"><input type="date" style={inpStyle} value={dataInicio} onChange={e=>setDataInicio(e.target.value)}/></Field>
        <Field label="Prazo"><input type="date" style={inpStyle} value={dataLimite} onChange={e=>setDataLimite(e.target.value)}/></Field>
      </div>
      <Field label="Tags (separadas por vírgula)">
        <input style={inpStyle} value={tags} onChange={e=>setTags(e.target.value)} placeholder="Ex: contrato, urgente, mensal"/>
      </Field>
      <SubmitBtn onClick={submit}>Criar tarefa</SubmitBtn>
    </Modal>
  );
}
function ModalMensagem({ data, usuario, onEnviar, onFechar }) {
  const { canal, contato, negocio } = data;

  // Detecta etapa do negócio para sugerir template
  const etapaAtual = negocio?.etapa;
  const templatesDisponiveis = Object.entries(TEMPLATES_MSG).filter(([k]) => k === etapaAtual);
  const [templateKey, setTemplateKey] = useState(etapaAtual && TEMPLATES_MSG[etapaAtual] ? etapaAtual : Object.keys(TEMPLATES_MSG)[0]);
  const template = TEMPLATES_MSG[templateKey] || TEMPLATES_MSG.primeiro_contato;

  const vars = {
    nome: contato?.nome?.split(' ')[0] || contato?.nome || '',
    consultor: usuario?.nome || 'Consultor',
    produto: negocio?.produto || 'sua operação',
  };

  const [assunto, setAssunto] = useState(canal === 'email' ? fillTemplate(template.email_assunto, vars) : '');
  const [mensagem, setMensagem] = useState(canal === 'whatsapp' ? fillTemplate(template.whatsapp, vars) : fillTemplate(template.email_corpo, vars));

  // Quando troca de template, atualiza
  useEffect(() => {
    const t = TEMPLATES_MSG[templateKey];
    if (t) {
      if (canal === 'email') {
        setAssunto(fillTemplate(t.email_assunto, vars));
        setMensagem(fillTemplate(t.email_corpo, vars));
      } else {
        setMensagem(fillTemplate(t.whatsapp, vars));
      }
    }
  }, [templateKey]);

  const enviar = () => {
    if (canal === 'whatsapp') {
      const url = `https://wa.me/${contato.telefone.replace(/\D/g,'')}?text=${encodeURIComponent(mensagem)}`;
      window.open(url, '_blank');
    } else {
      const url = `mailto:${contato.email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(mensagem)}`;
      window.location.href = url;
    }
    onEnviar({
      canal,
      contatoId: contato.id,
      negocioId: negocio?.id,
      assunto,
      mensagem,
      preview: mensagem.slice(0, 60),
    });
  };

  const corCanal = canal === 'whatsapp' ? '#25D366' : VAREJO.primary;
  const iconCanal = canal === 'whatsapp' ? I.whats : I.mail;
  const labelCanal = canal === 'whatsapp' ? 'WhatsApp' : 'E-mail';

  return (
    <Modal titulo={`${labelCanal} para ${contato?.nome}`} onFechar={onFechar} large>
      {/* Info contato */}
      <div style={{padding:"12px 16px",background:"#FAF8F3",borderRadius:10,marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,${corCanal},${corCanal}cc)`,color:"white",display:"grid",placeItems:"center"}}>{iconCanal}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>{contato?.nome}</div>
          <div style={{fontSize:11,color:"#888"}}>{canal === 'whatsapp' ? contato?.telefone : contato?.email}</div>
        </div>
        {negocio && (
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:"#aaa",letterSpacing:1.5,textTransform:"uppercase"}}>Negócio</div>
            <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a"}}>{negocio.titulo}</div>
          </div>
        )}
      </div>

      {/* Seletor de template */}
      <Field label="Template (tom Áxicon)">
        <select style={inpStyle} value={templateKey} onChange={e=>setTemplateKey(e.target.value)}>
          {Object.entries(TEMPLATES_MSG).map(([k,v]) => (
            <option key={k} value={k}>{v.nome} {k === etapaAtual ? '· (etapa atual)' : ''}</option>
          ))}
        </select>
      </Field>

      {canal === 'email' && (
        <Field label="Assunto"><input style={inpStyle} value={assunto} onChange={e=>setAssunto(e.target.value)}/></Field>
      )}

      <Field label="Mensagem (editável antes do envio)">
        <textarea
          style={{...inpStyle, minHeight: canal === 'email' ? 220 : 140, fontFamily: SN, lineHeight: 1.6, resize:'vertical'}}
          value={mensagem}
          onChange={e=>setMensagem(e.target.value)}
        />
      </Field>

      <div style={{padding:"10px 14px",background:"#fff7e6",border:"1px solid #ffd591",borderRadius:8,marginBottom:16,fontSize:11,color:"#92400e"}}>
        💡 Esta ação vai abrir o {canal === 'whatsapp' ? 'WhatsApp Web/App' : 'cliente de e-mail'} com a mensagem pronta. O envio fica registrado automaticamente como atividade no CRM.
      </div>

      <button onClick={enviar}
        style={{width:"100%",height:48,borderRadius:10,border:"none",background:corCanal,color:"white",fontSize:13,fontWeight:600,letterSpacing:1,cursor:"pointer",boxShadow:`0 12px 28px -12px ${corCanal}88`,display:"flex",alignItems:"center",justifyContent:"center",gap:10,fontFamily:SN}}>
        {iconCanal} Abrir {labelCanal} e Enviar
      </button>
    </Modal>
  );
}

// ── IMPORTAR DADOS (ClickUp / Bitrix24 CSV) ───────────────────────────────────
function parseCsv(text) {
  const linhas = text.split(/\r?\n/).filter(l => l.trim());
  if (linhas.length < 2) return { headers: [], rows: [] };
  const splitLine = (l) => {
    const cells = []; let cur = ''; let inQ = false;
    for (let i = 0; i < l.length; i++) {
      const c = l[i];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { cells.push(cur.trim()); cur = ''; }
      else { cur += c; }
    }
    cells.push(cur.trim());
    return cells;
  };
  const headers = splitLine(linhas[0]);
  const rows = linhas.slice(1).map(l => {
    const vals = splitLine(l);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });
  return { headers, rows };
}

// Detecta o formato do CSV automaticamente
function detectarFormato(headers) {
  const h = headers.map(x => x.toLowerCase());
  if (h.some(x => x.includes('task id') || x === 'task name')) return 'clickup';
  if (h.some(x => x.includes('deal') || x === 'title' && h.includes('stage'))) return 'bitrix';
  if (h.some(x => x === 'nome' || x === 'contato' || x === 'empresa')) return 'contatos';
  return 'generico';
}

// Mapeia status ClickUp → status interno
const mapStatusClickUp = s => {
  const l = (s||'').toLowerCase();
  if (['done','complete','concluido','concluída','fechado'].some(x=>l.includes(x))) return 'concluida';
  if (['progress','andamento','doing','fazendo'].some(x=>l.includes(x))) return 'em_andamento';
  if (['review','revisao','aprovacao'].some(x=>l.includes(x))) return 'em_revisao';
  return 'pendente';
};

// Mapeia prioridade ClickUp → interno
const mapPrioClickUp = p => {
  const l = (p||'').toLowerCase();
  if (l.includes('urgent') || l.includes('critico')) return 'critica';
  if (l.includes('high') || l.includes('alta')) return 'alta';
  if (l.includes('normal') || l.includes('media')) return 'media';
  return 'baixa';
};

// Mapeia lista ClickUp → lista interna pelo nome
const mapListaClickUp = (nome, listas) => {
  if (!nome) return null;
  const l = nome.toLowerCase();
  const match = listas.find(x => x.nome.toLowerCase().includes(l) || l.includes(x.nome.toLowerCase()));
  return match?.id || null;
};

// Mapeia stage ID do Bitrix → etapa interna
function mapBitrixStage(stageId) {
  const s = (stageId || '').replace(/^C\d+:/i, '').toUpperCase();
  if (['NEW','LEAD','QUALIFYING','IN_PROCESS'].includes(s)) return 'lead_captado';
  if (['PREPARATION','EXECUTING','APPOINTED'].includes(s)) return 'contato_realizado';
  if (['PROPOSAL','OFFER','PRESENTATION'].includes(s)) return 'proposta_enviada';
  if (['NEGOTIATION','FINAL_INVOICE'].includes(s)) return 'negociacao';
  if (['WON','SUCCESS'].includes(s)) return 'fechado_ganho';
  if (['LOSE','LOSE_2','FAILURE'].includes(s)) return 'fechado_perdido';
  return 'lead_captado';
}

// Mapeia tipo de campo do Bitrix → tipo interno
function mapBitrixTipo(typeId) {
  if (['integer','double','money'].includes(typeId)) return 'numero';
  if (['date','datetime'].includes(typeId)) return 'data';
  if (typeId === 'boolean') return 'checkbox';
  if (['enumeration','iblock_element','iblock_section'].includes(typeId)) return 'select';
  return 'texto';
}

// Extrai label legível de campo Bitrix.
// fieldsMap = resultado de crm.deal.fields ou crm.contact.fields (preferido — tem title direto)
function bxLabel(campo, fieldsMap) {
  // 1. crm.deal.fields / crm.contact.fields retorna title direto
  const fromMap = fieldsMap?.[campo.FIELD_NAME];
  if (fromMap?.title && !fromMap.title.match(/^UF_CRM_/i)) return fromMap.title;

  // 2. EDIT_FORM_LABEL / LIST_COLUMN_LABEL são objetos multilíngue
  const tryObj = (obj) => {
    if (!obj || typeof obj === 'string') return (typeof obj === 'string' && obj) ? obj : null;
    // Filtra strings vazias antes de escolher
    const val = ['pt_BR','pt','en','ru','de','fr','es']
      .map(k => obj[k])
      .find(v => v && v.trim());
    if (val) return val;
    return Object.values(obj).find(v => v && v.trim()) || null;
  };

  return tryObj(campo.EDIT_FORM_LABEL)
    || tryObj(campo.LIST_COLUMN_LABEL)
    || tryObj(campo.LIST_FILTER_LABEL)
    // 3. Último recurso: limpa o nome técnico (UF_CRM_1234567 → Campo 1234567)
    || (campo.FIELD_NAME || '').replace(/^UF_CRM_\d*_?/i, '').replace(/_/g, ' ').trim()
    || campo.FIELD_NAME
    || '';
}

// Extrai primeiro telefone/email de array Bitrix
function bxPhone(arr) { return (Array.isArray(arr) ? arr : [])[0]?.VALUE || ''; }
function bxEmail(arr) { return (Array.isArray(arr) ? arr : [])[0]?.VALUE || ''; }

function ImportarDados({ dados, onImportar, token }) {
  const [modo, setModo] = React.useState('api'); // 'api' | 'csv'

  // ── CSV state ──────────────────────────────────────────────────────────────
  const [step, setStep] = React.useState('upload'); // upload | mapeamento | preview | concluido
  const [formato, setFormato] = React.useState(null);
  const [csvData, setCsvData] = React.useState(null);
  const [mapeamento, setMapeamento] = React.useState({});
  const [destino, setDestino] = React.useState('tarefas'); // tarefas | negocios | contatos
  const [resultado, setResultado] = React.useState(null);
  const [erros, setErros] = React.useState([]);
  const fileRef = React.useRef();

  // ── Bitrix API state ───────────────────────────────────────────────────────
  const [bWebhook, setBWebhook] = React.useState('');
  const [bStatus, setBStatus] = React.useState('idle'); // idle|connecting|connected|fetching|ready|importing|done
  const [bInfo, setBInfo] = React.useState(null);       // { domain }
  const [bDados, setBDados] = React.useState(null);     // { contatos, negocios, stages, usuarios, camposNegocio, camposContato }
  const [bOpcoes, setBOpcoes] = React.useState({ contatos: true, negocios: true, campos: true, usuarios: true });
  const [bProgresso, setBProgresso] = React.useState('');
  const [bErro, setBErro] = React.useState(null);
  const [bResultado, setBResultado] = React.useState(null);
  const [bPreviewTab, setBPreviewTab] = React.useState('contatos');

  // Proxy call para Bitrix REST API
  const bxCall = async (method, params = {}, paginate = false) => {
    const r = await fetch('/api/bitrix-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl: bWebhook.trim(), method, params, paginate }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Erro desconhecido');
    return data;
  };

  const bxConectar = async () => {
    setBErro(null);
    setBStatus('connecting');
    try {
      await bxCall('crm.currency.list');
      setBInfo({ domain: new URL(bWebhook.trim()).hostname });
      setBStatus('connected');
    } catch (e) {
      setBErro(e.message);
      setBStatus('idle');
    }
  };

  const bxBuscarTudo = async () => {
    setBStatus('fetching');
    setBErro(null);
    try {
      setBProgresso('Buscando usuários...');
      const uRes = await bxCall('user.get', { filter: { ACTIVE: true } }, true);

      setBProgresso(`${uRes.result?.length || 0} usuários · Buscando contatos...`);
      const cRes = await bxCall('crm.contact.list', {
        select: ['ID','NAME','LAST_NAME','PHONE','EMAIL','COMPANY_TITLE','POST','DATE_CREATE','COMMENTS','ASSIGNED_BY_ID'],
      }, true);

      setBProgresso(`${cRes.result?.length || 0} contatos · Buscando negócios...`);
      const dRes = await bxCall('crm.deal.list', {
        select: ['ID','TITLE','STAGE_ID','OPPORTUNITY','CURRENCY_ID','CONTACT_ID','DATE_CREATE','COMMENTS','ASSIGNED_BY_ID'],
      }, true);

      setBProgresso(`${dRes.result?.length || 0} negócios · Buscando etapas e campos...`);
      const [sRes, ufD, ufC, flD, flC] = await Promise.all([
        bxCall('crm.status.list', { filter: { ENTITY_ID: 'DEAL_STAGE' } }),
        bxCall('crm.deal.userfield.list', {}),
        bxCall('crm.contact.userfield.list', {}),
        bxCall('crm.deal.fields'),      // retorna title direto de cada campo
        bxCall('crm.contact.fields'),   // idem para contatos
      ]);

      setBDados({
        usuarios:       uRes.result || [],
        contatos:       cRes.result || [],
        negocios:       dRes.result || [],
        stages:         sRes.result || [],
        camposNegocio:  (ufD.result || []).filter(f => f.FIELD_NAME?.startsWith('UF_CRM_')),
        camposContato:  (ufC.result || []).filter(f => f.FIELD_NAME?.startsWith('UF_CRM_')),
        fieldsNegocio:  flD.result  || {},   // { FIELD_NAME: { title, type, ... } }
        fieldsContato:  flC.result  || {},
      });
      setBStatus('ready');
    } catch (e) {
      setBErro(e.message);
      setBStatus('connected');
    }
  };

  const bxImportar = async () => {
    if (!bDados) return;
    setBStatus('importing');
    const novoId = (lista) => Math.max(0, ...(lista||[]).map(x => x.id || 0)) + 1;
    const patch = {};

    // ── 1. Funcionários a partir dos usuários Bitrix ──────────────────────────
    // Mapa bitrixUserId → id interno (para vincular negócios e contatos)
    const bxUserMap = new Map(); // bitrix user ID (string) → interno funcionario id

    if (bOpcoes.usuarios && bDados.usuarios.length > 0) {
      const existFuncs = dados.funcionarios || [];
      const baseId = novoId(existFuncs);
      const novosFuncs = [];

      bDados.usuarios.forEach((u, i) => {
        const bxId = String(u.ID);
        // Não duplicar se já existe pelo email
        const jaExiste = existFuncs.find(f => f.email && f.email.toLowerCase() === (u.EMAIL||'').toLowerCase());
        if (jaExiste) {
          bxUserMap.set(bxId, jaExiste.id);
          return;
        }
        const interno = baseId + novosFuncs.length;
        bxUserMap.set(bxId, interno);
        novosFuncs.push({
          id: interno,
          nome: [u.NAME, u.LAST_NAME].filter(Boolean).join(' ') || u.LOGIN || `Usuário ${i+1}`,
          cargo: u.WORK_POSITION || 'Consultor',
          email: u.EMAIL || '',
          telefone: u.WORK_PHONE || u.PERSONAL_PHONE || '',
          cpf: '',
          salario: 0,
          tipo: 'consultor_varejo',
          dataAdmissao: today,
          status: u.ACTIVE ? 'ativo' : 'inativo',
          bitrixId: bxId,
          importadoDe: 'bitrix24',
        });
      });

      patch.funcionarios = [...existFuncs, ...novosFuncs];

      // Registrar cada usuário no sistema (tabela usuarios) para que possam fazer login
      if (token) {
        for (const func of novosFuncs) {
          if (!func.email) continue;
          try {
            await fetch('/api/usuarios', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ email: func.email, nome: func.nome, role: 'consultor_varejo', ativo: func.status === 'ativo' }),
            });
          } catch { /* ignora erros individuais */ }
        }
      }
    } else {
      // Mesmo sem importar usuários, monta o mapa com os existentes para vincular corretamente
      (dados.funcionarios || []).forEach(f => {
        if (f.bitrixId) bxUserMap.set(String(f.bitrixId), f.id);
      });
    }

    // ── 2. Contatos ──────────────────────────────────────────────────────────
    if (bOpcoes.contatos && bDados.contatos.length > 0) {
      patch.contatos = [
        ...(dados.contatos || []),
        ...bDados.contatos.map((c, i) => ({
          id: novoId(dados.contatos) + i,
          nome: [c.NAME, c.LAST_NAME].filter(Boolean).join(' ') || `Contato ${i+1}`,
          email: bxEmail(c.EMAIL),
          telefone: bxPhone(c.PHONE),
          empresa: c.COMPANY_TITLE || '',
          cargo: c.POST || '',
          tipo: 'PF',
          area: 'varejo',
          criado: (c.DATE_CREATE || today).slice(0, 10),
          observacoes: c.COMMENTS || '',
          consultorId: bxUserMap.get(String(c.ASSIGNED_BY_ID)) || null,
          importadoDe: 'bitrix24',
          bitrixId: c.ID,
        })),
      ];
    }

    // ── 3. Negócios ──────────────────────────────────────────────────────────
    if (bOpcoes.negocios && bDados.negocios.length > 0) {
      patch.negocios = [
        ...(dados.negocios || []),
        ...bDados.negocios.map((n, i) => {
          const contatoBitrixId = n.CONTACT_ID;
          const contatoInterno = patch.contatos?.find(c => c.bitrixId === contatoBitrixId)
            || (dados.contatos||[]).find(c => c.bitrixId === contatoBitrixId);
          return {
            id: novoId(dados.negocios) + i,
            titulo: n.TITLE || `Negócio ${i+1}`,
            valor: parseFloat(n.OPPORTUNITY) || 0,
            etapa: mapBitrixStage(n.STAGE_ID),
            produto: 'Capital de Giro',
            probabilidade: 20,
            descricao: n.COMMENTS || '',
            dataCriacao: (n.DATE_CREATE || today).slice(0, 10),
            contatoId: contatoInterno?.id || null,
            consultorId: bxUserMap.get(String(n.ASSIGNED_BY_ID)) || null,
            importadoDe: 'bitrix24',
            bitrixId: n.ID,
          };
        }),
      ];
    }

    // ── 4. Campos customizados ────────────────────────────────────────────────
    if (bOpcoes.campos) {
      // Mescla os dois fieldsMap para buscar labels
      const fieldsMap = { ...(bDados.fieldsContato||{}), ...(bDados.fieldsNegocio||{}) };
      const todosOsCampos = [
        ...bDados.camposNegocio.map(f => ({ ...f, _ent: 'negocio' })),
        ...bDados.camposContato.map(f => ({ ...f, _ent: 'contato' })),
      ];
      const vistos = new Set();
      const novosCampos = todosOsCampos
        .filter(f => { if (vistos.has(f.FIELD_NAME)) return false; vistos.add(f.FIELD_NAME); return true; })
        .map(f => {
          const tipo = mapBitrixTipo(f.USER_TYPE_ID || f.FIELD_TYPE);
          const lista = f.LIST || f.ENUM || [];
          const fMap = f._ent === 'negocio' ? bDados.fieldsNegocio : bDados.fieldsContato;
          return {
            id: `bx_${f.FIELD_NAME}`,
            label: bxLabel(f, fMap) || f.FIELD_NAME,
            tipo,
            obrigatorio_em: [],
            opcoes: tipo === 'select' ? lista.map(o => o.VALUE || o) : [],
            importadoDe: 'bitrix24',
          };
        });
      const existentes = dados.campos_customizados || [];
      const existentesIds = new Set(existentes.map(c => c.id));
      patch.campos_customizados = [
        ...existentes,
        ...novosCampos.filter(c => !existentesIds.has(c.id)),
      ];
    }

    onImportar(patch);
    setBResultado({
      usuarios: patch.funcionarios ? (patch.funcionarios.length - (dados.funcionarios||[]).length) : 0,
      contatos: patch.contatos ? bDados.contatos.length : 0,
      negocios: patch.negocios ? bDados.negocios.length : 0,
      campos:   patch.campos_customizados ? (patch.campos_customizados.length - (dados.campos_customizados||[]).length) : 0,
    });
    setBStatus('done');
  };

  const bxReiniciar = () => {
    setBStatus('idle'); setBInfo(null); setBDados(null); setBErro(null);
    setBResultado(null); setBWebhook(''); setBProgresso('');
  };

  const lerArquivo = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      const parsed = parseCsv(text);
      if (parsed.headers.length === 0) { alert('CSV inválido ou vazio.'); return; }
      const fmt = detectarFormato(parsed.headers);
      setCsvData(parsed);
      setFormato(fmt);
      // Pre-mapear campos automaticamente
      const autoMap = {};
      parsed.headers.forEach(h => {
        const l = h.toLowerCase();
        if (l.includes('task name') || l === 'name' || l === 'nome' || l === 'titulo' || l === 'title') autoMap.titulo = h;
        if (l.includes('status')) autoMap.status = h;
        if (l.includes('assignee') || l.includes('responsavel') || l.includes('responsável')) autoMap.responsavel = h;
        if (l.includes('due date') || l.includes('vencimento') || l.includes('prazo')) autoMap.vencimento = h;
        if (l.includes('priority') || l.includes('prioridade')) autoMap.prioridade = h;
        if (l.includes('description') || l.includes('descricao') || l.includes('descrição')) autoMap.descricao = h;
        if (l.includes('list') || l.includes('lista') || l.includes('projeto')) autoMap.lista = h;
        if (l.includes('tag')) autoMap.tags = h;
        if (l.includes('folder') || l.includes('pasta') || l.includes('space') || l.includes('espaco')) autoMap.categoria = h;
        if (l.includes('email') || l === 'e-mail') autoMap.email = h;
        if (l.includes('telefone') || l.includes('phone')) autoMap.telefone = h;
        if (l.includes('empresa') || l.includes('company')) autoMap.empresa = h;
        if (l.includes('valor') || l.includes('value') || l.includes('amount')) autoMap.valor = h;
        if (l.includes('etapa') || l.includes('stage') || l.includes('fase')) autoMap.etapa = h;
      });
      setMapeamento(autoMap);
      setDestino(fmt === 'clickup' ? 'tarefas' : fmt === 'bitrix' ? 'negocios' : 'tarefas');
      setStep('mapeamento');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const executarImportacao = () => {
    if (!csvData) return;
    const errsLoc = [];
    const novoId = (lista) => Math.max(0, ...lista.map(x=>x.id||0)) + 1;

    if (destino === 'tarefas') {
      const novas = csvData.rows.map((row, idx) => {
        const titulo = row[mapeamento.titulo] || `Tarefa importada ${idx+1}`;
        const status = mapStatusClickUp(row[mapeamento.status]);
        const prioridade = mapPrioClickUp(row[mapeamento.prioridade]);
        const listaId = mapListaClickUp(row[mapeamento.lista], dados.listas_tarefas||[]);
        const responsavelNome = row[mapeamento.responsavel] || '';
        const responsavel = dados.funcionarios.find(f => f.nome?.toLowerCase().includes(responsavelNome.toLowerCase()));
        return {
          id: novoId(dados.tarefas||[]) + idx,
          titulo: titulo.replace(/^"|"$/g,''),
          status,
          prioridade,
          listaId: listaId || (dados.listas_tarefas?.[0]?.id),
          responsavelId: responsavel?.id || null,
          dataVencimento: row[mapeamento.vencimento] || null,
          descricao: row[mapeamento.descricao] || '',
          tags: row[mapeamento.tags] ? row[mapeamento.tags].split(',').map(t=>t.trim()) : [],
          dataCriacao: today,
          dataConclusao: status === 'concluida' ? today : null,
          importadoDe: 'clickup',
          subtarefas: [],
          comentarios: [],
          anexos: [],
        };
      }).filter(t => t.titulo);
      setResultado({ tipo: 'tarefas', itens: novas, count: novas.length });

    } else if (destino === 'contatos') {
      const novos = csvData.rows.map((row, idx) => {
        const nome = row[mapeamento.titulo] || row[mapeamento.empresa] || `Contato ${idx+1}`;
        return {
          id: novoId(dados.contatos||[]) + idx,
          nome: nome.replace(/^"|"$/g,''),
          email: row[mapeamento.email] || '',
          telefone: row[mapeamento.telefone] || '',
          empresa: row[mapeamento.empresa] || '',
          tipo: 'PF',
          area: 'varejo',
          criado: today,
          importadoDe: 'importacao',
        };
      }).filter(c => c.nome);
      setResultado({ tipo: 'contatos', itens: novos, count: novos.length });

    } else if (destino === 'negocios') {
      const novos = csvData.rows.map((row, idx) => {
        const titulo = row[mapeamento.titulo] || `Negócio ${idx+1}`;
        const valorRaw = row[mapeamento.valor] || '0';
        const valor = parseFloat(valorRaw.replace(/[^\d.,]/g,'').replace(',','.')) || 0;
        return {
          id: novoId(dados.negocios||[]) + idx,
          titulo: titulo.replace(/^"|"$/g,''),
          valor,
          etapa: 'lead_captado',
          produto: 'Capital de Giro',
          probabilidade: 20,
          descricao: row[mapeamento.descricao] || '',
          dataCriacao: today,
          importadoDe: 'importacao',
        };
      }).filter(n => n.titulo);
      setResultado({ tipo: 'negocios', itens: novos, count: novos.length });
    }

    setErros(errsLoc);
    setStep('preview');
  };

  const confirmarImportacao = () => {
    if (!resultado) return;
    onImportar({ [resultado.tipo]: [...(dados[resultado.tipo]||[]), ...resultado.itens] });
    setStep('concluido');
  };

  const reiniciar = () => { setStep('upload'); setCsvData(null); setFormato(null); setResultado(null); setErros([]); };

  const inpSt = {padding:"8px 12px",border:"1px solid rgba(113,63,42,0.2)",borderRadius:8,fontSize:13,fontFamily:SN,background:"white",width:"100%",boxSizing:"border-box"};
  const stepStyle = (s) => ({ display:'flex',alignItems:'center',gap:8,padding:'8px 16px',borderRadius:20,fontSize:12,fontWeight:600, background:step===s?ASSESS.primary:'rgba(113,63,42,0.08)', color:step===s?'white':ASSESS.primary });

  const CAMPOS_DESTINO = {
    tarefas:  [{key:'titulo',label:'Título (obrigatório)'},{key:'status',label:'Status'},{key:'prioridade',label:'Prioridade'},{key:'responsavel',label:'Responsável'},{key:'vencimento',label:'Data de Vencimento'},{key:'descricao',label:'Descrição'},{key:'lista',label:'Lista/Projeto'},{key:'tags',label:'Tags'}],
    contatos: [{key:'titulo',label:'Nome (obrigatório)'},{key:'email',label:'E-mail'},{key:'telefone',label:'Telefone'},{key:'empresa',label:'Empresa'}],
    negocios: [{key:'titulo',label:'Título (obrigatório)'},{key:'valor',label:'Valor'},{key:'descricao',label:'Descrição'},{key:'etapa',label:'Etapa'}],
  };

  const inpFull = {padding:"9px 14px",border:"1px solid rgba(113,63,42,0.2)",borderRadius:8,fontSize:13,fontFamily:SN,background:"white",width:"100%",boxSizing:"border-box"};
  const TAG_COLORS = {contatos:'#0ea5e9',negocios:ASSESS.primary,campos:'#8b5cf6'};

  return (
    <div style={{padding:'24px 32px',maxWidth:960,margin:'0 auto'}}>
      {/* HEADER */}
      <div style={{marginBottom:24}}>
        <h2 style={{margin:0,fontFamily:FT,fontWeight:300,fontSize:26,color:'#1a1a1a'}}>Importar Dados</h2>
        <div style={{fontSize:12,color:'#aaa',marginTop:4}}>Conecte diretamente ao Bitrix24 ou importe via CSV</div>
      </div>

      {/* MODE SWITCHER */}
      <div style={{display:'flex',gap:0,marginBottom:28,background:'rgba(113,63,42,0.06)',borderRadius:12,padding:4,width:'fit-content'}}>
        {[{id:'api',icon:'🔗',label:'Conectar Bitrix24'},{id:'csv',icon:'📄',label:'Importar CSV'}].map(m=>(
          <button key={m.id} onClick={()=>setModo(m.id)}
            style={{padding:'9px 22px',borderRadius:9,border:'none',background:modo===m.id?'white':'transparent',color:modo===m.id?ASSESS.primary:'#888',cursor:'pointer',fontSize:13,fontWeight:modo===m.id?700:400,boxShadow:modo===m.id?'0 1px 4px rgba(0,0,0,0.1)':'none',transition:'all .2s',display:'flex',alignItems:'center',gap:7}}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* ── BITRIX API MODE ─────────────────────────────────────────────────── */}
      {modo==='api'&&(
        <div>
          {/* IDLE / CONNECT */}
          {(bStatus==='idle'||bStatus==='connecting')&&(
            <div>
              <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:14,padding:'20px 24px',marginBottom:24}}>
                <div style={{fontWeight:700,color:'#1e40af',fontSize:14,marginBottom:10}}>🔗 Como gerar o Webhook do Bitrix24</div>
                <ol style={{margin:0,paddingLeft:20,color:'#1e3a8a',fontSize:13,lineHeight:2.1}}>
                  <li>No Bitrix24, vá em <strong>Configurações → Recursos para desenvolvedores → Webhooks de entrada</strong></li>
                  <li>Clique em <strong>Adicionar webhook</strong></li>
                  <li>Em "Permissões de acesso", marque <strong>CRM (crm)</strong></li>
                  <li>Salve e copie a URL gerada (ex: <code style={{background:'#dbeafe',padding:'1px 5px',borderRadius:4}}>https://seudominio.bitrix24.com.br/rest/1/abc123.../</code>)</li>
                  <li>Cole abaixo e clique em Conectar</li>
                </ol>
              </div>
              <div style={{background:'white',borderRadius:14,border:'1px solid rgba(113,63,42,0.08)',padding:'24px'}}>
                <label style={{fontSize:11,fontWeight:700,color:ASSESS.primary,letterSpacing:.8,display:'block',marginBottom:8}}>URL DO WEBHOOK</label>
                <div style={{display:'flex',gap:10}}>
                  <input
                    type="url"
                    value={bWebhook}
                    onChange={e=>setBWebhook(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&bWebhook&&bxConectar()}
                    placeholder="https://seudominio.bitrix24.com.br/rest/1/TOKEN/"
                    style={{...inpFull,flex:1}}
                  />
                  <button
                    onClick={bxConectar}
                    disabled={!bWebhook.trim()||bStatus==='connecting'}
                    style={{padding:'9px 22px',borderRadius:8,border:'none',background:ASSESS.primary,color:'white',cursor:'pointer',fontSize:13,fontWeight:600,whiteSpace:'nowrap',opacity:!bWebhook.trim()?0.5:1}}>
                    {bStatus==='connecting'?'Conectando…':'Conectar'}
                  </button>
                </div>
                {bErro&&<div style={{marginTop:12,padding:'10px 14px',background:'#fff1f2',borderRadius:8,color:'#be123c',fontSize:13}}>⚠️ {bErro}</div>}
              </div>
            </div>
          )}

          {/* CONNECTED — choose what to fetch */}
          {bStatus==='connected'&&bInfo&&(
            <div>
              <div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:12,padding:'14px 20px',marginBottom:20,display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontSize:22}}>✅</span>
                <div>
                  <div style={{fontWeight:700,color:'#166534',fontSize:14}}>Conectado com sucesso</div>
                  <div style={{fontSize:12,color:'#166534'}}>{bInfo.domain}</div>
                </div>
                <button onClick={bxReiniciar} style={{marginLeft:'auto',padding:'5px 12px',borderRadius:7,border:'1px solid #86efac',background:'white',color:'#166534',cursor:'pointer',fontSize:12}}>Trocar conta</button>
              </div>

              <div style={{background:'white',borderRadius:14,border:'1px solid rgba(113,63,42,0.08)',padding:'24px',marginBottom:20}}>
                <div style={{fontWeight:700,color:'#1a1a1a',fontSize:14,marginBottom:16}}>O que deseja importar?</div>
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {[{key:'usuarios',icon:'🧑‍💼',label:'Usuários / Equipe',desc:'Cadastra no RH e vincula negócios/contatos ao responsável'},
                    {key:'contatos',icon:'👥',label:'Contatos',desc:'Nome, e-mail, telefone, empresa'},
                    {key:'negocios',icon:'💼',label:'Negócios',desc:'Título, valor, etapa do pipeline, responsável e contato'},
                    {key:'campos',icon:'⚙️',label:'Campos Personalizados',desc:'Campos UF_CRM_* criados no Bitrix24'}
                  ].map(o=>(
                    <label key={o.key} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 18px',borderRadius:10,border:`1.5px solid ${bOpcoes[o.key]?ASSESS.primary:'rgba(113,63,42,0.12)'}`,cursor:'pointer',background:bOpcoes[o.key]?`${ASSESS.primary}08`:'white',transition:'all .15s'}}>
                      <input type="checkbox" checked={bOpcoes[o.key]} onChange={e=>setBOpcoes(p=>({...p,[o.key]:e.target.checked}))} style={{width:16,height:16,accentColor:ASSESS.primary}}/>
                      <span style={{fontSize:20}}>{o.icon}</span>
                      <div>
                        <div style={{fontWeight:600,fontSize:14,color:'#1a1a1a'}}>{o.label}</div>
                        <div style={{fontSize:12,color:'#888'}}>{o.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {bErro&&<div style={{marginTop:14,padding:'10px 14px',background:'#fff1f2',borderRadius:8,color:'#be123c',fontSize:13}}>⚠️ {bErro}</div>}
              </div>

              <div style={{display:'flex',justifyContent:'flex-end'}}>
                <button onClick={bxBuscarTudo}
                  style={{padding:'10px 28px',borderRadius:8,border:'none',background:ASSESS.primary,color:'white',cursor:'pointer',fontSize:14,fontWeight:600,display:'flex',alignItems:'center',gap:10}}>
                  🔍 Buscar dados do Bitrix24
                </button>
              </div>
            </div>
          )}

          {/* FETCHING */}
          {bStatus==='fetching'&&(
            <div style={{textAlign:'center',padding:'80px 40px'}}>
              <div style={{fontSize:48,marginBottom:20,animation:'spin 1s linear infinite'}}>⏳</div>
              <div style={{fontFamily:FT,fontWeight:300,fontSize:22,color:'#1a1a1a',marginBottom:10}}>Buscando dados…</div>
              <div style={{fontSize:14,color:'#888'}}>{bProgresso}</div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {/* READY — preview + confirm */}
          {bStatus==='ready'&&bDados&&(
            <div>
              {/* Summary cards */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
                {[
                  {label:'Usuários',count:bDados.usuarios.length,icon:'🧑‍💼',color:'#059669',enabled:bOpcoes.usuarios},
                  {label:'Contatos',count:bDados.contatos.length,icon:'👥',color:'#0ea5e9',enabled:bOpcoes.contatos},
                  {label:'Negócios',count:bDados.negocios.length,icon:'💼',color:ASSESS.primary,enabled:bOpcoes.negocios},
                  {label:'Campos Custom.',count:bDados.camposNegocio.length+bDados.camposContato.length,icon:'⚙️',color:'#8b5cf6',enabled:bOpcoes.campos},
                ].map(card=>(
                  <div key={card.label} style={{background:'white',borderRadius:12,border:`1.5px solid ${card.enabled?card.color+'40':'#eee'}`,padding:'18px 20px',opacity:card.enabled?1:0.45}}>
                    <div style={{fontSize:24,marginBottom:6}}>{card.icon}</div>
                    <div style={{fontSize:28,fontWeight:700,color:card.color}}>{card.count}</div>
                    <div style={{fontSize:12,color:'#888',marginTop:2}}>{card.label}{!card.enabled&&' (não selecionado)'}</div>
                  </div>
                ))}
              </div>

              {/* Preview tabs */}
              <div style={{background:'white',borderRadius:14,border:'1px solid rgba(113,63,42,0.08)',overflow:'hidden',marginBottom:20}}>
                <div style={{display:'flex',borderBottom:'1px solid rgba(113,63,42,0.08)'}}>
                  {[{id:'usuarios',label:`Usuários (${bDados.usuarios.length})`},{id:'contatos',label:`Contatos (${bDados.contatos.length})`},{id:'negocios',label:`Negócios (${bDados.negocios.length})`},{id:'campos',label:`Campos (${bDados.camposNegocio.length+bDados.camposContato.length})`}].map(t=>(
                    <button key={t.id} onClick={()=>setBPreviewTab(t.id)}
                      style={{padding:'12px 20px',border:'none',background:'transparent',borderBottom:`2px solid ${bPreviewTab===t.id?ASSESS.primary:'transparent'}`,color:bPreviewTab===t.id?ASSESS.primary:'#888',cursor:'pointer',fontSize:13,fontWeight:bPreviewTab===t.id?700:400}}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <div style={{overflowX:'auto',maxHeight:340,overflowY:'auto'}}>
                  {bPreviewTab==='usuarios'&&(
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                      <thead style={{position:'sticky',top:0,background:'#faf8f3'}}>
                        <tr>{['Nome','E-mail','Cargo','Telefone','Status'].map(h=><th key={h} style={{padding:'9px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:'#555'}}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {bDados.usuarios.slice(0,100).map((u,i)=>(
                          <tr key={i} style={{borderBottom:'1px solid #f7f5f0'}}>
                            <td style={{padding:'8px 14px',fontWeight:600}}>{[u.NAME,u.LAST_NAME].filter(Boolean).join(' ')||u.LOGIN||'—'}</td>
                            <td style={{padding:'8px 14px',color:'#555'}}>{u.EMAIL||'—'}</td>
                            <td style={{padding:'8px 14px',color:'#555'}}>{u.WORK_POSITION||'—'}</td>
                            <td style={{padding:'8px 14px',color:'#555'}}>{u.WORK_PHONE||u.PERSONAL_PHONE||'—'}</td>
                            <td style={{padding:'8px 14px'}}><span style={{padding:'2px 9px',borderRadius:10,fontSize:10,fontWeight:700,background:u.ACTIVE?'#dcfce7':'#fee2e2',color:u.ACTIVE?'#166534':'#be123c'}}>{u.ACTIVE?'Ativo':'Inativo'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {bPreviewTab==='contatos'&&(
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                      <thead style={{position:'sticky',top:0,background:'#faf8f3'}}>
                        <tr>{['Nome','E-mail','Telefone','Empresa','Cargo'].map(h=><th key={h} style={{padding:'9px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:'#555'}}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {bDados.contatos.slice(0,100).map((c,i)=>(
                          <tr key={i} style={{borderBottom:'1px solid #f7f5f0'}}>
                            <td style={{padding:'8px 14px',fontWeight:600}}>{[c.NAME,c.LAST_NAME].filter(Boolean).join(' ')||'—'}</td>
                            <td style={{padding:'8px 14px',color:'#555'}}>{bxEmail(c.EMAIL)||'—'}</td>
                            <td style={{padding:'8px 14px',color:'#555'}}>{bxPhone(c.PHONE)||'—'}</td>
                            <td style={{padding:'8px 14px',color:'#555'}}>{c.COMPANY_TITLE||'—'}</td>
                            <td style={{padding:'8px 14px',color:'#555'}}>{c.POST||'—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {bPreviewTab==='negocios'&&(
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                      <thead style={{position:'sticky',top:0,background:'#faf8f3'}}>
                        <tr>{['Título','Valor','Etapa Bitrix','→ Etapa Interna'].map(h=><th key={h} style={{padding:'9px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:'#555'}}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {bDados.negocios.slice(0,100).map((n,i)=>{
                          const stageName = (bDados.stages.find(s=>s.STATUS_ID===n.STAGE_ID)||{}).NAME || n.STAGE_ID;
                          const etapaInterna = mapBitrixStage(n.STAGE_ID);
                          return (
                            <tr key={i} style={{borderBottom:'1px solid #f7f5f0'}}>
                              <td style={{padding:'8px 14px',fontWeight:600,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n.TITLE||'—'}</td>
                              <td style={{padding:'8px 14px',color:ASSESS.primary,fontWeight:600}}>{n.OPPORTUNITY?fmtR(parseFloat(n.OPPORTUNITY)):'—'}</td>
                              <td style={{padding:'8px 14px',color:'#555',fontSize:11}}>{stageName}</td>
                              <td style={{padding:'8px 14px'}}><span style={{padding:'2px 9px',borderRadius:10,fontSize:10,fontWeight:700,background:ASSESS.primary+'18',color:ASSESS.primary}}>{etapaInterna}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                  {bPreviewTab==='campos'&&(
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                      <thead style={{position:'sticky',top:0,background:'#faf8f3'}}>
                        <tr>{['Campo Bitrix (UF_CRM_*)','Label','Tipo','Entidade'].map(h=><th key={h} style={{padding:'9px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:'#555'}}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {[...bDados.camposNegocio.map(f=>({...f,_ent:'Negócios',_fmap:bDados.fieldsNegocio||{}})),...bDados.camposContato.map(f=>({...f,_ent:'Contatos',_fmap:bDados.fieldsContato||{}}))].map((f,i)=>(
                          <tr key={i} style={{borderBottom:'1px solid #f7f5f0'}}>
                            <td style={{padding:'8px 14px',fontFamily:'monospace',fontSize:11,color:'#888'}}>{f.FIELD_NAME}</td>
                            <td style={{padding:'8px 14px',fontWeight:600}}>{bxLabel(f,f._fmap)}</td>
                            <td style={{padding:'8px 14px'}}><span style={{padding:'2px 9px',borderRadius:10,fontSize:10,fontWeight:700,background:'#8b5cf620',color:'#8b5cf6'}}>{mapBitrixTipo(f.USER_TYPE_ID||f.FIELD_TYPE)}</span></td>
                            <td style={{padding:'8px 14px',color:'#888',fontSize:11}}>{f._ent}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                {(bPreviewTab==='contatos'&&bDados.contatos.length>100||bPreviewTab==='negocios'&&bDados.negocios.length>100)&&(
                  <div style={{padding:'9px 14px',background:'#faf8f3',fontSize:11,color:'#888',borderTop:'1px solid #f0ede8'}}>Mostrando 100 de {bPreviewTab==='contatos'?bDados.contatos.length:bDados.negocios.length} itens</div>
                )}
              </div>

              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button onClick={()=>setBStatus('connected')} style={{padding:'9px 18px',borderRadius:8,border:'1px solid #E6E2D8',background:'white',cursor:'pointer',fontSize:13}}>Voltar</button>
                <button onClick={bxImportar}
                  style={{padding:'10px 26px',borderRadius:8,border:'none',background:'#166534',color:'white',cursor:'pointer',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:8}}>
                  {I.check} Importar do Bitrix24
                </button>
              </div>
            </div>
          )}

          {/* IMPORTING */}
          {bStatus==='importing'&&(
            <div style={{textAlign:'center',padding:'80px 40px'}}>
              <div style={{fontSize:48,marginBottom:20}}>⏳</div>
              <div style={{fontFamily:FT,fontWeight:300,fontSize:22,color:'#1a1a1a'}}>Importando…</div>
            </div>
          )}

          {/* DONE */}
          {bStatus==='done'&&bResultado&&(
            <div style={{textAlign:'center',padding:'60px 40px'}}>
              <div style={{fontSize:64,marginBottom:20}}>🎉</div>
              <h3 style={{fontFamily:FT,fontWeight:300,fontSize:28,color:'#1a1a1a',margin:'0 0 20px'}}>Importação concluída!</h3>
              <div style={{display:'flex',gap:16,justifyContent:'center',marginBottom:32,flexWrap:'wrap'}}>
                {bResultado.usuarios>0&&<div style={{background:'#dcfce7',borderRadius:12,padding:'16px 24px'}}><div style={{fontSize:28,fontWeight:700,color:'#059669'}}>{bResultado.usuarios}</div><div style={{fontSize:12,color:'#555'}}>usuários/equipe</div></div>}
                {bResultado.contatos>0&&<div style={{background:'#eff6ff',borderRadius:12,padding:'16px 24px'}}><div style={{fontSize:28,fontWeight:700,color:'#0ea5e9'}}>{bResultado.contatos}</div><div style={{fontSize:12,color:'#555'}}>contatos</div></div>}
                {bResultado.negocios>0&&<div style={{background:'#f5f0e8',borderRadius:12,padding:'16px 24px'}}><div style={{fontSize:28,fontWeight:700,color:ASSESS.primary}}>{bResultado.negocios}</div><div style={{fontSize:12,color:'#555'}}>negócios</div></div>}
                {bResultado.campos>0&&<div style={{background:'#f5f3ff',borderRadius:12,padding:'16px 24px'}}><div style={{fontSize:28,fontWeight:700,color:'#8b5cf6'}}>{bResultado.campos}</div><div style={{fontSize:12,color:'#555'}}>campos custom.</div></div>}
              </div>
              <div style={{display:'flex',gap:12,justifyContent:'center'}}>
                <button onClick={bxReiniciar} style={{padding:'10px 22px',borderRadius:8,border:'1px solid #E6E2D8',background:'white',cursor:'pointer',fontSize:13}}>Nova importação</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CSV MODE ─────────────────────────────────────────────────────────── */}
      {modo==='csv'&&(
        <div>
          {/* STEPS */}
          <div style={{display:'flex',gap:8,marginBottom:28,alignItems:'center'}}>
            {[{id:'upload',label:'1. Arquivo'},{id:'mapeamento',label:'2. Mapeamento'},{id:'preview',label:'3. Pré-visualização'},{id:'concluido',label:'4. Concluído'}].map((s,i,arr)=>(
              <React.Fragment key={s.id}>
                <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 16px',borderRadius:20,fontSize:12,fontWeight:600,background:step===s.id?ASSESS.primary:'rgba(113,63,42,0.08)',color:step===s.id?'white':ASSESS.primary}}>{s.label}</div>
                {i<arr.length-1&&<div style={{width:24,height:1,background:'rgba(113,63,42,0.2)'}}/>}
              </React.Fragment>
            ))}
          </div>

      {/* STEP 1: UPLOAD */}
      {step==='upload'&&(
        <div>
          {/* Instruções ClickUp */}
          <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:14,padding:'18px 22px',marginBottom:20}}>
            <div style={{fontWeight:700,color:'#92400e',marginBottom:10,display:'flex',alignItems:'center',gap:8}}>📋 Como exportar do ClickUp</div>
            <ol style={{margin:0,paddingLeft:20,color:'#78350f',fontSize:13,lineHeight:2}}>
              <li>No ClickUp, abra o <strong>Space</strong> ou <strong>List</strong> que deseja exportar</li>
              <li>Clique nos <strong>3 pontos (···)</strong> da lista → <strong>Export</strong></li>
              <li>Selecione <strong>Export as CSV</strong></li>
              <li>Faça o download e arraste o arquivo abaixo</li>
            </ol>
            <div style={{marginTop:10,padding:'8px 12px',background:'#fef3c7',borderRadius:8,fontSize:12,color:'#92400e'}}>
              💡 Para o Bitrix24: Negócios → Exportar → CSV. Para qualquer outra fonte: salve como .csv com cabeçalho na primeira linha.
            </div>
          </div>

          {/* Drop zone */}
          <div
            onClick={()=>fileRef.current.click()}
            onDragOver={e=>e.preventDefault()}
            onDrop={e=>{e.preventDefault();lerArquivo(e.dataTransfer.files[0]);}}
            style={{border:'2px dashed rgba(113,63,42,0.25)',borderRadius:16,padding:'60px 40px',textAlign:'center',cursor:'pointer',background:'#faf8f5',transition:'all .2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=ASSESS.primary;e.currentTarget.style.background='#f5f0e8'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(113,63,42,0.25)';e.currentTarget.style.background='#faf8f5'}}>
            <input ref={fileRef} type="file" accept=".csv,.txt" style={{display:'none'}} onChange={e=>lerArquivo(e.target.files[0])}/>
            <div style={{fontSize:40,marginBottom:12}}>📂</div>
            <div style={{fontWeight:700,color:'#1a1a1a',fontSize:16,marginBottom:6}}>Arraste o CSV aqui ou clique para selecionar</div>
            <div style={{fontSize:12,color:'#aaa'}}>Formatos aceitos: .csv · ClickUp, Bitrix24 ou qualquer planilha exportada</div>
          </div>
        </div>
      )}

      {/* STEP 2: MAPEAMENTO */}
      {step==='mapeamento'&&csvData&&(
        <div>
          <div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:12,padding:'12px 18px',marginBottom:20,display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:18}}>✅</span>
            <div>
              <div style={{fontWeight:600,color:'#166534',fontSize:13}}>Arquivo lido com sucesso</div>
              <div style={{fontSize:12,color:'#166534'}}>{csvData.rows.length} linhas · {csvData.headers.length} colunas · Formato detectado: <strong>{formato === 'clickup' ? 'ClickUp' : formato === 'bitrix' ? 'Bitrix24' : 'Genérico'}</strong></div>
            </div>
          </div>

          {/* Destino */}
          <div style={{marginBottom:20}}>
            <label style={{fontSize:11,fontWeight:700,color:ASSESS.primary,letterSpacing:.8,display:'block',marginBottom:8}}>IMPORTAR COMO</label>
            <div style={{display:'flex',gap:10}}>
              {[{id:'tarefas',label:'Tarefas',icon:'✅'},{id:'negocios',label:'Negócios (Pipeline)',icon:'💼'},{id:'contatos',label:'Contatos',icon:'👥'}].map(d=>(
                <button key={d.id} onClick={()=>setDestino(d.id)}
                  style={{padding:'10px 20px',borderRadius:10,border:`2px solid ${destino===d.id?ASSESS.primary:'rgba(113,63,42,0.15)'}`,background:destino===d.id?`${ASSESS.primary}10`:'white',color:destino===d.id?ASSESS.primary:'#555',cursor:'pointer',fontSize:13,fontWeight:destino===d.id?700:400,display:'flex',alignItems:'center',gap:8}}>
                  {d.icon} {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mapeamento de campos */}
          <div style={{background:'white',borderRadius:14,padding:'20px 22px',border:'1px solid rgba(113,63,42,0.08)',marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:700,color:'#1a1a1a',marginBottom:16}}>Mapear colunas do CSV → campos da intranet</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {CAMPOS_DESTINO[destino].map(campo=>(
                <div key={campo.key}>
                  <label style={{fontSize:11,fontWeight:700,color:ASSESS.primary,letterSpacing:.7,display:'block',marginBottom:4}}>{campo.label.toUpperCase()}</label>
                  <select style={inpSt} value={mapeamento[campo.key]||''} onChange={e=>setMapeamento(m=>({...m,[campo.key]:e.target.value}))}>
                    <option value="">— Ignorar —</option>
                    {csvData.headers.map(h=><option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview primeiras linhas */}
          <div style={{background:'white',borderRadius:14,padding:'16px 20px',border:'1px solid rgba(113,63,42,0.08)',marginBottom:20,overflowX:'auto'}}>
            <div style={{fontSize:12,fontWeight:700,color:'#888',marginBottom:12}}>PRIMEIRAS 3 LINHAS DO ARQUIVO</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
              <thead><tr>{csvData.headers.map(h=><th key={h} style={{padding:'5px 8px',textAlign:'left',background:'#f7f5f0',color:'#555',fontWeight:700,whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead>
              <tbody>{csvData.rows.slice(0,3).map((r,i)=><tr key={i}>{csvData.headers.map(h=><td key={h} style={{padding:'5px 8px',borderBottom:'1px solid #f0ede8',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r[h]}</td>)}</tr>)}</tbody>
            </table>
          </div>

          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <button onClick={reiniciar} style={{padding:'9px 18px',borderRadius:8,border:'1px solid #E6E2D8',background:'white',cursor:'pointer',fontSize:13}}>Voltar</button>
            <button onClick={executarImportacao} style={{padding:'9px 22px',borderRadius:8,border:'none',background:ASSESS.primary,color:'white',cursor:'pointer',fontSize:13,fontWeight:600}}>
              Continuar → Pré-visualizar
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PREVIEW */}
      {step==='preview'&&resultado&&(
        <div>
          <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:12,padding:'14px 18px',marginBottom:20,display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:18}}>👁️</span>
            <div>
              <div style={{fontWeight:700,color:'#1e40af',fontSize:13}}>{resultado.count} {resultado.tipo} prontos para importar</div>
              <div style={{fontSize:12,color:'#1e40af'}}>Revise abaixo antes de confirmar. Esta ação é reversível (você pode remover itens depois).</div>
            </div>
          </div>

          {erros.length > 0 && (
            <div style={{background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:12,padding:'12px 18px',marginBottom:16}}>
              <div style={{fontWeight:700,color:'#c2410c',fontSize:13,marginBottom:6}}>⚠️ {erros.length} aviso{erros.length>1?'s':''}</div>
              {erros.slice(0,5).map((e,i)=><div key={i} style={{fontSize:12,color:'#c2410c'}}>• {e}</div>)}
            </div>
          )}

          <div style={{background:'white',borderRadius:14,border:'1px solid rgba(113,63,42,0.08)',overflow:'hidden',marginBottom:20}}>
            <div style={{overflowX:'auto',maxHeight:360,overflowY:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead style={{position:'sticky',top:0,background:'#faf8f3',zIndex:1}}>
                  <tr>
                    {resultado.tipo==='tarefas'&&['Título','Status','Prioridade','Responsável','Lista','Vencimento'].map(h=><th key={h} style={{padding:'9px 12px',textAlign:'left',fontWeight:700,color:'#555',fontSize:11}}>{h}</th>)}
                    {resultado.tipo==='contatos'&&['Nome','E-mail','Telefone','Empresa'].map(h=><th key={h} style={{padding:'9px 12px',textAlign:'left',fontWeight:700,color:'#555',fontSize:11}}>{h}</th>)}
                    {resultado.tipo==='negocios'&&['Título','Valor','Etapa'].map(h=><th key={h} style={{padding:'9px 12px',textAlign:'left',fontWeight:700,color:'#555',fontSize:11}}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {resultado.itens.slice(0,100).map((item,i)=>(
                    <tr key={i} style={{borderBottom:'1px solid #f7f5f0'}}>
                      {resultado.tipo==='tarefas'&&<>
                        <td style={{padding:'8px 12px',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.titulo}</td>
                        <td style={{padding:'8px 12px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:item.status==='concluida'?'#dcfce7':item.status==='em_andamento'?'#dbeafe':'#f3f4f6',color:item.status==='concluida'?'#166534':item.status==='em_andamento'?'#1e40af':'#374151'}}>{item.status}</span></td>
                        <td style={{padding:'8px 12px',fontSize:11,color:'#555'}}>{item.prioridade}</td>
                        <td style={{padding:'8px 12px',fontSize:11,color:'#555'}}>{dados.funcionarios.find(f=>f.id===item.responsavelId)?.nome||'—'}</td>
                        <td style={{padding:'8px 12px',fontSize:11,color:'#555'}}>{(dados.listas_tarefas||[]).find(l=>l.id===item.listaId)?.nome||'—'}</td>
                        <td style={{padding:'8px 12px',fontSize:11,color:'#555'}}>{item.dataVencimento||'—'}</td>
                      </>}
                      {resultado.tipo==='contatos'&&<>
                        <td style={{padding:'8px 12px',fontWeight:600}}>{item.nome}</td>
                        <td style={{padding:'8px 12px',fontSize:11,color:'#555'}}>{item.email||'—'}</td>
                        <td style={{padding:'8px 12px',fontSize:11,color:'#555'}}>{item.telefone||'—'}</td>
                        <td style={{padding:'8px 12px',fontSize:11,color:'#555'}}>{item.empresa||'—'}</td>
                      </>}
                      {resultado.tipo==='negocios'&&<>
                        <td style={{padding:'8px 12px',fontWeight:600}}>{item.titulo}</td>
                        <td style={{padding:'8px 12px',fontSize:11,color:ASSESS.primary,fontWeight:600}}>{fmtR(item.valor)}</td>
                        <td style={{padding:'8px 12px',fontSize:11,color:'#555'}}>{item.etapa}</td>
                      </>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {resultado.itens.length>100&&<div style={{padding:'10px 16px',background:'#faf8f3',fontSize:11,color:'#888',borderTop:'1px solid #f0ede8'}}>Mostrando 100 de {resultado.itens.length} itens</div>}
          </div>

          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <button onClick={()=>setStep('mapeamento')} style={{padding:'9px 18px',borderRadius:8,border:'1px solid #E6E2D8',background:'white',cursor:'pointer',fontSize:13}}>Voltar</button>
            <button onClick={confirmarImportacao} style={{padding:'9px 22px',borderRadius:8,border:'none',background:'#166534',color:'white',cursor:'pointer',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:8}}>
              {I.check} Confirmar e Importar {resultado.count} {resultado.tipo}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CONCLUÍDO */}
      {step==='concluido'&&resultado&&(
        <div style={{textAlign:'center',padding:'60px 40px'}}>
          <div style={{fontSize:64,marginBottom:20}}>🎉</div>
          <h3 style={{fontFamily:FT,fontWeight:300,fontSize:28,color:'#1a1a1a',margin:'0 0 12px'}}>Importação concluída!</h3>
          <div style={{fontSize:15,color:'#555',marginBottom:32}}>
            <strong style={{color:'#166534'}}>{resultado.count} {resultado.tipo}</strong> importados com sucesso para a intranet.
          </div>
          <div style={{display:'flex',gap:12,justifyContent:'center'}}>
            <button onClick={reiniciar} style={{padding:'10px 22px',borderRadius:8,border:'1px solid #E6E2D8',background:'white',cursor:'pointer',fontSize:13}}>Importar outro arquivo</button>
            <button onClick={()=>window.location.reload()} style={{padding:'10px 22px',borderRadius:8,border:'none',background:ASSESS.primary,color:'white',cursor:'pointer',fontSize:13,fontWeight:600}}>Ver {resultado.tipo} importados</button>
          </div>
        </div>
      )}
        </div>
      )}{/* end modo==='csv' */}
    </div>
  );
}

// ── CAMPOS CUSTOMIZADOS (config) ──────────────────────────────────────────────
function CamposCustomizados({ dados, onSalvar }) {
  const campos = dados.campos_customizados || [];
  const [editando, setEditando] = React.useState(null); // null | 'novo' | campo obj
  const [form, setForm] = React.useState({ label:'', tipo:'texto', opcoes:'', secao:'', obrigatorio_em:[] });

  const todasEtapas = [
    ...PIPE_VAREJO.map(e => ({ ...e, area:'Varejo' })),
    ...PIPE_ATACADO.map(e => ({ ...e, area:'Atacado' })),
  ];
  // Deduplica por id
  const etapasUnicas = todasEtapas.filter((e,i,arr) => arr.findIndex(x=>x.id===e.id)===i);

  const abrirNovo = () => {
    setForm({ label:'', tipo:'texto', opcoes:'', secao:'', obrigatorio_em:[] });
    setEditando('novo');
  };
  const abrirEditar = (c) => {
    const opcoesStr = Array.isArray(c.opcoes) ? c.opcoes.join(', ') : (c.opcoes || '');
    setForm({ label:c.label, tipo:c.tipo, opcoes:opcoesStr, secao:c.secao||'', obrigatorio_em:c.obrigatorio_em||[] });
    setEditando(c);
  };
  const salvar = () => {
    if (!form.label.trim()) return;
    const campo = {
      id: editando === 'novo' ? `campo_${Date.now()}` : editando.id,
      label: form.label.trim(),
      tipo: form.tipo,
      opcoes: form.tipo === 'select' ? form.opcoes.split(',').map(s=>s.trim()).filter(Boolean) : [],
      secao: form.secao.trim() || 'Geral',
      obrigatorio_em: form.obrigatorio_em,
    };
    const novos = editando === 'novo'
      ? [...campos, campo]
      : campos.map(c => c.id === campo.id ? campo : c);
    onSalvar(novos);
    setEditando(null);
  };
  const remover = (id) => {
    if (!confirm('Remover este campo?')) return;
    onSalvar(campos.filter(c => c.id !== id));
  };
  const toggleEtapa = (etapaId) => {
    setForm(f => ({
      ...f,
      obrigatorio_em: f.obrigatorio_em.includes(etapaId)
        ? f.obrigatorio_em.filter(e => e !== etapaId)
        : [...f.obrigatorio_em, etapaId],
    }));
  };

  const TIPOS_CAMPO = [
    { id:'texto', label:'Texto livre' },
    { id:'numero', label:'Número' },
    { id:'data', label:'Data' },
    { id:'select', label:'Seleção (lista)' },
    { id:'checkbox', label:'Sim / Não' },
    { id:'moeda', label:'Valor monetário' },
  ];
  const inpSt = {padding:"8px 12px",border:"1px solid rgba(113,63,42,0.2)",borderRadius:8,fontSize:13,fontFamily:SN,background:"white",width:"100%",boxSizing:"border-box"};

  return (
    <div style={{padding:'24px 32px',maxWidth:960,margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
        <div>
          <h2 style={{margin:0,fontFamily:FT,fontWeight:300,fontSize:26,color:'#1a1a1a'}}>Campos Customizados</h2>
          <div style={{fontSize:12,color:'#aaa',marginTop:4}}>Adicione campos extras nos negócios e defina em quais etapas são obrigatórios</div>
        </div>
        <button onClick={abrirNovo}
          style={{padding:'9px 18px',borderRadius:8,border:'none',background:ASSESS.primary,color:'white',cursor:'pointer',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:8}}>
          {I.plus} Novo Campo
        </button>
      </div>

      {campos.length === 0 && !editando && (
        <div style={{background:'white',borderRadius:14,padding:48,border:'1px dashed rgba(113,63,42,0.2)',textAlign:'center'}}>
          <div style={{fontSize:32,marginBottom:12}}>📋</div>
          <div style={{fontWeight:600,color:'#1a1a1a',marginBottom:6}}>Nenhum campo customizado</div>
          <div style={{fontSize:13,color:'#aaa',marginBottom:20}}>Crie campos extras para capturar informações específicas do seu processo comercial.</div>
          <button onClick={abrirNovo} style={{padding:'9px 18px',borderRadius:8,border:'none',background:ASSESS.primary,color:'white',cursor:'pointer',fontSize:13,fontWeight:600}}>Criar primeiro campo</button>
        </div>
      )}

      {campos.length > 0 && (
        <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:24}}>
          {campos.map(c => (
            <div key={c.id} style={{background:'white',borderRadius:12,padding:'16px 20px',border:'1px solid rgba(113,63,42,0.08)',display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:36,height:36,borderRadius:10,background:`${ASSESS.primary}14`,color:ASSESS.primary,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                {c.tipo==='numero'||c.tipo==='moeda'?'#':c.tipo==='data'?'📅':c.tipo==='select'?'▾':c.tipo==='checkbox'?'☑':'T'}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:14,color:'#1a1a1a'}}>{c.label}</div>
                <div style={{fontSize:11,color:'#888',marginTop:2}}>
                  {TIPOS_CAMPO.find(t=>t.id===c.tipo)?.label}
                  {(c.opcoes?.length > 0) && ` · ${Array.isArray(c.opcoes) ? c.opcoes.join(', ') : c.opcoes}`}
                  {c.secao && c.secao !== 'Geral' && <span style={{marginLeft:6,padding:'1px 6px',borderRadius:4,background:'#f0ede5',color:'#888',fontSize:10}}>{c.secao}</span>}
                </div>
              </div>
              {c.obrigatorio_em?.length > 0 && (
                <div style={{display:'flex',gap:4,flexWrap:'wrap',maxWidth:340}}>
                  {c.obrigatorio_em.map(etapaId => {
                    const e = etapasUnicas.find(x=>x.id===etapaId);
                    return e ? (
                      <span key={etapaId} style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:'#fee2e2',color:'#dc2626',fontWeight:600}}>
                        {e.name}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              <div style={{display:'flex',gap:6,flexShrink:0}}>
                <button onClick={()=>abrirEditar(c)} style={{padding:'6px 12px',borderRadius:7,border:'1px solid rgba(113,63,42,0.18)',background:'white',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',gap:4}}>{I.edit} Editar</button>
                <button onClick={()=>remover(c.id)} style={{padding:'6px',borderRadius:7,border:'1px solid #fee2e2',background:'white',cursor:'pointer',color:'#dc2626',display:'flex'}}>{I.trash}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editando && (
        <Modal titulo={editando==='novo'?'Novo Campo':'Editar Campo'} onFechar={()=>setEditando(null)}>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:ASSESS.primary,letterSpacing:.8,display:'block',marginBottom:5}}>NOME DO CAMPO</label>
              <input style={inpSt} value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))} placeholder="Ex: Valor do Imóvel, CNPJ, Garantia..."/>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:ASSESS.primary,letterSpacing:.8,display:'block',marginBottom:5}}>SEÇÃO</label>
              <input style={inpSt} value={form.secao} onChange={e=>setForm(f=>({...f,secao:e.target.value}))} placeholder="Ex: Financeiro, Imóvel, Dados Gerais... (padrão: Geral)"/>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:ASSESS.primary,letterSpacing:.8,display:'block',marginBottom:5}}>TIPO</label>
              <select style={inpSt} value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>
                {TIPOS_CAMPO.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            {form.tipo === 'select' && (
              <div>
                <label style={{fontSize:11,fontWeight:700,color:ASSESS.primary,letterSpacing:.8,display:'block',marginBottom:5}}>OPÇÕES (separadas por vírgula)</label>
                <input style={inpSt} value={form.opcoes} onChange={e=>setForm(f=>({...f,opcoes:e.target.value}))} placeholder="Ex: Sim, Não, Em análise"/>
              </div>
            )}
            <div>
              <label style={{fontSize:11,fontWeight:700,color:ASSESS.primary,letterSpacing:.8,display:'block',marginBottom:10}}>OBRIGATÓRIO NAS ETAPAS</label>
              <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:240,overflowY:'auto',paddingRight:4}}>
                {etapasUnicas.map(e => (
                  <label key={e.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:8,border:`1px solid ${form.obrigatorio_em.includes(e.id)?'#dc2626':'rgba(113,63,42,0.12)'}`,background:form.obrigatorio_em.includes(e.id)?'#fff5f5':'white',cursor:'pointer'}}>
                    <input type="checkbox" checked={form.obrigatorio_em.includes(e.id)} onChange={()=>toggleEtapa(e.id)} style={{accentColor:'#dc2626'}}/>
                    <div style={{width:8,height:8,borderRadius:'50%',background:e.color,flexShrink:0}}/>
                    <span style={{fontSize:13,color:'#1a1a1a',flex:1}}>{e.name}</span>
                    <span style={{fontSize:10,color:'#aaa'}}>{e.area}</span>
                  </label>
                ))}
              </div>
              {form.obrigatorio_em.length > 0 && (
                <div style={{marginTop:8,fontSize:11,color:'#dc2626',display:'flex',alignItems:'center',gap:4}}>
                  {I.alert} Campo obrigatório em {form.obrigatorio_em.length} etapa{form.obrigatorio_em.length>1?'s':''}. O sistema bloqueará o avanço se não preenchido.
                </div>
              )}
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:4}}>
              <button onClick={()=>setEditando(null)} style={{padding:'9px 18px',borderRadius:8,border:'1px solid #E6E2D8',background:'white',cursor:'pointer',fontSize:13}}>Cancelar</button>
              <button onClick={salvar} style={{padding:'9px 18px',borderRadius:8,border:'none',background:ASSESS.primary,color:'white',cursor:'pointer',fontSize:13,fontWeight:600}}>Salvar Campo</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── AGENDAMENTO ───────────────────────────────────────────────────────────────
function Agendamento({ dados, usuario }) {
  const [mesAtual, setMesAtual] = React.useState(new Date().getMonth());
  const [anoAtual, setAnoAtual] = React.useState(new Date().getFullYear());
  const [eventos, setEventos] = React.useState([]);
  const [carregandoEvs, setCarregandoEvs] = React.useState(true);
  const [diaSel, setDiaSel] = React.useState(null);
  const [modal, setModal] = React.useState(null);
  const TIPOS = [
    { id:'reuniao',   label:'Reunião',    cor:'#001489' },
    { id:'ligacao',   label:'Ligação',    cor:'#3b82f6' },
    { id:'follow_up', label:'Follow-up',  cor:'#f59e0b' },
    { id:'prazo',     label:'Prazo',      cor:'#dc2626' },
    { id:'outro',     label:'Outro',      cor:'#6b7280' },
  ];
  const FORM0 = { titulo:'', inicio:'', fim:'', tipo:'reuniao', descricao:'', local:'', cor:'#001489', convidados:'', comMeet:false };
  const [form, setForm] = React.useState(FORM0);

  const carregar = React.useCallback(async () => {
    setCarregandoEvs(true);
    try {
      const q = `/api/agendamentos?mes=${mesAtual+1}&ano=${anoAtual}${usuario?.email?`&usuario_email=${encodeURIComponent(usuario.email)}`:''}`;
      const r = await fetch(q);
      if (r.ok) setEventos((await r.json()).agendamentos || []);
    } catch { setEventos([]); }
    setCarregandoEvs(false);
  }, [mesAtual, anoAtual, usuario?.email]);

  React.useEffect(() => { carregar(); }, [carregar]);

  const salvar = async () => {
    if (!form.titulo || !form.inicio) return alert('Título e início são obrigatórios');
    const r = await fetch('/api/agendamentos', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...form,criado_por:usuario?.email}) });
    if (r.ok) { const d = await r.json(); setEventos(e=>[...e,d.agendamento]); setModal(null); setForm(FORM0); }
    else alert('Erro ao salvar');
  };

  const excluir = async (id) => {
    if (!confirm('Excluir evento?')) return;
    await fetch(`/api/agendamentos?id=${id}`,{method:'DELETE'}).catch(()=>{});
    setEventos(ev=>ev.filter(e=>e.id!==id));
  };

  const gcalLink = (ev) => {
    const fmt = s => s ? s.replace(/[-:]/g,'').slice(0,13)+'00Z' : '';
    const params = {
      action:'TEMPLATE',
      text: ev.titulo,
      dates: `${fmt(ev.inicio)}/${fmt(ev.fim||ev.inicio)}`,
      details: (ev.descricao||'') + (ev.comMeet ? '\n\n[Google Meet será criado automaticamente]' : ''),
      location: ev.local||'',
    };
    if (ev.convidados) params.add = ev.convidados.split(',').map(s=>s.trim()).join(',');
    if (ev.comMeet) params.crm = 'AVAILABLE';
    return `https://calendar.google.com/calendar/render?${new URLSearchParams(params)}`;
  };

  const diasNoMes = new Date(anoAtual, mesAtual+1, 0).getDate();
  const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
  const cells = [...Array(primeiroDia).fill(null), ...Array.from({length:diasNoMes},(_,i)=>i+1)];
  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const DIAS  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const hoje  = new Date();
  const isHoje = d => d===hoje.getDate()&&mesAtual===hoje.getMonth()&&anoAtual===hoje.getFullYear();
  const evsPorDia = d => {
    if(!d) return [];
    const key=`${anoAtual}-${String(mesAtual+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    return eventos.filter(e=>e.inicio&&e.inicio.startsWith(key));
  };
  const inpSt = {padding:"8px 12px",border:"1px solid rgba(113,63,42,0.2)",borderRadius:8,fontSize:13,fontFamily:SN,background:"white",width:"100%",boxSizing:"border-box"};
  const evsDia = diaSel ? evsPorDia(diaSel) : [];

  return (
    <div style={{padding:'24px 32px',maxWidth:1200,margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
        <div>
          <h2 style={{margin:0,fontFamily:FT,fontWeight:300,fontSize:26,color:'#1a1a1a'}}>{MESES[mesAtual]} {anoAtual}</h2>
          <div style={{fontSize:12,color:'#aaa',marginTop:4}}>{eventos.length} evento{eventos.length!==1?'s':''} este mês</div>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <button onClick={()=>{if(mesAtual===0){setMesAtual(11);setAnoAtual(a=>a-1)}else setMesAtual(m=>m-1)}} style={{width:34,height:34,borderRadius:8,border:'1px solid #E6E2D8',background:'white',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>‹</button>
          <button onClick={()=>{setMesAtual(new Date().getMonth());setAnoAtual(new Date().getFullYear())}} style={{padding:'6px 14px',borderRadius:8,border:'1px solid #E6E2D8',background:'white',cursor:'pointer',fontSize:12,color:'#555'}}>Hoje</button>
          <button onClick={()=>{if(mesAtual===11){setMesAtual(0);setAnoAtual(a=>a+1)}else setMesAtual(m=>m+1)}} style={{width:34,height:34,borderRadius:8,border:'1px solid #E6E2D8',background:'white',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>›</button>
          <button onClick={()=>{setForm(FORM0);setModal('novo')}} style={{padding:'8px 18px',borderRadius:8,border:'none',background:ASSESS.primary,color:'white',cursor:'pointer',fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:6}}>{I.plus} Novo Evento</button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:20}}>
        {/* CALENDÁRIO */}
        <div style={{background:'white',borderRadius:16,border:'1px solid #E6E2D8',overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',background:'#faf8f3',borderBottom:'1px solid #E6E2D8'}}>
            {DIAS.map(d=><div key={d} style={{padding:'10px 0',textAlign:'center',fontSize:10,fontWeight:700,color:'#888',letterSpacing:1}}>{d}</div>)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
            {cells.map((dia,idx)=>{
              const evs=evsPorDia(dia); const sel=diaSel===dia;
              return (
                <div key={idx} onClick={()=>dia&&setDiaSel(sel?null:dia)}
                  style={{minHeight:86,padding:'7px 8px',borderRight:'1px solid #f0ede8',borderBottom:'1px solid #f0ede8',background:sel?`${ASSESS.primary}08`:dia?'white':'#faf9f7',cursor:dia?'pointer':'default',transition:'background .15s'}}
                  onMouseEnter={e=>{if(dia&&!sel)e.currentTarget.style.background='#faf8f3'}}
                  onMouseLeave={e=>{if(dia&&!sel)e.currentTarget.style.background='white'}}>
                  {dia&&<>
                    <div style={{width:24,height:24,borderRadius:'50%',background:isHoje(dia)?ASSESS.primary:sel?`${ASSESS.primary}20`:'transparent',color:isHoje(dia)?'white':sel?ASSESS.primary:'#333',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:isHoje(dia)?700:400,marginBottom:3}}>{dia}</div>
                    {evs.slice(0,2).map(e=><div key={e.id} style={{fontSize:10,padding:'2px 5px',borderRadius:3,background:`${e.cor||'#001489'}18`,color:e.cor||'#001489',fontWeight:600,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.titulo}</div>)}
                    {evs.length>2&&<div style={{fontSize:10,color:'#aaa'}}>+{evs.length-2}</div>}
                  </>}
                </div>
              );
            })}
          </div>
        </div>

        {/* PAINEL LATERAL */}
        <div>
          {diaSel ? (
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                <div style={{fontSize:14,fontWeight:700,color:'#1a1a1a'}}>{diaSel} de {MESES[mesAtual]}</div>
                <button onClick={()=>{setForm(f=>({...FORM0,inicio:`${anoAtual}-${String(mesAtual+1).padStart(2,'0')}-${String(diaSel).padStart(2,'0')}T09:00`}));setModal('novo')}} style={{padding:'4px 10px',borderRadius:6,border:'none',background:ASSESS.primary,color:'white',cursor:'pointer',fontSize:11,display:'flex',alignItems:'center',gap:4}}>{I.plus}</button>
              </div>
              {evsDia.length===0
                ? <div style={{background:'white',borderRadius:12,padding:24,border:'1px dashed rgba(113,63,42,0.2)',textAlign:'center',color:'#aaa',fontSize:12}}>Nenhum evento neste dia</div>
                : evsDia.map(ev=>(
                  <div key={ev.id} style={{background:'white',borderRadius:12,padding:'13px 15px',border:'1px solid rgba(113,63,42,0.10)',borderLeft:`4px solid ${ev.cor||ASSESS.primary}`,marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:5}}>
                      <div style={{fontWeight:600,fontSize:13,color:'#1a1a1a',flex:1,marginRight:6}}>{ev.titulo}</div>
                      <div style={{display:'flex',gap:4,flexShrink:0}}>
                        <a href={gcalLink(ev)} target="_blank" rel="noreferrer" style={{display:'flex',padding:4,color:'#4285F4',borderRadius:4,border:'1px solid #e8edf5',background:'white'}} title="Abrir no Google Agenda">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                        </a>
                        <button onClick={()=>excluir(ev.id)} style={{display:'flex',padding:4,color:'#dc2626',borderRadius:4,border:'1px solid #fee2e2',background:'white',cursor:'pointer'}}>{I.trash}</button>
                      </div>
                    </div>
                    {ev.inicio&&<div style={{fontSize:11,color:'#888',marginBottom:3}}>🕐 {ev.inicio.slice(11,16)}{ev.fim?` → ${ev.fim.slice(11,16)}`:''}</div>}
                    {ev.local&&<div style={{fontSize:11,color:'#888',marginBottom:3}}>📍 {ev.local}</div>}
                    {ev.descricao&&<div style={{fontSize:11,color:'#555',lineHeight:1.5}}>{ev.descricao}</div>}
                    <span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:`${ev.cor||ASSESS.primary}14`,color:ev.cor||ASSESS.primary,fontWeight:600,marginTop:6,display:'inline-block'}}>{TIPOS.find(t=>t.id===ev.tipo)?.label||ev.tipo}</span>
                  </div>
                ))
              }
            </div>
          ) : (
            <div>
              <div style={{fontSize:12,fontWeight:700,color:'#888',marginBottom:10,letterSpacing:.5}}>PRÓXIMOS EVENTOS</div>
              {carregandoEvs
                ? <div style={{textAlign:'center',padding:24,color:'#aaa',fontSize:12}}>Carregando...</div>
                : eventos.length===0
                  ? <div style={{background:'white',borderRadius:12,padding:24,border:'1px dashed rgba(113,63,42,0.2)',textAlign:'center',color:'#aaa',fontSize:12}}>Nenhum evento este mês</div>
                  : eventos.slice(0,8).map(ev=>(
                    <div key={ev.id} onClick={()=>setDiaSel(new Date(ev.inicio).getDate())}
                      style={{background:'white',borderRadius:10,padding:'10px 13px',border:'1px solid rgba(113,63,42,0.10)',borderLeft:`4px solid ${ev.cor||ASSESS.primary}`,marginBottom:7,cursor:'pointer'}}>
                      <div style={{fontWeight:600,fontSize:12,color:'#1a1a1a'}}>{ev.titulo}</div>
                      <div style={{fontSize:11,color:'#888',marginTop:2}}>{fmtDate(ev.inicio.slice(0,10))} · {ev.inicio.slice(11,16)}</div>
                    </div>
                  ))
              }
            </div>
          )}
        </div>
      </div>

      {modal==='novo'&&(
        <Modal titulo="Novo Evento" onFechar={()=>setModal(null)}>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div><label style={{fontSize:11,fontWeight:700,color:ASSESS.primary,letterSpacing:.8,display:'block',marginBottom:4}}>TÍTULO</label><input style={inpSt} value={form.titulo} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} placeholder="Ex: Reunião com cliente"/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div><label style={{fontSize:11,fontWeight:700,color:ASSESS.primary,letterSpacing:.8,display:'block',marginBottom:4}}>INÍCIO</label><input type="datetime-local" style={inpSt} value={form.inicio} onChange={e=>setForm(f=>({...f,inicio:e.target.value}))}/></div>
              <div><label style={{fontSize:11,fontWeight:700,color:ASSESS.primary,letterSpacing:.8,display:'block',marginBottom:4}}>FIM</label><input type="datetime-local" style={inpSt} value={form.fim} onChange={e=>setForm(f=>({...f,fim:e.target.value}))}/></div>
            </div>
            <div><label style={{fontSize:11,fontWeight:700,color:ASSESS.primary,letterSpacing:.8,display:'block',marginBottom:4}}>TIPO</label>
              <select style={inpSt} value={form.tipo} onChange={e=>{const t=TIPOS.find(x=>x.id===e.target.value);setForm(f=>({...f,tipo:e.target.value,cor:t?.cor||f.cor}))}}>
                {TIPOS.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div><label style={{fontSize:11,fontWeight:700,color:ASSESS.primary,letterSpacing:.8,display:'block',marginBottom:4}}>LOCAL / LINK</label><input style={inpSt} value={form.local} onChange={e=>setForm(f=>({...f,local:e.target.value}))} placeholder="Endereço ou link de videoconferência"/></div>
            <div><label style={{fontSize:11,fontWeight:700,color:ASSESS.primary,letterSpacing:.8,display:'block',marginBottom:4}}>DESCRIÇÃO</label><textarea style={{...inpSt,minHeight:70,resize:'vertical',lineHeight:1.5}} value={form.descricao} onChange={e=>setForm(f=>({...f,descricao:e.target.value}))}/></div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:ASSESS.primary,letterSpacing:.8,display:'block',marginBottom:4}}>CONVIDADOS (e-mails separados por vírgula)</label>
              <input style={inpSt} value={form.convidados} onChange={e=>setForm(f=>({...f,convidados:e.target.value}))} placeholder="email1@gmail.com, email2@empresa.com"/>
              <div style={{fontSize:10,color:'#aaa',marginTop:4}}>Ao abrir no Google Agenda, os convidados serão adicionados automaticamente ao evento.</div>
            </div>
            <label style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'#f0f7ff',borderRadius:8,cursor:'pointer',border:`1px solid ${form.comMeet?'#3b82f6':'transparent'}`}}>
              <input type="checkbox" checked={form.comMeet} onChange={e=>setForm(f=>({...f,comMeet:e.target.checked}))} style={{accentColor:'#3b82f6',width:16,height:16}}/>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:'#1e40af'}}>Criar link Google Meet</div>
                <div style={{fontSize:11,color:'#60a5fa'}}>O Google Agenda gerará um link de videoconferência automaticamente</div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{marginLeft:'auto',flexShrink:0}}><path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.899L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" fill="#3b82f6"/></svg>
            </label>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={()=>setModal(null)} style={{padding:'8px 18px',borderRadius:8,border:'1px solid #E6E2D8',background:'white',cursor:'pointer',fontSize:13}}>Cancelar</button>
              <button onClick={salvar} style={{padding:'8px 18px',borderRadius:8,border:'none',background:ASSESS.primary,color:'white',cursor:'pointer',fontSize:13,fontWeight:600}}>Salvar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── RELATÓRIO AVANÇADO ────────────────────────────────────────────────────────
function RelatorioAvancado({ dados }) {
  const [periodo, setPeriodo] = React.useState('mes');
  const [mesRef, setMesRef] = React.useState(`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`);

  const filtrar = (lista, campo='dataPagamento') => {
    if (periodo==='mes') return lista.filter(c=>c[campo]&&c[campo].startsWith(mesRef));
    if (periodo==='trimestre') {
      const [y,m] = mesRef.split('-').map(Number);
      const meses = [0,1,2].map(i=>{const mm=m-i;return mm<1?`${y-1}-${String(mm+12).padStart(2,'0')}`:`${y}-${String(mm).padStart(2,'0')}`});
      return lista.filter(c=>c[campo]&&meses.some(mx=>c[campo].startsWith(mx)));
    }
    return lista.filter(c=>c[campo]&&c[campo].startsWith(mesRef.slice(0,4)));
  };

  const recebidas = filtrar(dados.contas.filter(c=>c.tipo==='receber'&&c.status==='recebido'));
  const pagas     = filtrar(dados.contas.filter(c=>c.tipo==='pagar'&&c.status==='pago'));
  const totalRec  = recebidas.reduce((s,c)=>s+c.valor,0);
  const totalPag  = pagas.reduce((s,c)=>s+c.valor,0);
  const liquido   = totalRec - totalPag;

  const ganhos    = dados.negocios.filter(n=>['fechado_ganho','projeto_aprovado'].includes(n.etapa));
  const perdidos  = dados.negocios.filter(n=>n.etapa==='fechado_perdido');
  const ativos    = dados.negocios.filter(n=>!['fechado_ganho','projeto_aprovado','fechado_perdido'].includes(n.etapa));
  const txConv    = dados.negocios.length ? ((ganhos.length/dados.negocios.length)*100).toFixed(1) : '0.0';
  const volPipe   = ativos.reduce((s,n)=>s+(n.valor||0),0);

  const porConsultor = dados.funcionarios.filter(f=>f.status==='ativo').map(f=>{
    const negs  = dados.negocios.filter(n=>n.consultorId===f.id);
    const g     = negs.filter(n=>['fechado_ganho','projeto_aprovado'].includes(n.etapa));
    const vol   = g.reduce((s,n)=>s+(n.valor||0),0);
    const coms  = dados.contas.filter(c=>c.tipo==='pagar'&&c.categoria==='cus_comissoes'&&c.descricao?.includes(f.nome));
    return {...f,totalNegs:negs.length,ganhos:g.length,vol,totalCom:coms.reduce((s,c)=>s+c.valor,0)};
  }).sort((a,b)=>b.vol-a.vol);

  const porProd = {};
  ganhos.forEach(n=>{if(!n.produto)return;porProd[n.produto]=(porProd[n.produto]||{q:0,v:0});porProd[n.produto].q++;porProd[n.produto].v+=n.valor||0;});
  const prodSorted = Object.entries(porProd).sort((a,b)=>b[1].v-a[1].v);
  const maxVol = prodSorted[0]?.[1].v || 1;

  const todasEtapas = [...PIPE_VAREJO,...PIPE_ATACADO.filter(e=>!PIPE_VAREJO.some(v=>v.id===e.id))];
  const porEtapa = todasEtapas.map(e=>({...e,q:dados.negocios.filter(n=>n.etapa===e.id).length})).filter(e=>e.q>0);
  const maxEtapa = Math.max(...porEtapa.map(e=>e.q),1);

  const inpSt = {padding:"7px 12px",border:"1px solid #E6E2D8",borderRadius:8,fontSize:13,fontFamily:SN,background:"white"};
  const Kpi = ({label,valor,sub,cor}) => (
    <div style={{background:'white',borderRadius:14,padding:'18px 20px',border:'1px solid rgba(113,63,42,0.08)'}}>
      <div style={{fontSize:11,color:'#888',letterSpacing:.5,marginBottom:7}}>{label}</div>
      <div style={{fontSize:22,fontWeight:800,color:cor||ASSESS.primary,fontFamily:FT}}>{valor}</div>
      {sub&&<div style={{fontSize:11,color:'#aaa',marginTop:3}}>{sub}</div>}
    </div>
  );

  return (
    <div style={{padding:'24px 32px',maxWidth:1200,margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
        <div>
          <h2 style={{margin:0,fontFamily:FT,fontWeight:300,fontSize:26,color:'#1a1a1a'}}>Relatórios</h2>
          <div style={{fontSize:12,color:'#aaa',marginTop:4}}>Visão consolidada do desempenho</div>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <select style={inpSt} value={periodo} onChange={e=>setPeriodo(e.target.value)}>
            <option value="mes">Este mês</option>
            <option value="trimestre">Trimestre</option>
            <option value="ano">Este ano</option>
          </select>
          <input type="month" style={inpSt} value={mesRef} onChange={e=>setMesRef(e.target.value)}/>
        </div>
      </div>

      <div style={{fontSize:11,fontWeight:700,color:'#888',letterSpacing:2,textTransform:'uppercase',marginBottom:10}}>Financeiro</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:28}}>
        <Kpi label="Receita Recebida" valor={fmtMM(totalRec)} cor="#2e8a4e"/>
        <Kpi label="Despesas Pagas" valor={fmtMM(totalPag)} cor="#dc2626"/>
        <Kpi label="Resultado Líquido" valor={fmtMM(liquido)} cor={liquido>=0?"#2e8a4e":"#dc2626"} sub={liquido>=0?"Superávit":"Déficit"}/>
        <Kpi label="Volume Pipeline" valor={fmtMM(volPipe)} sub={`${ativos.length} negócios ativos`}/>
      </div>

      <div style={{fontSize:11,fontWeight:700,color:'#888',letterSpacing:2,textTransform:'uppercase',marginBottom:10}}>Pipeline</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:28}}>
        <Kpi label="Total de Negócios" valor={dados.negocios.length}/>
        <Kpi label="Ganhos" valor={ganhos.length} cor="#2e8a4e"/>
        <Kpi label="Perdidos" valor={perdidos.length} cor="#dc2626"/>
        <Kpi label="Taxa de Conversão" valor={`${txConv}%`} cor={Number(txConv)>=30?"#2e8a4e":"#f59e0b"}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>
        <div style={{background:'white',borderRadius:14,padding:'20px 22px',border:'1px solid rgba(113,63,42,0.08)'}}>
          <div style={{fontSize:13,fontWeight:700,color:'#1a1a1a',marginBottom:16}}>Produtos Mais Vendidos</div>
          {prodSorted.length===0
            ? <div style={{textAlign:'center',color:'#aaa',fontSize:12,padding:20}}>Nenhum fechamento ainda</div>
            : prodSorted.slice(0,6).map(([nome,d])=>(
              <div key={nome} style={{marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:12,color:'#1a1a1a'}}>{nome}</span>
                  <span style={{fontSize:12,fontWeight:600,color:ASSESS.primary}}>{d.q}x · {fmtMM(d.v)}</span>
                </div>
                <div style={{height:5,background:'#f0ede8',borderRadius:3}}><div style={{height:5,background:`linear-gradient(90deg,${ASSESS.primary},${SEC})`,borderRadius:3,width:`${(d.v/maxVol)*100}%`,transition:'width .5s'}}/></div>
              </div>
            ))
          }
        </div>
        <div style={{background:'white',borderRadius:14,padding:'20px 22px',border:'1px solid rgba(113,63,42,0.08)'}}>
          <div style={{fontSize:13,fontWeight:700,color:'#1a1a1a',marginBottom:16}}>Distribuição por Etapa</div>
          {porEtapa.length===0
            ? <div style={{textAlign:'center',color:'#aaa',fontSize:12,padding:20}}>Nenhum negócio cadastrado</div>
            : porEtapa.map(e=>(
              <div key={e.id} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:e.color,flexShrink:0}}/>
                <span style={{fontSize:12,color:'#555',flex:1}}>{e.name}</span>
                <span style={{fontSize:12,fontWeight:600,color:'#1a1a1a',minWidth:20,textAlign:'right'}}>{e.q}</span>
                <div style={{width:80,height:5,background:'#f0ede8',borderRadius:3}}><div style={{height:5,background:e.color,borderRadius:3,width:`${(e.q/maxEtapa)*100}%`}}/></div>
              </div>
            ))
          }
        </div>
      </div>

      <div style={{background:'white',borderRadius:14,padding:'20px 22px',border:'1px solid rgba(113,63,42,0.08)'}}>
        <div style={{fontSize:13,fontWeight:700,color:'#1a1a1a',marginBottom:16}}>Desempenho por Consultor</div>
        {porConsultor.length===0
          ? <div style={{textAlign:'center',color:'#aaa',fontSize:12,padding:20}}>Nenhum funcionário cadastrado</div>
          : (
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr style={{borderBottom:'2px solid #f0ede8'}}>
                  {['Consultor','Negócios','Ganhos','Volume Fechado','Comissão'].map(h=>(
                    <th key={h} style={{padding:'7px 12px',textAlign:'left',fontSize:10,color:'#888',fontWeight:700,letterSpacing:.5,textTransform:'uppercase'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {porConsultor.map(f=>(
                  <tr key={f.id} style={{borderBottom:'1px solid #f7f5f0'}}>
                    <td style={{padding:'10px 12px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:28,height:28,borderRadius:'50%',background:`linear-gradient(135deg,${ASSESS.primary},${SEC})`,color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700}}>{f.nome?.[0]}</div>
                        <div><div style={{fontWeight:600,color:'#1a1a1a'}}>{f.nome}</div><div style={{fontSize:10,color:'#aaa'}}>{f.cargo||f.area||'Consultor'}</div></div>
                      </div>
                    </td>
                    <td style={{padding:'10px 12px',color:'#555'}}>{f.totalNegs}</td>
                    <td style={{padding:'10px 12px'}}><span style={{padding:'2px 8px',borderRadius:10,background:'#dcfce7',color:'#2e8a4e',fontWeight:600}}>{f.ganhos}</span></td>
                    <td style={{padding:'10px 12px',fontWeight:600,color:ASSESS.primary}}>{fmtMM(f.vol)}</td>
                    <td style={{padding:'10px 12px',color:'#555'}}>{fmtMM(f.totalCom)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  );
}

// ── PERSONALIZAÇÃO VISUAL ─────────────────────────────────────────────────────
function PersonalizacaoVisual({ config, onSalvar }) {
  const cfg = config || {};
  const [form, setForm] = React.useState({
    corPrimaria: cfg.corPrimaria || '#001489',
    corAcento:   cfg.corAcento   || '#CCA67F',
    sidebarTema: cfg.sidebarTema || 'dark',
    fontePrincipal: cfg.fontePrincipal || 'montserrat',
    fundoApp:    cfg.fundoApp    || '#F5F4F0',
  });
  const [salvo, setSalvo] = React.useState(false);

  const salvar = () => { onSalvar(form); setSalvo(true); setTimeout(()=>setSalvo(false),2000); };

  const TEMAS_SIDEBAR = [
    { id:'dark',    label:'Escuro (padrão)', bg:'#0E0E0E', txt:'white' },
    { id:'light',   label:'Claro',           bg:'#FFFFFF', txt:'#1a1a1a' },
    { id:'navy',    label:'Marinho',          bg:'#001489', txt:'white' },
    { id:'brown',   label:'Âmbar',           bg:'#713F2A', txt:'white' },
    { id:'slate',   label:'Ardósia',         bg:'#334155', txt:'white' },
  ];
  const FUNDOS = [
    { id:'#F5F4F0', label:'Areia (padrão)' },
    { id:'#F5F5F5', label:'Cinza neutro' },
    { id:'#FFFFFF', label:'Branco' },
    { id:'#F0F4FF', label:'Azul gelo' },
    { id:'#FFF8F0', label:'Creme' },
  ];
  const FONTES = [
    { id:'montserrat', label:'Montserrat (padrão)' },
    { id:'inter',      label:'Inter' },
    { id:'system',     label:'System UI' },
  ];

  const Swatch = ({ color, active, onClick, label }) => (
    <div onClick={onClick} title={label} style={{ width:32,height:32,borderRadius:'50%',background:color,cursor:'pointer',border:`3px solid ${active?'#1a1a1a':'transparent'}`,boxShadow:active?'0 0 0 2px white, 0 0 0 4px '+color:'none',transition:'all .15s' }}/>
  );

  return (
    <div style={{padding:'24px 32px',maxWidth:900,margin:'0 auto'}}>
      <div style={{marginBottom:28}}>
        <h2 style={{margin:0,fontFamily:FT,fontWeight:300,fontSize:26,color:'#1a1a1a'}}>Personalização Visual</h2>
        <div style={{fontSize:12,color:'#aaa',marginTop:4}}>Customize as cores, tema e fontes do sistema</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        {/* COR PRIMÁRIA */}
        <div style={{background:'white',borderRadius:14,padding:'20px 22px',border:'1px solid rgba(113,63,42,0.08)'}}>
          <div style={{fontSize:13,fontWeight:700,color:'#1a1a1a',marginBottom:4}}>Cor Primária</div>
          <div style={{fontSize:11,color:'#888',marginBottom:14}}>Botões, destaques, links</div>
          <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
            {['#001489','#713F2A','#166534','#0f172a','#6d28d9','#dc2626','#0369a1'].map(c=>(
              <Swatch key={c} color={c} active={form.corPrimaria===c} onClick={()=>setForm(f=>({...f,corPrimaria:c}))} label={c}/>
            ))}
            <input type="color" value={form.corPrimaria} onChange={e=>setForm(f=>({...f,corPrimaria:e.target.value}))}
              style={{width:32,height:32,borderRadius:'50%',border:'2px solid #ddd',cursor:'pointer',padding:2}}/>
          </div>
          <div style={{marginTop:14,padding:'10px 14px',borderRadius:8,background:form.corPrimaria,color:'white',fontSize:12,fontWeight:600,textAlign:'center'}}>
            Prévia: Botão principal
          </div>
        </div>

        {/* COR DE ACENTO */}
        <div style={{background:'white',borderRadius:14,padding:'20px 22px',border:'1px solid rgba(113,63,42,0.08)'}}>
          <div style={{fontSize:13,fontWeight:700,color:'#1a1a1a',marginBottom:4}}>Cor de Acento</div>
          <div style={{fontSize:11,color:'#888',marginBottom:14}}>Barra lateral, bordas decorativas</div>
          <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
            {['#CCA67F','#DAB58F','#f59e0b','#22c55e','#3b82f6','#a78bfa','#f43f5e'].map(c=>(
              <Swatch key={c} color={c} active={form.corAcento===c} onClick={()=>setForm(f=>({...f,corAcento:c}))} label={c}/>
            ))}
            <input type="color" value={form.corAcento} onChange={e=>setForm(f=>({...f,corAcento:e.target.value}))}
              style={{width:32,height:32,borderRadius:'50%',border:'2px solid #ddd',cursor:'pointer',padding:2}}/>
          </div>
          <div style={{marginTop:14,padding:'10px 14px',borderRadius:8,background:`${form.corAcento}18`,borderLeft:`4px solid ${form.corAcento}`,fontSize:12,color:'#555'}}>
            Prévia: Destaque lateral
          </div>
        </div>

        {/* TEMA DA SIDEBAR */}
        <div style={{background:'white',borderRadius:14,padding:'20px 22px',border:'1px solid rgba(113,63,42,0.08)'}}>
          <div style={{fontSize:13,fontWeight:700,color:'#1a1a1a',marginBottom:14}}>Tema da Barra Lateral</div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {TEMAS_SIDEBAR.map(t=>(
              <div key={t.id} onClick={()=>setForm(f=>({...f,sidebarTema:t.id}))}
                style={{cursor:'pointer',borderRadius:10,overflow:'hidden',border:`2px solid ${form.sidebarTema===t.id?form.corPrimaria:'#E6E2D8'}`,transition:'all .15s'}}>
                <div style={{width:80,height:48,background:t.bg,display:'flex',alignItems:'center',paddingLeft:8,gap:6}}>
                  {[0,1,2].map(i=><div key={i} style={{width:48,height:4,borderRadius:2,background:t.txt,opacity:.2+i*.15}}/>)}
                </div>
                <div style={{padding:'5px 8px',fontSize:10,color:'#555',background:'#faf8f5',fontWeight:form.sidebarTema===t.id?700:400}}>{t.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FUNDO + FONTE */}
        <div style={{background:'white',borderRadius:14,padding:'20px 22px',border:'1px solid rgba(113,63,42,0.08)'}}>
          <div style={{fontSize:13,fontWeight:700,color:'#1a1a1a',marginBottom:14}}>Fundo do Aplicativo</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}>
            {FUNDOS.map(f=>(
              <div key={f.id} onClick={()=>setForm(fm=>({...fm,fundoApp:f.id}))}
                style={{cursor:'pointer',borderRadius:8,overflow:'hidden',border:`2px solid ${form.fundoApp===f.id?form.corPrimaria:'#E6E2D8'}`}}>
                <div style={{width:56,height:32,background:f.id}}/>
                <div style={{padding:'4px 6px',fontSize:9,color:'#555',fontWeight:form.fundoApp===f.id?700:400}}>{f.label}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:13,fontWeight:700,color:'#1a1a1a',marginBottom:10}}>Fonte Principal</div>
          <div style={{display:'flex',gap:8}}>
            {FONTES.map(f=>(
              <button key={f.id} onClick={()=>setForm(fm=>({...fm,fontePrincipal:f.id}))}
                style={{padding:'7px 14px',borderRadius:8,border:`2px solid ${form.fontePrincipal===f.id?form.corPrimaria:'#E6E2D8'}`,background:form.fontePrincipal===f.id?`${form.corPrimaria}10`:'white',cursor:'pointer',fontSize:12,fontWeight:form.fontePrincipal===f.id?700:400,color:form.fontePrincipal===f.id?form.corPrimaria:'#555',fontFamily:f.id==='system'?'system-ui':f.id}}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{display:'flex',justifyContent:'flex-end',marginTop:24,gap:10}}>
        <button onClick={()=>setForm({corPrimaria:'#001489',corAcento:'#CCA67F',sidebarTema:'dark',fontePrincipal:'montserrat',fundoApp:'#F5F4F0'})}
          style={{padding:'9px 18px',borderRadius:8,border:'1px solid #E6E2D8',background:'white',cursor:'pointer',fontSize:13}}>Restaurar padrão</button>
        <button onClick={salvar}
          style={{padding:'9px 24px',borderRadius:8,border:'none',background:salvo?'#166534':form.corPrimaria,color:'white',cursor:'pointer',fontSize:13,fontWeight:600,transition:'background .3s'}}>
          {salvo ? '✓ Salvo!' : 'Aplicar personalização'}
        </button>
      </div>
    </div>
  );
}

// ── CONSTRUTOR DE AUTOMAÇÕES ───────────────────────────────────────────────────
const GATILHOS = [
  { id:'novo_negocio',       label:'Novo negócio criado',        icon:'💼', desc:'Dispara quando um negócio é adicionado ao pipeline' },
  { id:'negocio_etapa',      label:'Negócio muda de etapa',      icon:'🔁', desc:'Dispara quando um negócio avança ou recua de etapa' },
  { id:'negocio_ganho',      label:'Negócio ganho',              icon:'🏆', desc:'Dispara quando um negócio é marcado como ganho' },
  { id:'novo_contato',       label:'Novo contato criado',        icon:'👤', desc:'Dispara quando um contato é adicionado' },
  { id:'nova_tarefa',        label:'Nova tarefa criada',         icon:'✅', desc:'Dispara quando uma tarefa é criada' },
  { id:'tarefa_concluida',   label:'Tarefa concluída',           icon:'🎯', desc:'Dispara quando uma tarefa muda para concluída' },
  { id:'conta_vencendo',     label:'Conta a vencer (3 dias)',    icon:'⚠️', desc:'Dispara 3 dias antes do vencimento de uma conta' },
];

const ACOES = [
  { id:'notificacao',    label:'Enviar notificação interna', icon:'🔔', campos:['destinatario','mensagem'] },
  { id:'criar_tarefa',   label:'Criar tarefa automaticamente', icon:'✅', campos:['titulo_tarefa','lista','responsavel'] },
  { id:'mover_etapa',    label:'Mover negócio para etapa',  icon:'🔁', campos:['etapa_destino'] },
  { id:'webhook',        label:'Chamar URL externa (webhook)', icon:'🌐', campos:['url','metodo'] },
];

function AutomacaoBuilder({ dados, onSalvar }) {
  const automacoes = dados.automacoes || [];
  const [editando, setEditando] = React.useState(null);
  const FORM0 = { nome:'', ativo:true, gatilho:null, condicoes:[], acoes:[] };
  const [form, setForm] = React.useState(FORM0);
  const [step, setStep] = React.useState('gatilho'); // gatilho | acoes | salvar

  const abrir = (auto) => {
    setForm(auto || FORM0);
    setStep('gatilho');
    setEditando(auto || 'novo');
  };

  const salvarAuto = () => {
    if (!form.gatilho || form.acoes.length === 0) return alert('Configure o gatilho e pelo menos uma ação.');
    const id = editando === 'novo' ? `auto_${Date.now()}` : editando.id;
    const updated = editando === 'novo'
      ? [...automacoes, { ...form, id }]
      : automacoes.map(a => a.id === id ? { ...form, id } : a);
    onSalvar(updated);
    setEditando(null);
  };

  const remover = (id) => { if(confirm('Remover automação?')) onSalvar(automacoes.filter(a=>a.id!==id)); };
  const toggleAtivo = (id) => onSalvar(automacoes.map(a=>a.id===id?{...a,ativo:!a.ativo}:a));

  const addAcao = (tipo) => {
    const acao = ACOES.find(a=>a.id===tipo);
    if (!acao) return;
    const nova = { id:`acao_${Date.now()}`, tipo, config:{} };
    setForm(f=>({...f,acoes:[...f.acoes,nova]}));
  };

  const updateAcaoConfig = (acaoId, key, val) => {
    setForm(f=>({...f,acoes:f.acoes.map(a=>a.id===acaoId?{...a,config:{...a.config,[key]:val}}:a)}));
  };

  const removerAcao = (acaoId) => setForm(f=>({...f,acoes:f.acoes.filter(a=>a.id!==acaoId)}));

  const todasEtapas = [...PIPE_VAREJO,...PIPE_ATACADO.filter(e=>!PIPE_VAREJO.some(v=>v.id===e.id))];
  const inpSt = {padding:"7px 10px",border:"1px solid rgba(113,63,42,0.2)",borderRadius:7,fontSize:12,fontFamily:SN,background:"white",width:"100%",boxSizing:"border-box"};

  return (
    <div style={{padding:'24px 32px',maxWidth:1000,margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28}}>
        <div>
          <h2 style={{margin:0,fontFamily:FT,fontWeight:300,fontSize:26,color:'#1a1a1a'}}>Automações</h2>
          <div style={{fontSize:12,color:'#aaa',marginTop:4}}>Crie regras que executam ações automaticamente quando eventos ocorrem</div>
        </div>
        <button onClick={()=>abrir(null)} style={{padding:'9px 18px',borderRadius:8,border:'none',background:ASSESS.primary,color:'white',cursor:'pointer',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:8}}>{I.plus} Nova Automação</button>
      </div>

      {/* LISTA */}
      {automacoes.length === 0 && !editando && (
        <div style={{background:'white',borderRadius:14,padding:56,border:'1px dashed rgba(113,63,42,0.2)',textAlign:'center'}}>
          <div style={{fontSize:48,marginBottom:12}}>⚡</div>
          <div style={{fontWeight:700,color:'#1a1a1a',marginBottom:6}}>Nenhuma automação criada</div>
          <div style={{fontSize:13,color:'#aaa',marginBottom:20}}>Automatize notificações, criação de tarefas e movimentação de negócios.</div>
          <button onClick={()=>abrir(null)} style={{padding:'9px 18px',borderRadius:8,border:'none',background:ASSESS.primary,color:'white',cursor:'pointer',fontSize:13,fontWeight:600}}>Criar primeira automação</button>
        </div>
      )}

      {automacoes.length > 0 && !editando && (
        <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:24}}>
          {automacoes.map(auto=>{
            const g = GATILHOS.find(x=>x.id===auto.gatilho);
            return (
              <div key={auto.id} style={{background:'white',borderRadius:14,padding:'18px 22px',border:'1px solid rgba(113,63,42,0.08)',display:'flex',alignItems:'center',gap:14}}>
                <div style={{fontSize:28,flexShrink:0}}>{g?.icon||'⚡'}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,color:'#1a1a1a',marginBottom:3}}>{auto.nome||'Sem nome'}</div>
                  <div style={{fontSize:12,color:'#888'}}>
                    Gatilho: <strong>{g?.label||auto.gatilho}</strong> → {auto.acoes.length} ação{auto.acoes.length!==1?'ões':''}
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <div onClick={()=>toggleAtivo(auto.id)}
                    style={{width:40,height:22,borderRadius:11,background:auto.ativo?'#22c55e':'#d1d5db',cursor:'pointer',position:'relative',transition:'background .2s'}}>
                    <div style={{width:18,height:18,borderRadius:'50%',background:'white',position:'absolute',top:2,left:auto.ativo?20:2,transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
                  </div>
                  <span style={{fontSize:11,color:auto.ativo?'#166534':'#888',fontWeight:600}}>{auto.ativo?'Ativo':'Inativo'}</span>
                  <button onClick={()=>abrir(auto)} style={{padding:'5px 12px',borderRadius:7,border:'1px solid rgba(113,63,42,0.15)',background:'white',cursor:'pointer',fontSize:12,marginLeft:8,display:'flex',alignItems:'center',gap:4}}>{I.edit} Editar</button>
                  <button onClick={()=>remover(auto.id)} style={{padding:'5px',borderRadius:7,border:'1px solid #fee2e2',background:'white',cursor:'pointer',color:'#dc2626',display:'flex'}}>{I.trash}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDITOR DE AUTOMAÇÃO */}
      {editando && (
        <div style={{background:'white',borderRadius:16,border:'1px solid rgba(113,63,42,0.10)',overflow:'hidden'}}>
          {/* HEADER */}
          <div style={{padding:'20px 24px',borderBottom:'1px solid rgba(113,63,42,0.08)',display:'flex',alignItems:'center',gap:14}}>
            <div style={{flex:1}}>
              <input value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))}
                placeholder="Nome da automação..."
                style={{border:'none',outline:'none',fontFamily:FT,fontSize:22,fontWeight:300,color:'#1a1a1a',width:'100%'}}/>
            </div>
            <button onClick={()=>setEditando(null)} style={{background:'none',border:'none',cursor:'pointer',color:'#aaa',display:'flex'}}>{I.x}</button>
          </div>

          {/* STEPS NAV */}
          <div style={{display:'flex',borderBottom:'1px solid rgba(113,63,42,0.08)'}}>
            {[{id:'gatilho',label:'1. Gatilho'},{id:'acoes',label:'2. Ações'}].map(s=>(
              <button key={s.id} onClick={()=>setStep(s.id)}
                style={{padding:'12px 20px',border:'none',borderBottom:`2px solid ${step===s.id?ASSESS.primary:'transparent'}`,background:'none',cursor:'pointer',fontSize:12,fontWeight:step===s.id?700:400,color:step===s.id?ASSESS.primary:'#888'}}>
                {s.label}
              </button>
            ))}
          </div>

          <div style={{padding:'24px'}}>
            {/* STEP GATILHO */}
            {step==='gatilho'&&(
              <div>
                <div style={{fontSize:13,fontWeight:700,color:'#1a1a1a',marginBottom:16}}>Quando isso acontecer...</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
                  {GATILHOS.map(g=>(
                    <div key={g.id} onClick={()=>setForm(f=>({...f,gatilho:g.id}))}
                      style={{padding:'14px 16px',borderRadius:10,border:`2px solid ${form.gatilho===g.id?ASSESS.primary:'rgba(113,63,42,0.12)'}`,background:form.gatilho===g.id?`${ASSESS.primary}08`:'white',cursor:'pointer',display:'flex',gap:12,alignItems:'flex-start',transition:'all .15s'}}>
                      <span style={{fontSize:22,flexShrink:0}}>{g.icon}</span>
                      <div>
                        <div style={{fontWeight:600,fontSize:13,color:'#1a1a1a',marginBottom:2}}>{g.label}</div>
                        <div style={{fontSize:11,color:'#888',lineHeight:1.4}}>{g.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',justifyContent:'flex-end',marginTop:20}}>
                  <button onClick={()=>setStep('acoes')} disabled={!form.gatilho}
                    style={{padding:'9px 22px',borderRadius:8,border:'none',background:form.gatilho?ASSESS.primary:'#ddd',color:'white',cursor:form.gatilho?'pointer':'not-allowed',fontSize:13,fontWeight:600}}>
                    Próximo: Configurar Ações →
                  </button>
                </div>
              </div>
            )}

            {/* STEP AÇÕES */}
            {step==='acoes'&&(
              <div>
                <div style={{fontSize:13,fontWeight:700,color:'#1a1a1a',marginBottom:6}}>...executar estas ações:</div>
                <div style={{fontSize:12,color:'#888',marginBottom:20}}>As ações são executadas em sequência quando o gatilho é disparado.</div>

                {/* FLUXO VISUAL */}
                <div style={{display:'flex',flexDirection:'column',gap:0,marginBottom:20}}>
                  {/* GATILHO CARD */}
                  <div style={{background:`${ASSESS.primary}08`,borderRadius:12,padding:'12px 16px',border:`1px solid ${ASSESS.primary}30`,display:'flex',alignItems:'center',gap:12,marginBottom:0}}>
                    <span style={{fontSize:20}}>{GATILHOS.find(g=>g.id===form.gatilho)?.icon}</span>
                    <div><div style={{fontSize:11,color:ASSESS.primary,fontWeight:700,letterSpacing:.5}}>GATILHO</div><div style={{fontSize:13,fontWeight:600,color:'#1a1a1a'}}>{GATILHOS.find(g=>g.id===form.gatilho)?.label}</div></div>
                  </div>

                  {form.acoes.map((acao,i)=>{
                    const acaoDef = ACOES.find(a=>a.id===acao.tipo);
                    return (
                      <React.Fragment key={acao.id}>
                        <div style={{display:'flex',justifyContent:'center'}}><div style={{width:2,height:20,background:`${ASSESS.primary}30`}}/></div>
                        <div style={{background:'white',borderRadius:12,padding:'14px 16px',border:'1px solid rgba(113,63,42,0.12)'}}>
                          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                            <span style={{fontSize:16}}>{acaoDef?.icon}</span>
                            <div style={{fontSize:11,color:'#888',fontWeight:700,letterSpacing:.5}}>AÇÃO {i+1}</div>
                            <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a',flex:1}}>{acaoDef?.label}</div>
                            <button onClick={()=>removerAcao(acao.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#dc2626',display:'flex'}}>{I.trash}</button>
                          </div>
                          {/* Campos da ação */}
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                            {acao.tipo==='notificacao'&&<>
                              <div><label style={{fontSize:10,fontWeight:700,color:ASSESS.primary,display:'block',marginBottom:3}}>DESTINATÁRIO</label>
                                <select style={inpSt} value={acao.config.destinatario||''} onChange={e=>updateAcaoConfig(acao.id,'destinatario',e.target.value)}>
                                  <option value="">— Selecionar —</option>
                                  <option value="consultor">Consultor do negócio</option>
                                  <option value="admin">Administrador</option>
                                  {dados.funcionarios.map(f=><option key={f.id} value={f.email}>{f.nome}</option>)}
                                </select>
                              </div>
                              <div><label style={{fontSize:10,fontWeight:700,color:ASSESS.primary,display:'block',marginBottom:3}}>MENSAGEM</label>
                                <input style={inpSt} value={acao.config.mensagem||''} onChange={e=>updateAcaoConfig(acao.id,'mensagem',e.target.value)} placeholder="Use {{titulo}}, {{valor}}..."/>
                              </div>
                            </>}
                            {acao.tipo==='criar_tarefa'&&<>
                              <div><label style={{fontSize:10,fontWeight:700,color:ASSESS.primary,display:'block',marginBottom:3}}>TÍTULO DA TAREFA</label>
                                <input style={inpSt} value={acao.config.titulo_tarefa||''} onChange={e=>updateAcaoConfig(acao.id,'titulo_tarefa',e.target.value)} placeholder="Ex: Follow-up com {{nome}}"/>
                              </div>
                              <div><label style={{fontSize:10,fontWeight:700,color:ASSESS.primary,display:'block',marginBottom:3}}>LISTA</label>
                                <select style={inpSt} value={acao.config.lista||''} onChange={e=>updateAcaoConfig(acao.id,'lista',e.target.value)}>
                                  <option value="">— Selecionar —</option>
                                  {(dados.listas_tarefas||[]).map(l=><option key={l.id} value={l.id}>{l.nome}</option>)}
                                </select>
                              </div>
                            </>}
                            {acao.tipo==='mover_etapa'&&(
                              <div><label style={{fontSize:10,fontWeight:700,color:ASSESS.primary,display:'block',marginBottom:3}}>ETAPA DESTINO</label>
                                <select style={inpSt} value={acao.config.etapa_destino||''} onChange={e=>updateAcaoConfig(acao.id,'etapa_destino',e.target.value)}>
                                  <option value="">— Selecionar —</option>
                                  {todasEtapas.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                              </div>
                            )}
                            {acao.tipo==='webhook'&&<>
                              <div><label style={{fontSize:10,fontWeight:700,color:ASSESS.primary,display:'block',marginBottom:3}}>URL</label>
                                <input style={inpSt} value={acao.config.url||''} onChange={e=>updateAcaoConfig(acao.id,'url',e.target.value)} placeholder="https://..."/>
                              </div>
                              <div><label style={{fontSize:10,fontWeight:700,color:ASSESS.primary,display:'block',marginBottom:3}}>MÉTODO</label>
                                <select style={inpSt} value={acao.config.metodo||'POST'} onChange={e=>updateAcaoConfig(acao.id,'metodo',e.target.value)}>
                                  <option value="POST">POST</option><option value="GET">GET</option>
                                </select>
                              </div>
                            </>}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}

                  {/* ADICIONAR AÇÃO */}
                  <div style={{display:'flex',justifyContent:'center'}}><div style={{width:2,height:20,background:'#ddd'}}/></div>
                  <div style={{borderRadius:12,border:'2px dashed rgba(113,63,42,0.2)',padding:'14px',display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center'}}>
                    {ACOES.map(a=>(
                      <button key={a.id} onClick={()=>addAcao(a.id)}
                        style={{padding:'8px 14px',borderRadius:8,border:'1px solid rgba(113,63,42,0.15)',background:'white',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',gap:6,color:'#555'}}>
                        <span>{a.icon}</span> {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                  <button onClick={()=>setStep('gatilho')} style={{padding:'9px 18px',borderRadius:8,border:'1px solid #E6E2D8',background:'white',cursor:'pointer',fontSize:13}}>← Voltar</button>
                  <button onClick={salvarAuto} style={{padding:'9px 22px',borderRadius:8,border:'none',background:ASSESS.primary,color:'white',cursor:'pointer',fontSize:13,fontWeight:600}}>
                    Salvar Automação ⚡
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function getStaticProps() {
  return { props: {} }
}
