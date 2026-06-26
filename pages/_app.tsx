import type { AppProps } from "next/app";
import { AuthProvider, useAuth } from "../src/contexts/AuthContext";
import { ImpersonationBanner } from "../src/components/ImpersonationBanner";
import "../src/styles.css";

// Renders the global impersonation banner and pushes page content down so the
// fixed banner never overlaps it. Must live INSIDE AuthProvider to read state.
function AppShell({ Component, pageProps }: AppProps) {
  const { isImpersonating } = useAuth();
  return (
    <>
      <ImpersonationBanner />
      <div style={isImpersonating ? { paddingTop: 44 } : undefined}>
        <Component {...pageProps} />
      </div>
    </>
  );
}

export default function MyApp(props: AppProps) {
  return (
    <AuthProvider>
      <AppShell {...props} />
    </AuthProvider>
  );
}
