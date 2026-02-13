<h1 align="center">
   Gestão de Jornada  Motoristas
</h1>

<p align="center">
  <strong>MVP de sistema web para gestão de jornada, treinamento e certificação de motoristas de frota</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-MVP_v2.0.0-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Fase-Validação-orange?style=for-the-badge" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/release/lucianomjf14/gestao-jornada-motoristas?style=flat-square&label=release" />
  <img src="https://img.shields.io/github/license/lucianomjf14/gestao-jornada-motoristas?style=flat-square" />
  <img src="https://img.shields.io/github/last-commit/lucianomjf14/gestao-jornada-motoristas?style=flat-square" />
  <img src="https://img.shields.io/github/repo-size/lucianomjf14/gestao-jornada-motoristas?style=flat-square" />
</p>

---

##  Sobre o Projeto

**MVP funcional** desenvolvido para uma transportadora real, atendendo **+200 motoristas** em operação rodoviária. A plataforma digitaliza o fluxo completo de treinamento obrigatório, controle de jornada e emissão de certificados  substituindo processos manuais em papel.

>  **Este é um MVP (Minimum Viable Product).** O foco desta versão foi **validar o modelo de negócio** e entregar valor ao usuário final o mais rápido possível. O roadmap de evolução técnica está documentado abaixo.

###  Problema

Transportadoras enfrentam:
- Controle de treinamentos via planilha (perda de dados, retrabalho)
- Certificados impressos sem rastreabilidade
- Dificuldade de comunicação com motoristas em trânsito
- Nenhuma visibilidade sobre taxa de conclusão por empresa/filial

###  Solução

Plataforma web responsiva (mobile-first) com:
- Autenticação dupla (motorista via CPF + Código / admin via Google OAuth)
- Dashboard administrativo em tempo real
- Sistema de cursos com vídeo + quiz
- Certificados digitais com QR Code
- Comunicados e FAQ centralizados

---

##  Arquitetura do MVP

```mermaid
flowchart LR
    subgraph Frontend["Frontend (HTML/JS/CSS)"]
        A[Login] --> B{Perfil}
        B -->|Motorista| C[Portal do Motorista]
        B -->|Admin| D[Painel Administrativo]
        C --> E[Treinamentos]
        C --> F[Guia do Motorista]
        C --> G[Diário de Bordo]
        E --> H[Certificado Digital]
        D --> I[Dashboard]
        D --> J[Gestão de Motoristas]
        D --> K[Comunicados]
    end

    subgraph Backend["Backend (Firebase)"]
        L[(Realtime DB)]
        M[Auth]
        N[Hosting]
    end

    C & D <--> L
    A <--> M
    Frontend --> N
```

### Fluxo de Autenticação (v2.0.0)

```mermaid
flowchart TD
    U([Usuário]) --> CHOICE{Perfil?}

    CHOICE -->|Motorista| LOGIN_M[login.html]
    LOGIN_M --> INPUT[CPF + Código de Acesso 6 chars]
    INPUT --> VALIDATE[firebaseValidateDriverLogin]
    VALIDATE --> CHECK{CPF + Código<br/>+ Status ativo?}
    CHECK -->|Não| DENY[ Acesso negado]
    CHECK -->|Sim| SESSION[Gera token sessão TTL 24h]
    SESSION --> PORTAL([Portal do Motorista])

    CHOICE -->|Gestor / RH| LOGIN_A[admin.html]
    LOGIN_A --> GOOGLE[Google OAuth<br/>signInWithPopup]
    GOOGLE --> DOMAIN{Email @empresa<br/>autorizado?}
    DOMAIN -->|Não| DENY_A[ Domínio negado]
    DOMAIN -->|Sim| PANEL([Painel Admin])

    LOGIN_A --> PWD_ALT[Senha Master<br/>alternativa]
    PWD_ALT --> CHECK_PWD{Senha válida?}
    CHECK_PWD -->|Sim| PANEL
    CHECK_PWD -->|Não| DENY_PWD[ Incorreta]

    style PORTAL fill:#3B82F6,stroke:#1D4ED8,color:#FFF
    style PANEL fill:#059669,stroke:#047857,color:#FFF
    style DENY fill:#EF4444,stroke:#DC2626,color:#FFF
    style DENY_A fill:#EF4444,stroke:#DC2626,color:#FFF
    style DENY_PWD fill:#EF4444,stroke:#DC2626,color:#FFF
```

>  Documentação técnica completa: [`docs/ARQUITETURA_AUTENTICACAO.md`](docs/ARQUITETURA_AUTENTICACAO.md)

---

##  Funcionalidades

