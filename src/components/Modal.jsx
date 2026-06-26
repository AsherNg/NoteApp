import { useEffect, useRef } from "react";


const Modal = ({ children, isOpen, setOpen }) => {
    const menuRef = useRef(null);
    useEffect(() => {
        const clickAway = (e) => {
            if (menuRef.current && menuRef.current === e.target) setOpen(false);
        }
        document.addEventListener("mousedown", clickAway);
        return () => document.removeEventListener("mousedown", clickAway);
    }, [])

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';      
        }
        return () => {document.body.style.overflow = '';};
    }, [isOpen]);

    if (!isOpen) return null;
    
    return (
        <div ref={menuRef} className=" z-20 flex justify-center items-center fixed w-screen h-screen bg-black/70">
            {children}
        </div>
    )
}

export default Modal;
