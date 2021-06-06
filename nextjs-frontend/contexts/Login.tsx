import React, { useContext, useState } from "react";

const Login = React.createContext({
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

  return <Login.Provider value={loginDetails}>{children}</Login.Provider>;
};

export const useLogin = () => {
  return React.useContext(Login);
};
