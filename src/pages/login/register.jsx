import { useState } from 'react';
import { InputField, Button, Linker } from "./../../components/form.jsx";
import supabase from "./../../supabaseClient.jsx"
import aginoteLogo from './../../assets/aginoteLogo.png';
import { useNavigate } from 'react-router-dom';

// --- Password criteria helpers ---
const criteria = (password) => ({
    isLengthValid: password.length >= 8,
    hasUpper:      /[A-Z]/.test(password),
    hasLower:      /[a-z]/.test(password),
    hasDigit:      /\d/.test(password),
    hasSpecial:    /[^a-zA-Z0-9]/.test(password), // broader special char check
});

function PasswordCriteria({ password }) {
    const { isLengthValid, hasUpper, hasLower, hasDigit, hasSpecial } = criteria(password);

    const item = (label, met) => (
        <li className={`text-base ${met ? "text-green-500" : "text-gray-400"}`}>
            ✓ {label}
        </li>
    );

    return (
        <ul className="flex flex-wrap justify-around list-none gap-2">
            {item("Min 8 Characters", isLengthValid)}
            {item("Uppercase Letter",  hasUpper)}
            {item("Lowercase Letter",  hasLower)}
            {item("Special Character", hasSpecial)}
            {item("Numeric Digit",     hasDigit)}
        </ul>
    );
}

function Register() {
    const [name,        setName]        = useState('');
    const [email,       setEmail]       = useState('');
    const [password,    setPassword]    = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [errors,      setErrors]      = useState({});
    const [focusedField, setFocusedField] = useState(null);

    const { isLengthValid, hasUpper, hasLower, hasDigit, hasSpecial } = criteria(password);
    const isPasswordSecure = isLengthValid && hasUpper && hasLower && hasDigit && hasSpecial;

    // --- Handlers ---
    const handleFocus = (field) => {
        setFocusedField(field);
        setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    };

    const handleBlur = () => setFocusedField(null);

    const handleGoogleSignIn = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: 'http://localhost:5173' },
            });
            if (error) throw error;
        } catch (err) {
            alert("Authentication failed: " + err.message);
        }
    };

    const handleGitHubSignIn = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: { redirectTo: 'http://localhost:5173' },
            });
            if (error) throw error;
        } catch (err) {
            alert("Authentication failed: " + err.message);
        }
    };

    // --- Validation ---
    function buildErrors() {
        const e = {};
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email       = "Invalid Email";
        if (!name.trim())                                e.name        = "Invalid Name";
        if (!isPasswordSecure)                           e.password        = "Invalid Password";
        if (password !== confirmPass)                    e.confirmPass = "Cannot confirm!";
        return e;
    }

    const navigate = useNavigate();

    async function validateForm(e) {
        e.preventDefault(); // fixed: was missing ()
        const newErrors = buildErrors();
        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            const { data, error } = await supabase.auth.signUp({ email, password, 
                options: { data: { name } } });
            if (error) {
                setErrors({ email: error.message });
            } else if (!data.user) {
                setErrors({ email: "Already registered E-mail" });
            } else {
                navigate('/verify', { state: { email } });
            }
        }
    }

    const isFormClean = Object.keys(errors).length === 0;

    // --- Render ---
    return (
        <div className="flex flex-col justify-center items-center gap-2 w-full h-screen overflow-hidden bg-gray-900">
            <img src={aginoteLogo} className="rounded-lg aspect-square w-xs" alt="AgiNote Logo" />

            <PasswordCriteria password={password} />

            <form onSubmit={validateForm} noValidate className="flex flex-col justify-center items-start mx-4 border-box self-stretch border-b-2">
                <div className="flex flex-wrap justify-around content-around gap-2">
                    {[
                        { id: "name", label: "Name", type: "text", value: name, setter: setName },
                        { id: "email", label: "E-mail", type: "email", value: email, setter: setEmail },
                        { id: "password", label: "Password", type: "password", value: password, setter: setPassword },
                        { id: "confirmPass", label: "Confirm Password", type: "password", value: confirmPass, setter: setConfirmPass },
                    ].map(({ id, label, type, value, setter }) => (
                        <InputField
                            id={id}
                            label={label}
                            type={type}
                            value={value}
                            setter={setter}
                            error={errors[id]}
                            isFocused={focusedField === id}
                            onFocus={() => handleFocus(id)}
                            onBlur={handleBlur}
                        />
                    ))}
                </div>

                <div className="flex flex-col items-start justify-center gap-1 mt-4 ml-4 pb-1">
                    <Button text="Register!" type="submit" enabled={isFormClean} />
                    <Linker to="/login" text="Already Have An Account?"/>
                </div>
            </form>

            <div className="flex flex-row justify-around items-center gap-2 m-2">
                <Button text="Sign In With Google" onClick={handleGoogleSignIn} enabled={true} />
                <Button text="Sign In With Github" onClick={handleGitHubSignIn} enabled={true} />
            </div>
        </div>
    );
}

export default Register;
