import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import routes from './routes.jsx';
import { AuthProvider } from './auth.jsx';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './pages/home.jsx'

const router = createBrowserRouter(routes);

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <AuthProvider>
            <RouterProvider router = {router} />
        </AuthProvider>
    </StrictMode>
);
