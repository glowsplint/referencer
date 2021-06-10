import React, { useState } from "react";

const LoginContext = React.createContext<Partial<Login>>({});

type Login = {
  displayName: string;
  spaceID: string;
  setDisplayName: (newDisplayName: string) => void;
};

export const LoginProvider = ({ children }) => {
  const [loginDetails, setLoginDetails] = useState({
    displayName: "user-1",
    spaceID: "space-1",
    setDisplayName: (newDisplayName: string) => {
      setLoginDetails({ ...loginDetails, displayName: newDisplayName });
    },
  });

  return (
    <LoginContext.Provider value={loginDetails}>
      {children}
    </LoginContext.Provider>
  );
};

export const useLogin = () => {
  return React.useContext(LoginContext);
};
