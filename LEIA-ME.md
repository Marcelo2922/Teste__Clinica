# Clínica+ — Módulo de Gestão de Estoque (completo)

Contém o back-end (`api_clinica`) e o front-end (`clinica-frontend`) já com o módulo integrado.

## 1. Back-end
```bash
cd api_clinica
npm install
cp .env.example .env          # ajuste DATABASE_URL e CHAVE_SECRETA
npx prisma contract emit      # OBRIGATÓRIO: regenera contract.json / contract.d.ts com as novas tabelas
npx prisma migration status   # confira/aplique as migrações do seu fluxo para criar as tabelas
npm run dev                   # http://localhost:3000
npm test                      # BE-01 a BE-35
```
Novas tabelas (em `src/prisma/contract.prisma`): `ItemEstoque`, `MovimentacaoEstoque`, `PedidoCompra`.

Rotas (todas exigem `Authorization: Bearer <tokenAcesso>`):

| Método | Rota | Função |
|---|---|---|
| GET | /estoque/itens | Lista itens |
| GET | /estoque/criticos | Itens com saldo <= mínimo |
| POST | /estoque/itens | Cadastra item |
| POST | /estoque/itens/:id/entrada | Entrada (lote, validade) |
| POST | /estoque/itens/:id/saida | Saída (bloqueia saldo negativo) |
| GET | /estoque/itens/:id/movimentacoes | Histórico (rastreabilidade) |
| POST | /estoque/itens/:id/contagem | Conciliação físico x sistema (opção de ajustar) |
| POST | /estoque/itens/:id/pedido-compra | Pedido de compra (bloqueia duplicidade) |

## 2. Front-end
```bash
cd clinica-frontend
npm install
npm run dev                   # http://localhost:5173
npm test                      # FE-01 a FE-26
```
Nova tela em **/estoque** (menu lateral "Estoque").

## 3. Alterações em arquivos existentes
- `app.ts`: monta `/estoque` após o middleware `auth`; adicionados `return` que faltavam em `/login`, `/logout/:id`, `GET /usuarios/:id` e `PUT /usuarios/:id` (evitavam resposta dupla).
- `LoginForm` e `RegisterUser`: passam a usar `POST /login` e `POST /cadastro` do back-end real (antes usavam o json-server), para obter o JWT exigido pelo estoque. O logout limpa os tokens.
- `main.tsx` e `SideMenu`: rota e item de menu do Estoque.
- `tsconfig.app.json` (front) e `tsconfig.json` (back): testes fora do build e tipos do Jest.

## 4. Atenção
- Os demais componentes do front (pacientes, contadores, etc.) ainda consomem o json-server em `localhost:3000`, a mesma porta da API. Rode um de cada vez ou mude a porta do json-server.
- A atualização de saldo não é transacional (ler, somar, gravar). Com muitos usuários simultâneos, use transação/atualização atômica no repositório.
- Os testes não foram executados no ambiente de geração (sem acesso à rede): rode `npm install && npm test` e registre a saída na seção 3.1 do relatório.
