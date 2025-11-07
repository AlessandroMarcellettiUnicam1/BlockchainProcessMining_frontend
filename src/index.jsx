import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { RouterProvider, createBrowserRouter } from 'react-router';
import BodyLayout from './layouts/BodyLayout';
import DataExtractionPage from './pages/DataExtraction';
import OcelMapping from './pages/OcelMapping';
import Query from './pages/Query';
import XesPage from './pages/XesPage';
import HomePage from './pages/HomePage';
import DataViewPage from './pages/DataView';
import NetworkGraph from './pages/VisualModel';
import DataExtractionInternalPage from './pages/DataExtractionInternal';

const router = createBrowserRouter([
    {
        Component: App,
        children: [
            {
              Component: BodyLayout,
              children : [
                {
                  path: "/",
                  Component: HomePage
                },
                {
                  path: "extraction",
                  Component: DataExtractionPage
                },
                {
                  path: "extractionInternal",
                  Component: DataExtractionInternalPage
                },
                {
                  path: "view",
                  Component: DataViewPage
                },
                {
                  path: "ocel",
                  Component: OcelMapping
                },
                {
                  path: "query",
                  Component: Query
                },
                {
                  path: "xes",
                  Component: XesPage
                },
                {
                  path: "visual",
                  Component: NetworkGraph
                }
              ]
            },
        ]
    }
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
