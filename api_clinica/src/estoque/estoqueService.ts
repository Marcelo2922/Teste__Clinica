export class EstoqueError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "EstoqueError";
    this.status = status;
  }
}

export interface ItemEstoque {
  id: number;
  nome: string;
  unidade: string;
  estoqueMinimo: number;
  saldo: number;
}

export interface Movimentacao {
  tipo: "ENTRADA" | "SAIDA" | "AJUSTE";
  itemId: number;
  quantidade: number;
  lote?: string;
  validade?: string;
  usuario?: string;
  data: Date;
}

export interface EstoqueRepo {
  buscarItemPorNome(nome: string): Promise<ItemEstoque | null>;
  buscarItemPorId(id: number): Promise<ItemEstoque | null>;
  salvarItem(item: Omit<ItemEstoque, "id">): Promise<ItemEstoque>;
  atualizarSaldo(id: number, saldo: number): Promise<void>;
  registrarMovimentacao(mov: Movimentacao): Promise<void>;
  listarItens(): Promise<ItemEstoque[]>;
  listarMovimentacoes(itemId: number): Promise<Movimentacao[]>;
  buscarPedidosAbertos(itemId: number): Promise<unknown[]>;
  salvarPedido(pedido: { itemId: number; quantidade: number; data: Date }): Promise<{ id: number }>;
}

interface Deps {
  repo: EstoqueRepo;
  agora?: () => Date;
}

export type EstoqueService = ReturnType<typeof criarEstoqueService>;

export function calcularDivergencia(saldoSistema: number, contagemFisica: number) {
  const diferenca = contagemFisica - saldoSistema;
  const status = diferenca === 0 ? "OK" : diferenca < 0 ? "FALTA" : "SOBRA";
  return { diferenca, status };
}

export function criarEstoqueService({ repo, agora = () => new Date() }: Deps) {
  async function obterItem(itemId: number): Promise<ItemEstoque> {
    const item = await repo.buscarItemPorId(itemId);
    if (!item) throw new EstoqueError("Item não encontrado", 404);
    return item;
  }

  function validarQuantidade(q: number): void {
    if (!Number.isInteger(q) || q <= 0) throw new EstoqueError("Quantidade inválida");
  }

  async function compraDuplicada(itemId: number): Promise<boolean> {
    const pedidos = await repo.buscarPedidosAbertos(itemId);
    return pedidos.length > 0;
  }

  return {
    async cadastrarItem(dados: { nome: string; unidade: string; estoqueMinimo?: number }) {
      const { nome, unidade, estoqueMinimo = 0 } = dados;
      if (!nome || !nome.trim()) throw new EstoqueError("Nome é obrigatório");
      if (!unidade) throw new EstoqueError("Unidade é obrigatória");
      if (estoqueMinimo < 0) throw new EstoqueError("Estoque mínimo inválido");
      if (await repo.buscarItemPorNome(nome.trim())) throw new EstoqueError("Item já cadastrado", 409);
      return repo.salvarItem({ nome: nome.trim(), unidade, estoqueMinimo, saldo: 0 });
    },

    listarItens() {
      return repo.listarItens();
    },

    async listarMovimentacoes(itemId: number) {
      await obterItem(itemId);
      return repo.listarMovimentacoes(itemId);
    },

    async registrarEntrada(dados: {
      itemId: number;
      quantidade: number;
      lote?: string;
      validade?: string;
      usuario?: string;
    }) {
      const { itemId, quantidade, lote, validade, usuario } = dados;
      validarQuantidade(quantidade);
      const item = await obterItem(itemId);
      if (validade && new Date(validade) < agora()) throw new EstoqueError("Lote vencido");
      const saldo = item.saldo + quantidade;
      await repo.atualizarSaldo(itemId, saldo);
      await repo.registrarMovimentacao({
        tipo: "ENTRADA",
        itemId,
        quantidade,
        lote,
        validade,
        usuario,
        data: agora(),
      });
      return { saldo };
    },

    async registrarSaida(dados: { itemId: number; quantidade: number; usuario?: string }) {
      const { itemId, quantidade, usuario } = dados;
      validarQuantidade(quantidade);
      const item = await obterItem(itemId);
      if (quantidade > item.saldo) throw new EstoqueError("Saldo insuficiente");
      const saldo = item.saldo - quantidade;
      await repo.atualizarSaldo(itemId, saldo);
      await repo.registrarMovimentacao({ tipo: "SAIDA", itemId, quantidade, usuario, data: agora() });
      return { saldo };
    },

    async itensCriticos() {
      const itens = await repo.listarItens();
      return itens.filter((i) => i.saldo <= i.estoqueMinimo);
    },

    calcularDivergencia,

    async conciliar(dados: { itemId: number; contagemFisica: number; ajustar?: boolean; usuario?: string }) {
      const { itemId, contagemFisica, ajustar = false, usuario } = dados;
      if (!Number.isInteger(contagemFisica) || contagemFisica < 0) throw new EstoqueError("Contagem inválida");
      const item = await obterItem(itemId);
      const div = calcularDivergencia(item.saldo, contagemFisica);
      if (ajustar && div.diferenca !== 0) {
        await repo.atualizarSaldo(itemId, contagemFisica);
        await repo.registrarMovimentacao({
          tipo: "AJUSTE",
          itemId,
          quantidade: Math.abs(div.diferenca),
          usuario,
          data: agora(),
        });
      }
      return { itemId, saldoSistema: item.saldo, contagemFisica, ...div, ajustado: ajustar && div.diferenca !== 0 };
    },

    compraDuplicada,

    async criarPedidoCompra(dados: { itemId: number; quantidade: number }) {
      validarQuantidade(dados.quantidade);
      await obterItem(dados.itemId);
      if (await compraDuplicada(dados.itemId)) {
        throw new EstoqueError("Já existe pedido de compra em aberto para este item", 409);
      }
      return repo.salvarPedido({ itemId: dados.itemId, quantidade: dados.quantidade, data: agora() });
    },
  };
}
