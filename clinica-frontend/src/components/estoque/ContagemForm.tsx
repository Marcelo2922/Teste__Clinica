import { useState, type FormEvent } from "react";

interface ContagemFormProps {
  onSubmit: (dados: { contagemFisica: number; ajustar: boolean }) => void | Promise<void>;
  erro?: string;
}

const ContagemForm = ({ onSubmit, erro }: ContagemFormProps) => {
  const [contagem, setContagem] = useState<string>("");
  const [ajustar, setAjustar] = useState<boolean>(false);
  const [erroLocal, setErroLocal] = useState<string>("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const n = Number(contagem);
    if (contagem === "" || !Number.isInteger(n) || n < 0) {
      setErroLocal("Informe a contagem física (número inteiro, zero ou mais)");
      return;
    }
    setErroLocal("");
    await onSubmit({ contagemFisica: n, ajustar });
  };

  const mensagem = erroLocal || erro;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <fieldset>
        <label htmlFor="contagem" className="block text-sm font-medium mb-1">Contagem física</label>
        <input id="contagem" type="number" value={contagem} onChange={(e) => setContagem(e.target.value)}
          className="w-full p-2 border rounded-lg" />
      </fieldset>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={ajustar} onChange={(e) => setAjustar(e.target.checked)} />
        Ajustar saldo do sistema para a contagem
      </label>
      {mensagem && <p role="alert" className="text-red-600 text-sm">{mensagem}</p>}
      <button type="submit" className="w-full bg-cyan-700 text-white p-2 rounded-lg hover:bg-cyan-800 cursor-pointer">
        Conciliar
      </button>
    </form>
  );
};

export default ContagemForm;
