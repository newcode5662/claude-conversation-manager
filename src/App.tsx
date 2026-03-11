import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { SessionDetail } from './components/session/SessionDetail';
import { StatsDashboard } from './components/stats/StatsDashboard';
import { FileImport } from './components/common/FileImport';
import { useSessionStore } from './stores/sessionStore';

function App() {
  const { viewMode } = useSessionStore();

  return (
    <div className="min-h-screen bg-claude-50">
      <Header />

      <div className="flex">
        {viewMode === 'list' && <Sidebar />}

        <main className="flex-1">
          {viewMode === 'list' ? <SessionDetail /> : <StatsDashboard />}
        </main>
      </div>

      <FileImport />
    </div>
  );
}

export default App;
