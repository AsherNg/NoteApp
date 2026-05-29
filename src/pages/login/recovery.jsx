import { useState } from 'react';
import supabase from './../../supabaseClient.jsx';
import { InputField, Button } from '../../components/form.jsx';
import { useNavigate } from 'react-router-dom';

function Recovery() {
    const [email, setEmail] = useState('');
    const [focused, setFocused] = useState(false);
    const [error, setError] = useState({});

    const handleFocus = () => {
        setFocused(true);
        setError({});
    }
    const handleBlur = () => {
        setFocused(false);
    }

    const validateEmail = () => {
        let e = {};
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+/.test(email)) {
            e.email = "Invalid E-mail";
            setError(e);
        }
    }

    async function submitEmail(e) {
        e.preventDefault();
        validateEmail();
        if (!error.email) {
            const { data, err } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'http://localhost:5173/reset'
            });
            if (err) {
                setError({ email: err.message });
            }
        }
    }

    const navigate = useNavigate();

    return(
        <div className="flex flex-col items-center justify-start gap-2 bg-gray-900 h-screen w-full">
            <div className="text-2xl text-white">Forgot Password?</div>
            <InputField
                id="email"
                label="Recovery E-mail"
                type="email"
                value={email}
                setter={setEmail}
                error={!!error.email}
                isFocused={focused}
                onFocus={() => handleFocus()}
                onBlur={handleBlur}
            />
            <div className="flex justify-center items-center gap-2">
            <Button text="Reset!" type="button" enabled={!error.email} onClick={submitEmail} />
            <Button text="Back to Login" type="button" enabled={true} onClick={() => navigate('/login')} />
            </div>
        </div>
    )
}

export default Recovery;
