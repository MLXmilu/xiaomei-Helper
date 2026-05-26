import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PlanningProvider } from './context/PlanningContext';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
import { PlannerPage } from './pages/PlannerPage';
import { HistoryPage } from './pages/HistoryPage';

export default function App() {
  return (
    <PlanningProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="planner" element={<PlannerPage />} />
            <Route path="history" element={<HistoryPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PlanningProvider>
  );
}
