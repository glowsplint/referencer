import { App } from "./App";
import { HubPage } from "./components/hub/HubPage";
import { useHashRoute } from "./hooks/use-hash-route";

export function AppRouter() {
  const { route, navigate } = useHashRoute();

  if (route.type === "hub") {
    return <HubPage navigate={navigate} />;
  }

  return <App workspaceId={route.workspaceId} readOnly={route.readOnly} navigate={navigate} />;
}
