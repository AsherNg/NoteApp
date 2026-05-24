import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from "./supabaseClient.jsx";
import Loading from "./pages/loading.jsx";
import { Navigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => setUser(session?.user ?? null)
        );
        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

export function ProtectedRoute({ children }) {
    const [user, loading] = useAuth();
    if (loading) return <Loading />;
    return user ? children : <Navigate to="/login" />;
}

export function AuthRoute({ children }) {
    const [user, loading] = useAuth();
    if (loading) return <Loading />;
    return user ? <Navigate to="/editor"/> : children;
}
