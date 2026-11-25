import axios from "axios";
import type {
  DadosMovimentacao,
  ItemEstoque,
  MovimentacaoEstoque,
  NovoItem,
  ResultadoConciliacao,
} from "../types/estoque";

const API_URL = "http://localhost:3000";

const api = axios.create({ baseURL: `${API_URL}/estoque` });

// Envia o token de acesso (JWT) em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tokenAcesso");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// O token de acesso expira em 5 minutos: tenta renová-lo uma vez com o refresh token
api.interceptors.response.use(
  (resposta) => resposta,
  async (erro) => {
    const original = erro.config as typeof erro.config & { _retry?: boolean };
    const refresh = localStorage.getItem("tokenRefresh");

    if (erro.response?.status === 401 && refresh && original && !original._retry) {
      original._retry = true;
      try {
        const renovado = await axios.get(`${API_URL}/renovar-token`, { params: { token: refresh } });
        const novoToken: string = renovado.data.data.tokenAcesso;
        localStorage.setItem("tokenAcesso", novoToken);
        original.headers.Authorization = `Bearer ${novoToken}`;
        return api(original);
      } catch {
        localStorage.removeItem("tokenAcesso");
        localStorage.removeItem("tokenRefresh");
        localStorage.removeItem("email");
        window.location.href = "/";
      }
    }
    return Promise.reject(erro);
  },
);

export const estoqueApi = {
  listarItens: async (): Promise<ItemEstoque[]> => (await api.get("/itens")).data,
  criarItem: async (dados: NovoItem): Promise<ItemEstoque> => (await api.post("/itens", dados)).data.data,
  registrarEntrada: async (id: number, dados: DadosMovimentacao): Promise<{ saldo: number }> =>
    (await api.post(`/itens/${id}/entrada`, dados)).data.data,
  registrarSaida: async (id: number, dados: DadosMovimentacao): Promise<{ saldo: number }> =>
    (await api.post(`/itens/${id}/saida`, { quantidade: dados.quantidade })).data.data,
  listarMovimentacoes: async (id: number): Promise<MovimentacaoEstoque[]> =>
    (await api.get(`/itens/${id}/movimentacoes`)).data,
  conciliar: async (id: number, contagemFisica: number, ajustar: boolean): Promise<ResultadoConciliacao> =>
    (await api.post(`/itens/${id}/contagem`, { contagemFisica, ajustar })).data.data,
  criarPedidoCompra: async (id: number, quantidade: number): Promise<{ id: number }> =>
    (await api.post(`/itens/${id}/pedido-compra`, { quantidade })).data.data,
};
