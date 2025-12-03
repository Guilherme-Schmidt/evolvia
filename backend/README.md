# Evolvia Backend (Spring Boot)

Backend API para a plataforma de gestão financeira Evolvia.

## 🚀 Tecnologias

- **Java 21**
- **Spring Boot 3.2.5**
- **Spring Security** com JWT
- **Spring Data JPA** com Hibernate
- **PostgreSQL 15**
- **Maven**
- **Swagger/OpenAPI** para documentação

## 📋 Pré-requisitos

- Java 21 ou superior
- Maven 3.9+
- PostgreSQL 15+
- (Opcional) Docker & Docker Compose

## ⚙️ Configuração

### 1. Banco de Dados

Crie o banco de dados PostgreSQL:

```bash
createdb evolvia
```

Execute o schema:

```bash
psql -d evolvia -f src/main/resources/schema.sql
```

### 2. Variáveis de Ambiente

Configure as variáveis em `src/main/resources/application.properties`:

```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/evolvia
spring.datasource.username=postgres
spring.datasource.password=postgres

# JWT
jwt.secret=your-super-secret-jwt-key-change-this-in-production-make-it-at-least-256-bits
jwt.expiration=604800000

# CORS
cors.allowed-origins=http://localhost:8080,http://localhost:5173
```

## 🏃 Executando o Projeto

### Desenvolvimento

```bash
# Instalar dependências
mvn clean install

# Executar aplicação
mvn spring-boot:run
```

A API estará disponível em: `http://localhost:3001`

### Produção

```bash
# Build
mvn clean package

# Executar JAR
java -jar target/evolvia-backend-1.0.0.jar
```

### Docker

```bash
# Build da imagem
docker build -t evolvia-backend .

# Executar container
docker run -p 3001:3001 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/evolvia \
  -e SPRING_DATASOURCE_USERNAME=postgres \
  -e SPRING_DATASOURCE_PASSWORD=postgres \
  evolvia-backend
```

## 📚 Documentação da API

Após iniciar o servidor, acesse:

- **Swagger UI**: http://localhost:3001/swagger-ui.html
- **OpenAPI JSON**: http://localhost:3001/api-docs

## 🔑 Principais Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/user` - Obter usuário atual (autenticado)
- `POST /api/auth/logout` - Logout

### Transações
- `GET /api/transactions` - Listar transações
- `POST /api/transactions` - Criar transação
- `DELETE /api/transactions/{id}` - Deletar transação

### Investimentos
- `GET /api/investments` - Listar investimentos
- `POST /api/investments` - Criar investimento
- `PUT /api/investments/{id}` - Atualizar investimento
- `DELETE /api/investments/{id}` - Deletar investimento

### Funções Externas
- `POST /api/functions/get-quote` - Obter cotação de ação (Yahoo Finance)

### CRUD Genérico
- `GET /api/{table}` - Listar registros (profiles, credit-cards, budgets, etc)
- `POST /api/{table}` - Criar registro
- `PUT /api/{table}/{id}` - Atualizar registro
- `DELETE /api/{table}/{id}` - Deletar registro

Tabelas disponíveis:
- `profiles`
- `credit-cards`
- `budgets`
- `financial-goals`
- `broker-accounts`
- `dividends`
- `treasury-bonds`

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Após o login, inclua o token no header:

```
Authorization: Bearer {seu-token-jwt}
```

## 🏗️ Estrutura do Projeto

```
src/main/java/com/evolvia/
├── config/              # Configurações (Security, CORS)
├── controller/          # Controllers REST
├── dto/                 # Data Transfer Objects
├── model/               # Entidades JPA
├── repository/          # Repositories Spring Data
├── security/            # Segurança (JWT, Filters)
├── service/             # Lógica de negócio
└── EvolviaApplication.java
```

## 🧪 Testes

```bash
# Executar testes
mvn test

# Executar testes com coverage
mvn clean verify
```

## 📝 Licença

Este projeto é privado.
