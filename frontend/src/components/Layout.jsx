// Layout.jsx
import { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children, title }) {
  useEffect(() => {
    document.title = title ? title + " | Mathi's Secret Organics" : "Mathi's Secret Organics";
  }, [title]);
  return (
    <div>
      <Navbar />
      <main className="page-main">{children}</main>
      <Footer />
    </div>
  );
}