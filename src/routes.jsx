import Login from "./pages/login/login.jsx";
import Register from "./pages/login/register.jsx";
import Recovery from "./pages/login/recovery.jsx";
import VerifyOTP from "./pages/login/verifyOTP.jsx";
import ErrorPage from "./pages/error.jsx";
import Main from "./pages/editor.jsx";
import { Navigate } from "react-router-dom";
import { AuthRoute, ProtectedRoute } from "./auth.jsx";

const routes = [
    { path: "/", element: <Navigate to="/login" />, errorElement: <ErrorPage /> },
    { path:"/login", element: <AuthRoute><Login /></AuthRoute>, errorElement: <ErrorPage /> },
    { path:"/register", element: <AuthRoute><Register /></AuthRoute>, errorElement: <ErrorPage />  },
    { path:"/recovery", element: <AuthRoute><Recovery /></AuthRoute>, errorElement: <ErrorPage />  },
    { path:"/verify", element: <AuthRoute><VerifyOTP /></AuthRoute>, errorElement: <ErrorPage />  },
    { path:"/editor", element: <ProtectedRoute><Main /></ProtectedRoute>, errorElement: <ErrorPage /> }
];

export default routes;
