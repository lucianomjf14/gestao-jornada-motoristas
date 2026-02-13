# 🔐 Arquitetura de Autenticação — v2.0.0

> **Documento Técnico** | Controle de Jornada de Motoristas  
> Atualizado em: 13/02/2026 | Versão: 2.0.0  
> Autor: Luciano Marinho Silveira

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Fluxo do Motorista](#fluxo-do-motorista)
3. [Fluxo da Empresa (Admin)](#fluxo-da-empresa-admin)
4. [Gestão de Códigos de Acesso](#gestão-de-códigos-de-acesso)
5. [Controle de Sessão](#controle-de-sessão)
6. [Arquitetura de Segurança](#arquitetura-de-segurança)
7. [Referência Técnica](#referência-técnica)

---

## Visão Geral

O sistema possui **dois perfis de acesso** com mecanismos de autenticação distintos:

| Perfil | Método | Página | Destino |
|--------|--------|--------|---------|
| **Motorista** | CPF + Código de Acesso (6 chars) | `login.html` | `index.html` (portal) |
| **Admin (Empresa)** | Google OAuth (domínio restrito) ou Senha Master | `admin.html` | Painel Administrativo |

```mermaid
graph LR
    A[Usuário] -->|Motorista| B[login.html]
    A -->|Gestor / RH| C[admin.html]
    B -->|CPF + Código| D[Portal do Motorista]
    C -->|Google OAuth ou Senha| E[Painel Admin]

    style B fill:#3B82F6,stroke:#1D4ED8,color:#FFF
    style C fill:#059669,stroke:#047857,color:#FFF
    style D fill:#F59E0B,stroke:#D97706,color:#000
    style E fill:#8B5CF6,stroke:#7C3AED,color:#FFF
```

---

## Fluxo do Motorista

### Diagrama Completo

```mermaid
flowchart TD
    START([Motorista acessa login.html]) --> GUARD{Session Guard}
    
    GUARD -->|driverSession válida<br/>TTL < 24h| REDIRECT_INDEX[Redireciona para index.html]
    GUARD -->|Sessão expirada<br/>ou inexistente| SHOW_LOGIN[Exibe formulário de login]
    
    SHOW_LOGIN --> INPUT_CPF[/Digita CPF<br/>000.000.000-00/]
    INPUT_CPF --> INPUT_CODE[/Digita Código de Acesso<br/>Ex: A7K2M9/]
    INPUT_CODE --> SUBMIT[Clica em 'Entrar']
    
    SUBMIT --> VALIDATE_FORMAT{Validações<br/>de formato}
    VALIDATE_FORMAT -->|CPF < 11 dígitos| ERR_CPF[❌ CPF deve ter<br/>11 dígitos]
    VALIDATE_FORMAT -->|Código < 4 chars| ERR_CODE[❌ Código deve ter<br/>pelo menos 4 caracteres]
    VALIDATE_FORMAT -->|Formato OK| API_CALL

    ERR_CPF --> INPUT_CPF
    ERR_CODE --> INPUT_CODE
    
    API_CALL[firebaseValidateDriverLogin<br/>cpf, accessCode]
    API_CALL --> QUERY_FB[(Firebase Realtime DB<br/>Query: cpf == input)]
    
    QUERY_FB --> CHECK_EXISTS{Motorista<br/>encontrado?}
    CHECK_EXISTS -->|Não| ERR_AUTH[❌ CPF ou código inválido]
    CHECK_EXISTS -->|Sim| CHECK_CODE{Código de Acesso<br/>confere?}
    
    CHECK_CODE -->|Não<br/>case-insensitive| ERR_AUTH
    CHECK_CODE -->|Sim| CHECK_ACTIVE{Motorista<br/>ativo?}
    
    CHECK_ACTIVE -->|ativo: false| ERR_AUTH
    CHECK_ACTIVE -->|ativo: true| AUTH_OK[✅ Autenticação OK]

    ERR_AUTH --> INPUT_CPF
    
    AUTH_OK --> STEP2[Exibe Step 2:<br/>Confirmar dados + Logo empresa]
    STEP2 --> CONFIRM[Motorista confirma<br/>e clica 'Iniciar Treinamento']
    
    CONFIRM --> SAVE_SESSION[Salvar no localStorage]
    SAVE_SESSION --> S1[driverData = objeto do motorista]
    SAVE_SESSION --> S2[driverSession = generateSessionToken<br/>token + expiry 24h]
    
    S1 & S2 --> GO_INDEX([Redireciona para index.html])

    style START fill:#3B82F6,stroke:#1D4ED8,color:#FFF
    style AUTH_OK fill:#059669,stroke:#047857,color:#FFF
    style ERR_AUTH fill:#EF4444,stroke:#DC2626,color:#FFF
    style ERR_CPF fill:#EF4444,stroke:#DC2626,color:#FFF
    style ERR_CODE fill:#EF4444,stroke:#DC2626,color:#FFF
    style GO_INDEX fill:#F59E0B,stroke:#D97706,color:#000
    style QUERY_FB fill:#FDE68A,stroke:#D97706,color:#000
```

### Sequência Detalhada

```mermaid
sequenceDiagram
    actor M as Motorista
    participant L as login.html
    participant FC as firebase-config.js
    participant FB as Firebase Realtime DB
    participant LS as localStorage
    participant P as index.html (Portal)

    M->>L: Acessa página de login
    L->>LS: Verifica driverSession (TTL)
    
    alt Sessão válida (< 24h)
        LS-->>L: {token, expiry} válido
        L->>P: Redirect automático
    else Sessão expirada ou inexistente
        LS-->>L: null ou expirado
        L-->>M: Exibe formulário (CPF + Código)
    end

    M->>L: Digita CPF + Código de Acesso
    M->>L: Clica "Entrar"
    
    L->>L: Valida formato (CPF=11 dígitos, Código≥4 chars)
    L->>FC: firebaseValidateDriverLogin(cpf, code)
    FC->>FB: orderByChild('cpf').equalTo(cpf)
    FB-->>FC: Resultado da query
    
    alt CPF não encontrado
        FC-->>L: return null
        L-->>M: "CPF ou código inválido"
    else CPF encontrado
        FC->>FC: Compara codigoAcesso (case-insensitive)
        alt Código não confere
            FC-->>L: return null
            L-->>M: "CPF ou código inválido"
        else Código OK + Motorista ativo
            FC-->>L: return driverObject
            L-->>M: Exibe Step 2 (dados + logo empresa)
            M->>L: Confirma dados → "Iniciar Treinamento"
            L->>FC: generateSessionToken()
            FC-->>L: {token: "X7K2M9...", expiry: Date.now()+86400000}
            L->>LS: setItem('driverData', driver)
            L->>LS: setItem('driverSession', {token, expiry})
            L->>P: window.location.href = 'index.html'
        end
    end
```

---

## Fluxo da Empresa (Admin)

### Diagrama Completo

```mermaid
flowchart TD
    START([Gestor acessa admin.html]) --> SHOW_AUTH[Exibe tela de autenticação]
    
    SHOW_AUTH --> CHOICE{Método de login}
    
    %% === GOOGLE OAUTH ===
    CHOICE -->|Google OAuth| GOOGLE_POPUP[signInWithPopup<br/>GoogleAuthProvider]
    GOOGLE_POPUP --> GOOGLE_RESULT{Popup<br/>resultado}
    GOOGLE_RESULT -->|Erro/Cancelou| ERR_GOOGLE[❌ Erro no login Google]
    GOOGLE_RESULT -->|Sucesso| GET_EMAIL[Obtém user.email]
    
    GET_EMAIL --> VALIDATE_ACCESS{validateAccess<br/>email}
    
    VALIDATE_ACCESS --> CHECK_DOMAIN{Email termina com<br/>@empresa-demo.com.br?}
    CHECK_DOMAIN -->|Sim| ACCESS_OK[✅ Acesso autorizado]
    CHECK_DOMAIN -->|Não| CHECK_LIST{Email está na<br/>lista ALLOWED_EMAILS?}
    CHECK_LIST -->|Sim| ACCESS_OK
    CHECK_LIST -->|Não| ACCESS_DENIED[⛔ Acesso negado]
    
    ACCESS_DENIED --> SIGNOUT[auth.signOut]
    SIGNOUT --> ERR_DOMAIN[❌ Apenas emails<br/>@empresa-demo.com.br<br/>são permitidos]
    ERR_DOMAIN --> SHOW_AUTH
    ERR_GOOGLE --> SHOW_AUTH
    
    %% === SENHA MASTER ===
    CHOICE -->|Senha Master| INPUT_PWD[/Digita senha<br/>de administrador/]
    INPUT_PWD --> CHECK_PWD[firebaseCheckAdminPassword<br/>password]
    CHECK_PWD --> QUERY_PWD[(Firebase DB<br/>config/adminPassword)]
    QUERY_PWD --> PWD_RESULT{Senha<br/>confere?}
    PWD_RESULT -->|Não| ERR_PWD[❌ Senha incorreta]
    PWD_RESULT -->|Sim| ACCESS_OK
    ERR_PWD --> INPUT_PWD

    %% === PERSISTÊNCIA ===
    ACCESS_OK --> SHOW_PANEL[showAdminPanel]
    SHOW_PANEL --> UPDATE_MSG[updateWelcomeMessage<br/>email]
    UPDATE_MSG --> DASHBOARD([Painel Administrativo<br/>Carregado])

    %% === RESTAURAÇÃO DE SESSÃO ===
    START -.->|onAuthStateChanged| CHECK_PERSIST{Sessão Google<br/>persistida?}
    CHECK_PERSIST -->|Sim| VALIDATE_ACCESS
    CHECK_PERSIST -->|Não| SHOW_AUTH

    style START fill:#059669,stroke:#047857,color:#FFF
    style ACCESS_OK fill:#059669,stroke:#047857,color:#FFF
    style ACCESS_DENIED fill:#EF4444,stroke:#DC2626,color:#FFF
    style ERR_DOMAIN fill:#EF4444,stroke:#DC2626,color:#FFF
    style ERR_PWD fill:#EF4444,stroke:#DC2626,color:#FFF
    style ERR_GOOGLE fill:#EF4444,stroke:#DC2626,color:#FFF
    style DASHBOARD fill:#8B5CF6,stroke:#7C3AED,color:#FFF
    style QUERY_PWD fill:#FDE68A,stroke:#D97706,color:#000
```

### Sequência Detalhada

```mermaid
sequenceDiagram
    actor G as Gestor (Admin)
    participant A as admin.html
    participant FA as Firebase Auth
    participant FC as firebase-config.js
    participant FB as Firebase Realtime DB

    G->>A: Acessa painel admin

    Note over A,FA: === Restauração de Sessão ===
    A->>FA: onAuthStateChanged listener
    
    alt Sessão Google persistida
        FA-->>A: user (email)
        A->>A: validateAccess(email)
        alt Email autorizado
            A-->>G: Painel Admin carregado automaticamente
        else Email não autorizado
            A->>FA: signOut()
            A-->>G: Exibe tela de login
        end
    else Sem sessão
        A-->>G: Exibe tela de login
    end

    Note over G,FB: === Login via Google OAuth ===
    G->>A: Clica "Entrar com Google"
    A->>FA: signInWithPopup(GoogleAuthProvider)
    FA-->>A: user.email
    A->>A: validateAccess(email)
    
    alt Email termina com @empresa-demo.com.br OU está em ALLOWED_EMAILS
        A-->>G: ✅ showAdminPanel() + updateWelcomeMessage()
    else Email não autorizado
        A->>FA: signOut()
        A-->>G: ⛔ "Acesso negado para email@..."
    end

    Note over G,FB: === Login via Senha Master ===
    G->>A: Digita senha + clica "Entrar"
    A->>FC: firebaseCheckAdminPassword(password)
    FC->>FB: config/adminPassword.once('value')
    FB-->>FC: hash da senha
    
    alt Senha confere
        FC-->>A: true
        A-->>G: ✅ showAdminPanel()
    else Senha incorreta
        FC-->>A: false
        A-->>G: ❌ "Senha incorreta"
    end
```

---

## Gestão de Códigos de Acesso

### Ciclo de Vida do Código

```mermaid
stateDiagram-v2
    [*] --> Gerado: Admin cadastra motorista
    
    Gerado --> Exibido: Modal com código
    Exibido --> Compartilhado: Copiar / Email / WhatsApp
    Compartilhado --> EmUso: Motorista usa para login
    EmUso --> EmUso: Logins bem-sucedidos

    EmUso --> Regenerado: Admin clica "Regenerar"
    Regenerado --> Exibido: Novo modal com código novo

    Gerado --> Regenerado: Admin regenera antes do primeiro uso

    note right of Gerado
        generateAccessCode()
        6 chars alfanuméricos
        Charset: ABCDEFGHJKLMNPQRSTUVWXYZ23456789
    end note

    note right of Compartilhado
        📋 Clipboard
        📧 mailto: (Email)
        💬 wa.me/ (WhatsApp)
    end note

    note right of Regenerado
        firebaseRegenerateAccessCode(id)
        Código anterior é INVALIDADO
        Novo código salvo no Firebase
    end note
```

### Fluxo de Cadastro + Código

```mermaid
flowchart LR
    A[Admin preenche<br/>formulário] --> B[firebaseAddDriver]
    B --> C[generateAccessCode<br/>gera 6 chars]
    C --> D[(Firebase salva<br/>motorista + codigoAcesso)]
    D --> E[firebaseFindDriverByName<br/>recupera código]
    E --> F[showAccessCodeModal<br/>exibe código]
    F --> G{Admin escolhe}
    G -->|📋| H[Copiar para clipboard]
    G -->|📧| I[Abrir email com código]
    G -->|💬| J[Abrir WhatsApp com código]
    G -->|✖| K[Fechar modal]

    style C fill:#3B82F6,stroke:#1D4ED8,color:#FFF
    style D fill:#FDE68A,stroke:#D97706,color:#000
    style F fill:#059669,stroke:#047857,color:#FFF
```

### Fluxo de Regeneração

```mermaid
flowchart LR
    A[Admin clica<br/>🔄 Regenerar] --> B{Confirma?}
    B -->|Não| Z[Cancelado]
    B -->|Sim| C[firebaseRegenerateAccessCode id]
    C --> D[generateAccessCode<br/>novo código]
    D --> E[(Firebase atualiza<br/>codigoAcesso)]
    E --> F[showAccessCodeModal<br/>novo código]
    F --> G[loadDashboard<br/>atualiza tabela]

    style D fill:#3B82F6,stroke:#1D4ED8,color:#FFF
    style E fill:#FDE68A,stroke:#D97706,color:#000
```

---

## Controle de Sessão

### Mecanismo de TTL

```mermaid
flowchart TD
    LOGIN_OK[Login bem-sucedido] --> GEN_TOKEN[generateSessionToken]
    GEN_TOKEN --> CREATE[Cria objeto de sessão]
    CREATE --> TOKEN["token: código12chars + timestamp_base36"]
    CREATE --> EXPIRY["expiry: Date.now() + 86.400.000ms (24h)"]
    TOKEN & EXPIRY --> SAVE["localStorage.setItem('driverSession', JSON.stringify({token, expiry}))"]
    
    SAVE --> NAVEGACAO([Motorista navega pelo sistema])
    
    NAVEGACAO --> PAGE[Acessa qualquer página]
    PAGE --> GUARD{Session Guard<br/>isSessionValid}
    
    GUARD --> CHECK_EXISTS{driverSession<br/>existe?}
    CHECK_EXISTS -->|Não| EXPIRED
    CHECK_EXISTS -->|Sim| CHECK_TIME{Date.now <br/>> expiry?}
    
    CHECK_TIME -->|Não - Válida| OK[✅ Página carrega]
    CHECK_TIME -->|Sim - Expirou| EXPIRED[⏰ Sessão expirada]
    
    EXPIRED --> CLEAR[Limpa localStorage:<br/>driverData<br/>driverSession<br/>driverSignature]
    CLEAR --> REDIRECT[Redireciona para login.html]

    style LOGIN_OK fill:#059669,stroke:#047857,color:#FFF
    style OK fill:#059669,stroke:#047857,color:#FFF
    style EXPIRED fill:#EF4444,stroke:#DC2626,color:#FFF
```

### Cobertura por Página

```mermaid
graph TD
    subgraph "Guard via isSessionValid() — firebase-config.js"
        I[index.html]
        C[certificado.html]
        T[treinamento.html]
    end

    subgraph "Guard Inline — script no head"
        CO[comunicado2.html]
        DB[diario_bordo.html]
        FA[faq.html]
        TB[tabela.html]
        GM[guia-motorista/index.html]
    end

    subgraph "Sem Guard — Páginas de Entrada"
        L[login.html]
        A[admin.html]
    end

    L -->|CPF + Código| I
    A -->|Google OAuth / Senha| A

    style I fill:#3B82F6,stroke:#1D4ED8,color:#FFF
    style C fill:#3B82F6,stroke:#1D4ED8,color:#FFF
    style T fill:#3B82F6,stroke:#1D4ED8,color:#FFF
    style CO fill:#F59E0B,stroke:#D97706,color:#000
    style DB fill:#F59E0B,stroke:#D97706,color:#000
    style FA fill:#F59E0B,stroke:#D97706,color:#000
    style TB fill:#F59E0B,stroke:#D97706,color:#000
    style GM fill:#F59E0B,stroke:#D97706,color:#000
    style L fill:#6B7280,stroke:#4B5563,color:#FFF
    style A fill:#6B7280,stroke:#4B5563,color:#FFF
```

---

## Arquitetura de Segurança

### Modelo de Ameaças vs. Proteções

```mermaid
graph LR
    subgraph "Ameaças"
        T1[Acesso por CPF alheio]
        T2[Sessão infinita]
        T3[Acesso admin<br/>não autorizado]
        T4[Força bruta<br/>no código]
        T5[Confusão visual<br/>de caracteres]
    end

    subgraph "Proteções v2.0.0"
        P1[CPF + Código 6 chars]
        P2[TTL 24h + Guard]
        P3[Google OAuth +<br/>domínio restrito]
        P4[~729M combinações<br/>por código]
        P5[Charset sem<br/>I/O/0/1]
    end

    T1 -->|mitigado por| P1
    T2 -->|mitigado por| P2
    T3 -->|mitigado por| P3
    T4 -->|mitigado por| P4
    T5 -->|mitigado por| P5

    style T1 fill:#FEE2E2,stroke:#EF4444,color:#991B1B
    style T2 fill:#FEE2E2,stroke:#EF4444,color:#991B1B
    style T3 fill:#FEE2E2,stroke:#EF4444,color:#991B1B
    style T4 fill:#FEE2E2,stroke:#EF4444,color:#991B1B
    style T5 fill:#FEE2E2,stroke:#EF4444,color:#991B1B
    style P1 fill:#D1FAE5,stroke:#059669,color:#065F46
    style P2 fill:#D1FAE5,stroke:#059669,color:#065F46
    style P3 fill:#D1FAE5,stroke:#059669,color:#065F46
    style P4 fill:#D1FAE5,stroke:#059669,color:#065F46
    style P5 fill:#D1FAE5,stroke:#059669,color:#065F46
```

### Comparativo v1.0 → v2.0

```mermaid
graph TD
    subgraph "v1.0.0 — Vulnerável"
        direction TB
        V1_LOGIN[Login: Só CPF] --> V1_SESSION[Sessão: Eterna]
        V1_SESSION --> V1_GUARD[Guard: Apenas index.html]
        V1_GUARD --> V1_RISK["⚠️ RISCO CRÍTICO<br/>Qualquer pessoa com CPF<br/>acessa indefinidamente"]
    end

    subgraph "v2.0.0 — Protegido"
        direction TB
        V2_LOGIN[Login: CPF + Código 6 chars] --> V2_SESSION["Sessão: TTL 24h<br/>Token criptográfico"]
        V2_SESSION --> V2_GUARD["Guard: 9 páginas protegidas<br/>(isSessionValid + inline)"]
        V2_GUARD --> V2_OK["✅ SEGURO<br/>Autenticação dupla<br/>+ expiração automática"]
    end

    style V1_RISK fill:#FEE2E2,stroke:#EF4444,color:#991B1B
    style V2_OK fill:#D1FAE5,stroke:#059669,color:#065F46
    style V1_LOGIN fill:#FCA5A5,stroke:#EF4444,color:#000
    style V2_LOGIN fill:#6EE7B7,stroke:#059669,color:#000
```

---

## Referência Técnica

### Funções de Autenticação (`firebase-config.js`)

| Função | Tipo | Descrição |
|--------|------|-----------|
| `generateAccessCode()` | Sync | Gera código alfanumérico de 6 chars (charset: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`) |
| `firebaseValidateDriverLogin(cpf, accessCode)` | Async | Valida CPF + código + status ativo. Retorna driver ou `null` |
| `firebaseRegenerateAccessCode(id)` | Async | Gera novo código, atualiza Firebase, retorna novo código |
| `generateSessionToken()` | Sync | Cria `{token, expiry}` com TTL de 24 horas (86.400.000 ms) |
| `isSessionValid()` | Sync | Verifica `driverSession` no localStorage. Limpa e retorna `false` se expirado |
| `firebaseCheckAdminPassword(password)` | Async | Compara senha com `config/adminPassword` no Firebase |

### Estrutura de Dados no Firebase

```json
{
  "motoristas": {
    "0": {
      "nome": "João Silva",
      "cpf": "12345678901",
      "email": "joao@email.com",
      "empresa": "Empresa A",
      "codigoAcesso": "A7K2M9",
      "ativo": true,
      "senhaOperacao": "1234",
      "senhaCoacao": "5678"
    }
  },
  "config": {
    "adminPassword": "hash_da_senha"
  }
}
```

### Estrutura de Sessão no localStorage

```json
// driverSession
{
  "token": "A7K2M9X3P5R8QW1707840000",
  "expiry": 1707926400000
}

// driverData
{
  "id": "0",
  "nome": "João Silva",
  "cpf": "12345678901",
  "empresa": "Empresa A",
  "email": "joao@email.com"
}
```

### Charset do Código de Acesso

```
A B C D E F G H J K L M N P Q R S T U V W X Y Z 2 3 4 5 6 7 8 9
└──────────────── 30 caracteres ────────────────┘

Excluídos: I (confunde com 1), O (confunde com 0), 0, 1

Combinações: 30⁶ = 729.000.000 (~729 milhões)
```

---

> **Nota:** Este documento acompanha a Release [v2.0.0](https://github.com/lucianomjf14/gestao-jornada-motoristas/releases/tag/v2.0.0).  
> Para a lista completa de mudanças, consulte o [Full Changelog](https://github.com/lucianomjf14/gestao-jornada-motoristas/compare/v1.0.0...v2.0.0).
