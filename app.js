const preview = document.getElementById("preview");
const panel = document.getElementById("editorPanel");
const svgControls = document.getElementById("svgControls");
const tabsBar = document.getElementById("tabsBar");

let currentTab = "html";
let customTabs = [];
let unsavedTabs = new Set();
let currentProjectName = null;
let autosaveTimer = null;
let cmInstances = {};

function getTextarea(id) { return document.getElementById("code_" + id); }

/* ---------- Camada de valor (funciona com ou sem CodeMirror carregado) ---------- */

function getValue(id) {
  if (cmInstances[id]) return cmInstances[id].getValue();
  const ta = getTextarea(id);
  return ta ? ta.value : "";
}
function setValue(id, val) {
  if (cmInstances[id]) { cmInstances[id].setValue(val || ""); return; }
  const ta = getTextarea(id);
  if (ta) ta.value = val || "";
}

function modeForExt(ext) {
  if (ext === "html" || ext === "htm") return "htmlmixed";
  if (ext === "css") return "css";
  if (ext === "js") return "javascript";
  if (ext === "svg" || ext === "xml") return "xml";
  if (ext === "json") return { name: "javascript", json: true };
  return null;
}

function initCodeMirror(id, ext) {
  const ta = getTextarea(id);
  if (!ta || typeof CodeMirror === "undefined") return null;
  const cm = CodeMirror.fromTextArea(ta, {
    mode: modeForExt(ext),
    theme: "dracula",
    lineNumbers: true,
    lineWrapping: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    indentUnit: 2,
    tabSize: 2
  });
  cm.getWrapperElement().classList.add("cm-pane");
  panel.insertBefore(cm.getWrapperElement(), document.querySelector(".buttons"));
  cm.on("change", () => {
    markUnsaved(id);
    scheduleAutosave();
    if (id === "svg" && currentTab === "svg") renderSvgPreview();
  });
  cmInstances[id] = cm;
  return cm;
}

/* ---------- Navegação entre abas ---------- */

function toggleEditor() { panel.classList.toggle("open"); }

function switchTab(tabId) {
  currentTab = tabId;
  document.querySelectorAll(".cm-pane").forEach(w => w.style.display = "none");
  document.querySelectorAll("textarea").forEach(t => t.style.display = "none");
  document.querySelectorAll(".tabs-container button").forEach(b => b.classList.remove("active"));
  svgControls.style.display = (tabId === "svg") ? "flex" : "none";

  if (cmInstances[tabId]) {
    cmInstances[tabId].getWrapperElement().style.display = "block";
    cmInstances[tabId].refresh();
  } else {
    const ta = getTextarea(tabId);
    if (ta) ta.style.display = "block";
  }
  const targetTabBtn = document.getElementById("tab_" + tabId);
  if (targetTabBtn) targetTabBtn.classList.add("active");

  if (tabId === "svg") renderSvgPreview();
}

function renderSvgPreview() {
  const svgCode = getValue("svg");
  const bgColor = document.getElementById("svgBgSelect").value;
  const doc = `<!DOCTYPE html><html><head><style>
    body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:${bgColor};transition:background .2s;overflow:hidden;}
    svg{max-width:80vw;max-height:80vh;}
  </style></head><body>${svgCode}</body></html>`;
  preview.srcdoc = doc;
}
function updateSvgBg() { if (currentTab === "svg") renderSvgPreview(); }

/* ---------- Nível 1: estado / autosave ---------- */

function markUnsaved(tabId) {
  unsavedTabs.add(tabId);
  const btn = document.getElementById("tab_" + tabId);
  if (btn) btn.classList.add("unsaved");
}
function clearUnsavedMarks() {
  unsavedTabs.clear();
  document.querySelectorAll(".tabs-container button").forEach(b => b.classList.remove("unsaved"));
}
function collectState() {
  return {
    html: getValue("html"),
    css: getValue("css"),
    js: getValue("js"),
    svg: getValue("svg"),
    customTabs: customTabs.map(t => ({ id: t.id, name: t.name, ext: t.ext, code: getValue(t.id) }))
  };
}
function applyState(data) {
  clearCustomTabs();
  setValue("html", data.html || "");
  setValue("css", data.css || "");
  setValue("js", data.js || "");
  setValue("svg", data.svg || "");
  (data.customTabs || []).forEach(ct => createCustomTab(ct.name, ct.ext, ct.code));
  clearUnsavedMarks();
  switchTab("html");
  runCode();
}
function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    localStorage.setItem("autosave_current", JSON.stringify(collectState()));
  }, 1000);
}
function restoreAutosave() {
  const raw = localStorage.getItem("autosave_current");
  if (!raw) return;
  applyState(JSON.parse(raw));
  closeModal();
}

