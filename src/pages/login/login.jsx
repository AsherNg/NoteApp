import { useState } from "react";
import supabase from "./../../supabaseClient.jsx";
import aginoteLogo from "./../../assets/aginoteLogo.png";
import { InputField, Button, Linker } from "../../components/form.jsx";

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [focusedField, setFocusedField] = useState(null);

    const handleFocus = (id) => {
        setFocusedField(id);
        setErrors({});
    }

    const handleBlur = () => setFocusedField(null);

    async function validateCredentials() {
        let currErr = {};
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        if (error) {
            currErr.err = error.message;
            setErrors(currErr.err);
        } else if (!data.user) {
            currErr.err = "Wrong email or password!";
            setErrors(currErr.err);
        } else {
            navigate("/editor", { state: { user } });
        }
    }

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

    const isFormClean = () => Object.keys(errors).length === 0;

    return (
        <div className="flex flex-col justify-center items-center gap-2 w-full h-screen overflow-hidden bg-gray-900">
            <img src={aginoteLogo} className="rounded-lg aspect-square w-xs" alt="AgiNote Logo" />
            <form noValidate className="flex flex-wrap justify-center items-start mx-4 border-box self-stretch border-b-2">
                <div className="flex flex-wrap justify-around content-around gap-2">
                    {[
                        { id: "email", label: "E-mail", type: "email", value: email, setter: setEmail },
                        { id: "password", label: "Password", type: "password", value: password, setter: setPassword }
                    ].map(({ id, label, type, value, setter }) => (
                        <InputField
                            id={id}
                            label={label}
                            type={type}
                            value={value}
                            setter={setter}
                            error={false}
                            isFocused={focusedField === id}
                            onFocus={() => handleFocus(id)}
                            onBlur={handleBlur}
                        />
                    ))}
                </div>
                <div className="flex flex-col items-start justify-center gap-1 mt-4 ml-4 pb-1">
                    <Button text="Login!" type="submit" enabled={isFormClean} />
                    <Linker to="/register" text="Don't have an account?" />
                </div>
            </form>
            <div className="flex flex-row justify-center items-start gap-2">
                <Button text="Sign In With Google" onClick={handleGoogleSignIn} enabled={true}/>
                <Button text="Sign In With Github" onClick={handleGitHubSignIn} enabled={true}/>
            </div>
        </div>
    )
}

export default Login;
