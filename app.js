import { auth, db } from "./firebase-config.js";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const ALLOWED_EMAIL = "SEU_EMAIL_AQUI@EXEMPLO.COM";

const $ = id => document.getElementById(id);
const app = $("app"), notice = $("loginNotice"), grid = $("componentGrid");

$("btnLogin").onclick = login;
$("btnLogin2").onclick = login;
$("btnLogout").onclick = () => signOut(auth);
$("btnAddComponent").onclick = () => $("componentModal").classList.remove("hidden");
$("saveComponent").onclick = saveComponent;

document.querySelectorAll("[data-close]").forEach(b => b.onclick = () => $(b.dataset.close).classList.add("hidden"));

async function login() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    if (result.user.email?.toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
      await signOut(auth);
      alert("Esta conta não está autorizada.");
    }
  } catch (e) { alert(e.message); }
}

onAuthStateChanged(auth, user => {
  if (user && user.email?.toLowerCase() === ALLOWED_EMAIL.toLowerCase()) {
    notice.classList.add("hidden");
    app.classList.remove("hidden");
    $("btnLogin").classList.add("hidden");
    $("btnLogout").classList.remove("hidden");
    $("userEmail").textContent = user.email;
    loadComponents();
  } else {
    notice.classList.remove("hidden");
    app.classList.add("hidden");
    $("btnLogin").classList.remove("hidden");
    $("btnLogout").classList.add("hidden");
    $("userEmail").textContent = "";
  }
});

function loadComponents() {
  onSnapshot(query(collection(db, "subjects"), orderBy("name")), snap => {
    grid.innerHTML = "";
    snap.forEach(d => {
      const c = d.data();
      const card = document.createElement("article");
      card.className = "component-card";
      card.innerHTML = `
        <div class="cover" style="background-image:url('${escapeAttr(c.cover || defaultCover(c.name))}')">
          <div class="cover-shade"></div><h3>${escapeHtml(c.name)}</h3>
        </div>
        <div class="card-actions">
          <button class="primary open">Abrir jogos</button>
          <button class="danger remove">Retirar</button>
        </div>`;
      card.querySelector(".open").onclick = () => location.href = `component.html?id=${encodeURIComponent(d.id)}`;
      card.querySelector(".remove").onclick = async () => {
        if (confirm(`Retirar "${c.name}"?`)) await deleteDoc(doc(db, "subjects", d.id));
      };
      grid.appendChild(card);
    });
  });
}

async function saveComponent() {
  const name = $("componentName").value.trim();
  if (!name) return alert("Informe o nome do componente.");
  await addDoc(collection(db, "subjects"), {
    name, cover: $("componentCover").value.trim(),
    createdAt: serverTimestamp()
  });
  $("componentName").value = ""; $("componentCover").value = "";
  $("componentModal").classList.add("hidden");
}

function defaultCover(name) {
  return `https://placehold.co/900x600/png?text=${encodeURIComponent(name)}`;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function escapeAttr(s){return String(s).replace(/'/g,"%27");}
