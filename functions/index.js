const {onObjectFinalized} = require("firebase-functions/v2/storage");
const {defineSecret} = require("firebase-functions/params");
const {getStorage} = require("firebase-admin/storage");
const {initializeApp} = require("firebase-admin/app");

initializeApp();

const GITHUB_TOKEN = defineSecret("GITHUB_TOKEN");

// Esta função é um esqueleto seguro para sincronização futura.
// O token fica como Secret do Firebase, nunca no JavaScript do navegador.
// Configure GITHUB_OWNER, GITHUB_REPO e GITHUB_BRANCH como variáveis de ambiente
// antes de habilitar a rotina de publicação no GitHub.

exports.syncGameToGithub = onObjectFinalized(
  {secrets:[GITHUB_TOKEN], region:"southamerica-east1"},
  async (event) => {
    const object = event.data;
    if (!object.name || !object.name.startsWith("games/")) return null;

    // Próxima etapa: baixar o objeto do Storage e usar a API Contents do GitHub
    // para criar/atualizar o arquivo no repositório.
    console.log("Novo jogo detectado:", object.name);
    return null;
  }
);
