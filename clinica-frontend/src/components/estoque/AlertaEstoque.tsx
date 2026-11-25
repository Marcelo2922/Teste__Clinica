import type { ItemEstoque } from "../../types/estoque";

interface AlertaEstoqueProps {
  itens: Pick<ItemEstoque, "id" | "nome" | "saldo" | "estoqueMinimo">[];
}

const AlertaEstoque = ({ itens }: AlertaEstoqueProps) => {
  if (!itens.length) return <p>Nenhum item crítico</p>;
  return (
    <ul aria-label="Itens críticos" className="space-y-1">
      {itens.map((i) => (
        <li key={i.id}>
          {i.nome}: {i.saldo} (mínimo {i.estoqueMinimo})
        </li>
      ))}
    </ul>
  );
};

export default AlertaEstoque;
