import { useEffect, useState, useRef } from "react";
import type { LessonItem } from "../../types/learningitems";
import { Check } from "lucide-react";
import PDFViewer from "../common/PDFViewer";
import { createRoot } from "react-dom/client";

interface LessonViewProps {
    item: LessonItem;
    onMarkComplete: () => void;
}

export default function LessonView({ item, onMarkComplete }: LessonViewProps) {
    const [html, setHtml] = useState<string | null>(null);

    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch(`/data/${item.contentFile}`)
            .then(r => r.text())
            .then(t => {
                setHtml(t);
                // After setting HTML, process any PDF viewer elements
                setTimeout(() => {
                    if (contentRef.current) {
                        const pdfElements = contentRef.current.getElementsByClassName('pdf-viewer');
                        Array.from(pdfElements).forEach((elem) => {
                            const pdfPath = elem.getAttribute('data-pdf');
                            if (pdfPath) {
                                const container = document.createElement('div');
                                elem.parentNode?.replaceChild(container, elem);
                                const root = createRoot(container);
                                root.render(<PDFViewer file={pdfPath} />);
                            }
                        });
                    }
                }, 0);
            })
            .catch(() => setHtml("<p>Unable to load content.</p>"));
    }, [item.contentFile]);


    return (
        <div className="grow p-6">
            {/* <div className="relative">
                <h2 className="absolute left-1/2 transform -translate-x-2/3 text-3xl font-semibold">{item.title}</h2>
            </div> */}
            {/* <h2 className="text-2xl text-center -ml-[calc((100vw-100%)/2)] font-bold mb-4"></h2> */}


            {/* Include title with html file for now. Later make it standardized here */}
            <div ref={contentRef} className="max-w-none" dangerouslySetInnerHTML={{ __html: html ?? "<p>Loading...</p>" }} />


            <div className="flex items-center justify-center">
                <button onClick={onMarkComplete} className="px-4 py-3 bg-secondary text-primary-foreground rounded-3xl font-medium shadow-md hover:bg-secondary/80 transition-all"><Check /></button>
            </div>
        </div>
    );
}