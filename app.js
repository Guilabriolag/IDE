const preview = document.getElementById("preview");
const panel = document.getElementById("editorPanel");
const svgControls = document.getElementById("svgControls");
const tabsBar = document.getElementById("tabsBar");

let currentTab = "html";
let customTabs = [];
let unsavedTabs = new Set();

function getTextarea(id) {
  return document.getElementById("code_" + id);
}

function toggleEditor() {
  panel.classList.toggle("open");
}

function switchTab(tabId) {
  currentTab = tabId;

  document.querySelectorAll("textarea").forEach(t => t.style.display = "none");
  document.querySelectorAll(".tabs-container button").forEach(b => b.classList.remove("active"));

  svgControls.style.display = (tabId === "svg") ? "flex" : "none";

  const targetTextarea = getTextarea(tabId);
  const targetTabBtn = document.getElementById("tab_" + tabId);

  if (targetTextarea) targetTextarea.style.display = "block";
  if (targetTabBtn) targetTabBtn.classList.add("active");

  if (tabId === "svg") renderSvgPreview();
}

function renderSvgPreview() {
  const svgCode = getTextarea("svg").value;
  const bgColor = document.getElementById("svgBgSelect").value;
  const doc = `<!DOCTYPE html>
  <html>
  <head>
    <style>
      body {
        margin: 0;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${bgColor};
        transition: background 0.2s;
        overflow: hidden;
      }
      svg { max-width: 80vw; max-height: 80vh; }
    </style>
  </head>
  <body>${svgCode}</body>
  </html>`;
  preview.srcdoc = doc;
}

function updateSvgBg() {
  if (currentTab === "svg") renderSvgPreview();
}

// Marca aba como "não salva" quando o conteúdo muda
function markUnsaved(tabId) {
  unsavedTabs.add(tabId);
  const btn = document.getElementById("tab_" + tabId);
  if (btn) btn.classList.add("unsaved");
}

function clearUnsavedMarks() {
  unsavedTabs.clear();
  document.querySelectorAll(".tabs-container button").forEach(b => b.classList.remove("unsaved"));
}

["html", "css", "js", "svg"].forEach(id => {
  getTextarea(id).addEventListener("input", () => {
    markUnsaved(id);
    if (id === "svg" && currentTab === "svg") renderSvgPreview();
  });
});

// Remove todas as abas customizadas da tela (usado antes de carregar um novo projeto)
function clearCustomTabs() {
  customTabs.forEach(t => {
    const btn = document.getElementById("tab_" + t.id);
    const ta = document.getElementById("code_" + t.id);
    if (btn) btn.remove();
    if (ta) ta.remove();
  });
  customTabs = [];
}

// Adicionar nova aba dinamicamente (+ Criar Aba)
function addNewTab() {
  const fileType = prompt(
    "Digite o nome/extensão do arquivo:\nExemplos:\n- player.svg\n- theme.css\n- game.js\n- shader.glsl",
    "novo-arquivo.css"
  );
  if (!fileType) return;

  const tabId = "custom_" + Date.now();
  const ext = fileType.split('.').pop().toLowerCase();

  const newBtn = document.createElement("button");
  newBtn.id = "tab_" + tabId;
  newBtn.textContent = fileType;
  newBtn.onclick = () => switchTab(tabId);

  const addBtn = document.querySelector(".add-tab");
  tabsBar.insertBefore(newBtn, addBtn);

  const newTextarea = document.createElement("textarea");
  newTextarea.id = "code_" + tabId;
  newTextarea.placeholder = `// Código para ${fileType}`;
  newTextarea.addEventListener("input", () => markUnsaved(tabId));
  panel.insertBefore(newTextarea, document.querySelector(".buttons"));

  customTabs.push({ id: tabId, name: fileType, ext: ext });
  switchTab(tabId);
}

// Rodar código do projeto completo (HTML + CSS + JS)
function runCode() {
  if (currentTab === "svg") {
    renderSvgPreview();
    return;
  }

  let extraCSS = "";
  let extraJS = "";
  let extraHTML = "";

  customTabs.forEach(t => {
    const code = getTextarea(t.id).value;
    if (t.ext === "css") extraCSS += "\n" + code;
    else if (t.ext === "js") extraJS += "\n" + code;
    else if (t.ext === "html" || t.ext === "htm") extraHTML += "\n" + code;
    // outras extensões (ex: .glsl) ficam disponíveis nas abas mas não são injetadas automaticamente
  });

  const code = `<!DOCTYPE html>
  <html>
  <head>
    <style>
      ${getTextarea("css").value}
      ${extraCSS}
    </style>
  </head>
  <body contenteditable="true">
    ${getTextarea("html").value}
    ${extraHTML}
    <script>
      ${getTextarea("js").value}
      ${extraJS}
    <\\/script>
  </body>
  </html>`;

  preview.srcdoc = code;
}

