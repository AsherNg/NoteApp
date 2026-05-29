import { Link } from "react-router-dom";

function InputField({ id, label, type, value, setter, error, onFocus, onBlur, isFocused, example }) {
    const base = "text-black text-base p-2 w-md text-clip rounded-lg border-2 box-border outline-none";
    const state = isFocused
        ? "border-blue-500 bg-gray-300"
        : error
        ? "border-red-500 bg-red-50"
        : "border-gray-200 bg-gray-300";

    return (
        <div className="flex flex-col items-start justify-center">
            <div className="flex flex-row justify-start items-center">
                <label htmlFor={id} className="my-2 text-base font-bold">{ label }</label>
                {error && <span className="text-red-500 text-sm">{error}</span>}
            </div>
            <input
                id={id}
                type={type}
                value={value}
                onChange={(e) => setter(e.target.value)}
                onFocus={onFocus}
                onBlur={onBlur}
                className={`${base} ${state}`}
                placeholder={example}
            />
        </div>
    );
}

function Button({ text, onClick, enabled = true, type = "button", className }) {
    const base = "px-4 py-2 text-lg font-bold flex justify-center items-center rounded-lg box-border";
    const enabledStyle = "text-(--color-tertiary) bg-(--color-accent) hover:ring-4 hover:ring-green-700 active:bg-green-700 cursor-pointer";
    const disabledStyle = "text-white bg-gray-400 cursor-not-allowed opacity-60";

    return (
        <button
            className={`${base} ${enabled ? enabledStyle : disabledStyle} ${className}`}
            onClick={onClick}
            disabled={!enabled}
            type={type}
        >
            {text}
        </button>
    );
}

function Linker({ to, text, className }) {
    return (
        <Link to={to} className={`text-gray-400 text-xs hover:underline cursor-pointer ${className}`}>{text}</Link>
    )
}

export { InputField, Button, Linker };
