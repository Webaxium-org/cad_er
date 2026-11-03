import { createContext, useContext } from "react";
export const PdfExportContext = createContext(null);
export const usePdfExports = () => useContext(PdfExportContext);
