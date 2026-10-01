import { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { MonumentsPage, type MonumentData } from './components/MonumentsPage';
import { MonumentExperiencePage } from './components/MonumentExperiencePage';
import { PaintingsPage } from './components/PaintingsPage';

type View = 'landing' | 'monuments' | 'experience' | 'paintings';

export function App() {
  const [view, setView] = useState<View>('landing');
  const [selectedMonument, setSelectedMonument] = useState<MonumentData | null>(null);

  const handleLandingSelect = (choice: 'monuments' | 'paintings') => {
    setView(choice);
  };

  const handleSelectMonument = (monument: MonumentData) => {
    setSelectedMonument(monument);
    setView('experience');
  };

  return (
    <>
      {view === 'landing' && (
        <LandingPage onSelect={handleLandingSelect} />
      )}

      {view === 'monuments' && (
        <MonumentsPage
          onBack={() => setView('landing')}
          onSelectMonument={handleSelectMonument}
        />
      )}

      {view === 'experience' && selectedMonument && (
        <MonumentExperiencePage
          monument={selectedMonument}
          onBack={() => setView('monuments')}
        />
      )}

      {view === 'paintings' && (
        <PaintingsPage onBack={() => setView('landing')} />
      )}
    </>
  );
}

export default App;
