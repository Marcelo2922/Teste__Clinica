import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ItemForm from "./ItemForm";
import AlertaEstoque from "./AlertaEstoque";
import MovimentacaoForm from "./MovimentacaoForm";
import ContagemForm from "./ContagemForm";
import HistoricoMovimentacoes from "./HistoricoMovimentacoes";

describe("ItemForm", () => {
  test("FE-05 renderiza campos e botão", () => {
    render(<ItemForm onSubmit={jest.fn()} />);
    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
    expect(screen.getByLabelText("Unidade")).toBeInTheDocument();
    expect(screen.getByLabelText("Estoque mínimo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });

  test("FE-06 exibe erro quando o nome está vazio", async () => {
    const onSubmit = jest.fn();
    render(<ItemForm onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Nome é obrigatório");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("FE-07 exibe erro quando a unidade não é selecionada", async () => {
    const onSubmit = jest.fn();
    render(<ItemForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText("Nome"), "Luva");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Selecione a unidade");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("FE-08 envia dados válidos", async () => {
    const onSubmit = jest.fn();
    render(<ItemForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText("Nome"), "Luva");
    await userEvent.selectOptions(screen.getByLabelText("Unidade"), "cx");
    await userEvent.clear(screen.getByLabelText("Estoque mínimo"));
    await userEvent.type(screen.getByLabelText("Estoque mínimo"), "5");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(onSubmit).toHaveBeenCalledWith({ nome: "Luva", unidade: "cx", estoqueMinimo: 5 });
  });
});

describe("AlertaEstoque", () => {
  test("FE-09 lista itens críticos", () => {
    render(<AlertaEstoque itens={[{ id: 1, nome: "Luva", saldo: 2, estoqueMinimo: 5 }]} />);
    expect(screen.getByRole("list", { name: "Itens críticos" })).toBeInTheDocument();
    expect(screen.getByText(/Luva/)).toBeInTheDocument();
  });
  test("FE-10 mostra mensagem quando não há itens críticos", () => {
    render(<AlertaEstoque itens={[]} />);
    expect(screen.getByText("Nenhum item crítico")).toBeInTheDocument();
  });
});

describe("MovimentacaoForm", () => {
  test("FE-13 rejeita quantidade zero sem chamar onSubmit", async () => {
    const onSubmit = jest.fn();
    render(<MovimentacaoForm tipo="saida" onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText("Quantidade"), "0");
    await userEvent.click(screen.getByRole("button", { name: "Registrar saída" }));
    expect(screen.getByRole("alert")).toHaveTextContent("quantidade inteira maior que zero");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("FE-14 entrada envia quantidade, lote e validade", async () => {
    const onSubmit = jest.fn();
    render(<MovimentacaoForm tipo="entrada" onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText("Quantidade"), "5");
    await userEvent.type(screen.getByLabelText("Lote"), "L1");
    await userEvent.type(screen.getByLabelText("Validade"), "2027-01-31");
    await userEvent.click(screen.getByRole("button", { name: "Registrar entrada" }));
    expect(onSubmit).toHaveBeenCalledWith({ quantidade: 5, lote: "L1", validade: "2027-01-31" });
  });

  test("FE-15 saída não exibe campos de lote e validade", () => {
    render(<MovimentacaoForm tipo="saida" onSubmit={jest.fn()} />);
    expect(screen.queryByLabelText("Lote")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Validade")).not.toBeInTheDocument();
  });
});

describe("ContagemForm", () => {
  test("FE-16 exige a contagem física", async () => {
    const onSubmit = jest.fn();
    render(<ContagemForm onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole("button", { name: "Conciliar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Informe a contagem física");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("FE-17 envia contagem com opção de ajustar saldo", async () => {
    const onSubmit = jest.fn();
    render(<ContagemForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText("Contagem física"), "7");
    await userEvent.click(screen.getByLabelText(/Ajustar saldo/));
    await userEvent.click(screen.getByRole("button", { name: "Conciliar" }));
    expect(onSubmit).toHaveBeenCalledWith({ contagemFisica: 7, ajustar: true });
  });
});

describe("HistoricoMovimentacoes", () => {
  test("FE-18 lista as movimentações", () => {
    render(
      <HistoricoMovimentacoes
        movimentacoes={[{ tipo: "SAIDA", itemId: 1, quantidade: 4, usuario: "ana", data: "2026-11-25T10:00:00Z" }]}
      />,
    );
    const tabela = screen.getByRole("table", { name: "Histórico de movimentações" });
    expect(tabela).toHaveTextContent("Saída");
    expect(tabela).toHaveTextContent("ana");
  });
  test("FE-19 mostra mensagem quando não há movimentações", () => {
    render(<HistoricoMovimentacoes movimentacoes={[]} />);
    expect(screen.getByText("Nenhuma movimentação registrada")).toBeInTheDocument();
  });
});
