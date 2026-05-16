document.addEventListener("DOMContentLoaded", inicializar);

// ==========================================
// CONSTANTES E CONFIGURAÇÕES
// ==========================================

const AUTH_TOKEN_KEY = "authToken"; // Chave para guardar o Token JWT (será necessário para o login)
const API_BASE_URL = "http://localhost:3000/api"; // URL base do Express.js (assumindo a porta 3000)

const VALIDACAO = {
  nomeUtilizador: /^[a-zA-Z0-9_.-]{3,20}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  telemovel: /^\d{9}$/,
  nif: /^\d{9}$/,
};

const MENSAGENS = {
  required: "Por favor, preencha todos os campos obrigatórios.",
  usernameRequired: "O nome de utilizador é obrigatório.",
  usernameInvalid:
    "O nome de utilizador deve ter entre 3 e 20 caracteres e apenas letras, números, . _ -",
  usernameExists: "Este nome de utilizador já está registado.",
  passwordRequired: "A palavra-passe é obrigatória.",
  passwordShort: "A palavra-passe deve ter pelo menos 6 caracteres.",
  nomeRequired: "O nome completo é obrigatório.",
  nomeInvalid: "Por favor, indique um nome válido.",
  emailRequired: "O email é obrigatório.",
  emailInvalid: "O email indicado não é válido.",
  telemovelRequired: "O telemóvel é obrigatório.",
  telemovelInvalid: "O telemóvel deve ter exatamente 9 dígitos.",
  nifRequired: "O NIF é obrigatório.",
  nifInvalid: "O NIF deve ter exatamente 9 dígitos.",
  moradaRequired: "A morada é obrigatória.",
  fotoInvalid: "A foto de perfil deve ser um ficheiro de imagem válido.",
  fotoLarge: "A foto de perfil não pode ter mais de 100 KB.",
  credentialsInvalid: "Nome de utilizador ou palavra-passe incorretos.",
};

// ==========================================
// SANITIZAÇÃO (DOMPurify)
// ==========================================

function sanitizar(texto) {
    return DOMPurify.sanitize(texto ? texto.trim() : '');
}


// ==========================================
// INICIALIZAÇÃO
// ==========================================

// Inicializa a aplicação quando o DOM carrega
function inicializar() {
  // Configura a History API para ouvir os botões Voltar/Avançar do navegador
  window.addEventListener("popstate", tratarMudancaRota);

  tratarMudancaRota(); // Determina qual View renderizar com base no URL atual no carregamento
  atualizarNavegacao(); // Garante que a navegação é atualizada após o carregamento inicial

  // ==========================================
  // CONFIGURAÇÃO DOS LISTENERS DE EVENTOS CSP-SAFE
  // ==========================================

  // Navegação
  const linkHome = document.getElementById("link-home");
  if (linkHome)
    linkHome.addEventListener("click", (e) => {
      e.preventDefault();
      navegarPara("/");
    });

  const linkConta = document.getElementById("link-conta");
  if (linkConta)
    linkConta.addEventListener("click", (e) => {
      e.preventDefault();
      const sessao = JSON.parse(localStorage.getItem("sessao") || "null");
      if (sessao && sessao.autenticado) {
        navegarPara("/perfil");
      } else {
        navegarPara("/login");
      }
    });

  const linkAdmin = document.getElementById("link-admin");
  if (linkAdmin)
    linkAdmin.addEventListener("click", (e) => {
      e.preventDefault();
      navegarPara("/admin");
    });

  // Login & Registo (Botões)
  const btnLogin = document.getElementById("btn-login");
  if (btnLogin) btnLogin.addEventListener("click", autenticarUtilizador);

  const btnIrRegisto = document.getElementById("btn-ir-registo");
  if (btnIrRegisto) btnIrRegisto.addEventListener("click", irParaRegisto);

  const formRegisto = document.getElementById("form-registo");
  if (formRegisto) formRegisto.addEventListener("submit", registarUtilizador);

  const btnVoltarRegisto = document.getElementById("btn-voltar-registo");
  if (btnVoltarRegisto)
    btnVoltarRegisto.addEventListener("click", cancelarRegisto);

  // Logout
  const btnLogoutPerfil = document.getElementById("btn-logout-perfil");
  if (btnLogoutPerfil)
    btnLogoutPerfil.addEventListener("click", terminarSessao);

  const btnLogoutAdmin = document.getElementById("btn-logout-admin");
  if (btnLogoutAdmin) btnLogoutAdmin.addEventListener("click", terminarSessao);
}

