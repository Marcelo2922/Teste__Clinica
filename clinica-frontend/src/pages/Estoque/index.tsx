import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Modal from "../../components/ui/Modal";
import AlertaEstoque from "../../components/estoque/AlertaEstoque";
import ContagemForm from "../../components/estoque/ContagemForm";
import HistoricoMovimentacoes from "../../components/estoque/HistoricoMovimentacoes";
import ItemForm from "../../components/estoque/ItemForm";
import MovimentacaoForm from "../../components/estoque/MovimentacaoForm";
import { formatarQuantidade, mensagemDeErro, nivelEstoque } from "../../components/estoque/utils";
import { estoqueApi } from "../../service/estoqueApi";
import type { DadosMovimentacao, ItemEstoque, MovimentacaoEstoque, NovoItem } from "../../types/estoque";

type Modo =
  | { tipo: "novo" }
  | { tipo: "entrada" | "saida" | "pedido" | "contagem" | "historico"; item: ItemEstoque };

const BADGE: Record<ReturnType<typeof nivelEstoque>, { texto: string; classe: string }> = {
  critico: { texto: "Crítico", classe: "bg-red-100 text-red-700" },
  atencao: { texto: "Atenção", classe: "bg-yellow-100 text-yellow-700" },
  ok: { texto: "Normal", classe: "bg-green-100 text-green-700" },
};

const TITULOS: Record<string, string> = {
  novo: "Novo item",
  entrada: "Entrada de estoque",
  saida: "Saída de estoque",
  pedido: "Pedido de compra",
  contagem: "Conciliação de estoque",
  historico: "Histórico de movimentações",
};

