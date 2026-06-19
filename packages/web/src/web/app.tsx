import { Route, Switch } from "wouter";
import Index from "./pages/index";
import AdminPage from "./pages/admin";
import { Provider } from "./components/provider";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";
import { CartProvider } from "./lib/cart";
import CustomCursor from "./components/CustomCursor";

function App() {
  return (
    <Provider>
      <CartProvider>
        <Switch>
          <Route path="/admin" component={AdminPage} />
          <Route path="/">
            <>
              <CustomCursor />
              <Index />
              {import.meta.env.DEV && <AgentFeedback />}
              <RunableBadge />
            </>
          </Route>
        </Switch>
      </CartProvider>
    </Provider>
  );
}

export default App;
