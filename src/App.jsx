import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import IntroSplash from './components/IntroSplash';
import Dashboard from './pages/Dashboard';
import Suche from './pages/Suche';
import Leads from './pages/Leads';
import Einstellungen from './pages/Einstellungen';
import Vorlagen from './pages/Vorlagen';
import Rechnungen from './pages/Rechnungen';
import Anfragen from './pages/Anfragen';

function App() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <>
      {showIntro && <IntroSplash onDone={() => setShowIntro(false)} />}
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="suche" element={<Suche />} />
          <Route path="leads" element={<Leads />} />
          <Route path="vorlagen" element={<Vorlagen />} />
          <Route path="rechnungen" element={<Rechnungen />} />
          <Route path="anfragen" element={<Anfragen />} />
          <Route path="einstellungen" element={<Einstellungen />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
