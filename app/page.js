"use client";

import React, { useMemo, useRef, useState } from "react";
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
      </div>
      <h1>{cv.general.displayName}</h1>
      <div className="header-items">
        <button
          className="header-item"
          onClick={() => {
            const hideBoth = !(state.hideLayers && state.hideInspector);
            state.hideLayers = hideBoth;
            state.hideInspector = hideBoth;
            state.showLayers = false;
            state.showInspector = false;
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
  const canvasRef = useRef(null);
  const contentRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const sections = useMemo(
    () => [
      ...(cv.projects || []).map((item) => ({ ...item })),
      ...(cv.sideProjects || []).map((item) => ({ ...item })),
    ],
    []
  );

  function onCanvasWheel(e) {
    if (!e.metaKey && !e.ctrlKey) {
      return;
    }
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const nextZoom = Math.max(0.3, Math.min(3, zoom * (e.deltaY > 0 ? 0.92 : 1.08)));
    const zoomRatio = nextZoom / zoom;
    const rect = canvas.getBoundingClientRect();
    const offsetX = e.clientX - rect.left + canvas.scrollLeft;
    const offsetY = e.clientY - rect.top + canvas.scrollTop;
    setZoom(nextZoom);

    requestAnimationFrame(() => {
      canvas.scrollLeft = offsetX * zoomRatio - (e.clientX - rect.left);
      canvas.scrollTop = offsetY * zoomRatio - (e.clientY - rect.top);
    });
  }

  return (
    <main id="canvas" className="canvas" ref={canvasRef} onWheel={onCanvasWheel}>
      <div
        id="canvas-content"
        className="canvas-content"
        ref={contentRef}
        style={{ transform: `scale(${zoom})`, transformOrigin: "0 0" }}
      >
        {sections.map((project) => (
          <article
            key={project.id}
            id={`project-${project.id}`}
            className={`canvas-section project-frame ${selectedItem?.id === project.id ? "selected" : ""}`}
            style={{ "--section-tint": "rgb(0, 123, 229)" }}
            onClick={() => {
              state.selectedItem = project;
            }}
          >
            <h3>{project.title}</h3>
            <div className="project-media-list">
              {(project.attachments || []).map((media, idx) =>
                media.type === "video" ? (
                  <video key={`${project.id}-video-${idx}`} src={media.url} muted loop controls />
                ) : (
                  <img key={`${project.id}-img-${idx}`} src={media.url} alt={`${project.title} ${idx + 1}`} loading="lazy" />
                )
              )}
            </div>
          </article>
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