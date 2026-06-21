//import { getEditorContents } from "./Editor";
import { marked } from "marked";

const PrintPreview = ({ markdown }) => {
    //const markdown = getEditorContents();
    const html = marked.parse(markdown);
    console.log("Html: ", html);

    return (
        <div className="bg-white aspect-[1/1.414] h-[65%] p-3 text-[8px] text-black overflow-hidden" dangerouslySetInnerHTML={{ __html: html }}/>
    )
}

export default PrintPreview;