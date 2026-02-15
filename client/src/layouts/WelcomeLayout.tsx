import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function WelcomeLayout() {
  return (
    <>
      <main>
        <Outlet />
      </main>
    </>
  );
}
