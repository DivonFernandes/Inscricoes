(function () {
  var params = new URLSearchParams(window.location.search);
  var flash = document.getElementById("flash");

  function showAlert(kind, text) {
    if (!flash) return;
    var div = document.createElement("div");
    div.className = "alert alert-" + kind + " alert-dismissible fade show";
    div.setAttribute("role", "alert");
    div.textContent = text;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-close";
    btn.setAttribute("data-bs-dismiss", "alert");
    btn.setAttribute("aria-label", "Close");
    div.appendChild(btn);
    flash.appendChild(div);
  }

  var status = params.get("status");
  if (status === "success") showAlert("success", "Inscrição cadastrada com sucesso!");
  if (status === "duplicate") showAlert("warning", "CPF já cadastrado.");
  if (status === "error") showAlert("danger", params.get("message") || "Erro ao salvar.");
  if (params.get("error") === "1") showAlert("danger", "Senha incorreta.");

  ["cpf", "nome", "estado_civil", "sexo", "data_nascimento", "endereco", "bairro", "cidade_estado", "telefone"].forEach(
    function (name) {
      var el = document.getElementById(name);
      if (el && params.has(name)) el.value = params.get(name);
    },
  );

  var chefe = document.getElementById("chefe_de_equipe");
  if (chefe && params.get("chefe_de_equipe") === "on") chefe.checked = true;
})();
