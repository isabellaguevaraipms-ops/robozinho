import { useEffect, useState } from "react";
import {
  Bot, LayoutDashboard, Smile, Image, Mic, Settings,
  Power, Wifi, WifiOff, Send, Upload, Moon, Sun,
  Heart, Zap, Volume2, Monitor, RefreshCw
} from "lucide-react";

const API = "http://127.0.0.1:8000";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [connected, setConnected] = useState(false);
  const [expression, setExpression] = useState("happy");
  const [mode, setMode] = useState("face");
  const [dark, setDark] = useState(true);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState([]);
  const [port, setPort] = useState("COM3");

  const expressions = [
    ["happy", "Feliz", "😊"],
    ["sad", "Triste", "😢"],
    ["angry", "Bravo", "😠"],
    ["sleep", "Dormindo", "😴"],
    ["love", "Apaixonado", "😍"],
    ["surprise", "Surpreso", "😮"]
  ];

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, options);
    if (!response.ok) throw new Error("Falha na comunicação");
    return response;
  }

  async function checkConnection() {
    try {
      const response = await request("/status");
      const data = await response.json();
      setConnected(data.connected);
    } catch {
      setConnected(false);
    }
  }

  useEffect(() => {
    checkConnection();
    const timer = setInterval(checkConnection, 3000);
    return () => clearInterval(timer);
  }, []);

  async function connectRobot() {
    try {
      await request("/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ port })
      });
      await checkConnection();
    } catch {
      alert("Não foi possível conectar. Verifique o serviço Python e a porta USB.");
    }
  }

  async function sendExpression(value) {
    setExpression(value);
    try {
      await request("/expression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expression: value })
      });
    } catch {
      alert("Robô desconectado. A expressão foi alterada apenas na prévia.");
    }
  }

  async function changeMode(value) {
    setMode(value);
    try {
      await request("/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: value })
      });
    } catch {
      alert("Não foi possível enviar o comando ao robô.");
    }
  }

  async function sendPhoto(file) {
    if (!file) return;
    setPhotos(old => [...old, URL.createObjectURL(file)]);

    const data = new FormData();
    data.append("file", file);

    try {
      await request("/photo", { method: "POST", body: data });
      alert("Foto enviada!");
    } catch {
      alert("Não foi possível enviar a foto. Confira a conexão.");
    }
  }

  async function sendMessage() {
    if (!message.trim()) return;

    try {
      await request("/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      setMessage("");
    } catch {
      alert("Robô desconectado.");
    }
  }

  async function togglePower() {
    try {
      await request("/power", { method: "POST" });
    } catch {
      alert("Robô desconectado.");
    }
  }

  const currentExpression =
    expressions.find(item => item[0] === expression)?.[2] || "😊";

  return (
    <div className={dark ? "app dark" : "app light"}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Bot /></div>
          <div>
            <strong>ROVER</strong>
            <small>PIXEL COMMAND</small>
          </div>
        </div>

        <div className="nav-label">MENU PRINCIPAL</div>

        {[
          ["dashboard", LayoutDashboard, "Dashboard"],
          ["expressions", Smile, "Expressões"],
          ["photos", Image, "Galeria"],
          ["voice", Mic, "Central de voz"],
          ["settings", Settings, "Configurações"]
        ].map(([id, Icon, label]) => (
          <button
            key={id}
            className={`nav-item ${page === id ? "active" : ""}`}
            onClick={() => setPage(id)}
          >
            <Icon size={19} />
            {label}
          </button>
        ))}

        <div className="sidebar-bottom">
          <div className="connection-small">
            <span className={`dot ${connected ? "online" : ""}`} />
            {connected ? "Robô conectado" : "Robô desconectado"}
          </div>
          <small>ROVER OS v1.0.0</small>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="breadcrumb">ROVER / {page.toUpperCase()}</span>
            <h2>
              {{
                dashboard: "Dashboard",
                expressions: "Expressões",
                photos: "Galeria de fotos",
                voice: "Central de voz",
                settings: "Configurações"
              }[page]}
            </h2>
          </div>

          <div className="top-actions">
            <button className="icon-btn" onClick={() => setDark(!dark)}>
              {dark ? <Sun /> : <Moon />}
            </button>
            <div className="status-pill">
              <span className={`dot ${connected ? "online" : ""}`} />
              {connected ? "ONLINE" : "OFFLINE"}
            </div>
          </div>
        </header>

        {page === "dashboard" && (
          <>
            <section className="welcome">
              <div>
                <span className="eyebrow">SISTEMA DE CONTROLE</span>
                <h1>Olá, Rover <span>👋</span></h1>
                <p>Seu companheiro está esperando por você.</p>
              </div>
              <button className="primary-btn" onClick={togglePower}>
                <Power size={17} /> Ligar / Desligar
              </button>
            </section>

            <section className="stats">
              <div className="stat-card">
                <Wifi size={20} />
                <span>Conexão</span>
                <strong>{connected ? "Conectado" : "Desconectado"}</strong>
              </div>
              <div className="stat-card">
                <Smile size={20} />
                <span>Expressão atual</span>
                <strong>{expressions.find(e => e[0] === expression)?.[1]}</strong>
              </div>
              <div className="stat-card">
                <Monitor size={20} />
                <span>Modo de tela</span>
                <strong>{mode === "face" ? "Rosto" : "Fotos"}</strong>
              </div>
            </section>

            <section className="dashboard-grid">
              <div className="panel robot-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Visualização do Rover</h3>
                    <p>Prévia do personagem</p>
                  </div>
                  <span className="live-tag">LIVE PREVIEW</span>
                </div>

                <div className="robot-stage">
                  <div className="robot-face">
                    <div className="robot-eyes">
                      <div className={`eye ${expression === "sleep" ? "closed" : ""}`}>
                        {expression !== "sleep" && <div className="pupil" />}
                      </div>
                      <div className={`eye ${expression === "sleep" ? "closed" : ""}`}>
                        {expression !== "sleep" && <div className="pupil" />}
                      </div>
                    </div>
                    <div className={`mouth ${expression}`} />
                  </div>
                  <span className="stage-caption">
                    {currentExpression} ROVER EM {mode === "face" ? "MODO ROSTO" : "MODO FOTO"}
                  </span>
                </div>

                <div className="mode-controls">
                  <button className={mode === "face" ? "selected" : ""} onClick={() => changeMode("face")}>
                    <Smile size={17} /> Rosto
                  </button>
                  <button className={mode === "photos" ? "selected" : ""} onClick={() => changeMode("photos")}>
                    <Image size={17} /> Fotos
                  </button>
                </div>
              </div>

              <div className="right-column">
                <div className="panel">
                  <div className="panel-heading">
                    <div><h3>Expressões rápidas</h3><p>Mude o humor do Rover</p></div>
                  </div>
                  <div className="quick-expressions">
                    {expressions.map(([id, name, emoji]) => (
                      <button
                        key={id}
                        className={expression === id ? "expression active-expression" : "expression"}
                        onClick={() => sendExpression(id)}
                      >
                        <span>{emoji}</span>
                        <small>{name}</small>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="panel connection-panel">
                  <div className="panel-heading">
                    <div><h3>Conexão USB</h3><p>Comunicação com ESP32</p></div>
                    {connected ? <Wifi color="#20c997" /> : <WifiOff />}
                  </div>
                  <label>Porta serial</label>
                  <input value={port} onChange={e => setPort(e.target.value)} />
                  <button className="primary-btn full" onClick={connectRobot}>
                    <RefreshCw size={16} /> Conectar ao Rover
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {page === "expressions" && (
          <section className="panel page-panel">
            <h3>Biblioteca de expressões</h3>
            <p>Selecione uma expressão para enviar ao display.</p>
            <div className="expression-grid">
              {expressions.map(([id, name, emoji]) => (
                <button className="expression-card" key={id} onClick={() => sendExpression(id)}>
                  <span>{emoji}</span><strong>{name}</strong>
                  <small>{id === expression ? "Selecionada" : "Aplicar expressão"}</small>
                </button>
              ))}
            </div>
          </section>
        )}

        {page === "photos" && (
          <section className="panel page-panel">
            <h3>Galeria do Rover</h3>
            <p>Envie fotos para aparecerem na tela TFT 160 × 128.</p>
            <label className="upload-area">
              <Upload size={30} />
              <strong>Selecionar imagem</strong>
              <span>PNG, JPG ou JPEG</span>
              <input type="file" accept="image/*" hidden onChange={e => sendPhoto(e.target.files[0])} />
            </label>
            <div className="photo-grid">
              {photos.map((photo, index) => (
                <img key={index} src={photo} alt="Foto enviada" />
              ))}
            </div>
          </section>
        )}

        {page === "voice" && (
          <section className="panel page-panel voice-page">
            <Mic size={42} />
            <h3>Central de voz</h3>
            <p>Use o microfone do computador para conversar com o Rover.</p>
            <button className={`mic-button ${listening ? "listening" : ""}`} onClick={() => setListening(!listening)}>
              <Mic size={25} />
            </button>
            <strong>{listening ? "Microfone ativado" : "Microfone desativado"}</strong>
            <p className="muted">Reconhecimento de voz será integrado na próxima etapa.</p>
            <div className="message-box">
              <input
                placeholder="Digite uma mensagem..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage}><Send size={18} /></button>
            </div>
          </section>
        )}

        {page === "settings" && (
          <section className="panel page-panel">
            <h3>Configurações do sistema</h3>
            <p>Configure a comunicação com seu robô.</p>
            <label>Porta USB do ESP32</label>
            <input value={port} onChange={e => setPort(e.target.value)} />
            <button className="primary-btn" onClick={connectRobot}>Conectar</button>
            <div className="setting-row">
              <span>Estado da conexão</span>
              <strong>{connected ? "Online" : "Offline"}</strong>
            </div>
            <div className="setting-row">
              <span>Resolução do display</span>
              <strong>160 × 128</strong>
            </div>
            <div className="setting-row">
              <span>Protocolo</span>
              <strong>Serial USB · 115200</strong>
            </div>
          </section>
        )}

        <footer>ROVER PIXEL COMMAND <span>•</span> FEITO PARA SEU ROBÔ</footer>
      </main>
    </div>
  );
}
