import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import supabase from "./../../supabaseClient.jsx";
import { InputField, Button } from '../../components/form';
import Loading from '../loading.jsx';

function Verify() {
    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email || "";

    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [focused, setFocused] = useState(false);

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
            <Button text="Verify" onClick={handleVerify} enabled={!error} />
        </div>
    );
}

export default Verify;
