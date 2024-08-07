import { sendDataToServer, sendAllDataToServer } from "./connections.js";

if (localStorage.getItem("isLoggedIn") !== "true") {
  window.location.href = "../login/login.html";
}

$("#user-name").text(localStorage.getItem("nome") || "UserName");
export var name = localStorage.getItem("nome");
var profilePic = $("#profilePic");
profilePic.attr("src", "https://api.dicebear.com/8.x/shapes/svg?seed=" + name);

export function logout() {
  localStorage.clear();
  window.location.href = "../login/login.html";
}

export function themeToggle() {
  const toggle = document.getElementById("darkModeToggle");
  const theme = toggle.checked ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

export function alterarTema() {
  const toggle = document.getElementById("darkModeToggle");
  const theme = toggle.checked ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

export function hideDropZone() {
  var dropZone = document.getElementById("drop-zone");
  var tables = document.getElementById("tables");
  if (dropZone.style.display === "none") {
    dropZone.style.display = "flex";
    tables.style.display = "none";
  } else {
    dropZone.style.display = "none";
    tables.style.display = "block";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "dark";
  const toggle = document.getElementById("darkModeToggle");
  toggle.checked = savedTheme === "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
});

document.addEventListener("DOMContentLoaded", function () {
  const recebimentoTbody = document.getElementById("tableBody2");
  recebimentoTbody.addEventListener("click", function (event) {
    if (event.target.className === "update-button") {
      const row = event.target.closest("tr");
      if (verifyIdChapa(row)) {
        if (verifyRowData(row)) {
          sendDataToServer(row);
        } else {
          alert("Por favor, defina os campos vazios.");
        }
      } else {
        deleteRow(row);
      }
    }
  });

  const enviarTudoButton = document.getElementById("enviarTudo");
  enviarTudoButton.addEventListener("click", sendAllDataToServer);
});

export function rowDataObj(row) {
  if (!row || row.cells.length === 0) {
    console.error("A linha fornecida é inválida ou não contém células");
    return {};
  }

  var rowData = {
    id_chapa: row.getAttribute("data-id") || "", // Verifica data-id na linha
    fornecedor: row.cells[1].querySelector("input") ? row.cells[1].querySelector("input").value : "",
    id_compra: row.cells[2].querySelector("input") ? row.cells[2].querySelector("input").value : "",
    quantidade_recebida: parseFloat(row.cells[3].querySelector("input") ? row.cells[3].querySelector("input").value : "0") || 0,
    qualidade: row.cells[4].querySelector("input") ? row.cells[4].querySelector("input").value : "",
    largura: row.cells[5].querySelector("input") ? row.cells[5].querySelector("input").value : "",
    comprimento: row.cells[6].querySelector("input") ? row.cells[6].querySelector("input").value : "",
    onda: row.cells[7].querySelector("select") ? row.cells[7].querySelector("select").value : "",
    vincos: row.cells[8].querySelector("select") ? row.cells[8].querySelector("select").value : "",
    status: row.cells[9].querySelector("select") ? row.cells[9].querySelector("select").value : "",
    data_recebimento: row.cells[10].querySelector("input") ? row.cells[10].querySelector("input").value : "",
  };

  console.log("rowDataObj: ", rowData);
  return rowData;
}

function verifyRowData(row) {
  const requiredCells = Array.from(row.cells).slice(1, 7); // Verifica as colunas Fornecedor, Id_compra, Quantidade, Qualidade, Largura, Comprimento
  let allEmpty = true;
  for (let cell of requiredCells) {
    const input = cell.querySelector("input, select");
    if (input && input.value.trim() !== "") {
      allEmpty = false;
      break;
    }
  }
  return !allEmpty;
}

export function verifyIdChapa(row) {
  const id = row.getAttribute("data-id");
  console.log("Verifying ID Chapa: ", id);
  return id && id.trim() !== "";
}


function deleteRow(row) {
  row.parentNode.removeChild(row);
}