import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts'
import { ProtectedRoute, MainLayout } from './components'
import { Landing, Login, Register, Dashboard } from './pages'
import { List as EventsList, Create as EventCreate, Edit as EventEdit } from './pages/Events'
import { List as WidgetsList, Create as WidgetCreate, Edit as WidgetEdit } from './pages/Widgets'
import { List as ApiKeysList } from './pages/ApiKeys'

// Компонент для редиректа авторизованных пользователей с landing page
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/app/dashboard" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Публичные роуты */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <Landing />
              </PublicRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Защищённые роуты */}
          <Route
            path="/app/*"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />

            <Route path="dashboard" element={<Dashboard />} />

            {/* События */}
            <Route path="events" element={<EventsList />} />
            <Route path="events/new" element={<EventCreate />} />
            <Route path="events/:id/edit" element={<EventEdit />} />

            {/* Виджеты */}
            <Route path="widgets" element={<WidgetsList />} />
            <Route path="widgets/new" element={<WidgetCreate />} />
            <Route path="widgets/:id/edit" element={<WidgetEdit />} />

            {/* API ключи */}
            <Route path="api-keys" element={<ApiKeysList />} />
          </Route>

          {/* Редирект для старых роутов */}
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/events" element={<Navigate to="/app/events" replace />} />
          <Route path="/widgets" element={<Navigate to="/app/widgets" replace />} />
          <Route path="/api-keys" element={<Navigate to="/app/api-keys" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App
