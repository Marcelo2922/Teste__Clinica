import { jest } from "@jest/globals";
import { criarEstoqueService, type EstoqueRepo, type ItemEstoque } from "./estoqueService";

const AGORA = new Date("2026-11-25T10:00:00Z");
const ITEM: ItemEstoque = { id: 1, nome: "Luva", unidade: "cx", saldo: 10, estoqueMinimo: 5 };

function criarRepo(): { [K in keyof EstoqueRepo]: jest.Mock<EstoqueRepo[K]> } {
  return {
    buscarItemPorNome: jest.fn<EstoqueRepo["buscarItemPorNome"]>().mockResolvedValue(null),
    buscarItemPorId: jest.fn<EstoqueRepo["buscarItemPorId"]>().mockResolvedValue({ ...ITEM }),
    salvarItem: jest.fn<EstoqueRepo["salvarItem"]>().mockImplementation(async (i) => ({ id: 1, ...i })),
    atualizarSaldo: jest.fn<EstoqueRepo["atualizarSaldo"]>().mockResolvedValue(undefined),
    registrarMovimentacao: jest.fn<EstoqueRepo["registrarMovimentacao"]>().mockResolvedValue(undefined),
    listarItens: jest.fn<EstoqueRepo["listarItens"]>().mockResolvedValue([]),
    listarMovimentacoes: jest.fn<EstoqueRepo["listarMovimentacoes"]>().mockResolvedValue([]),
    buscarPedidosAbertos: jest.fn<EstoqueRepo["buscarPedidosAbertos"]>().mockResolvedValue([]),
    salvarPedido: jest.fn<EstoqueRepo["salvarPedido"]>().mockResolvedValue({ id: 7 }),
  };
}

let repo: ReturnType<typeof criarRepo>;
let service: ReturnType<typeof criarEstoqueService>;

beforeEach(() => {
  repo = criarRepo();
  service = criarEstoqueService({ repo, agora: () => AGORA });
});

describe("cadastrarItem (RF01)", () => {
  test("BE-01 cadastra item válido com saldo 0", async () => {
    const r = await service.cadastrarItem({ nome: " Luva ", unidade: "cx", estoqueMinimo: 5 });
    expect(repo.salvarItem).toHaveBeenCalledWith({ nome: "Luva", unidade: "cx", estoqueMinimo: 5, saldo: 0 });
    expect(r.saldo).toBe(0);
  });
  test("BE-02 rejeita nome vazio", async () => {
    await expect(service.cadastrarItem({ nome: "  ", unidade: "cx" })).rejects.toThrow("Nome é obrigatório");
    expect(repo.salvarItem).not.toHaveBeenCalled();
  });
  test("BE-03 rejeita item duplicado (status 409)", async () => {
    repo.buscarItemPorNome.mockResolvedValue({ ...ITEM });
    await expect(service.cadastrarItem({ nome: "Luva", unidade: "cx" })).rejects.toMatchObject({
      message: "Item já cadastrado",
      status: 409,
    });
  });
  test("BE-04 rejeita estoque mínimo negativo", async () => {
    await expect(
      service.cadastrarItem({ nome: "Luva", unidade: "cx", estoqueMinimo: -1 }),
    ).rejects.toThrow("Estoque mínimo inválido");
  });
});

describe("registrarEntrada (RF02)", () => {
  test("BE-05 soma ao saldo e registra movimentação", async () => {
    const r = await service.registrarEntrada({ itemId: 1, quantidade: 5, lote: "L1", usuario: "ana" });
    expect(r.saldo).toBe(15);
    expect(repo.atualizarSaldo).toHaveBeenCalledWith(1, 15);
    expect(repo.registrarMovimentacao).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: "ENTRADA", quantidade: 5, usuario: "ana", data: AGORA }),
    );
  });
  test.each([0, -3, 1.5])("BE-06 rejeita quantidade inválida (%p)", async (q) => {
    await expect(service.registrarEntrada({ itemId: 1, quantidade: q })).rejects.toThrow("Quantidade inválida");
  });
  test("BE-07 rejeita item inexistente", async () => {
    repo.buscarItemPorId.mockResolvedValue(null);
    await expect(service.registrarEntrada({ itemId: 99, quantidade: 1 })).rejects.toThrow("Item não encontrado");
  });
  test("BE-08 rejeita lote vencido", async () => {
    await expect(
      service.registrarEntrada({ itemId: 1, quantidade: 1, validade: "2026-01-01" }),
    ).rejects.toThrow("Lote vencido");
    expect(repo.atualizarSaldo).not.toHaveBeenCalled();
  });
});

