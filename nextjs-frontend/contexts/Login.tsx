import React, { SetStateAction, useState } from "react";

interface Login {
  displayName: string;
  spaceID: string;
}

type SetLogin = React.Dispatch<SetStateAction<Login>>;

const baseLogin = {
  displayName: "user-1",
  spaceID: "space-1",
};

const LoginContext = React.createContext<{
  login: Login;
  setLogin: SetLogin;
}>({
  login: baseLogin,
  setLogin: () => {},
});

const LoginProvider = ({ children }: { children: React.ReactNode }) => {
  const [login, setLogin] = useState(baseLogin);

  return (
    <LoginContext.Provider value={{ login, setLogin }}>
      {children}
    </LoginContext.Provider>
  );
};

const useLogin = () => {
  return React.useContext(LoginContext);
};

export type { SetLogin };
export { LoginProvider, useLogin };
