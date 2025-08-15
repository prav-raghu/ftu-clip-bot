import React, { useState } from 'react';
import Mascot from './components/Mascot';
import Chat from './components/Chat';
import Settings from './components/Settings';

export default function App() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="window">
      <div className="titlebar">
        <span>FTU Clip Bot</span>
        <div className="actions">
          <button className="btn" onClick={() => window.close()}>×</button>
          <button className="btn" onClick={() => setShowSettings(s => !s)}>⚙️</button>
        </div>
      </div>
      <div className="content">
        <Mascot onDoubleClick={() => setShowSettings(s => !s)} />
        {showSettings ? <Settings onClose={() => setShowSettings(false)} /> : <Chat />}
      </div>
    </div>
  );
}