// Salvar Projeto no LocalStorage
function saveProject() {
  const name = prompt("Nome do projeto:");
  if (!name) return;

  const projectData = {
    html: getTextarea("html").value,
    css: getTextarea("css").value,
    js: getTextarea("js").value,
    svg: getTextarea("svg").value,
    customTabs: customTabs.map(t => ({ id: t.id, name: t.name, ext: t.ext, code: getTextarea(t.id).value }))
  };

  localStorage.setItem("proj_" + name, JSON.stringify(projectData));
  clearUnsavedMarks();
  alert("✅ Projeto salvo!");
}

// Carregar Projeto do LocalStorage
function loadProject() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith("proj_"));
  if (keys.length === 0) { alert("⚠ Nenhum projeto salvo."); return; }

  const name = prompt("Digite o nome do projeto:\n" + keys.map(k => k.replace("proj_","")).join(", "));
  if (name && localStorage.getItem("proj_" + name)) {
    const data = JSON.parse(localStorage.getItem("proj_" + name));

    // Remove abas customizadas do projeto anterior antes de carregar o novo
    clearCustomTabs();

    getTextarea("html").value = data.html || "";
    getTextarea("css").value = data.css || "";
    getTextarea("js").value = data.js || "";
    getTextarea("svg").value = data.svg || "";

    if (data.customTabs) {
      data.customTabs.forEach(ct => {
        const newBtn = document.createElement("button");
        newBtn.id = "tab_" + ct.id;
        newBtn.textContent = ct.name;
        newBtn.onclick = () => switchTab(ct.id);
        tabsBar.insertBefore(newBtn, document.querySelector(".add-tab"));

        const newTextarea = document.createElement("textarea");
        newTextarea.id = "code_" + ct.id;
        newTextarea.addEventListener("input", () => markUnsaved(ct.id));
        panel.insertBefore(newTextarea, document.querySelector(".buttons"));

        getTextarea(ct.id).value = ct.code;
      });
      customTabs = data.customTabs;
    }

    clearUnsavedMarks();
    switchTab("html");
    runCode();
  } else { alert("⚠ Projeto não encontrado."); }
}

// Comandos do Preview
function execCommand(cmd, value = null) {
  const iframeDoc = preview.contentDocument || preview.contentWindow.document;
  iframeDoc.execCommand(cmd, false, value);
}
function addLink() {
  const url = prompt("URL:", "https://");
  if (url) preview.contentDocument.execCommand('createLink', false, url);
}
function addImage() {
  const url = prompt("URL da imagem:", "https://");
  if (url) preview.contentDocument.execCommand('insertImage', false, url);
}
function addVideo() {
  const url = prompt("URL do vídeo:", "https://");
  if (url) {
    const doc = preview.contentDocument;
    const vid = doc.createElement("iframe");
    vid.src = url; vid.width = "100%"; vid.height = "200"; vid.frameBorder = "0";
    doc.body.appendChild(vid);
  }
}

// Atalho: Ctrl+Enter (ou Cmd+Enter no Mac) executa o código
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    runCode();
  }
});

// Valores Iniciais
getTextarea("html").value = `<h1>Cobra Globo — Playground</h1><p>Alterne para a aba asset.svg para desenhar os itens!</p>`;
getTextarea("css").value = `body { font-family: Arial; background: #122820; color: #f4efe4; padding: 20px; }`;
getTextarea("js").value = `console.log("IDE Pronta!");`;
getTextarea("svg").value = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <style>
    .glow { filter: drop-shadow(0 0 8px #ff5252); }
    .float { animation: float 2s ease-in-out infinite; }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-6px); }
    }
  </style>
  <g class="float glow">
    <circle cx="50" cy="55" r="30" fill="#ff5252" />
    <path d="M 50 30 Q 65 15 70 25 Q 55 35 50 30 Z" fill="#4fd1a5" />
    <circle cx="38" cy="45" r="5" fill="#ffffff" opacity="0.6" />
  </g>
</svg>`;

switchTab("html");
runCode();