/* ---------- Abas customizadas ---------- */

function attachTabEvents(btn, tabId) {
  btn.onclick = () => switchTab(tabId);
  let pressTimer;
  btn.addEventListener("touchstart", () => { pressTimer = setTimeout(() => renameTab(tabId), 600); }, { passive: true });
  btn.addEventListener("touchend", () => clearTimeout(pressTimer));
  btn.addEventListener("touchmove", () => clearTimeout(pressTimer));
  btn.addEventListener("contextmenu", (e) => { e.preventDefault(); renameTab(tabId); });
}
function renameTab(tabId) {
  const t = customTabs.find(x => x.id === tabId);
  if (!t) return;
  const newName = prompt("Novo nome do arquivo:", t.name);
  if (!newName) return;
  t.name = newName;
  t.ext = newName.split(".").pop().toLowerCase();
  const btn = document.getElementById("tab_" + tabId);
  if (btn) btn.textContent = newName;
  markUnsaved(tabId);
  scheduleAutosave();
}
function createCustomTab(name, ext, content = "") {
  const tabId = "custom_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

  const newBtn = document.createElement("button");
  newBtn.id = "tab_" + tabId;
  newBtn.textContent = name;
  attachTabEvents(newBtn, tabId);
  tabsBar.insertBefore(newBtn, document.querySelector(".add-tab"));

  const newTextarea = document.createElement("textarea");
  newTextarea.id = "code_" + tabId;
  newTextarea.value = content;
  panel.insertBefore(newTextarea, document.querySelector(".buttons"));

  initCodeMirror(tabId, ext);
  if (!cmInstances[tabId]) {
    newTextarea.addEventListener("input", () => { markUnsaved(tabId); scheduleAutosave(); });
  }

  customTabs.push({ id: tabId, name, ext });
  return tabId;
}
function clearCustomTabs() {
  customTabs.forEach(t => {
    const btn = document.getElementById("tab_" + t.id);
    if (btn) btn.remove();
    if (cmInstances[t.id]) {
      cmInstances[t.id].getWrapperElement().remove();
      delete cmInstances[t.id];
    }
    const ta = document.getElementById("code_" + t.id);
    if (ta) ta.remove();
  });
  customTabs = [];
}
function addNewTab() {
  const fileType = prompt(
    "Digite o nome/extensão do arquivo:\nExemplos:\n- player.svg\n- theme.css\n- game.js\n- shader.glsl",
    "novo-arquivo.css"
  );
  if (!fileType) return;
  const ext = fileType.split(".").pop().toLowerCase();
  const id = createCustomTab(fileType, ext, "");
  switchTab(id);
}
function classifyExt(ext) {
  if (["svg", "png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "assets";
  if (["js", "css"].includes(ext)) return "modules";
  return "files";
}
function getCurrentExt() {
  if (["html", "css", "js", "svg"].includes(currentTab)) return currentTab;
  const t = customTabs.find(t => t.id === currentTab);
  return t ? t.ext : "txt";
}

/* ---------- Executar preview ---------- */

function runCode() {
  if (currentTab === "svg") { renderSvgPreview(); return; }

  let extraCSS = "", extraJS = "", extraHTML = "";
  customTabs.forEach(t => {
    const code = getValue(t.id);
    if (t.ext === "css") extraCSS += "\n" + code;
    else if (t.ext === "js") extraJS += "\n" + code;
    else if (t.ext === "html" || t.ext === "htm") extraHTML += "\n" + code;
  });

  const code = `<!DOCTYPE html><html><head><style>
    ${getValue("css")}
    ${extraCSS}
  </style></head>
  <body contenteditable="true">
    ${getValue("html")}
    ${extraHTML}
    <script>
      ${getValue("js")}
      ${extraJS}
    <\\/script>
  </body></html>`;
  preview.srcdoc = code;
}

/* ---------- Modal genérico ---------- */

function openModal(html) {
  document.getElementById("modalBox").innerHTML = html;
  document.getElementById("modalOverlay").classList.add("open");
}
function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
}

/* ---------- Nível 1: Projetos (novo / salvar / listar / duplicar / excluir) ---------- */

function getProjectKeys() { return Object.keys(localStorage).filter(k => k.startsWith("proj_")); }

function persistProject(name) {
  let version = 1;
  const existingRaw = localStorage.getItem("proj_" + name);
  if (existingRaw) {
    try { version = (JSON.parse(existingRaw).version || 1) + 1; } catch (e) {}
  }
  const state = collectState();
  state.version = version;
  state.savedAt = new Date().toISOString();
  localStorage.setItem("proj_" + name, JSON.stringify(state));
  clearUnsavedMarks();
}
function quickSave() {
  if (!currentProjectName) return saveAsNewProject();
  persistProject(currentProjectName);
  alert("✅ Projeto salvo! (v" + (JSON.parse(localStorage.getItem("proj_" + currentProjectName)).version) + ")");
}
function saveAsNewProject() {
  const name = prompt("Nome do novo projeto:");
  if (!name) return;
  if (localStorage.getItem("proj_" + name) && !confirm('Já existe um projeto chamado "' + name + '". Sobrescrever?')) return;
  currentProjectName = name;
  persistProject(name);
  closeModal();
  alert('✅ Salvo como "' + name + '"');
}
function openProjectByName(name) {
  const raw = localStorage.getItem("proj_" + name);
  if (!raw) return;
  applyState(JSON.parse(raw));
  currentProjectName = name;
  closeModal();
}
function duplicateProject(name) {
  const newName = prompt("Nome da cópia:", name + "_copia");
  if (!newName) return;
  if (localStorage.getItem("proj_" + newName) && !confirm('Já existe um projeto chamado "' + newName + '". Sobrescrever?')) return;
  const raw = localStorage.getItem("proj_" + name);
  if (raw) localStorage.setItem("proj_" + newName, raw);
  openProjectsModal();
}
function deleteProject(name) {
  if (!confirm('Excluir o projeto "' + name + '"? Essa ação não pode ser desfeita.')) return;
  localStorage.removeItem("proj_" + name);
  if (currentProjectName === name) currentProjectName = null;
  openProjectsModal();
}
function newProject(template) {
  if (!confirm("Isso vai limpar o editor atual (o rascunho automático guarda o que estiver aqui agora). Continuar?")) return;
  currentProjectName = null;
  clearCustomTabs();
  if (template === "fgg") {
    setValue("html", "<h1>Novo FGG</h1>\n<p>Estrutura inicial do fichário gráfico generativo.</p>");
    setValue("css", "body { font-family: Arial; background: #122820; color: #f4efe4; padding: 20px; }");
    setValue("js", '// lógica do FGG\nconsole.log("FGG iniciado");');
    setValue("svg", '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">\n  <circle cx="50" cy="50" r="30" fill="#4fd1a5" />\n</svg>');
  } else {
    setValue("html", ""); setValue("css", ""); setValue("js", ""); setValue("svg", "");
  }
  clearUnsavedMarks();
  switchTab("html");
  runCode();
  closeModal();
}
function openProjectsModal() {
  const autosave = localStorage.getItem("autosave_current");
  let html = "<h3>📁 Projetos</h3>";
  html += `<button class="action" onclick="newProject('blank')">🆕 Novo projeto em branco</button>`;
  html += `<button class="action" onclick="newProject('fgg')">🧬 Novo a partir do template FGG</button>`;
  if (autosave) {
    html += `<div class="modal-row"><span>↺ Rascunho automático</span><button onclick="restoreAutosave()">Restaurar</button></div>`;
  }
  html += `<button class="action" onclick="saveAsNewProject()">💾 Salvar projeto atual como...</button>`;
  const keys = getProjectKeys();
  if (keys.length === 0) html += "<p>Nenhum projeto salvo ainda.</p>";
  keys.forEach(k => {
    const name = k.replace("proj_", "");
    let meta = {};
    try { meta = JSON.parse(localStorage.getItem(k)); } catch (e) {}
    const versionLabel = meta.version ? `v${meta.version}` : "";
    html += `<div class="modal-row">
      <span>${name}<span class="modal-meta">${versionLabel}</span></span>
      <div>
        <button onclick="openProjectByName('${name}')">Abrir</button>
        <button onclick="duplicateProject('${name}')">Duplicar</button>
        <button onclick="deleteProject('${name}')">Excluir</button>
      </div>
    </div>`;
  });
  html += `<button class="action" onclick="closeModal()">Fechar</button>`;
  openModal(html);
}

/* ---------- Nível 2: Componente / Fichário ---------- */

function getFichario() { return JSON.parse(localStorage.getItem("fichario") || "[]"); }
function saveFichario(list) { localStorage.setItem("fichario", JSON.stringify(list)); }

function saveCurrentTabAsComponent() {
  const type = prompt("Tipo do componente:\n1 = Código puro\n2 = Asset\n3 = Módulo\n4 = FGG", "2");
  const typeMap = { "1": "codigo", "2": "asset", "3": "modulo", "4": "fgg" };
  const typeName = typeMap[type] || "asset";
  const ext = getCurrentExt();
  const name = prompt("Nome do arquivo:", "componente." + ext);
  if (!name) return;
  const code = getValue(currentTab);
  const list = getFichario();
  const id = typeName.toUpperCase() + "_" + String(list.filter(c => c.type === typeName).length + 1).padStart(3, "0");
  list.push({ id, name, type: typeName, ext: name.split(".").pop().toLowerCase(), code });
  saveFichario(list);
  alert("✅ Componente salvo como " + id);
  openComponentModal();
}
function loadComponentToTab(id) {
  const c = getFichario().find(x => x.id === id);
  if (!c) return;
  const tabId = createCustomTab(c.name, c.ext, c.code);
  switchTab(tabId);
  closeModal();
}
function deleteComponent(id) {
  if (!confirm("Excluir este componente do fichário?")) return;
  saveFichario(getFichario().filter(x => x.id !== id));
  openComponentModal();
}
function renderFicharioList() {
  const list = getFichario();
  if (list.length === 0) return "<p>Nenhum componente salvo ainda.</p>";
  return list.map(c => {
    const thumb = c.ext === "svg"
      ? `<div class="fichario-thumb">${c.code}</div>`
      : `<div class="fichario-thumb"><span class="fichario-thumb-text">${c.ext}</span></div>`;
    return `<div class="modal-row">
      ${thumb}
      <span style="flex:1">[${c.type}] ${c.name}</span>
      <div>
        <button onclick="loadComponentToTab('${c.id}')">Carregar</button>
        <button onclick="deleteComponent('${c.id}')">Excluir</button>
      </div>
    </div>`;
  }).join("");
}
function openComponentModal() {
  openModal(`<h3>🧩 Componente</h3>
    <button class="action" onclick="saveCurrentTabAsComponent()">💾 Salvar aba atual como componente</button>
    <h4>Fichário</h4>
    ${renderFicharioList()}
    <button class="action" onclick="closeModal()">Fechar</button>`);
}

/* ---------- Nível 3: Exportar (arquivo avulso / ZIP) ---------- */

function downloadFile(filename, content, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
function exportCurrentTab() {
  const ext = getCurrentExt();
  const coreNames = { html: "index.html", css: "style.css", js: "script.js", svg: "asset.svg" };
  const name = coreNames[currentTab] || (customTabs.find(t => t.id === currentTab) || {}).name || ("arquivo." + ext);
  downloadFile(name, getValue(currentTab));
  closeModal();
}
async function exportProjectZip(includeLibrary) {
  if (typeof JSZip === "undefined") { alert("⚠ JSZip não carregou — verifique a conexão."); return; }
  const projectName = currentProjectName || prompt("Nome do projeto para o ZIP:", "meu-projeto") || "projeto";
  let version = 1, savedAt = new Date().toISOString();
  const existingRaw = currentProjectName ? localStorage.getItem("proj_" + currentProjectName) : null;
  if (existingRaw) {
    try { const d = JSON.parse(existingRaw); version = d.version || 1; savedAt = d.savedAt || savedAt; } catch (e) {}
  }

  const zip = new JSZip();
  const filesManifest = [];

  zip.file("index.html", getValue("html"));
  filesManifest.push({ id: "CORE_HTML", name: "index.html", type: "html", role: "core" });
  zip.file("style.css", getValue("css"));
  filesManifest.push({ id: "CORE_CSS", name: "style.css", type: "css", role: "core" });
  zip.file("script.js", getValue("js"));
  filesManifest.push({ id: "CORE_JS", name: "script.js", type: "js", role: "core" });
  zip.file("asset.svg", getValue("svg"));
  filesManifest.push({ id: "CORE_SVG", name: "asset.svg", type: "svg", role: "core" });

  customTabs.forEach(t => {
    const folder = classifyExt(t.ext);
    zip.folder(folder).file(t.name, getValue(t.id));
    filesManifest.push({ id: t.id, name: folder + "/" + t.name, type: t.ext, role: "custom" });
  });

  if (includeLibrary) {
    getFichario().forEach(c => {
      zip.folder("library").file(c.name, c.code);
      filesManifest.push({ id: c.id, name: "library/" + c.name, type: c.ext, role: "library" });
    });
  }

  zip.file("project.json", JSON.stringify({ project: projectName, version, savedAt, files: filesManifest }, null, 2));

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = projectName.replace(/\s+/g, "_") + ".zip";
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  closeModal();
}
function openExportModal() {
  openModal(`<h3>📦 Exportar</h3>
    <button class="action" onclick="exportCurrentTab()">📄 Aba atual</button>
    <button class="action" onclick="exportProjectZip(false)">📁 Projeto completo (.zip)</button>
    <button class="action" onclick="exportProjectZip(true)">🧰 Projeto + biblioteca (.zip)</button>
    <button class="action" onclick="closeModal()">Fechar</button>`);
}

/* ---------- Nível 4: Importar (arquivo avulso / ZIP) ---------- */

function handleImportFile(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const ext = file.name.split(".").pop().toLowerCase();
    const tabId = createCustomTab(file.name, ext, reader.result);
    switchTab(tabId);
    closeModal();
  };
  reader.readAsText(file);
}
async function importProjectZip(file) {
  if (typeof JSZip === "undefined") { alert("⚠ JSZip não carregou — verifique a conexão."); return; }
  const zip = await JSZip.loadAsync(file);
  clearCustomTabs();

  const coreMap = { "index.html": "html", "style.css": "css", "script.js": "js", "asset.svg": "svg" };
  for (const [fname, tabId] of Object.entries(coreMap)) {
    const f = zip.file(fname);
    if (f) setValue(tabId, await f.async("string"));
  }

  const handled = new Set(Object.keys(coreMap).concat(["project.json"]));
  const entries = Object.keys(zip.files).filter(n => !zip.files[n].dir);
  for (const path of entries) {
    if (handled.has(path)) continue;
    const content = await zip.files[path].async("string");
    const parts = path.split("/");
    const filename = parts[parts.length - 1];
    const ext = filename.split(".").pop().toLowerCase();
    createCustomTab(filename, ext, content);
  }

  clearUnsavedMarks();
  switchTab("html");
  runCode();
  closeModal();
  alert("✅ Projeto importado!");
}
async function handleImportZip(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  await importProjectZip(file);
}
function openImportModal() {
  openModal(`<h3>📥 Importar</h3>
    <label class="action" style="display:block;text-align:center;">📄 Arquivo (nova aba)
      <input type="file" style="display:none" onchange="handleImportFile(event)">
    </label>
    <label class="action" style="display:block;text-align:center;">📦 Projeto ZIP
      <input type="file" accept=".zip" style="display:none" onchange="handleImportZip(event)">
    </label>
    <button class="action" onclick="closeModal()">Fechar</button>`);
}

/* ---------- Comandos do preview (contenteditable) ---------- */

function execCommand(cmd, value = null) {
  const iframeDoc = preview.contentDocument || preview.contentWindow.document;
  iframeDoc.execCommand(cmd, false, value);
}
function addLink() {
  const url = prompt("URL:", "https://");
  if (url) preview.contentDocument.execCommand("createLink", false, url);
}
function addImage() {
  const url = prompt("URL da imagem:", "https://");
  if (url) preview.contentDocument.execCommand("insertImage", false, url);
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

/* ---------- Atalho de teclado ---------- */

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runCode(); }
});

/* ---------- PWA: registra o service worker ---------- */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}

/* ---------- Valores iniciais ---------- */

getTextarea("html").value = `<h1>Cobra Globo — Playground</h1><p>Alterne para a aba asset.svg para desenhar os itens!</p>`;
getTextarea("css").value = `body { font-family: Arial; background: #122820; color: #f4efe4; padding: 20px; }`;
getTextarea("js").value = `console.log("IDE Pronta!");`;
getTextarea("svg").value = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <style>
    .glow { filter: drop-shadow(0 0 8px #ff5252); }
    .float { animation: float 2s ease-in-out infinite; }
    @keyframes float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-6px);} }
  </style>
  <g class="float glow">
    <circle cx="50" cy="55" r="30" fill="#ff5252" />
    <path d="M 50 30 Q 65 15 70 25 Q 55 35 50 30 Z" fill="#4fd1a5" />
    <circle cx="38" cy="45" r="5" fill="#ffffff" opacity="0.6" />
  </g>
</svg>`;

initCodeMirror("html", "html");
initCodeMirror("css", "css");
initCodeMirror("js", "js");
initCodeMirror("svg", "svg");

switchTab("html");
runCode();
