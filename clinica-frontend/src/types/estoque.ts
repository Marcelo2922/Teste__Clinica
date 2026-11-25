export interface ItemEstoque {
  id: number;
  nome: string;
  unidade: string;
  estoqueMinimo: number;
  saldo: number;
}

export interface MovimentacaoEstoque {
  tipo: "ENTRADA" | "SAIDA" | "AJUSTE";
  itemId: number;
  quantidade: number;
  lote?: string;
  validade?: string;
  usuario?: string;
  data: string;
}

export interface NovoItem {
  nome: string;
  unidade: string;
  estoqueMinimo: number;
}

export interface DadosMovimentacao {
  quantidade: number;
  lote?: string;
  validade?: string;
}

export interface ResultadoConciliacao {
  itemId: number;
  saldoSistema: number;
  contagemFisica: number;
  diferenca: number;
  status: "OK" | "FALTA" | "SOBRA";
  ajustado: boolean;
}
