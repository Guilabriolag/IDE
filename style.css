body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #0d1117;
  color: #e6edf3;
  height: 100vh;
  overflow: hidden;
}
iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}
#editorPanel {
  position: fixed;
  bottom: -100%;
  left: 0;
  right: 0;
  height: 75%;
  background: #161b22;
  display: flex;
  flex-direction: column;
  transition: bottom 0.3s;
  z-index: 9999;
}
#editorPanel.open { bottom: 0; }

.tabs-container {
  display: flex;
  background: #21262d;
  overflow-x: auto;
  white-space: nowrap;
  border-bottom: 1px solid #30363d;
}
.tabs-container::-webkit-scrollbar { height: 4px; }
.tabs-container::-webkit-scrollbar-thumb { background: #484f58; }

.tabs-container button {
  padding: 12px 16px;
  background: #21262d;
  border: none;
  color: #8b949e;
  cursor: pointer;
  font-weight: bold;
  font-size: 13px;
  border-right: 1px solid #30363d;
  -webkit-user-select: none;
  user-select: none;
}
.tabs-container button.active {
  background: #238636;
  color: #ffffff;
}
.tabs-container button.add-tab {
  background: #30363d;
  color: #2ea043;
  font-size: 16px;
  font-weight: bold;
}
.tabs-container button.unsaved::after {
  content: " •";
  color: #f0883e;
}
.tab-hint {
  font-size: 10px;
  color: #6e7681;
  padding: 3px 10px;
  background: #161b22;
  border-bottom: 1px solid #21262d;
}

/* Textareas originais (fallback antes do CodeMirror assumir) */
textarea {
  flex: 1;
  width: 100%;
  padding: 10px;
  border: none;
  outline: none;
  resize: none;
  font-size: 13px;
  font-family: 'SFMono-Regular', Consolas, monospace;
  background: #0d1117;
  color: #e6edf3;
  display: none;
  box-sizing: border-box;
}

/* Painéis do CodeMirror (substituem as textareas visualmente) */
.cm-pane {
  flex: 1;
  display: none;
  min-height: 0;
}
.cm-pane .CodeMirror {
  height: 100%;
  font-size: 13px;
}

.svg-controls {
  display: none;
  background: #161b22;
  padding: 6px 10px;
  gap: 6px;
  align-items: center;
  border-bottom: 1px solid #30363d;
  font-size: 11px;
}
.svg-controls select, .svg-controls button {
  background: #21262d;
  color: #e6edf3;
  border: 1px solid #30363d;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 8px;
  background: #161b22;
}
button.action {
  flex: 1;
  min-width: 90px;
  background: #238636;
  color: white;
  border: none;
  padding: 10px;
  font-size: 13px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}
button.action:hover { background: #2ea043; }

#fab {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  background: #238636;
  border-radius: 50%;
  color: white;
  font-size: 24px;
  border: none;
  cursor: pointer;
  z-index: 10000;
  box-shadow: 0 4px 10px rgba(0,0,0,0.6);
}
#previewToolbar {
  position: fixed;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: center;
  background: rgba(22,27,34,0.92);
  padding: 6px;
  border-radius: 6px;
  z-index: 10001;
}
#previewToolbar button {
  background: #238636;
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

/* Modal genérico: Projetos / Componente / Exportar / Importar */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 20000;
}
.modal-overlay.open { display: flex; }
.modal-box {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 10px;
  padding: 16px;
  width: 90%;
  max-width: 420px;
  max-height: 80vh;
  overflow-y: auto;
}
.modal-box h3 { margin-top: 0; }
.modal-box h4 { margin-bottom: 4px; color: #8b949e; font-size: 12px; text-transform: uppercase; }
.modal-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #21262d;
  font-size: 13px;
}
.modal-row span { overflow-wrap: anywhere; }
.modal-row button {
  background: #21262d;
  color: #e6edf3;
  border: 1px solid #30363d;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}
.modal-box button.action {
  width: 100%;
  margin-bottom: 8px;
  display: block;
  text-align: center;
  box-sizing: border-box;
}
.modal-meta {
  font-size: 10px;
  color: #6e7681;
  display: block;
}

/* Fichário: miniaturas de componentes */
.fichario-thumb {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.fichario-thumb svg { max-width: 100%; max-height: 100%; }
.fichario-thumb-text {
  font-size: 9px;
  color: #8b949e;
  text-transform: uppercase;
}