describe("registrarSaida (RF03)", () => {
  test("BE-09 subtrai do saldo e registra movimentação", async () => {
    const r = await service.registrarSaida({ itemId: 1, quantidade: 4, usuario: "ana" });
    expect(r.saldo).toBe(6);
    expect(repo.registrarMovimentacao).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: "SAIDA", quantidade: 4 }),
    );
  });
  test("BE-10 impede saldo negativo", async () => {
    await expect(service.registrarSaida({ itemId: 1, quantidade: 11 })).rejects.toThrow("Saldo insuficiente");
    expect(repo.atualizarSaldo).not.toHaveBeenCalled();
    expect(repo.registrarMovimentacao).not.toHaveBeenCalled();
  });
  test("BE-11 permite saída igual ao saldo (limite)", async () => {
    const r = await service.registrarSaida({ itemId: 1, quantidade: 10 });
    expect(r.saldo).toBe(0);
  });
  test("BE-12 rejeita item inexistente", async () => {
    repo.buscarItemPorId.mockResolvedValue(null);
    await expect(service.registrarSaida({ itemId: 99, quantidade: 1 })).rejects.toThrow("Item não encontrado");
  });
});

describe("itensCriticos (RF04)", () => {
  test("BE-13 retorna apenas itens com saldo <= mínimo", async () => {
    repo.listarItens.mockResolvedValue([
      { ...ITEM, id: 1, saldo: 2 },
      { ...ITEM, id: 2, saldo: 5 },
      { ...ITEM, id: 3, saldo: 9 },
    ]);
    const r = await service.itensCriticos();
    expect(r.map((i) => i.id)).toEqual([1, 2]);
  });
  test("BE-14 retorna lista vazia quando não há críticos", async () => {
    repo.listarItens.mockResolvedValue([{ ...ITEM, saldo: 9 }]);
    expect(await service.itensCriticos()).toEqual([]);
  });
});

describe("calcularDivergencia (RF05)", () => {
  test("BE-15 contagem igual ao sistema", () => {
    expect(service.calcularDivergencia(10, 10)).toEqual({ diferenca: 0, status: "OK" });
  });
  test("BE-16 contagem menor indica FALTA", () => {
    expect(service.calcularDivergencia(10, 7)).toEqual({ diferenca: -3, status: "FALTA" });
  });
  test("BE-17 contagem maior indica SOBRA", () => {
    expect(service.calcularDivergencia(10, 12)).toEqual({ diferenca: 2, status: "SOBRA" });
  });
});

describe("compraDuplicada (RF06)", () => {
  test("BE-18 verdadeiro com pedido em aberto", async () => {
    repo.buscarPedidosAbertos.mockResolvedValue([{ id: 1 }]);
    expect(await service.compraDuplicada(1)).toBe(true);
  });
  test("BE-19 falso sem pedido em aberto", async () => {
    expect(await service.compraDuplicada(1)).toBe(false);
  });
});

describe("consultas, conciliação e pedidos (RF08 a RF10)", () => {
  test("BE-20 listarItens delega ao repositório", async () => {
    repo.listarItens.mockResolvedValue([{ ...ITEM }]);
    expect(await service.listarItens()).toEqual([ITEM]);
  });
  test("BE-21 listarMovimentacoes devolve o histórico do item", async () => {
    const mov = { tipo: "ENTRADA" as const, itemId: 1, quantidade: 3, data: AGORA };
    repo.listarMovimentacoes.mockResolvedValue([mov]);
    expect(await service.listarMovimentacoes(1)).toEqual([mov]);
  });
  test("BE-22 listarMovimentacoes rejeita item inexistente (status 404)", async () => {
    repo.buscarItemPorId.mockResolvedValue(null);
    await expect(service.listarMovimentacoes(99)).rejects.toMatchObject({ status: 404 });
  });
  test("BE-23 criarPedidoCompra salva quando não há pedido em aberto", async () => {
    const r = await service.criarPedidoCompra({ itemId: 1, quantidade: 20 });
    expect(repo.salvarPedido).toHaveBeenCalledWith({ itemId: 1, quantidade: 20, data: AGORA });
    expect(r).toEqual({ id: 7 });
  });
  test("BE-24 criarPedidoCompra bloqueia compra duplicada (status 409)", async () => {
    repo.buscarPedidosAbertos.mockResolvedValue([{ id: 3 }]);
    await expect(service.criarPedidoCompra({ itemId: 1, quantidade: 20 })).rejects.toMatchObject({ status: 409 });
    expect(repo.salvarPedido).not.toHaveBeenCalled();
  });
  test("BE-25 conciliar sem ajuste apenas calcula a divergência", async () => {
    const r = await service.conciliar({ itemId: 1, contagemFisica: 7 });
    expect(r).toMatchObject({ saldoSistema: 10, diferenca: -3, status: "FALTA", ajustado: false });
    expect(repo.atualizarSaldo).not.toHaveBeenCalled();
  });
  test("BE-26 conciliar com ajuste atualiza o saldo e registra AJUSTE", async () => {
    const r = await service.conciliar({ itemId: 1, contagemFisica: 12, ajustar: true, usuario: "ana" });
    expect(r.ajustado).toBe(true);
    expect(repo.atualizarSaldo).toHaveBeenCalledWith(1, 12);
    expect(repo.registrarMovimentacao).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: "AJUSTE", quantidade: 2, usuario: "ana" }),
    );
  });
  test("BE-27 conciliar rejeita contagem inválida", async () => {
    await expect(service.conciliar({ itemId: 1, contagemFisica: -1 })).rejects.toThrow("Contagem inválida");
  });
});
