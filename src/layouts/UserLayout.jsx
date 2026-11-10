import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/user/Header';
import Footer from '../components/user/Footer';

function UserLayout() {
  return (
    <>
      <Header />
      {/* Main Content Area */}
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default UserLayout;
