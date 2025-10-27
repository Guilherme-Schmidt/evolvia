# 🚀 Tudo em Um - Superapp de Organização Pessoal

Um aplicativo completo para gerenciar finanças, rotina e saúde em um só lugar.

## 📱 Funcionalidades

- 💰 **Finanças**: Controle de receitas, despesas, metas e relatórios
- 🗓️ **Rotina**: Gerenciamento de tarefas, hábitos e agenda
- 🏋️ **Saúde**: Acompanhamento de peso, treinos e alimentação
- 📊 **Dashboard**: Visão geral de todas as áreas
- 🔔 **Notificações**: Lembretes e alertas personalizados

## 🛠️ Stack Tecnológica

### Backend
- Java 17
- Spring Boot 3.2
- PostgreSQL
- Spring Security + JWT
- Flyway (migrations)
- Maven

### Frontend
- React Native + Expo
- React Native Web
- NativeWind (Tailwind)
- React Native Paper
- Axios
- AsyncStorage

## 📦 Estrutura do Projeto

```
tudoemum/
├── backend/                 # API Spring Boot
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/tudoemum/
│   │   │   │   ├── config/
│   │   │   │   ├── controller/
│   │   │   │   ├── service/
│   │   │   │   ├── repository/
│   │   │   │   ├── model/
│   │   │   │   ├── dto/
│   │   │   │   ├── security/
│   │   │   │   └── exception/
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       └── db/migration/
│   │   └── test/
│   ├── pom.xml
│   └── docker-compose.yml
│
└── frontend/                # App React Native
    ├── src/
    │   ├── screens/
    │   ├── components/
    │   ├── navigation/
    │   ├── services/
    │   ├── contexts/
    │   └── utils/
    ├── assets/
    ├── App.js
    ├── package.json
    └── app.json
```

## 🚀 Como Executar

### Pré-requisitos

- Java 17+
- Node.js 18+
- PostgreSQL 15+
- Maven 3.8+
- Expo CLI

### Backend

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/tudoemum.git
cd tudoemum/backend
```

2. Configure o banco de dados:
```bash
docker-compose up -d
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Execute o projeto:
```bash
mvn spring-boot:run
```

A API estará disponível em: `http://localhost:8080`

### Frontend

1. Navegue até a pasta frontend:
```bash
cd frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env
```

4. Execute o projeto:
```bash
# Para desenvolvimento web
npm run web

# Para Android
npm run android

# Para iOS
npm run ios
```

## 📝 Scripts Disponíveis

### Backend
```bash
mvn clean install          # Compilar o projeto
mvn spring-boot:run       # Executar em desenvolvimento
mvn test                  # Executar testes
```

### Frontend
```bash
npm start                 # Iniciar Expo
npm run web              # Executar versão web
npm run android          # Executar no Android
npm run ios              # Executar no iOS
npm run lint             # Executar linter
npm run format           # Formatar código
```

## 🗄️ Banco de Dados

O projeto usa PostgreSQL com Flyway para migrations. As migrations estão em:
```
backend/src/main/resources/db/migration/
```

Para acessar o PgAdmin:
- URL: http://localhost:5050
- Email: admin@tudoemum.com
- Senha: admin

## 🔐 Autenticação

O sistema usa JWT com access token (15min) e refresh token (7 dias).

**Endpoints públicos:**
- `POST /api/auth/register` - Cadastro
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Renovar token
- `GET /api/health` - Health check

## 📊 Roadmap

- [x] Sprint 1: Fundação e arquitetura
- [ ] Sprint 2: Autenticação e perfil
- [ ] Sprint 3: Dashboard e navegação
- [ ] Sprint 4-5: Módulo financeiro
- [ ] Sprint 6-7: Módulo de rotina
- [ ] Sprint 8-9: Módulo de saúde
- [ ] Sprint 10: Integração e refinamento
- [ ] Sprint 11: Deploy
- [ ] Sprint 12: Testes e lançamento

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'feat: adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

### Convenções de Commit

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Tarefas gerais

## 📄 Licença

Este projeto está sob a licença MIT.

## 👥 Autores

- Seu Nome - [@seu-usuario](https://github.com/seu-usuario)

## 📞 Contato

Para dúvidas ou sugestões, abra uma issue no GitHub.

---

**Status:** 🚧 Em desenvolvimento (Sprint 1 completa)
