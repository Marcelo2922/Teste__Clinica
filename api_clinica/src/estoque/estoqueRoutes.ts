import { Router, type NextFunction, type Request, type Response } from "express";
import { getToken } from "../utils/jwt";
import { EstoqueError, type EstoqueService } from "./estoqueService";

type Handler = (req: Request, res: Response) => Promise<unknown>;

const envolver =
  (fn: Handler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res).catch(next);
  };

function idDaRota(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new EstoqueError("Item inválido");
  return id;
}

function usuarioDaRequisicao(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return undefined;
  try {
    const payload = getToken(header.slice("Bearer ".length)) as unknown as { email?: string } | null;
    return payload?.email;
  } catch {
    return undefined;
  }
}

export function criarEstoqueRouter(service: EstoqueService): Router {
  const router = Router();

  router.get("/itens", envolver(async (_req, res) => {
    res.json(await service.listarItens());
  }));

  router.get("/criticos", envolver(async (_req, res) => {
    res.json(await service.itensCriticos());
  }));

  router.post("/itens", envolver(async (req, res) => {
    const item = await service.cadastrarItem({
      nome: req.body?.nome,
      unidade: req.body?.unidade,
      estoqueMinimo: req.body?.estoqueMinimo === undefined ? undefined : Number(req.body.estoqueMinimo),
    });
    res.status(201).json({ mensagem: "Item cadastrado!", data: item });
  }));

  router.get("/itens/:id/movimentacoes", envolver(async (req, res) => {
    res.json(await service.listarMovimentacoes(idDaRota(req)));
  }));

  router.post("/itens/:id/entrada", envolver(async (req, res) => {
    const resultado = await service.registrarEntrada({
      itemId: idDaRota(req),
      quantidade: Number(req.body?.quantidade),
      lote: req.body?.lote,
      validade: req.body?.validade,
      usuario: usuarioDaRequisicao(req),
    });
    res.json({ mensagem: "Entrada registrada!", data: resultado });
  }));

  router.post("/itens/:id/saida", envolver(async (req, res) => {
    const resultado = await service.registrarSaida({
      itemId: idDaRota(req),
      quantidade: Number(req.body?.quantidade),
      usuario: usuarioDaRequisicao(req),
    });
    res.json({ mensagem: "Saída registrada!", data: resultado });
  }));

  router.post("/itens/:id/contagem", envolver(async (req, res) => {
    const resultado = await service.conciliar({
      itemId: idDaRota(req),
      contagemFisica: Number(req.body?.contagemFisica),
      ajustar: Boolean(req.body?.ajustar),
      usuario: usuarioDaRequisicao(req),
    });
    res.json({ mensagem: "Conciliação realizada!", data: resultado });
  }));

  router.post("/itens/:id/pedido-compra", envolver(async (req, res) => {
    const pedido = await service.criarPedidoCompra({
      itemId: idDaRota(req),
      quantidade: Number(req.body?.quantidade),
    });
    res.status(201).json({ mensagem: "Pedido de compra criado!", data: pedido });
  }));

  router.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof EstoqueError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    return res.status(500).json({ error: "Erro interno do servidor" });
  });

  return router;
}
