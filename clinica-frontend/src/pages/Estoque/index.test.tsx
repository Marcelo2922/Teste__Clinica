import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Estoque from ".";
import { estoqueApi } from "../../service/estoqueApi";

jest.mock("../../service/estoqueApi", () => ({
  estoqueApi: {
    listarItens: jest.fn(),
    criarItem: jest.fn(),
    registrarEntrada: jest.fn(),
    registrarSaida: jest.fn(),
    conciliar: jest.fn(),
    criarPedidoCompra: jest.fn(),
    listarMovimentacoes: jest.fn(),
  },
}));

const api = estoqueApi as unknown as Record<string, jest.Mock>;

const ITENS = [
  { id: 1, nome: "Luva", unidade: "cx", saldo: 20, estoqueMinimo: 5 },
  { id: 2, nome: "Seringa", unidade: "un", saldo: 2, estoqueMinimo: 10 },
];

beforeEach(() => {
  jest.clearAllMocks();
  api.listarItens.mockResolvedValue(ITENS);
});

describe("Página de Estoque", () => {
  test("FE-20 carrega e lista os itens na tabela", async () => {
    render(<Estoque />);
    const tabela = await screen.findByRole("table", { name: "Itens de estoque" });
    expect(within(tabela).getByText("Luva")).toBeInTheDocument();
    expect(within(tabela).getByText("20 cx")).toBeInTheDocument();
  });

  test("FE-21 destaca os itens críticos no alerta", async () => {
    render(<Estoque />);
    const alerta = await screen.findByRole("list", { name: "Itens críticos" });
    expect(alerta).toHaveTextContent("Seringa");
    expect(alerta).not.toHaveTextContent("Luva");
  });

  test("FE-22 registra entrada e recarrega a lista", async () => {
    api.registrarEntrada.mockResolvedValue({ saldo: 25 });
    render(<Estoque />);
    await userEvent.click(await screen.findByRole("button", { name: "Entrada de Luva" }));
    await userEvent.type(screen.getByLabelText("Quantidade"), "5");
    await userEvent.click(screen.getByRole("button", { name: "Registrar entrada" }));
    expect(api.registrarEntrada).toHaveBeenCalledWith(1, expect.objectContaining({ quantidade: 5 }));
    expect(api.listarItens).toHaveBeenCalledTimes(2);
  });

  test("FE-23 cadastra um novo item", async () => {
    api.criarItem.mockResolvedValue({ id: 3, nome: "Gaze", unidade: "un", saldo: 0, estoqueMinimo: 3 });
    render(<Estoque />);
    await userEvent.click(await screen.findByRole("button", { name: "Novo item" }));
    await userEvent.type(screen.getByLabelText("Nome"), "Gaze");
    await userEvent.selectOptions(screen.getByLabelText("Unidade"), "un");
    await userEvent.clear(screen.getByLabelText("Estoque mínimo"));
    await userEvent.type(screen.getByLabelText("Estoque mínimo"), "3");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(api.criarItem).toHaveBeenCalledWith({ nome: "Gaze", unidade: "un", estoqueMinimo: 3 });
  });

  test("FE-24 exibe o erro da API quando a saída é recusada", async () => {
    api.registrarSaida.mockRejectedValue({ response: { data: { error: "Saldo insuficiente" } } });
    render(<Estoque />);
    await userEvent.click(await screen.findByRole("button", { name: "Saída de Luva" }));
    await userEvent.type(screen.getByLabelText("Quantidade"), "99");
    await userEvent.click(screen.getByRole("button", { name: "Registrar saída" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Saldo insuficiente");
  });

  test("FE-25 abre o histórico de movimentações do item", async () => {
    api.listarMovimentacoes.mockResolvedValue([
      { tipo: "ENTRADA", itemId: 1, quantidade: 3, usuario: "ana", data: "2026-11-25T10:00:00Z" },
    ]);
    render(<Estoque />);
    await userEvent.click(await screen.findByRole("button", { name: "Histórico de Luva" }));
    const historico = await screen.findByRole("table", { name: "Histórico de movimentações" });
    expect(historico).toHaveTextContent("Entrada");
    expect(api.listarMovimentacoes).toHaveBeenCalledWith(1);
  });

  test("FE-26 filtra a tabela pela busca", async () => {
    render(<Estoque />);
    const tabela = await screen.findByRole("table", { name: "Itens de estoque" });
    await userEvent.type(screen.getByLabelText("Buscar item"), "sering");
    expect(within(tabela).queryByText("Luva")).not.toBeInTheDocument();
    expect(within(tabela).getByText("Seringa")).toBeInTheDocument();
  });
});
