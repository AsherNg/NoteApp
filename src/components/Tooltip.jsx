const Tooltip = ({ children, text }) => {
    return (
        <div className="relative group">
            {children}
            <div className="absolute top-[40%] left-[100%] rotate-45 bg-(--color-secondary) border-l-1 border-b-1 border-(--color-tertiary) h-3 w-3 invisible group-hover:visible z-2"></div>
            <span className="absolute top-[20%] left-[110%] text-(--color-text) bg-(--color-secondary) py-1 px-2 border-1 border-(--color-tertiary) rounded-lg z-1 invisible group-hover:visible">{text}</span>
        </div>
    );
}

export default Tooltip;