import React, { useState } from "react";
import { Login, SetLogin } from "../common/types";

const defaultLogin = {
  displayName: "user-1",
  spaceID: "space-1",
};

const LoginContext = React.createContext<{
  login: Login;
  setLogin: SetLogin;
}>({
  login: defaultLogin,
  setLogin: () => {},
});

const LoginProvider = ({ children }: { children: React.ReactNode }) => {
  const [login, setLogin] = useState(defaultLogin);

  return (
    <LoginContext.Provider value={{ login, setLogin }}>
      {children}
    </LoginContext.Provider>
  );
};

const useLogin = () => {
  return React.useContext(LoginContext);
};

export { LoginProvider, useLogin };
