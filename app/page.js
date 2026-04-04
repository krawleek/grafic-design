"use client";

import React, { useMemo } from "react";
import { RichText } from "readcv";
import "@fontsource-variable/inter";
import { proxy, useSnapshot } from "valtio";
import cv from "./cv";

const state = proxy({
  selectedItem: null,
  showLayers: false,
  showInspector: false,
  hideLayers: false,
  hideInspector: false,
  hideHeader: false,
});

function isMobile() {
  return typeof window !== "undefined" && window.innerWidth < 640;
}

function App() {
  const { hideLayers, hideInspector, hideHeader } = useSnapshot(state);

  React.useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "." && e.metaKey) {
        state.hideLayers = !state.hideLayers;
        state.hideInspector = !state.hideInspector;
        state.hideHeader = !state.hideHeader;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      className={`layout ${hideHeader ? "" : "with-header"} ${hideLayers ? "" : "with-layers"} ${hideInspector ? "" : "with-inspector"}`}
    >
      {hideHeader ? null : <Header />}
      {hideLayers ? null : <Layers />}
      <Canvas />
      {hideInspector ? null : <Inspector />}
    </div>
  );
}

function Header() {
  return (
    <nav className="header">
      <div className="header-items">
        <a className="header-item" aria-label="View CV" href={`https://read.cv/${cv.general.username}`} target="_blank" rel="noreferrer">
          Layers
        </a>
      </div>
      <h1>{cv.general.displayName}</h1>
      <div className="header-items">
        <button
          className="header-item"
          onClick={() => {
            if (isMobile()) {
              state.showInspector = !state.showInspector;
            } else {
              state.hideInspector = !state.hideInspector;
            }
          }}
        >
          Info
        </button>
        <button
          className="header-item"
          onClick={() => {
            if (isMobile()) {
              state.showLayers = !state.showLayers;
            } else {
              state.hideLayers = !state.hideLayers;
            }
          }}
        >
          Menu
        </button>
      </div>
    </nav>
  );
}

function Layers() {
  const { showLayers, selectedItem } = useSnapshot(state);
  const sections = useMemo(
    () => [
      { title: "Projects", items: cv.projects || [] },
      { title: "Side Projects", items: cv.sideProjects || [] },
    ],
    []
  );

  return (
    <aside className={`sidebar layers ${showLayers ? "shown" : ""}`}>
      <section className="sidebar-section">
        <h2 className="sidebar-title">Layers</h2>
      </section>
      <hr className="sidebar-divider" />
      {sections.map((section) => (
        <section className="sidebar-section" key={section.title}>
          <h3 className="sidebar-title">{section.title}</h3>
          <ul>
            {section.items.map((item) => (
              <li
                key={item.id}
                className={`sidebar-item ${selectedItem?.id === item.id ? "selected" : ""}`}
                onClick={() => {
                  state.selectedItem = item;
                  document.getElementById(`project-${item.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              >
                {item.title}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </aside>
  );
}

function Canvas() {
  const { selectedItem } = useSnapshot(state);
  const sections = useMemo(
    () => [
      { name: "Projects", items: cv.projects || [] },
      { name: "Side Projects", items: cv.sideProjects || [] },
    ],
    []
  );

  return (
    <main id="canvas" className="canvas">
      <div id="canvas-content" className="canvas-content">
        {sections.map((section) => (
          <div className="canvas-padding" key={section.name}>
            <article className="canvas-section" style={{ "--section-tint": "rgb(0, 123, 229)" }}>
              <h3>{section.name}</h3>
              {section.items.map((project) => (
                <div
                  key={project.id}
                  id={`project-${project.id}`}
                  className={`canvas-artboard ${selectedItem?.id === project.id ? "selected" : ""}`}
                  onClick={() => {
                    state.selectedItem = project;
                  }}
                  style={{ width: 260 }}
                >
                  <h4>{project.title}</h4>
                  {(project.attachments || []).slice(0, 1).map((media) =>
                    media.type === "video" ? (
                      <video key={media.url} src={media.url} muted loop controls />
                    ) : (
                      <img key={media.url} src={media.url} alt={project.title} loading="lazy" />
                    )
                  )}
                </div>
              ))}
            </article>
          </div>
        ))}
      </div>
    </main>
  );
}

function Inspector() {
  const { selectedItem, showInspector } = useSnapshot(state);
  const item = selectedItem || cv.general;

  return (
    <aside className={`sidebar inspector ${showInspector ? "shown" : ""}`}>
      <section className="sidebar-section large">
        <h2 className="sidebar-title">{selectedItem ? selectedItem.title : cv.general.displayName}</h2>
        {selectedItem?.description ? <RichText text={selectedItem.description} /> : <RichText text={cv.general.about} />}
      </section>
      <hr className="sidebar-divider" />
      <section className="sidebar-section">
        <div className="sidebar-fields">
          {"year" in item && item.year ? (
            <label className="sidebar-field">
              <span className="sidebar-key">Year</span>
              <input className="sidebar-value" readOnly value={item.year} />
            </label>
          ) : null}
          {cv.general.location ? (
            <label className="sidebar-field">
              <span className="sidebar-key">Location</span>
              <input className="sidebar-value" readOnly value={cv.general.location} />
            </label>
          ) : null}
          {cv.general.website ? (
            <label className="sidebar-field">
              <span className="sidebar-key">Website</span>
              <a className="sidebar-value" href={cv.general.websiteURL} target="_blank" rel="noreferrer">
                {cv.general.website}
              </a>
            </label>
          ) : null}
        </div>
      </section>
    </aside>
  );
}

export default App;