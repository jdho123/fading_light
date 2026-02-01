
import './App.css'
import Crystal from './components/crystal';

function App() {

  return (
    <main className="relative flex items-center justify-center min-h-screen bg-slate-950 overflow-hidden">
      {/* Ominous Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      
      {/* The Crystal */}
      <Crystal />
    </main>
  );
}

export default App