| Módulo | Descrição | Destaque Técnico |
|--------|-----------|------------------|
|  **Login Duplo** | Motorista (CPF + Código)  Admin (Google OAuth) | Auth Firebase + código alfanumérico 6 chars |
|  **Dashboard Admin** | KPIs em tempo real por empresa | Listeners `onValue` com atualização automática |
|  **Treinamentos** | Cursos com vídeo, quiz e progresso | Validação de conclusão por etapa |
|  **Certificados** | Geração automática com QR Code | Renderização canvas + `html2canvas` |
|  **Guia do Motorista** | Conteúdo educacional com imagens | Layout Tailwind CSS responsivo |
|  **Diário de Bordo** | Registro digital de viagens | Formulário com validação client-side |
|  **Comunicados** | Avisos com contatos WhatsApp | Cards interativos com links diretos |
|  **FAQ** | Perguntas frequentes com accordion | Animações CSS puras |
|  **Tabela de Motoristas** | Lista completa com status | Filtros dinâmicos por empresa |

---

##  Stack Técnica

```
Frontend        HTML5  CSS3  JavaScript (Vanilla ES6+)
UI Framework    Tailwind CSS (via CDN)
Backend         Firebase Realtime Database
Autenticação    Firebase Authentication (Google OAuth + Código de Acesso)
Hospedagem      Firebase Hosting
Certificados    html2canvas  QR Code Generator
Ícones          Phosphor Icons  Lucide Icons
```

---

##  Estrutura do Projeto

```
 index.html              # Portal principal do motorista
 login.html              # Autenticação (CPF + Código de Acesso)
 admin.html              # Painel administrativo completo
 treinamento.html        # Sistema de cursos e quiz
 certificado.html        # Geração de certificados digitais
 comunicado2.html        # Central de comunicados
 diario_bordo.html       # Registro de diário de bordo
 faq.html                # Perguntas frequentes
 tabela.html             # Tabela de motoristas
 firebase-config.js      # Config Firebase + funções de auth/DB
 drivers.js              # Wrapper de dados de motoristas
 database.rules.json     # Regras de segurança do Realtime DB
 .env.example            # Template de variáveis de ambiente
 docs/
    ARQUITETURA_AUTENTICACAO.md  # Doc técnico com Mermaid
 guia-motorista/
    index.html
    imagens/
 imagens/
```

---

##  Como Executar

