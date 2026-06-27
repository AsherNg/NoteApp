import { useState } from 'react';
import supabase from './../../supabaseClient.jsx';
import { InputField, Button, Linker } from '../../components/form.jsx';
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
            return false;
        }
        return true;
    }

    async function submitEmail() {
        if (validateEmail()) {
            const { data, err } = await supabase.auth.resetPasswordForEmail(email);
            if (err) setError({ email: err.message });
            else navigate('/verify', { state: { mode: 'reset', email } });
        }
    }

    const navigate = useNavigate();

    return(
        <div className="flex flex-col items-center justify-center gap-2 bg-(--color-bg) text-(--color-text) h-screen w-screen">
            <span className="text-4xl font-bold">Recover Your Password</span>
            <span className="m-2">Please enter your recovery email</span>
            <InputField
                id="email"
                label=""
                type="email"
                value={email}
                setter={setEmail}
                error={!!error.email}
                isFocused={focused}
                onFocus={() => handleFocus()}
                onBlur={handleBlur}
            />
            <div className="flex flex-col justify-center items-center gap-2">
                <Button className="w-md my-2" text="Reset!" type="button" enabled={!error.email} onClick={submitEmail} />
                <Linker to="/login" text="Return to login?"/>
            </div>
        </div>
    )
}

export default Recovery;
