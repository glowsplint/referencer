import { App } from "./App";
import { HubPage } from "./components/hub/HubPage";
import { TourProvider } from "./contexts/TourContext";
import { useHashRoute } from "./hooks/ui/use-hash-route";

export function AppRouter() {
  const { route, navigate } = useHashRoute();

  if (route.type === "hub") {
    return <HubPage navigate={navigate} />;
  }

  return (
    <TourProvider>
      <App workspaceId={route.workspaceId} navigate={navigate} />
    </TourProvider>
  );
}
