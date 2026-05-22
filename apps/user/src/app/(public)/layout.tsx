import { Providers } from '../providers';
import Navbar from './components/navbar/NavBar';
// import PublicNavbar from './components/PublicNavbar';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Navbar />
      <main className="min-h-screen  bg-[var(--bg)]">
        {children}
      </main>
    </Providers>
  );
}