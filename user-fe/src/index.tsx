import "./index.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import App from "./App.tsx";
import  theme  from "./theme";

import ReactDOM from "react-dom/client";

import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";

ReactDOM.createRoot(document.querySelector("#root")!).render(
  <BrowserRouter>
 
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
  
  </BrowserRouter>,
);
