import { Navbar } from "@/components/ui/navbar";
import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-jetbrains-mono",
	display: "swap",
});

export const metadata: Metadata = {
	title: "DevRoast",
	description: "Paste your code. Get roasted.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="pt-BR" className={jetbrainsMono.variable}>
			<body className="min-h-screen bg-bg-page flex flex-col">
				<Navbar.Root>
					<Navbar.Logo />
					<Navbar.Spacer />
					<Navbar.Link href="/leaderboard">leaderboard</Navbar.Link>
				</Navbar.Root>
				{children}
			</body>
		</html>
	);
}
