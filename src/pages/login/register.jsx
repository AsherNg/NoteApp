import { useState } from 'react';
import { InputField, Button, Linker } from "./../../components/form.jsx";
import supabase from "./../../supabaseClient.jsx"
import aginoteLogoOnly from './../../assets/aginoteLogoOnly.png';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from "react-icons/fc";
import { ImGithub } from "react-icons/im";

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
                if (error?.message.includes('Email not confirmed')) {
                    // resend OTP and send to verify
                    await supabase.auth.resend({ type: 'signup', email });
                    navigate('/verify', { state: { email, name } });
                }
                else { setErrors({ email: error.message }); }
            } else if (data?.user && data.user.identities && data.user.identities.length === 0) {
                setErrors({ email: "Already registered E-mail" });
            } else {
                navigate('/verify', { state: { email, name } });
            }
        }
    }

    const isFormClean = Object.keys(errors).length === 0;

    // --- Render ---
    return (
        <div className="flex flex-col justify-center w-screen h-screen bg-(--color-bg) text-(--color-hover) overflow-hidden">
            <div className="flex flex-col items-center">
                <span className="text-2xl font-semibold my-4">Register</span>
                <form onSubmit={validateForm} noValidate className="flex flex-col justify-center items-center mx-4">
                    <div className="flex flex-col justify-center items-center w-full">
                        {[
                            { id: "name", label: "Name", type: "text", value: name, setter: setName, example: "John Doe" },
                            { id: "email", label: "E-mail", type: "email", value: email, setter: setEmail, example: "email@domain.com" },
                            { id: "password", label: "Password", type: "password", value: password, setter: setPassword },
                            { id: "confirmPass", label: "Confirm Password", type: "password", value: confirmPass, setter: setConfirmPass }
                        ].map(({ id, label, type, value, setter, example }) => (
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
                                    example={example}
                                />
                        ))}
                        <div className="w-md my-2">
                            <PasswordCriteria password={password} />
                        </div>
                        <Button className="my-4 w-md" text="Register" type="submit" enabled={isFormClean} />
                    </div>

                    <div className="flex flex-row w-md justify-center">
                        <Linker to="/login" text="Already Have An Account?"/>
                    </div>
                </form>
            </div>

            <div className="flex flex-col items-center justify-center">
                            <div className="flex flex-row items-center justify-center w-md my-2">
                                <hr className="w-2/7"/>
                                <span className="mx-4 text-base">or continue with</span>
                                <hr className="w-2/7"/>
                            </div>
                            <div className="flex flex-row w-md items-center justify-center">
                                <Button className="mx-4 w-20" text={<FcGoogle /> } onClick={handleGoogleSignIn} enabled={true}/>
                                <Button className="mx-4 w-20" text={<ImGithub />} onClick={handleGitHubSignIn} enabled={true}/>
                            </div>
                        </div> 
        </div>
    );
}

export default Register;
