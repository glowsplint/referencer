import { App } from "./App";
import { HubPage } from "./components/hub/HubPage";
import { ShareAcceptPage } from "./components/ShareAcceptPage";
import { TourProvider } from "./contexts/TourContext";
import { useHashRoute } from "./hooks/ui/use-hash-route";

export function AppRouter() {
  const { route, navigate } = useHashRoute();

  if (route.type === "hub") {
    return <HubPage navigate={navigate} />;
  }

  if (route.type === "share") {
    return <ShareAcceptPage code={route.code} navigate={navigate} />;
  }

  return (
    <TourProvider>
      <App workspaceId={route.workspaceId} navigate={navigate} />
    </TourProvider>
  );
}
