import React, { useState } from "react";

const LoginContext = React.createContext({
  displayName: "",
  spaceID: "",
  setDisplayName: (_: string) => {},
});

export const LoginProvider = ({ children }) => {
  const setDisplayName = (newDisplayName: string) => {
    setLoginDetails({ ...loginDetails, displayName: newDisplayName });
  };

  const [loginDetails, setLoginDetails] = useState({
    displayName: "user-1",
    spaceID: "space-1",
    setDisplayName: setDisplayName,
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