// ==========================================
// NAVEGAÇÃO SPA
// ==========================================

const ROTAS = {
  "/": "view-home",
  "/login": "view-login",
  "/registo": "view-registo",
  "/perfil": "view-perfil",
  "/admin": "view-admin"
};

function navegarPara(caminho, empurrarHistorico = true) {
  const idView = ROTAS[caminho] || "view-home"; // Redireciona para home se a rota for desconhecida

  if (empurrarHistorico) {
    window.history.pushState({ caminho }, "", caminho);
  }

  const views = document.querySelectorAll(".view");
  views.forEach((view) => {
    view.style.display = "none";
  });

  const viewAtiva = document.getElementById(idView);
  if (viewAtiva) {
    viewAtiva.style.display = "block";
  }

  if (idView === "view-perfil") {
    carregarPerfil();
  } else if (idView === "view-admin") {
    carregarListaUtilizadores();
  }
}

function tratarMudancaRota() {
  const caminho = window.location.pathname;
  navegarPara(caminho, false);
}

// ==========================================
// GESTÃO DE SESSÃO
// ==========================================

// Atualiza o link de navegação baseado no estado de login
function atualizarNavegacao() {
  const sessao = JSON.parse(localStorage.getItem("sessao") || "null");
  const ligacao = document.getElementById("link-conta");
  const ligacaoAdmin = document.getElementById("link-admin");

  if (!ligacao) {
    return;
  }

  if (sessao && sessao.autenticado) {
    ligacao.textContent = "Meu Perfil";
    if (ligacaoAdmin) ligacaoAdmin.style.display = sessao.isAdmin ? "inline" : "none";
  } else {
    ligacao.textContent = "A minha conta";
    if (ligacaoAdmin) ligacaoAdmin.style.display = "none";
  }
}

// ==========================================
// UTILITÁRIOS
// ==========================================

// Obtém a lista de utilizadores do localStorage
function obterUtilizadores() {
  return JSON.parse(localStorage.getItem("utilizadores") || "[]");
}

// Guarda a lista de utilizadores no localStorage
function guardarUtilizadores(utilizadores) {
  localStorage.setItem("utilizadores", JSON.stringify(utilizadores));
}

// Exibe uma mensagem de erro ao utilizador
function mostrarErro(mensagem) {
  alert(mensagem);
}

// Altera o estado de um botão para dar feedback visual (Loading)
function alternarCarregamento(botaoId, aCarregar) {
  const botao = document.getElementById(botaoId);
  if (!botao) return;
  
  if (aCarregar) {
    botao.disabled = true;
    botao.dataset.textoOriginal = botao.textContent;
    botao.textContent = "A processar...";
  } else {
    botao.disabled = false;
    botao.textContent = botao.dataset.textoOriginal;
  }
}

// ==========================================
// REGISTO
// ==========================================

let utilizadorEmEdicaoId = null; // Variável global para controlar a edição

// Valida os dados do formulário de registo
function validarRegisto(
  nomeUtilizador,
  palavrapasse,
  nome,
  email,
  telemovel,
  nif,
  morada,
) {
  if (
    !nomeUtilizador ||
    (!utilizadorEmEdicaoId && !palavrapasse) ||
    !nome ||
    !email ||
    !telemovel ||
    !nif ||
    !morada
  ) {
    return MENSAGENS.required;
  }

  if (!VALIDACAO.nomeUtilizador.test(nomeUtilizador)) {
    return MENSAGENS.usernameInvalid;
  }

  if (!utilizadorEmEdicaoId && !palavrapasse) {
    return MENSAGENS.passwordRequired;
  }

  if (palavrapasse && palavrapasse.length < 6) {
    return MENSAGENS.passwordShort;
  }

  if (!nome || nome.length < 3) {
    return MENSAGENS.nomeInvalid;
  }

  if (!VALIDACAO.email.test(email)) {
    return MENSAGENS.emailInvalid;
  }

  if (!VALIDACAO.telemovel.test(telemovel)) {
    return MENSAGENS.telemovelInvalid;
  }

  if (!VALIDACAO.nif.test(nif)) {
    return MENSAGENS.nifInvalid;
  }

  if (!morada) {
    return MENSAGENS.moradaRequired;
  }

  return "";
}

