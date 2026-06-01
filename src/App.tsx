import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PlanningProvider } from './context/PlanningContext';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
import { PlannerPage } from './pages/PlannerPage';
import { HistoryPage } from './pages/HistoryPage';
import CollabPage from './pages/CollabPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 家人协同页：独立路由，无需 PlanningProvider */}
        <Route path="collab" element={<CollabPage />} />

        {/* 主应用路由 */}
        <Route element={
          <PlanningProvider>
            <AppShell />
          </PlanningProvider>
        }>
          <Route index element={<HomePage />} />
          <Route path="planner" element={<PlannerPage />} />
          <Route path="history" element={<HistoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
