import { createElementWithClass } from "../utils/dom.js";

export class Subcard {
  constructor(conjugacao, onSelectionChange) {
    this.conjugacao = conjugacao;
    this.onSelectionChange = onSelectionChange;
    this.isChecked = false;
    this.disabled = false;
  }

  createValueDiv(key, value) {
    let valueDiv = createElementWithClass("div", "subcard-value-div col text-center value d-flex align-items-center justify-content-center rounded");

    if (key === "quantidade") {
      let quantidade_disponivel = this.conjugacao.quantidade_disponivel;
      valueDiv.textContent = `${value} / ${quantidade_disponivel}`;
    } else {
      valueDiv.textContent = value || "N/A";
    }

    return valueDiv;
  }

  createUsadoDiv() {
    let status = this.conjugacao.usado ? "USADO" : "DISP";
    let statusDiv = createElementWithClass("div", "subcard-status-div col text-center value d-flex align-items-center justify-content-center rounded");
    statusDiv.textContent = status;
    statusDiv.className += this.conjugacao.usado ? " text-danger" : " text-success";
    return statusDiv;
  }

  createRendimentoDiv() {
    let rendimento = this.conjugacao.rendimento ? `${this.conjugacao.rendimento}x` : "N/A";
    let rendimentoDiv = createElementWithClass("div", "subcard-rendimento-div col text-center value d-flex align-items-center justify-content-center rounded");
    rendimentoDiv.textContent = rendimento;
    return rendimentoDiv;
  }

  createValueRow() {
    let valueRow = createElementWithClass("div", "value-row d-flex flex-wrap w-100 justify-content-between");
    valueRow.appendChild(this.createValueDiv("medida", this.conjugacao.medida));
    valueRow.appendChild(this.createRendimentoDiv());
    valueRow.appendChild(this.createValueDiv("quantidade", this.conjugacao.quantidade));
    valueRow.appendChild(this.createValueDiv("PartNumber", this.conjugacao.part_number));
    valueRow.appendChild(this.createValueDiv("PedidoVenda", this.conjugacao.pedido_venda));
    valueRow.appendChild(this.createUsadoDiv());
    return valueRow;
  }

  createSubcardBody() {
    let subcardBody = createElementWithClass("div", "subcard-body rounded d-flex align-items-center");
    subcardBody.appendChild(this.createValueRow());
    return subcardBody;
  }

  createSubcard() {
    let subcard = createElementWithClass("div", "subcard p-2 rounded mb-2 d-flex flex-column");
    subcard.setAttribute("data-id-conjugacao", this.conjugacao.id_conjugacoes);
    subcard.style.flex = "1 0 21%";

    if (this.conjugacao.usado) {
      subcard.className += " usado";
    }

    subcard.appendChild(this.createValueRow());

    subcard.addEventListener("click", (event) => {
      event.stopPropagation();

      if (this.disabled) {
        return;
      }

      this.isChecked = !this.isChecked;
      subcard.classList.toggle("selected");
      this.onSelectionChange(this.conjugacao, this.isChecked, "subcard");

      if (this.isChecked) {
        this.parentCard.disabled = true;
      } else {
        if (!this.parentCard.subcards.some((subcard) => subcard.isChecked)) {
          this.parentCard.disabled = false;
        }
      }
    });

    return subcard;
  }

  deselect() {
    this.isChecked = false;
    this.subcard.classList.remove("selected");
  }
}
