import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

const ProtectedRoute: React.FC<object> = () => {
  // Usando 'object'
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuth(!!user);
    });

    return () => unsubscribe();
  }, []);

  if (isAuth === null) {
    return <div>Carregando...</div>; // Ou um componente de carregamento
  }

  return isAuth ? <Outlet /> : <Navigate to='/' replace />;
};

export default ProtectedRoute;
