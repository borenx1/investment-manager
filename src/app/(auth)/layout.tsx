export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="h-full">
      <div className="p-4 sm:p-8">{children}</div>
    </main>
  );
}
