import { formatarQuantidade, mensagemDeErro, nivelEstoque } from "./utils";

test("FE-01 formata quantidade com unidade", () => {
  expect(formatarQuantidade(10, "cx")).toBe("10 cx");
});
test("FE-02 nível crítico quando saldo <= mínimo", () => {
  expect(nivelEstoque(5, 5)).toBe("critico");
});
test("FE-03 nível atenção até 150% do mínimo", () => {
  expect(nivelEstoque(7, 5)).toBe("atencao");
});
test("FE-04 nível ok acima de 150% do mínimo", () => {
  expect(nivelEstoque(8, 5)).toBe("ok");
});
test("FE-11 mensagemDeErro usa a mensagem devolvida pela API", () => {
  expect(mensagemDeErro({ response: { data: { error: "Saldo insuficiente" } } })).toBe("Saldo insuficiente");
});
test("FE-12 mensagemDeErro usa texto padrão quando não há resposta", () => {
  expect(mensagemDeErro(new Error("Network Error"))).toBe("Não foi possível comunicar com o servidor");
});
