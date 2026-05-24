import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button, InputField } from "../../components/form";
import supabase from "../../supabaseClient";

function VerifyOTP() {
    const [focusedField, setFocusedField] = useState(null);
    const [otpTry, setOTPTry] = useState('');
    const [error, setErrors] = useState({});
    const { state } = useLocation();
    const { email, name } = state;
    const [cooldown, setCooldown] =  useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        if (!state) { navigate('/register'); }
    }, []);
    
    async function validateOTP(attempt) {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: attempt,
            type: 'signup'
        });
        if (error) {
            setErrors({ otp: error.message });
        } else {
            await supabase.from('profiles').insert({
                id: data.user.id,
                name: name,
                email: email
            });
            navigate("/editor");
        }
    }

    async function resendOTP() {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email
        })
        if (error) {
            setErrors({ otp: error.message });
        } else {
            setCooldown(60);
            const interval = setInterval(() => {
                setCooldown(prev => {
                    if (prev <= 1) { clearInterval(interval); return 0; }
                    return prev - 1;
                });
            }, 1000);
        }
    }

    const handleFocus = (field) => {
        setFocusedField(field);
        setErrors({});
    }

    const handleBlur = () => setFocusedField(null);

    return (
        <div className="flex flex-col justify-start items-center w-full h-screen py-2 gap-2 bg-gray-900">
            <div className="text-2xl text-white">Verify Email Please!</div>
            <InputField 
                id="otpTry" 
                label="Type your OTP here!" 
                type="text" 
                value={otpTry} 
                setter={setOTPTry}
                onFocus={() => handleFocus("otpTry")}
                onBlur={handleBlur}
                isFocused={focusedField === "otpTry"}
            />
            {Object.keys(error).length != 0 && <div className="text-sm text-red-500">{error.otp}</div>}
            <div className="flex justify-center items-center gap-2">
                <Button 
                    text="Submit" 
                    onClick={() => validateOTP(otpTry)}
                />
                <Button 
                    text="Request OTP" 
                    onClick={resendOTP}
                    enabled={ cooldown < 1 }
                />
            </div>
        </div>
    );
}

export default VerifyOTP;