### Pré-requisitos
- Conta no [Firebase](https://firebase.google.com/)
- Node.js 16+ (para Firebase CLI)
- Firebase CLI: `npm install -g firebase-tools`

### Setup

```bash
# 1. Clone o repositório
git clone https://github.com/lucianomjf14/gestao-jornada-motoristas.git
cd gestao-jornada-motoristas

# 2. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais Firebase

# 3. Atualize firebase-config.js com suas credenciais
# Substitua os placeholders YOUR_API_KEY, YOUR_AUTH_DOMAIN, etc.

# 4. Configure o Firebase
firebase login
firebase init

# 5. Deploy
firebase deploy
```

### Desenvolvimento Local

```bash
# Servir localmente com Firebase Emulator
firebase emulators:start

# Ou simplesmente abrir com Live Server (VS Code)
```

---

##  Segurança

### Implementado (v2.0.0)

-  Login por CPF + Código de Acesso alfanumérico (6 chars, ~729M combinações)
-  Sessão com TTL de 24 horas (token expira automaticamente)
-  Guard de sessão em todas as 9 páginas protegidas
-  Admin restrito por domínio de e-mail (Google OAuth)
-  Credenciais Firebase via `.env` (não versionadas)
-  Dados pessoais (CPFs, nomes reais) removidos do repositório

### Limitações conhecidas do MVP

-  Regras de banco permissivas (`auth != null`  requer refinamento por nó)
-  Código de acesso armazenado em plain text (sem hash)
-  Sem rate limiting nas tentativas de login
-  Session token usa `Math.random()` (não criptográfico)

> Estas limitações são aceitáveis para a fase de MVP/validação e estão mapeadas no roadmap de evolução.

---

##  Resultados

- **+200 motoristas** cadastrados e treinados
- **100% digital**  eliminação de processos em papel
- **Dashboard em tempo real** com taxa de conclusão por empresa
- **Certificados rastreáveis** via QR Code

---

##  Roadmap de Evolução

### Maturidade Atual: MVP Funcional

```mermaid
graph LR
    V1["v1.0.0<br/>MVP Inicial<br/> Concluído"] --> V2["v2.0.0<br/>Auth por Código<br/> Concluído"]
    V2 --> V3["v3.0.0<br/>Refatoração<br/> Planejado"]
    V3 --> V4["v4.0.0<br/>Backend Seguro<br/> Planejado"]
    V4 --> V5["v5.0.0<br/>Produção<br/> Futuro"]

    style V1 fill:#059669,stroke:#047857,color:#FFF
    style V2 fill:#059669,stroke:#047857,color:#FFF
    style V3 fill:#3B82F6,stroke:#1D4ED8,color:#FFF
    style V4 fill:#F59E0B,stroke:#D97706,color:#000
    style V5 fill:#8B5CF6,stroke:#7C3AED,color:#FFF
```

### v3.0.0  Refatoração Estrutural

| Item | Descrição | Impacto |
|------|-----------|---------|
|  Modularização | Extrair CSS e JS dos HTMLs monolíticos para arquivos separados | Manutenibilidade |
|  Deduplicação | Unificar `imagens/` e `guia-motorista/imagens/` (~7.8 MB) | Tamanho do repo |
|  Limpeza | Remover `console.log` de produção (~64 ocorrências) | Profissionalismo |
|  Package.json | Adicionar gestão de dependências e scripts de build | Padronização |
|  Design System | Extrair componentes reutilizáveis (botões, cards, modais) | Consistência visual |

### v4.0.0  Segurança & Backend

| Item | Descrição | Impacto |
|------|-----------|---------|
|  Database Rules | Regras granulares por nó (motorista lê apenas seus dados) | Segurança real |
|  Hashing | Armazenar `codigoAcesso` e `adminPassword` com bcrypt/SHA-256 | Proteção de credenciais |
|  Rate Limiting | Cloud Functions para limitar tentativas de login (5/min) | Anti brute-force |
|  Crypto Token | Substituir `Math.random()` por `crypto.getRandomValues()` | Token seguro |
|  Cloud Functions | Migrar validações críticas para server-side | Zero trust |

### v5.0.0  Produção & DevOps

| Item | Descrição | Impacto |
|------|-----------|---------|
|  Testes | Jest + Testing Library para funções críticas de auth | Confiabilidade |
|  CI/CD | GitHub Actions (lint  test  deploy Firebase Hosting) | Automação |
|  Monitoramento | Firebase Analytics + Performance Monitoring | Observabilidade |
|  Acessibilidade | Audit WCAG 2.1 AA (aria-labels, landmarks, contraste) | Inclusão |
|  PWA | Service Worker + manifest para uso offline | Motoristas em trânsito |

---

##  Análise de Maturidade

```mermaid
quadrantChart
    title Maturidade do Projeto por Dimensão
    x-axis Baixo --> Alto
    y-axis Baixo --> Alto
    quadrant-1 Pronto para escalar
    quadrant-2 Investir mais
    quadrant-3 Atenção urgente
    quadrant-4 Bom para MVP

    Valor de Negócio: [0.85, 0.90]
    Documentação: [0.75, 0.80]
    UX e Design: [0.70, 0.75]
    Funcionalidades: [0.80, 0.70]
    Autenticação v2: [0.60, 0.65]
    Responsividade: [0.55, 0.60]
    Error Handling: [0.50, 0.55]
    Segurança Backend: [0.25, 0.30]
    Testes: [0.10, 0.15]
    CI-CD: [0.10, 0.10]
    Modularização: [0.20, 0.25]
```

| Dimensão | Nível | Status |
|----------|-------|--------|
|  Valor de negócio |  10/10 | Resolve problema real, +200 usuários |
|  Documentação |  8/10 | README, Mermaid, doc técnico, releases |
|  UX / Design |  7/10 | Mobile-first, Tailwind, responsivo |
|  Funcionalidades |  8/10 | 9 módulos completos e integrados |
|  Autenticação |  6/10 | v2.0.0 é sólida, mas front-end only |
|  Testes |  1/10 | Zero cobertura |
|  CI/CD |  0/10 | Inexistente |
|  Arquitetura |  3/10 | Monolíticos, sem modularização |
|  Segurança backend |  2/10 | Rules permissivas, plain text |

---

##  Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## Changelog

| Versão | Data | Descrição |
|--------|------|-----------|
| [v2.0.0](https://github.com/lucianomjf14/gestao-jornada-motoristas/releases/tag/v2.0.0) | 13/02/2026 | Auth por Código de Acesso + Session TTL 24h + Guard em 9 páginas |
| [v1.0.0](https://github.com/lucianomjf14/gestao-jornada-motoristas/releases/tag/v1.0.0) | 12/02/2026 | Release inicial  sistema completo com 9 módulos |

---

## Autor

<div align="center">

<img src="https://github.com/lucianomjf14.png" width="150" style="border-radius: 50%;" alt="Luciano Marinho Silveira">

### Luciano Marinho Silveira

Mestre em Administração | Gestão e Arquitetura Organizacional | Processos, Dados e Inovação | Inteligência Artificial

Juiz de Fora, MG, Brasil

[![GitHub](https://img.shields.io/badge/GitHub-lucianomjf14-181717?style=flat-square&logo=github)](https://github.com/lucianomjf14)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Luciano_Silveira-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/luciano-marinho-silveira)
[![DIO](https://img.shields.io/badge/DIO-Perfil-7C3AED?style=flat-square)](https://web.dio.me/users/lucianomjf14)
[![Lattes](https://img.shields.io/badge/Lattes-CNPq-006B3F?style=flat-square)](http://lattes.cnpq.br/8717991759915273)
[![Email](https://img.shields.io/badge/Email-lucianomjf14%40gmail.com-EA4335?style=flat-square&logo=gmail)](mailto:lucianomjf14@gmail.com)

</div>
