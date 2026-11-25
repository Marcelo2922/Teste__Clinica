import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";
import { criarEstoqueRouter } from "./estoqueRoutes";
import { EstoqueError, type EstoqueService } from "./estoqueService";

type Fn = jest.Mock<(...args: any[]) => Promise<any>>;

function criarApp(service: Record<string, Fn>) {
  const app = express();
  app.use(express.json());
  app.use("/estoque", criarEstoqueRouter(service as unknown as EstoqueService));
  return app;
}

const fn = (): Fn => jest.fn<(...args: any[]) => Promise<any>>();

describe("rotas de /estoque", () => {
  test("BE-28 GET /estoque/itens devolve a lista (200)", async () => {
    const listarItens = fn().mockResolvedValue([{ id: 1, nome: "Luva" }]);
    const res = await request(criarApp({ listarItens })).get("/estoque/itens");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, nome: "Luva" }]);
  });

  test("BE-29 POST /estoque/itens cria o item (201) com os dados do corpo", async () => {
    const cadastrarItem = fn().mockResolvedValue({ id: 1, nome: "Luva" });
    const res = await request(criarApp({ cadastrarItem }))
      .post("/estoque/itens")
      .send({ nome: "Luva", unidade: "cx", estoqueMinimo: 5 });
    expect(res.status).toBe(201);
    expect(cadastrarItem).toHaveBeenCalledWith({ nome: "Luva", unidade: "cx", estoqueMinimo: 5 });
  });

  test("BE-30 saída com saldo insuficiente responde 400 com a mensagem", async () => {
    const registrarSaida = fn().mockRejectedValue(new EstoqueError("Saldo insuficiente"));
    const res = await request(criarApp({ registrarSaida })).post("/estoque/itens/1/saida").send({ quantidade: 99 });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Saldo insuficiente" });
  });

  test("BE-31 item inexistente responde 404", async () => {
    const registrarEntrada = fn().mockRejectedValue(new EstoqueError("Item não encontrado", 404));
    const res = await request(criarApp({ registrarEntrada })).post("/estoque/itens/9/entrada").send({ quantidade: 1 });
    expect(res.status).toBe(404);
  });

  test("BE-32 pedido de compra duplicado responde 409", async () => {
    const criarPedidoCompra = fn().mockRejectedValue(new EstoqueError("Já existe pedido", 409));
    const res = await request(criarApp({ criarPedidoCompra }))
      .post("/estoque/itens/1/pedido-compra")
      .send({ quantidade: 10 });
    expect(res.status).toBe(409);
  });

  test("BE-33 id inválido na rota responde 400 sem chamar o serviço", async () => {
    const registrarSaida = fn();
    const res = await request(criarApp({ registrarSaida })).post("/estoque/itens/abc/saida").send({ quantidade: 1 });
    expect(res.status).toBe(400);
    expect(registrarSaida).not.toHaveBeenCalled();
  });

  test("BE-34 GET /estoque/criticos devolve os itens críticos", async () => {
    const itensCriticos = fn().mockResolvedValue([{ id: 2 }]);
    const res = await request(criarApp({ itensCriticos })).get("/estoque/criticos");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 2 }]);
  });

  test("BE-35 erro inesperado responde 500 sem vazar detalhes", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const listarItens = fn().mockRejectedValue(new Error("falha de conexão com o banco"));
    const res = await request(criarApp({ listarItens })).get("/estoque/itens");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Erro interno do servidor" });
  });
});
