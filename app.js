// Função auxiliar para converter ficheiros para texto (Base64)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Exemplo de salvamento direto no Firestore sem Storage:
async function salvarJogo(titulo, disciplina, ano, arquivoHtml, arquivoImagem) {
  try {
    const htmlBase64 = arquivoHtml ? await fileToBase64(arquivoHtml) : "";
    const imagemBase64 = arquivoImagem ? await fileToBase64(arquivoImagem) : "";

    await db.collection("jogos").add({
      titulo: titulo,
      disciplina: disciplina,
      ano: ano,
      conteudoHtml: htmlBase64,
      imagemCapa: imagemBase64,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("Jogo cadastrado com sucesso!");
  } catch (erro) {
    console.error("Erro ao salvar:", erro);
    alert("Erro ao cadastrar jogo: " + erro.message);
  }
}
