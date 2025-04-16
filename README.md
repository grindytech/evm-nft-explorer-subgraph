# Gafi Subgraph

This project is a subgraph for indexing NFT-related events on the Nibiru Testnet-2, part of the Gafi ecosystem. It tracks:
- ERC-721 collections (`OERC721Factory`)
- ERC-1155 collections (`OERC1155Factory`)
- DN404 tokens (`ODN404Factory`)
- Marketplace trades (`OpenMark`)
- Minting stages (`StageFactory`)

The subgraph is built using [The Graph](https://thegraph.com/) and runs on a local Graph Node.

## Prerequisites

- **Rust**: Install via [rustup](https://rustup.rs/):
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```
- **PostgreSQL**: Install (e.g., on Ubuntu):
  ```bash
  sudo apt update
  sudo apt install postgresql postgresql-contrib
  ```
- **IPFS**: Install [IPFS CLI](https://docs.ipfs.io/install/command-line/#install-official-binary-distributions):
  ```bash
  wget https://dist.ipfs.io/kubo/v0.20.0/kubo_v0.20.0_linux-amd64.tar.gz
  tar -xvzf kubo_v0.20.0_linux-amd64.tar.gz
  cd kubo && sudo bash install.sh
  ```
- **Node.js & npm**: Install via [nvm](https://github.com/nvm-sh/nvm):
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  nvm install 18
  ```
- **Graph CLI**: Install globally:
  ```bash
  npm install -g @graphprotocol/graph-cli
  ```

## Setup Graph Node

1. **Clone Graph Node Repository**:
   ```bash
   git clone https://github.com/graphprotocol/graph-node.git
   cd graph-node
   ```

2. **Install Dependencies**:
   ```bash
   cargo build --release
   ```

3. **Configure PostgreSQL**:
   - Start PostgreSQL:
     ```bash
     sudo service postgresql start
     ```
   - Create a user and database (replace `HIDDEN_PASSWORD` with your password):
     ```bash
     sudo -u postgres psql -c "CREATE USER 'USER_NAME' WITH PASSWORD 'HIDDEN_PASSWORD';"
     sudo -u postgres psql -c "CREATE DATABASE graph-node WITH OWNER 'USER_NAME';"
     ```

4. **Run IPFS**:
   - Initialize and start IPFS daemon:
     ```bash
     ipfs init
     ipfs daemon
     ```
   - Run this in a separate terminal.

5. **Run Graph Node**:
   - In the `graph-node` directory:
     ```bash
     cargo run -p graph-node --release \
       --postgres-url postgresql://USER_NAME:HIDDEN_PASSWORD@localhost:5432/graph-node \
       --ethereum-rpc nibiru-testnet-2:https://evm-rpc.archive.testnet-2.nibiru.fi/ \
       --ipfs http://localhost:5001
     ```
   - Keep this running in a terminal.

## Setup and Run Subgraph

1. **Clone This Repository**:
   ```bash
   git clone https://github.com/your-username/gafi-nft-subgraph.git
   cd gafi-nft-subgraph
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Generate Types**:
   ```bash
   graph codegen
   ```

4. **Build Subgraph**:
   ```bash
   graph build
   ```

5. **Create Subgraph**:
   - Register the subgraph name with the Graph Node:
     ```bash
     graph create gafi-nft-subgraph --node http://localhost:8020/
     ```

6. **Deploy Subgraph**:
   - Deploy to the local Graph Node:
     ```bash
     graph deploy gafi-nft-subgraph --node http://localhost:8020/ --ipfs http://localhost:5001
     ```
   - When prompted, set a version (e.g., `v0.1.0`).

7. **Verify Sync**:
   - Check indexing status:
     ```bash
     curl http://localhost:8030/graphql -X POST -H "Content-Type: application/json" -d '{"query": "query { indexingStatuses { subgraph health chains { network latestBlock { number } chainHeadBlock { number } } } }"}'
     ```
   - Wait until `latestBlock` matches `chainHeadBlock`.

## Querying the Subgraph

- **Endpoint**: `http://localhost:8000/subgraphs/name/gafi-nft-subgraph/graphql`
- **Example Queries** (use Postman or GraphiQL):
  - ERC-721 Collections:
    ```json
    {
      "query": "query { erc721Collections { id owner { id } collectionId name } }"
    }
    ```
  - ERC-1155 Collections:
    ```json
    {
      "query": "query { erc1155Collections { id owner { id } collectionId name } }"
    }
    ```
  - DN404 Tokens:
    ```json
    {
      "query": "query { dn404Tokens { id owner { id } tokenId name } }"
    }
    ```

## Troubleshooting

- **Graph Node Logs**: Check the `cargo run` terminal for errors.
- **IPFS Not Running**: Ensure `ipfs daemon` is active.
- **Database Issues**: Verify PostgreSQL is running and credentials match.

## License

[MIT License](LICENSE) - feel free to modify or replace as needed.# evm-nft-explorer-subgraph
# evm-nft-explorer-subgraph
