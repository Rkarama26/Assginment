import { ChatWidget } from "./components/ChatWidget";
import "./App.css";

function App() {
  return (
    <div className="app">
      <div className="app-content">
        <div className="hero">
          <h2>Need help?</h2>
          <p>Chat with our AI support agent for instant answers about orders, shipping, and returns.</p>
        </div>
        <ChatWidget />
      </div>
    </div>
  );
}

export default App;
