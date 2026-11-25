export type NivelEstoque = "critico" | "atencao" | "ok";

export function formatarQuantidade(qtd: number, unidade: string): string {
  return `${qtd} ${unidade}`;
}

export function nivelEstoque(saldo: number, minimo: number): NivelEstoque {
  if (saldo <= minimo) return "critico";
  if (saldo <= minimo * 1.5) return "atencao";
  return "ok";
}

// Extrai a mensagem de erro devolvida pela API ({ error: "..." }) ou usa um texto padrão
export function mensagemDeErro(erro: unknown): string {
  const mensagem = (erro as { response?: { data?: { error?: string } } })?.response?.data?.error;
  return mensagem ?? "Não foi possível comunicar com o servidor";
}
