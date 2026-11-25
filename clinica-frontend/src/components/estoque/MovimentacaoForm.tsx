import { useState, type FormEvent } from "react";
import type { DadosMovimentacao } from "../../types/estoque";

export type TipoMovimentacao = "entrada" | "saida" | "pedido";

interface MovimentacaoFormProps {
  tipo: TipoMovimentacao;
  onSubmit: (dados: DadosMovimentacao) => void | Promise<void>;
  erro?: string;
}

const ROTULOS: Record<TipoMovimentacao, string> = {
  entrada: "Registrar entrada",
  saida: "Registrar saída",
  pedido: "Criar pedido",
};

const MovimentacaoForm = ({ tipo, onSubmit, erro }: MovimentacaoFormProps) => {
  const [quantidade, setQuantidade] = useState<string>("");
  const [lote, setLote] = useState<string>("");
  const [validade, setValidade] = useState<string>("");
  const [erroLocal, setErroLocal] = useState<string>("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = Number(quantidade);
    if (!Number.isInteger(q) || q <= 0) {
      setErroLocal("Informe uma quantidade inteira maior que zero");
      return;
    }
    setErroLocal("");
    await onSubmit({ quantidade: q, lote: lote.trim() || undefined, validade: validade || undefined });
  };

  const mensagem = erroLocal || erro;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <fieldset>
        <label htmlFor="quantidade" className="block text-sm font-medium mb-1">Quantidade</label>
        <input id="quantidade" type="number" value={quantidade} onChange={(e) => setQuantidade(e.target.value)}
          className="w-full p-2 border rounded-lg" />
      </fieldset>
      {tipo === "entrada" && (
        <>
          <fieldset>
            <label htmlFor="lote" className="block text-sm font-medium mb-1">Lote</label>
            <input id="lote" value={lote} onChange={(e) => setLote(e.target.value)}
              className="w-full p-2 border rounded-lg" />
          </fieldset>
          <fieldset>
            <label htmlFor="validade" className="block text-sm font-medium mb-1">Validade</label>
            <input id="validade" type="date" value={validade} onChange={(e) => setValidade(e.target.value)}
              className="w-full p-2 border rounded-lg" />
          </fieldset>
        </>
      )}
      {mensagem && <p role="alert" className="text-red-600 text-sm">{mensagem}</p>}
      <button type="submit" className="w-full bg-cyan-700 text-white p-2 rounded-lg hover:bg-cyan-800 cursor-pointer">
        {ROTULOS[tipo]}
      </button>
    </form>
  );
};

export default MovimentacaoForm;
