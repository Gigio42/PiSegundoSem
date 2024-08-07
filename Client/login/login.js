import BASE_URL from "../utils/config.js";

document.getElementById("login").addEventListener("click", function (event) {
  event.preventDefault();
  validaUsuario();
});

document.getElementById("toggleProducao").addEventListener("change", function () {
  var maquinaSelect = document.getElementById("maquinaSelectContainer");
  maquinaSelect.style.display = this.checked ? "block" : "none";
});

function validaUsuario() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const url = `${BASE_URL}/user?name=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {

        localStorage.setItem("cargo", data.cargo);

        const nome = document.getElementById("username").value;
        localStorage.setItem("nome", nome);

        const maquina = document.getElementById("selectMaquina").value;
        localStorage.setItem("maquina", maquina);

        localStorage.setItem("isLoggedIn", "true"); //var q vai ser usada para verif se o usuario ta logado
        const isProducaoChecked = document.getElementById("toggleProducao").checked;
        if (isProducaoChecked) {
          window.location.href = "../produção/producao.html";
        } else {
          window.location.href = "../home.html";
        }
      } else {
        alert("Usuário ou senha inválidos!");
      }
    })
    .catch((error) => {
      console.error("Erro ao validar o usuário:", error);
      alert("Falha ao conectar ao servidor!");
    });
}



function carregarMaquinas() {
  fetch(`${BASE_URL}/adm/maquina`)
    .then((response) => response.json())
    .then((data) => {
      const select = document.getElementById("selectMaquina");
      // Limpa opções existentes
      select.innerHTML = '<option value="">Máquina</option>';
      console.log();

      // Adiciona novas opções baseadas na resposta
      data.forEach((maquina) => {
        const option = document.createElement("option");
        option.value = maquina.nome; // Assumindo que o retorno é um array de objetos com a propriedade 'nome'
        option.textContent = maquina.nome;
        select.appendChild(option);
      });
    })
    .catch((error) => console.error("Erro ao carregar as máquinas:", error));
}

// Chamada da função quando a página carrega
document.addEventListener("DOMContentLoaded", carregarMaquinas);

document.getElementById("darkModeToggle").addEventListener("change", alterarTema);

document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  const toggle = document.getElementById("darkModeToggle");
  toggle.checked = savedTheme !== "light"; // Default is dark mode
  alterarTema();
});

function alterarTema() {
  const toggle = document.getElementById("darkModeToggle");
  const body = document.body;
  body.classList.toggle("body-light-mode", !toggle.checked);
  localStorage.setItem("theme", toggle.checked ? "dark" : "light");
}
