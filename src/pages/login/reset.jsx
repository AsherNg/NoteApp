import { useEffect, useState } from 'react';
import supabase from '../../supabaseClient';
import { InputField, Button } from './../../components/form.jsx';
import Loading from '../loading.jsx';
import { useNavigate } from "react-router-dom";

const criteria = (password) => ({
    isLengthValid: {text: "Min 8 Character", test: password.length >= 8},
    specialChar: {text: "Special Character", test: /[^A-Za-z0-9]/.test(password)},
    upperChar: {text: "Uppercase", test: /[A-Z]/.test(password)},
    lowerChar: {text: "Lowercase", test: /[a-z]/.test(password)},
    digit: {text: "Digit", test: /\d/.test(password)}
});

function Reset() {
    const [password, setPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [focusedField, setFocusedField] = useState(null);
    const [error, setError] = useState('');

    const check = criteria(password);
    const isPasswordSecure = Object.keys(check).reduce((acc, key) => acc && check[key].test, true)

    function passwordCriteria() {
        return(
            <ul className="flex flex-row justify-around items-center list-none gap-2">
                {Object.keys(check).map((key) => (
                    <li key={key} className={`text-base ${check[key].test ? "text-green-500" : "text-gray-400"}`}> 
                        ✓ {check[key].text} 
                    </li>
                ))}
            </ul>
        )
    }

    const handleFocus = (id) => { setFocusedField(id); setError(null); }
    const handleBlur = () => setFocusedField(null);
    const navigate = useNavigate()

    async function validateSubmission(e) {
        e.preventDefault();
        if (confirmPass != password) setError("Invalid Confirmation!");
        else {
            const { error: err } = await supabase.auth.updateUser({
                password: password
            });
            if (err) {
                setError(err.message);
            } else {
                navigate('/login');
            }
        }
    }

    return (
        <div className="flex flex-col justify-start items-center gap-2 bg-gray-900 w-screen h-screen">
            <div className="text-2xl text-gray-500">Reset Password</div>
            {passwordCriteria()}
            <div className="flex flex-col gap-2 items-start justify-center">
                <div className="flex flex-row gap-2 justify-center items-center">
                    <InputField
                        id="password"
                        label="New Password"
                        type="password"
                        value={password}
                        setter={setPassword}
                        error={error}
                        isFocused={focusedField === "password"}
                        onFocus={() => handleFocus("password")}
                        onBlur={handleBlur}
                    />
                    <InputField
                        id="confirmPass"
                        label="Confirm Password"
                        type="password"
                        value={confirmPass}
                        setter={setConfirmPass}
                        error={error}
                        isFocused={focusedField === "confirmPass"}
                        onFocus={() => handleFocus("confirmPass")}
                        onBlur={handleBlur}
                    />
                </div>
                <Button text="Submit!" onClick={validateSubmission} enabled={!error && isPasswordSecure} />
            </div>
        </div>
    )
}

export default Reset;