// Prepara o formulário de registo para edição
async function carregarEdicaoUtilizador(nomeUtilizadorAntigo) {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const response = await fetch(
      `${API_BASE_URL}/auth/users/${nomeUtilizadorAntigo}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (response.ok && data.success) {
      const utilizador = data.user;
      utilizadorEmEdicaoId = utilizador.username;

      // Preencher o formulário com os dados existentes
      const elNomeUtilizadorReg = document.getElementById("nomeUtilizadorReg");
      if (elNomeUtilizadorReg) {
        elNomeUtilizadorReg.value = utilizador.username;
        elNomeUtilizadorReg.disabled = true; // Impede alterar o username na edição
      }

      const inputPass = document.getElementById("palavrapasseReg");
      if (inputPass) {
        inputPass.value = ""; // Deixar vazio por segurança
        inputPass.removeAttribute("required"); // Permite submeter vazio para não alterar
        inputPass.placeholder = "Deixe em branco para manter a atual";
      }

      document.getElementById("nome").value = utilizador.nome || "";
      document.getElementById("email").value = utilizador.email || "";
      document.getElementById("telemovel").value = utilizador.telemovel || "";
      document.getElementById("nif").value = utilizador.nif || "";
      document.getElementById("morada").value = utilizador.morada || "";

      // Alterar textos da interface para modo edição
      document.getElementById("titulo-registo").textContent =
        "Editar Utilizador";
      document.getElementById("btn-submit-registo").textContent =
        "Guardar Alterações";
      document.getElementById("btn-voltar-registo").textContent =
        "Cancelar Edição";

      navegarPara("/registo");
    } else {
      mostrarErro(data.message || "Erro ao carregar dados do utilizador.");
    }
  } catch (error) {
    console.error("Erro ao carregar edição:", error);
    mostrarErro(
      "Falha de comunicação com o servidor ao carregar dados do utilizador.",
    );
  }
}

// Cancela o registo ou edição e volta para a view correta
function cancelarRegisto() {
  if (utilizadorEmEdicaoId) {
    utilizadorEmEdicaoId = null;
    const form = document.forms["registo"];
    if (form) form.reset();

    const elNomeUtilizadorReg = document.getElementById("nomeUtilizadorReg");
    if (elNomeUtilizadorReg) elNomeUtilizadorReg.disabled = false;

    navegarPara("/admin");
  } else {
    irParaLogin();
  }
}

// Processa o registo de um novo utilizador
async function registarUtilizador(evento) {
  if (evento && typeof evento.preventDefault === "function") {
    evento.preventDefault();
  }

  const nomeUtilizador = sanitizar(document.getElementById("nomeUtilizadorReg")?.value) || "";
  const palavrapasse = document.getElementById("palavrapasseReg")?.value.trim() || "";
  const nome = sanitizar(document.getElementById("nome")?.value) || "";
  const email = sanitizar(document.getElementById("email")?.value) || "";
  const telemovel = sanitizar(document.getElementById("telemovel")?.value) || "";
  const nif = sanitizar(document.getElementById("nif")?.value) || "";
  const morada = sanitizar(document.getElementById("morada")?.value) || "";
  const elementoFoto = document.getElementById("foto");
  const foto =
    elementoFoto && elementoFoto.files ? elementoFoto.files[0] : null;

  // Validação: a imagem não pode ter mais de 100kb (ajustável conforme necessário)
  if (foto && foto.size > 1024 * 100) {
    mostrarErro(MENSAGENS.fotoLarge);
    return false;
  }

  const mensagemValidacao = validarRegisto(
    nomeUtilizador,
    palavrapasse,
    nome,
    email,
    telemovel,
    nif,
    morada,
  );
  if (mensagemValidacao) {
    mostrarErro(mensagemValidacao);
    return false;
  }

  // Converte a imagem para formato Base64 para envio via JSON
  let fotoBase64 = null;
  if (foto) {
    fotoBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(foto);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  alternarCarregamento("btn-submit-registo", true);

  // Criar o objeto de dados (Payload) para enviar ao servidor
  const newUserPayload = {
    username: DOMPurify.sanitize(nomeUtilizador),
    password: palavrapasse,
    fotografia: DOMPurify.sanitize(fotoBase64), // Convertido para string Base64
    nome: DOMPurify.sanitize(nome),
    email: DOMPurify.sanitize(email),
    telemovel: DOMPurify.sanitize(telemovel), // O nome do campo é 'telemovel' (ver User.js)
    nif: DOMPurify.sanitize(nif),
    morada: DOMPurify.sanitize(morada), // O nome do campo é 'morada' (ver User.js)// O nome do campo é 'morada' (ver User.js)
  };

  const isEditing = !!utilizadorEmEdicaoId;
  // Define o endpoint para registar um novo ou para editar o atual
  const endpoint = isEditing
    ? `${API_BASE_URL}/auth/users/${utilizadorEmEdicaoId}`
    : `${API_BASE_URL}/auth/register`;
  const method = isEditing ? "PUT" : "POST";

  const headers = {
    "Content-Type": "application/json",
  };

  // Em caso de edição tem de passar o token na autenticação para proteção da rota
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (isEditing && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: method,
      headers: headers,
      body: JSON.stringify(newUserPayload), // Converte o objeto JS para string JSON
    });

    const data = await response.json();

    if (response.ok) {
      if (isEditing) {
        alert(`Utilizador ${nomeUtilizador} atualizado com sucesso!`);

        utilizadorEmEdicaoId = null;
        const form = document.forms["registo"];
        if (form) form.reset();

        const elNomeUtilizadorReg =
          document.getElementById("nomeUtilizadorReg");
        if (elNomeUtilizadorReg) elNomeUtilizadorReg.disabled = false;

        const sessao = JSON.parse(localStorage.getItem("sessao") || "null");
        if (sessao && sessao.nomeUtilizador === nomeUtilizador) {
          navegarPara("/perfil");
        } else {
          navegarPara("/admin");
        }
      } else {
        alert(
          `Registo de ${nomeUtilizador} BEM-SUCEDIDO! Pode agora fazer Login.`,
        );
        const form = document.forms["registo"];
        if (form) form.reset();
        irParaLogin();
      }
    } else {
      alert(`ERRO: ${data.message || "Ocorreu um erro no servidor."}`);
    }
  } catch (error) {
    console.error("Erro de rede:", error);
    alert("ERRO: Falha de comunicação com o servidor.");
  } finally {
    alternarCarregamento("btn-submit-registo", false);
  }

  return false;
}

// Navega para a página de login
function irParaLogin() {
  navegarPara("/login");
}

// Regista o evento de seleção de foto (para debug)
function enviarFoto() {
  const fotoInput = document.getElementById("foto");
  if (fotoInput && fotoInput.files.length > 0) {
    console.log("Foto selecionada:", fotoInput.files[0].name);
  }
}

// ==========================================
// LOGIN
// ==========================================

// Valida as credenciais de login
function validarAutenticacao(nomeUtilizador, palavrapasse) {
  if (!nomeUtilizador || !palavrapasse) {
    return MENSAGENS.required;
  }

  return "";
}

// Processa o login do utilizador
async function autenticarUtilizador(evento) {
  if (evento && typeof evento.preventDefault === "function") {
    evento.preventDefault();
  }

  const nomeUtilizador = sanitizar(document.getElementById("nomeUtilizador")?.value) || "";
  const palavrapasse = document.getElementById("palavrapasse")?.value.trim() || "";

  const mensagemValidacao = validarAutenticacao(nomeUtilizador, palavrapasse);
  if (mensagemValidacao) {
    mostrarErro(mensagemValidacao);
    return false;
  }

  // Payload para a API (O backend em authController.js espera 'identifier' e 'password')
  const loginPayload = {
    identifier: nomeUtilizador,
    password: palavrapasse,
  };

  alternarCarregamento("btn-login", true);

  try {
    // Rota: http://localhost:3000/api/auth/login
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginPayload),
    });

    const data = await response.json();

    if (response.ok) {
      // Sucesso: Guardar o Token JWT recebido no localStorage para uso futuro
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);

      // Mantemos o objeto de sessão para compatibilidade do frontend atual com a página de perfil
      const sessao = {
        autenticado: true,
        nomeUtilizador: data.user.username,
        isAdmin: data.user.isAdmin,
      };
      localStorage.setItem("sessao", JSON.stringify(sessao));

      atualizarNavegacao();
      navegarPara("/perfil");
    } else {
      mostrarErro(data.message || MENSAGENS.credentialsInvalid);
    }
  } catch (error) {
    console.error("Erro de rede durante o login:", error);
    mostrarErro("Falha de comunicação com o servidor durante o login.");
  } finally {
    alternarCarregamento("btn-login", false);
  }

  return false;
}

// Navega para a página de registo
function irParaRegisto() {
  utilizadorEmEdicaoId = null; // Garante que estamos no modo de criação puro

  const form = document.forms["registo"];
  if (form) form.reset();

  const elNomeUtilizadorReg = document.getElementById("nomeUtilizadorReg");
  if (elNomeUtilizadorReg) elNomeUtilizadorReg.disabled = false;

  const elTitulo = document.getElementById("titulo-registo");
  if (elTitulo) elTitulo.textContent = "Registo de Novo Utilizador";
  const elBtnSubmit = document.getElementById("btn-submit-registo");
  if (elBtnSubmit) elBtnSubmit.textContent = "Registar";
  const elBtnVoltar = document.getElementById("btn-voltar-registo");
  if (elBtnVoltar) elBtnVoltar.textContent = "Voltar ao Login";

  // Restaura a obrigatoriedade e placeholder da palavra-passe para o registo normal
  const inputPass = document.getElementById("palavrapasseReg");
  if (inputPass) {
    inputPass.setAttribute("required", "required");
    inputPass.placeholder = "Palavra-passe";
  }

  navegarPara("/registo");
}

// ==========================================
// PERFIL
// ==========================================

// Carrega e exibe os dados do perfil do utilizador autenticado
async function carregarPerfil() {
  const sessao = JSON.parse(localStorage.getItem("sessao") || "null");
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (!sessao || !sessao.autenticado || !token) {
    navegarPara("/login");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.ok && data.success) {
      const utilizador = data.user;

      const fotoPredefini = "img/foto_perfil.jpg";
      const primeiroNome = utilizador.nome
        ? utilizador.nome.split(" ")[0]
        : utilizador.username;

      // Função auxiliar para atualizar texto em elementos HTML
      const atualizarTexto = (id, texto) => {
        const el = document.getElementById(id);
        if (el) el.textContent = texto || "";
      };

      atualizarTexto("nome-titulo-perfil", primeiroNome);
      atualizarTexto("nome-utilizador", utilizador.nome);
      atualizarTexto("email-utilizador", utilizador.email);
      atualizarTexto("telemovel-utilizador", utilizador.telemovel);
      atualizarTexto("nif-utilizador", utilizador.nif);
      atualizarTexto("morada-utilizador", utilizador.morada);
      atualizarTexto("nome-utilizador-username", utilizador.username);

      // Define a foto do perfil (Data URL ou caminho padrão)
      const elementoFoto = document.getElementById("foto-perfil");
      if (elementoFoto) {
        if (
          utilizador.fotografia &&
          utilizador.fotografia.startsWith("data:")
        ) {
          elementoFoto.src = utilizador.fotografia;
        } else if (
          utilizador.fotografia &&
          typeof utilizador.fotografia === "string" &&
          utilizador.fotografia.trim() !== ""
        ) {
          elementoFoto.src = `img/${utilizador.fotografia}`;
        } else {
          elementoFoto.src = fotoPredefini;
        }
      }
    } else {
      terminarSessao();
    }
  } catch (error) {
    console.error("Erro ao carregar perfil:", error);
    mostrarErro("Erro de comunicação ao carregar o perfil.");
  }
}

// Termina a sessão do utilizador e redireciona para login
function terminarSessao() {
  localStorage.removeItem("sessao");
  localStorage.removeItem(AUTH_TOKEN_KEY); // Limpa o Token JWT por segurança
  atualizarNavegacao();
  navegarPara("/login");
}

// ==========================================
// LISTA DE UTILIZADORES
// ==========================================

// Carrega e exibe a lista de utilizadores na tabela
async function carregarListaUtilizadores() {
  const sessao = JSON.parse(localStorage.getItem("sessao") || "null");
    if (!sessao || !sessao.autenticado || !sessao.isAdmin) {
        navegarPara("/login");
        return;
    }
  const corpoTabela = document.getElementById("corpo-tabela-utilizadores");
  if (!corpoTabela) return;

  corpoTabela.innerHTML = "";

  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const response = await fetch(`${API_BASE_URL}/auth/users`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.ok && data.success) {
      const utilizadores = data.users;

      // ordenar por nome de utilizador
      utilizadores.sort((a, b) =>
        a.username.localeCompare(b.username, undefined, {
          sensitivity: "base",
        }),
      );

      utilizadores.forEach((utilizador) => {
        const tr = document.createElement("tr");

        // Foto
        const tdFoto = document.createElement("td");
        const img = document.createElement("img");
        img.style.width = "50px";
        img.style.height = "50px";
        img.style.objectFit = "cover";
        img.style.borderRadius = "50%";

        // Adaptado para usar 'fotografia' (nome utilizado no backend)
        if (
          utilizador.fotografia &&
          utilizador.fotografia.startsWith("data:")
        ) {
          img.src = utilizador.fotografia;
        } else if (
          utilizador.fotografia &&
          typeof utilizador.fotografia === "string" &&
          utilizador.fotografia.trim() !== ""
        ) {
          img.src = `img/${utilizador.fotografia}`;
        } else {
          img.src = "img/foto_perfil.jpg";
        }
        tdFoto.appendChild(img);

        // Dados de texto
        const criarTd = (texto) => {
          const td = document.createElement("td");
          td.textContent = texto || "";
          return td;
        };

        // Ação (Editar e Remover)
        const tdAcao = document.createElement("td");

        const btnEditar = document.createElement("button");
        btnEditar.textContent = "Editar";
        btnEditar.className = "btn-editar";
        // Passamos 'utilizador.username' em vez de 'nomeUtilizador' pois vem da DB
        btnEditar.addEventListener("click", () =>
          carregarEdicaoUtilizador(utilizador.username),
        );

        const btnRemover = document.createElement("button");
        btnRemover.textContent = "Remover";
        btnRemover.className = "btn-remover";
        btnRemover.addEventListener("click", () =>
          removerUtilizador(utilizador.username),
        );

        tdAcao.append(btnEditar, btnRemover);

        tr.append(
          tdFoto,
          criarTd(utilizador.username),
          criarTd(utilizador.nome),
          criarTd(utilizador.email),
          criarTd(utilizador.nif),
          tdAcao,
        );
        corpoTabela.appendChild(tr);
      });
    } else {
      mostrarErro(data.message || "Erro ao carregar a lista de utilizadores.");
    }
  } catch (error) {
    console.error("Erro ao carregar lista de utilizadores:", error);
    mostrarErro(
      "Falha de comunicação com o servidor ao carregar os utilizadores.",
    );
  }
}

// Remove um utilizador pelo nome de utilizador via API
async function removerUtilizador(nomeUtilizador) {
  if (
    !confirm(
      `Tem a certeza que deseja remover o utilizador "${nomeUtilizador}"?`,
    )
  ) {
    return;
  }

  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const response = await fetch(
      `${API_BASE_URL}/auth/users/${nomeUtilizador}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (response.ok && data.success) {
      const sessao = JSON.parse(localStorage.getItem("sessao") || "null");
      if (sessao && sessao.nomeUtilizador === nomeUtilizador) {
        // Se o próprio utilizador se remover, encerra a sessão
        terminarSessao();
      } else {
        // Atualiza a tabela
        carregarListaUtilizadores();
      }
    } else {
      mostrarErro(data.message || "Erro ao remover o utilizador.");
    }
  } catch (error) {
    console.error("Erro ao remover utilizador:", error);
    mostrarErro("Falha de comunicação com o servidor ao remover o utilizador.");
  }
}
