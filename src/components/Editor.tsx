import { useCodeMirror } from './useCodeMirror'

interface Props {
    value: string;
    onChange: (value: string) => void;
}

export function Editor({ value, onChange }: Props) {
    const ref = useCodeMirror({ doc: value, onChange });

    return (
        <div ref={ref} className="h-screen text-left" />
    );
}