import type { MovimentacaoEstoque } from "../../types/estoque";

interface HistoricoProps {
  movimentacoes: MovimentacaoEstoque[];
}

const ROTULO_TIPO: Record<MovimentacaoEstoque["tipo"], string> = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
  AJUSTE: "Ajuste",
};

const HistoricoMovimentacoes = ({ movimentacoes }: HistoricoProps) => {
  if (!movimentacoes.length) return <p>Nenhuma movimentação registrada</p>;
  return (
    <div className="overflow-x-auto max-h-80">
      <table aria-label="Histórico de movimentações" className="w-full text-sm text-left">
        <thead>
          <tr>
            <th className="p-1">Tipo</th>
            <th className="p-1">Qtd.</th>
            <th className="p-1">Lote</th>
            <th className="p-1">Usuário</th>
            <th className="p-1">Data</th>
          </tr>
        </thead>
        <tbody>
          {movimentacoes.map((m, i) => (
            <tr key={i} className="border-t">
              <td className="p-1">{ROTULO_TIPO[m.tipo]}</td>
              <td className="p-1">{m.quantidade}</td>
              <td className="p-1">{m.lote ?? "-"}</td>
              <td className="p-1">{m.usuario ?? "-"}</td>
              <td className="p-1">{new Date(m.data).toLocaleString("pt-BR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HistoricoMovimentacoes;
