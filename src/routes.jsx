import Login from "./pages/login/login.jsx";
import Register from "./pages/login/register.jsx";
import Recovery from "./pages/login/recovery.jsx";
import ErrorPage from "./pages/error.jsx";
import Reset from "./pages/login/reset.jsx";
// import Main from "./pages/editor.jsx";
import { Navigate } from "react-router-dom";
import { AuthRoute, ProtectedRoute } from "./auth.jsx";

const routes = [
    { path: "/", element: <Navigate to="/register" />, errorElement: <ErrorPage /> },
    { path:"/login", element: <AuthRoute><Login /></AuthRoute>, errorElement: <ErrorPage /> },
    { path:"/register", element: <AuthRoute><Register /></AuthRoute>, errorElement: <ErrorPage />  },
    { path:"/recovery", element: <Recovery />, errorElement: <ErrorPage />  },
    { path:"/reset", element: <Reset />, errorElement: <ErrorPage />},
    //{ path:"/editor", element: <ProtectedRoute><Main /></ProtectedRoute>, errorElement: <ErrorPage /> }
    { path:"/*", element: <AuthRoute><Login /></AuthRoute>}
];

export default routes;
