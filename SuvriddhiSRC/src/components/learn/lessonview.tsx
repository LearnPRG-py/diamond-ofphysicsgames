import { useEffect, useState, useRef } from "react";
import type { LessonItem } from "../../types/learningitems";
import { Check } from "lucide-react";
import PDFViewer from "../common/PDFViewer";
import { createRoot } from "react-dom/client";
import { Unity, useUnityContext } from "react-unity-webgl";

interface LessonViewProps {
    item: LessonItem;
    onMarkComplete: () => void;
}

function isUnityLesson(contentFile: string) {
    // crude check: ends with Gxx/index.html
    return /G\d+\/index\.html$/.test(contentFile);
}

function UnityLesson({ contentFile }: { contentFile: string }) {
    const parts = contentFile.split("/");
    const buildName = parts[1];
    const base = `/data/${parts[0]}/${buildName}/`; 

    const { unityProvider } = useUnityContext({
        loaderUrl: `${base}/Build/${buildName}.loader.js`,
        dataUrl: `${base}/Build/${buildName}.data`,
        frameworkUrl: `${base}/Build/${buildName}.framework.js`,
        codeUrl: `${base}/Build/${buildName}.wasm`,
    });

    return (
        <>
            <div style={{ height: "30px" }}></div>
            <h1 style={{ color: "white", fontFamily: "Arial, sans-serif", textAlign: "center", fontSize: "24px" }}>Press R to reset block positions if needed.</h1>
            <div style={{ height: "30px" }}></div>
            <Unity unityProvider={unityProvider} style={{ width: "640px", aspectRatio: "16 / 9", marginRight: "auto", marginLeft: "auto" }} />
            <div style={{ height: "50px" }}></div>
            {/* no scrollbars in iframe */}
            <iframe src="data/topics/Calc/index.html" style={{ border: "5px #000000 none", margin: "20px auto", display: "block", name: "Calculator", scrolling: "no", frameBorder: "1", marginHeight: "10000px", marginWidth: "50px", height: "400px", width: "600px", allowFullScreen: "", overflowY: "hidden", scrollbarWidth: "none" }}></iframe>
        </>
    );
}

export default function LessonView({ item, onMarkComplete }: LessonViewProps) {
    const [html, setHtml] = useState<string | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isUnityLesson(item.contentFile)) return; // skip fetch for Unity

        fetch(`/data/${item.contentFile}`)
            .then(r => r.text())
            .then(t => {
                setHtml(t);
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
            {isUnityLesson(item.contentFile) ? (
                <UnityLesson key={item.contentFile} contentFile={item.contentFile} />
            ) : (
                <div ref={contentRef} className="max-w-none" dangerouslySetInnerHTML={{ __html: html ?? "<p>Loading...</p>" }} />
            )}

            <div className="flex items-center justify-center mt-4">
                <button onClick={onMarkComplete} className="px-4 py-3 bg-secondary text-primary-foreground rounded-3xl font-medium shadow-md hover:bg-secondary/80 transition-all">
                    <Check />
                </button>
            </div>
        </div>
    );
}