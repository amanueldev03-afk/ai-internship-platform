import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from '@/store'
import AppRoutes from '@/routes'
import { ThemeProvider } from '@/contexts/ThemeContext'

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  )
}