const Estoque = () => {
  const [itens, setItens] = useState<ItemEstoque[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [busca, setBusca] = useState<string>("");
  const [modo, setModo] = useState<Modo | null>(null);
  const [erroModal, setErroModal] = useState<string>("");
  const [historico, setHistorico] = useState<MovimentacaoEstoque[]>([]);

  const carregar = useCallback(async (): Promise<void> => {
    try {
      setItens(await estoqueApi.listarItens());
    } catch (erro) {
      toast.error(mensagemDeErro(erro));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const fechar = (): void => {
    setModo(null);
    setErroModal("");
  };

  const abrir = async (novoModo: Modo): Promise<void> => {
    setErroModal("");
    setModo(novoModo);
    if (novoModo.tipo === "historico") {
      setHistorico([]);
      try {
        setHistorico(await estoqueApi.listarMovimentacoes(novoModo.item.id));
      } catch (erro) {
        setErroModal(mensagemDeErro(erro));
      }
    }
  };

  const executar = async (acao: () => Promise<unknown>, sucesso: string): Promise<void> => {
    try {
      await acao();
      toast.success(sucesso);
      fechar();
      await carregar();
    } catch (erro) {
      setErroModal(mensagemDeErro(erro));
    }
  };

  const conciliar = async (item: ItemEstoque, contagemFisica: number, ajustar: boolean): Promise<void> => {
    try {
      const r = await estoqueApi.conciliar(item.id, contagemFisica, ajustar);
      const texto =
        r.status === "OK"
          ? "Estoque conferido: sem divergência."
          : `Divergência: ${r.status} de ${Math.abs(r.diferenca)} ${item.unidade}${r.ajustado ? " (saldo ajustado)" : ""}.`;
      toast.info(texto);
      fechar();
      await carregar();
    } catch (erro) {
      setErroModal(mensagemDeErro(erro));
    }
  };

  const criticos = itens.filter((i) => i.saldo <= i.estoqueMinimo);
  const filtrados = itens.filter((i) => i.nome.toLowerCase().includes(busca.trim().toLowerCase()));

  const botao = "text-cyan-700 hover:underline cursor-pointer text-sm";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestão de Estoque</h1>
        <button
          type="button"
          onClick={() => abrir({ tipo: "novo" })}
          className="bg-cyan-700 text-white px-4 py-2 rounded-lg hover:bg-cyan-800 cursor-pointer"
        >
          Novo item
        </button>
      </div>

      <section className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold mb-2">Itens em nível crítico</h2>
        <AlertaEstoque itens={criticos} />
      </section>

      <section className="bg-white rounded-xl shadow p-4 space-y-3">
        <input
          type="search"
          aria-label="Buscar item"
          placeholder="Buscar item..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full max-w-sm p-2 border rounded-lg"
        />

        {carregando ? (
          <p>Carregando...</p>
        ) : filtrados.length === 0 ? (
          <p>Nenhum item cadastrado</p>
        ) : (
          <div className="overflow-x-auto">
            <table aria-label="Itens de estoque" className="w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="p-2">Item</th>
                  <th className="p-2">Saldo</th>
                  <th className="p-2">Mínimo</th>
                  <th className="p-2">Situação</th>
                  <th className="p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((item) => {
                  const badge = BADGE[nivelEstoque(item.saldo, item.estoqueMinimo)];
                  return (
                    <tr key={item.id} className="border-t">
                      <td className="p-2">{item.nome}</td>
                      <td className="p-2">{formatarQuantidade(item.saldo, item.unidade)}</td>
                      <td className="p-2">{item.estoqueMinimo}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${badge.classe}`}>{badge.texto}</span>
                      </td>
                      <td className="p-2 flex flex-wrap gap-3">
                        <button type="button" className={botao} aria-label={`Entrada de ${item.nome}`}
                          onClick={() => abrir({ tipo: "entrada", item })}>Entrada</button>
                        <button type="button" className={botao} aria-label={`Saída de ${item.nome}`}
                          onClick={() => abrir({ tipo: "saida", item })}>Saída</button>
                        <button type="button" className={botao} aria-label={`Histórico de ${item.nome}`}
                          onClick={() => abrir({ tipo: "historico", item })}>Histórico</button>
                        <button type="button" className={botao} aria-label={`Conciliar ${item.nome}`}
                          onClick={() => abrir({ tipo: "contagem", item })}>Contagem</button>
                        <button type="button" className={botao} aria-label={`Pedido de compra de ${item.nome}`}
                          onClick={() => abrir({ tipo: "pedido", item })}>Pedido</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal isOpen={modo !== null} onClose={fechar}>
        {modo && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">
              {TITULOS[modo.tipo]}
              {"item" in modo && `: ${modo.item.nome}`}
            </h2>

            {modo.tipo === "novo" && (
              <>
                <ItemForm onSubmit={(dados: NovoItem) => executar(() => estoqueApi.criarItem(dados), "Item cadastrado!")} />
                {erroModal && <p role="alert" className="text-red-600 text-sm">{erroModal}</p>}
              </>
            )}

            {modo.tipo === "entrada" && (
              <MovimentacaoForm
                tipo="entrada"
                erro={erroModal}
                onSubmit={(d: DadosMovimentacao) =>
                  executar(() => estoqueApi.registrarEntrada(modo.item.id, d), "Entrada registrada!")
                }
              />
            )}

            {modo.tipo === "saida" && (
              <MovimentacaoForm
                tipo="saida"
                erro={erroModal}
                onSubmit={(d: DadosMovimentacao) =>
                  executar(() => estoqueApi.registrarSaida(modo.item.id, d), "Saída registrada!")
                }
              />
            )}

            {modo.tipo === "pedido" && (
              <MovimentacaoForm
                tipo="pedido"
                erro={erroModal}
                onSubmit={(d: DadosMovimentacao) =>
                  executar(() => estoqueApi.criarPedidoCompra(modo.item.id, d.quantidade), "Pedido de compra criado!")
                }
              />
            )}

            {modo.tipo === "contagem" && (
              <ContagemForm
                erro={erroModal}
                onSubmit={({ contagemFisica, ajustar }) => conciliar(modo.item, contagemFisica, ajustar)}
              />
            )}

            {modo.tipo === "historico" && (
              <>
                <HistoricoMovimentacoes movimentacoes={historico} />
                {erroModal && <p role="alert" className="text-red-600 text-sm">{erroModal}</p>}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Estoque;
