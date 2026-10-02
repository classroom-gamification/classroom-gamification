// =========================================================
// ARCHIVO: app.js - Sistema de Jogos Educacionais
// Funciona 100% no Firestore (Sem precisar de Firebase Storage / Cartão)
// =========================================================

// 1. Inicializa o Firestore
const db = firebase.firestore();

// 2. Função para converter ficheiros (HTML ou Imagem) para texto (Base64)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

// 3. Função principal para salvar o jogo
async function salvarJogo(event) {
  if (event) event.preventDefault();

  // Captura dos elementos do formulário
  const inputsTexto = document.querySelectorAll('input[type="text"], input:not([type])');
  const inputsFile = document.querySelectorAll('input[type="file"]');

  // Identificação dos campos
  let nomeJogo = "";
  inputsTexto.forEach(input => {
    if (input.value && !nomeJogo) nomeJogo = input.value;
  });

  let arquivoHtml = null;
  let arquivoImagem = null;

  inputsFile.forEach(input => {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.name.endsWith('.html') || file.name.endsWith('.htm') || file.type.includes('html')) {
        arquivoHtml = file;
      } else if (file.type.includes('image') || file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        arquivoImagem = file;
      }
    }
  });

  // Validações
  if (!nomeJogo) {
    alert("Por favor, digite o NOME DO JOGO.");
    return;
  }

  if (!arquivoHtml) {
    alert("Por favor, selecione o ARQUIVO HTML do jogo.");
    return;
  }

  // Feedback visual
  const btnSalvar = document.querySelector('button[type="submit"]') || document.querySelector('button');
  const textoOriginal = btnSalvar ? btnSalvar.innerText : "";
  if (btnSalvar) btnSalvar.innerText = "⏳ Guardando jogo no Firestore...";

  try {
    // Converte os ficheiros em texto
    const htmlBase64 = await fileToBase64(arquivoHtml);
    const imagemBase64 = arquivoImagem ? await fileToBase64(arquivoImagem) : "";

    // Salva diretamente no Firestore
    await db.collection("jogos").add({
      nome: nomeJogo,
      conteudoHtml: htmlBase64,
      imagemCapa: imagemBase64,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("✅ JOGO CADASTRADO COM SUCESSO!");
    location.reload();
  } catch (erro) {
    console.error("Erro ao salvar:", erro);
    alert("❌ Erro ao guardar jogo: " + erro.message);
    if (btnSalvar) btnSalvar.innerText = textoOriginal;
  }
}

// 4. Função para carregar e exibir os jogos cadastrados
function carregarJogos() {
  const container = document.getElementById("containerJogos") || 
                    document.getElementById("listaJogos") || 
                    document.querySelector(".jogos-container") ||
                    document.querySelector(".jogos-grid");

  if (!container) return;

  db.collection("jogos").orderBy("criadoEm", "desc").onSnapshot((snapshot) => {
    container.innerHTML = "";

    if (snapshot.empty) {
      container.innerHTML = "<p style='color: white; text-align: center;'>Nenhum jogo cadastrado ainda.</p>";
      return;
    }

    snapshot.forEach((doc) => {
      const jogo = doc.data();
      const id = doc.id;

      const card = document.createElement("div");
      card.className = "card-jogo";
      card.style.cssText = "background: rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; margin: 10px; display: inline-block; width: 220px; vertical-align: top; text-align: center; color: white;";

      const imgCapa = jogo.imagemCapa 
        ? `<img src="${jogo.imagemCapa}" style="width: 100%; height: 130px; object-fit: cover; border-radius: 6px;">`
        : `<div style="width: 100%; height: 130px; background: #333; display: flex; align-items: center; justify-content: center; border-radius: 6px;">🎮 Sem Capa</div>`;

      card.innerHTML = `
        ${imgCapa}
        <h3 style="margin: 10px 0 5px 0; font-size: 16px;">${jogo.nome}</h3>
        <div style="margin-top: 10px; display: flex; gap: 5px; justify-content: center;">
          <button onclick="jogar('${id}')" style="background: #28a745; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;">▶ JOGAR</button>
          <button onclick="deletarJogo('${id}')" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">🗑️</button>
        </div>
      `;

      container.appendChild(card);
    });
  });
}

// 5. Função para rodar o jogo
async function jogar(id) {
  try {
    const doc = await db.collection("jogos").doc(id).get();
    if (!doc.exists) {
      alert("Jogo não encontrado.");
      return;
    }

    const jogo = doc.data();
    if (!jogo.conteudoHtml) {
      alert("Conteúdo HTML não encontrado.");
      return;
    }

    const novaJanela = window.open();
    if (novaJanela) {
      novaJanela.document.open();
      novaJanela.document.write(jogo.conteudoHtml.startsWith("data:") ? atob(jogo.conteudoHtml.split(",")[1]) : jogo.conteudoHtml);
      novaJanela.document.close();
    } else {
      window.location.href = jogo.conteudoHtml;
    }
  } catch (e) {
    alert("Erro ao carregar o jogo: " + e.message);
  }
}

// 6. Função para apagar o jogo
async function deletarJogo(id) {
  if (confirm("Tem certeza que deseja apagar este jogo?")) {
    try {
      await db.collection("jogos").doc(id).delete();
      alert("Jogo apagado com sucesso!");
    } catch (e) {
      alert("Erro ao apagar: " + e.message);
    }
  }
}

// 7. Inicialização automática
document.addEventListener("DOMContentLoaded", () => {
  carregarJogos();

  const form = document.querySelector("form");
  if (form) {
    form.addEventListener("submit", salvarJogo);
  }

  const botoesSalvar = document.querySelectorAll("button");
  botoesSalvar.forEach(btn => {
    if (btn.innerText.includes("SALVAR") || btn.innerText.includes("Salvar")) {
      btn.addEventListener("click", salvarJogo);
    }
  });
});
