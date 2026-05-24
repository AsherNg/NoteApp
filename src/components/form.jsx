function InputField({ id, label, type, value, setter, error, onFocus, onBlur, isFocused }) {
    const base = "text-black text-lg p-4 w-md text-clip rounded-lg border-2 box-border outline-none";
    const state = isFocused
        ? "border-blue-500 bg-gray-300"
        : error
        ? "border-red-500 bg-red-50"
        : "border-gray-200 bg-gray-300";

    return (
        <div className="flex flex-col items-start justify-center">
            <label htmlFor={id} className="text-gray-300 text-base">{label}</label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={(e) => setter(e.target.value)}
                onFocus={onFocus}
                onBlur={onBlur}
                className={`${base} ${state}`}
            />
        </div>
    );
}

function Button({ text, onClick, enabled = true, type = "button" }) {
    const base = "px-4 py-2 text-lg font-bold flex justify-center items-center rounded-lg box-border";
    const enabledStyle = "text-white bg-green-500 hover:ring-4 hover:ring-green-700 active:bg-green-700 cursor-pointer";
    const disabledStyle = "text-white bg-gray-400 cursor-not-allowed opacity-60";

    return (
        <button
            className={`${base} ${enabled ? enabledStyle : disabledStyle}`}
            onClick={onClick}
            disabled={!enabled}
            type={type}
        >
            {text}
        </button>
    );
}

export { InputField, Button };
