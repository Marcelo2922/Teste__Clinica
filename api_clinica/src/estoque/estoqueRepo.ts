import { db } from "../prisma/db";
import type { EstoqueRepo, ItemEstoque, Movimentacao } from "./estoqueService";

// Implementação do EstoqueRepo sobre o Prisma Next (db.orm.public).
// Requer as tabelas definidas em src/prisma/contract.prisma (ItemEstoque,
// MovimentacaoEstoque, PedidoCompra) e `npx prisma contract emit` executado.

const COLUNAS_ITEM = ["id", "nome", "unidade", "estoque_minimo", "saldo"] as const;

function paraItem(r: any): ItemEstoque {
  return {
    id: r.id,
    nome: r.nome,
    unidade: r.unidade,
    estoqueMinimo: r.estoque_minimo,
    saldo: r.saldo,
  };
}

function paraMovimentacao(r: any): Movimentacao {
  return {
    tipo: r.tipo,
    itemId: r.item_id,
    quantidade: r.quantidade,
    lote: r.lote ?? undefined,
    validade: r.validade ?? undefined,
    usuario: r.usuario ?? undefined,
    data: new Date(r.data),
  };
}

export function criarEstoqueRepoPrisma(): EstoqueRepo {
  const orm = db.orm.public;

  return {
    async buscarItemPorNome(nome) {
      const r = await orm.ItemEstoque.where({ nome }).first();
      return r ? paraItem(r) : null;
    },

    async buscarItemPorId(id) {
      const r = await orm.ItemEstoque.where({ id }).first();
      return r ? paraItem(r) : null;
    },

    async salvarItem(item) {
      const r = await orm.ItemEstoque.create({
        nome: item.nome,
        unidade: item.unidade,
        estoque_minimo: item.estoqueMinimo,
        saldo: item.saldo,
      });
      return paraItem(r);
    },

    async atualizarSaldo(id, saldo) {
      await orm.ItemEstoque.where({ id }).update({ saldo });
    },

    async registrarMovimentacao(mov) {
      await orm.MovimentacaoEstoque.create({
        tipo: mov.tipo,
        quantidade: mov.quantidade,
        lote: mov.lote,
        validade: mov.validade ? new Date(mov.validade).toISOString() : undefined,
        usuario: mov.usuario,
        data: mov.data.toISOString(),
        item_id: mov.itemId,
      });
    },

    async listarItens() {
      const rows = await orm.ItemEstoque.select(...COLUNAS_ITEM)
        .orderBy([(i) => i.nome.asc()])
        .all();
      return rows.map(paraItem);
    },

    async listarMovimentacoes(itemId) {
      const rows = await orm.MovimentacaoEstoque.where({ item_id: itemId })
        .orderBy([(m) => m.data.desc(), (m) => m.id.desc()])
        .all();
      return rows.map(paraMovimentacao);
    },

    async buscarPedidosAbertos(itemId) {
      return orm.PedidoCompra.where({ item_id: itemId, status: "ABERTO" }).all();
    },

    async salvarPedido(pedido) {
      const r = await orm.PedidoCompra.create({
        item_id: pedido.itemId,
        quantidade: pedido.quantidade,
        status: "ABERTO",
        criado_em: pedido.data.toISOString(),
      });
      return { id: r.id };
    },
  };
}
