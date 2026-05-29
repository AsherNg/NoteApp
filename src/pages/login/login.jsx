import { useState } from "react";
import supabase from "./../../supabaseClient.jsx";
import aginoteLogoOnly from "./../../assets/aginoteLogoOnly.png";
import { InputField, Button, Linker } from "../../components/form.jsx";
import { FcGoogle } from "react-icons/fc";
import { ImGithub } from "react-icons/im";

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

    async function validateCredentials(e) {
        e.preventDefault();
        let currErr = {};
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        if (error) {
            currErr.err = error.message;
            setErrors(currErr);
        } else if (!data.user) {
            currErr.err = "Wrong email or password!";
            setErrors(currErr);
        } else if (error?.message.includes('Email not confirmed')) {
            // resend OTP and send to verify
            await supabase.auth.resend({ type: 'signup', email });
            navigate('/verify', { state: { email, name } });
        } else {
            navigate("/editor");
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
        <div className="w-screen h-screen flex flex-col text-(--color-hover) bg-(--color-bg) justify-center">
            <div className="flex flex-col items-center mb-10">
                <img src={aginoteLogoOnly} alt="AgiNote Logo" className="w-32 h-32 my-2"/>
                <span className="text-4xl font-bold">AgiNote</span>
            </div>
            
            <div className="flex flex-col items-center">
                <span className="text-2xl font-semibold my-4">Login</span>

                <form noValidate onSubmit={validateCredentials} className="flex flex-wrap justify-center items-start mx-4">
                    <div className="flex flex-col items-center w-full">
                        {[
                            { id: "email", label: "Email", type: "email", value: email, setter: setEmail, example: "email@domain.com" },
                            { id: "password", label: "Password", type: "password", value: password, setter: setPassword, example: "Enter your password" }
                        ].map(({ id, label, type, value, setter, example }) => (
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
                                example={example}
                            />
                        ))}

                        <Button className="my-4 w-md" text="Login" type="submit" enabled={isFormClean()} />
                    </div>
                    <div className="flex flex-row w-md justify-between px-4">
                        <Linker to="/register" text="Don't have an account?" />
                        <Linker to="/recovery" text="Forget password?" />
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
    )
}

export default Login;
