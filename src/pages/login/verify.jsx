import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import supabase from "./../../supabaseClient.jsx";
import { InputField, Button } from '../../components/form';

function Verify() {
    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email || "";

    useEffect(() => {
        if (!email) navigate('/register');
    }, []);

    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [focused, setFocused] = useState(false);
    const [resend, setResend] = useState(true);

    async function handleVerify(e) {
        e.preventDefault();
        setError('');

        const { data, error: verifyError } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'signup'
        });
        if (verifyError) {
            setError(verifyError.message);
        } else if (data.session) {
            navigate('/editor');
        }
    }

    function handleFocus() {
        setFocused(true);
        setError('');
    }

    function handleBlur() {
        setFocused(false);
    }

    async function resendOTP() {
        setResend(false);
        let timer = 60;
        await supabase.auth.resend({ type: 'signup', email })
        const interval = setInterval(() => {
            timer -= 1;
            if (timer <= 0) clearInterval(interval);
        }, 1000);
        setResend(true);
    }

    return (
        <div className="flex flex-col justify-start items-center gap-2 h-screen w-full bg-gray-900">
            <div className="text-2xl text-gray-400">Please verify your email!</div>
            <InputField
                id="verify"
                label="Verify Email"
                type="text"
                value={token}
                setter={setToken}
                error={error}
                isFocused={focused}
                onFocus={handleFocus}
                onBlur={handleBlur}
            />
            <Button text={resend ? "Resent!" : "Resend OTP"} onClick={resendOTP} enabled={resend} />
            <Button text="Verify" onClick={handleVerify} enabled={!error} />
        </div>
    );
}

export default Verify;
