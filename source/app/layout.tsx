import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"커리어캐쳐 | 나의 경험으로 쓰는 자기소개서",description:"나의 Gemini API로 기업·직무를 분석하고 경험 기반 자기소개서 초안을 만드세요.",manifest:"/manifest.webmanifest",appleWebApp:{capable:true,title:"커리어캐쳐",statusBarStyle:"default"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ko"><body>{children}</body></html>}
