import { useState, type FormEvent } from "react";
import type { NovoItem } from "../../types/estoque";

interface ItemFormProps {
  onSubmit: (item: NovoItem) => void;
}

const ItemForm = ({ onSubmit }: ItemFormProps) => {
  const [nome, setNome] = useState<string>("");
  const [unidade, setUnidade] = useState<string>("");
  const [minimo, setMinimo] = useState<string>("0");
  const [erro, setErro] = useState<string>("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nome.trim()) return setErro("Nome é obrigatório");
    if (!unidade) return setErro("Selecione a unidade");
    if (Number(minimo) < 0) return setErro("Estoque mínimo não pode ser negativo");
    setErro("");
    onSubmit({ nome: nome.trim(), unidade, estoqueMinimo: Number(minimo) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <fieldset>
        <label htmlFor="nome" className="block text-sm font-medium mb-1">Nome</label>
        <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)}
          className="w-full p-2 border rounded-lg" />
      </fieldset>
      <fieldset>
        <label htmlFor="unidade" className="block text-sm font-medium mb-1">Unidade</label>
        <select id="unidade" value={unidade} onChange={(e) => setUnidade(e.target.value)}
          className="w-full p-2 border rounded-lg">
          <option value="">Selecione</option>
          <option value="cx">Caixa</option>
          <option value="un">Unidade</option>
          <option value="fr">Frasco</option>
          <option value="amp">Ampola</option>
        </select>
      </fieldset>
      <fieldset>
        <label htmlFor="minimo" className="block text-sm font-medium mb-1">Estoque mínimo</label>
        <input id="minimo" type="number" value={minimo} onChange={(e) => setMinimo(e.target.value)}
          className="w-full p-2 border rounded-lg" />
      </fieldset>
      {erro && <p role="alert" className="text-red-600 text-sm">{erro}</p>}
      <button type="submit" className="w-full bg-cyan-700 text-white p-2 rounded-lg hover:bg-cyan-800 cursor-pointer">
        Salvar
      </button>
    </form>
  );
};

export default ItemForm;
