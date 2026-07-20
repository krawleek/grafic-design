"use client";

import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import { RichText, combineCollections } from 'readcv';
import '@fontsource-variable/inter';
import {proxy, useSnapshot} from 'valtio';
import {
  useWindowWidth,
} from '@react-hook/window-size'

const state = proxy({
  selectedItem: null,
  scrollTo: undefined, // function to scrollTo(x, y) in canvas, assigned in Canvas
  showLayers: false, // for mobile only
  showInspector: false, // for mobile only
  hideLayers: true, // for desktop only
  hideInspector: false, // for desktop only
  hideHeader: false, // for desktop only
  locale: "ru",
});

import cv from './cv';
import {localizeProject, profileCopy} from './localization';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function withBasePath(path) {
  if (!path || /^https?:\/\//.test(path)) return path;
  return `${BASE_PATH}${path}`;
}

function App() {
  const { hideLayers, hideInspector, hideHeader } = useSnapshot(state);
  React.useEffect(() => {
    function onKeyDown(e) {
      switch (e.key) {
        case ".":
          if (e.metaKey) {
            state.hideLayers = !state.hideLayers;
            state.hideInspector = !state.hideInspector;
            state.hideHeader = !state.hideHeader;
          }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    }
  }, []);
    const layoutRef = React.useRef(null);

  return (
    <div
      ref={layoutRef}
      className={`layout
        ${hideHeader ? "" : "with-header"}
        ${hideLayers ? "" : "with-layers"}
        ${hideInspector ? "" : "with-inspector"}
      `}>
      {hideHeader ? null : <Header />}
      {hideLayers ? null : <Layers />}
      <Canvas />
      {hideInspector ? null : <Inspector />}
    </div>
  );
}

const LOCAL_STORAGE_ADJUSTABLE_SIDEBAR_KEY = "adjustable-sidebar-width";
const MAX_WIDTH = 400;
const MIN_WIDTH = 100;

/**
 * @prop className
 * @prop side: "left" | "right"
 */
function AdjustableSidebar(props) {
  const storageKey = LOCAL_STORAGE_ADJUSTABLE_SIDEBAR_KEY + props.side;
  const [mounted, setMounted] = React.useState(false);
  const [width, setWidth] = React.useState("280px");
  React.useEffect(() => {
    setMounted(true);
    setWidth(window.localStorage.getItem(storageKey) ?? "280px");
  }, [storageKey]);
  const startX = React.useRef(undefined);
  const startWidth = React.useRef(undefined);
  function onPointerDown(e) {
    startX.current = e.clientX;
    startWidth.current = parseInt(width);
  }
  React.useEffect(() => {
    function onPointerMove(e) {
      if (startX.current === undefined) {
        return;
      }
      const diff = e.clientX - startX.current;
      const newWidth = Math.max(Math.min(
        startWidth.current + (diff * (props.side === "right" ? -1 : 1)),
        MAX_WIDTH
      ), MIN_WIDTH);
      const newWidthStr = newWidth + "px";
      setWidth(newWidthStr);
      window.localStorage.setItem(
        storageKey,
        newWidthStr
      );
    }
    function onPointerUp(e) {
      startX.current = undefined;
      startWidth.current = undefined;
    }
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);
    return () => {
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
    }
  }, []);

  const windowWidth = useWindowWidth();

  if (mounted && windowWidth < 640) {
    return <>
      <div className={`sidebar-backdrop ${props.shown ? "active" : ""}`}
        onPointerDown={props.onClickBackdrop}
        />
      <div className={props.className}>
        {props.children}
      </div>
    </>;
  }

  return (
    <div style={{position: "relative"}}>
    <div
      style={{
        width
      }}
      className={props.className}
      >
      {props.children}
    </div>
      <div
        className="adjustable-sidebar-grabber"
        style={{
          left: props.side === "right" ? 0 : "auto",
          right: props.side === "left" ? 0 : "auto",
        }}
        onPointerDown={onPointerDown}
        />
    </div>
  );
}

function Canvas() {
  const canvasRef = React.useRef(null);
  const [zoom, setZoom] = React.useState(1);
  const zoomRef = React.useRef(1);

  React.useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  React.useEffect(() => {
    function onTrackpadZoom(event) {
      if (!event.ctrlKey && !event.metaKey) return;

      event.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas || !canvas.contains(event.target)) return;

      const previousZoom = zoomRef.current;
      const nextZoom = Math.min(3, Math.max(0.25,
        previousZoom * Math.exp(-event.deltaY * 0.01)
      ));
      if (nextZoom === previousZoom) return;

      const rect = canvas.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      const ratio = nextZoom / previousZoom;

      zoomRef.current = nextZoom;
      setZoom(nextZoom);
      requestAnimationFrame(() => {
        canvas.scrollLeft = (canvas.scrollLeft + pointerX) * ratio - pointerX;
        canvas.scrollTop = (canvas.scrollTop + pointerY) * ratio - pointerY;
      });
    }

    document.addEventListener("wheel", onTrackpadZoom, {
      capture: true,
      passive: false,
    });
    return () => {
      document.removeEventListener("wheel", onTrackpadZoom, {capture: true});
    };
  }, []);

  React.useEffect(() => {
    state.scrollTo = (x, y) => {
      canvasRef.current?.scrollTo({
        left: Math.max(0, -x),
        top: Math.max(0, -y),
        behavior: "smooth",
      });
    };
    return () => {
      state.scrollTo = undefined;
    };
  }, []);

  return (
    <main ref={canvasRef} id="canvas" className="canvas">
      <div id="canvas-content" className="canvas-content" style={{zoom}}>
        {[...(cv.projects ?? []), ...(cv.sideProjects ?? [])].map((project) => (
          <ProjectFrame key={project.id ?? project.title} project={project} />
        ))}
      </div>
    </main>
  );
}

function ProjectFrame({project}) {
  const {selectedItem, locale} = useSnapshot(state);
  const copy = localizeProject(project, locale);
  return (
    <section
      id={project.title}
      className={`canvas-section ${selectedItem === project ? "selected" : ""}`}
      onClick={() => { state.selectedItem = project; }}
    >
      <h3>{copy.title}</h3>
      {project.attachments.map((attachment, index) => (
        <Artboard key={`${attachment.url}-${index}`} attachment={attachment} index={index} />
      ))}
    </section>
  );
}

function Artboard({attachment, index}) {
  const {selectedItem} = useSnapshot(state);
  const selected = selectedItem?.url === attachment.url;
  const mediaProps = {
    src: withBasePath(attachment.url),
    draggable: false,
    onClick: (event) => {
      event.stopPropagation();
      state.selectedItem = attachment;
    },
  };

  return (
    <figure
      id={attachment.url}
      className={`canvas-artboard ${selected ? "selected" : ""}`}
      style={{aspectRatio: `${attachment.width ?? 16} / ${attachment.height ?? 9}`}}
    >
      <h4>Image {index + 1}</h4>
      {attachment.type === "video"
        ? <video {...mediaProps} muted loop playsInline controls />
        : <img {...mediaProps} alt="" loading="lazy" />}
    </figure>
  );
}

function Header(props) {
  const {locale} = useSnapshot(state);
  const profile = profileCopy[locale];
  return (
    <nav className="header">
      <div className="header-items">
        <button
          className="header-item locale-toggle"
          aria-label={locale === "ru" ? "Switch to English" : "Переключить на русский"}
          onClick={() => { state.locale = locale === "ru" ? "en" : "ru"; }}
        >{locale === "ru" ? "EN" : "RU"}</button>
        <LayersToggle />
      </div>
      <h1>{profile.name}</h1>
      <div className="header-items">
        <InspectorToggle />
        <button className="header-item" aria-label={locale === "ru" ? "Обо мне" : "About me"} onClick={() => {
          state.selectedItem = null;
          state.showInspector = true;
          state.hideInspector = false;
        }}>
          <img src={withBasePath(cv.general.profilePhoto)} height="24px" width="24px" alt="" />
        </button>
      </div>
    </nav>
  );
}


function createMatcher(prefix, suffix) {
  const pattern = new RegExp(`${prefix}\/([a-zA-Z0-9-]+)${suffix}`);
  return (input) => {
    const match = input.match(pattern);
    return match ? match[1] : null;
  };
}

function getProjectIdFromAttachmentUrl(url) { return createMatcher('profileItems', '\/')(url) }
function getAttachmentIdFromAttachmentUrl(url) { return createMatcher('newProfileItem', '\.')(url) }

function getPathForAttachment(attachment) {
  return getProjectIdFromAttachmentUrl(attachment.url) + "/" + getAttachmentIdFromAttachmentUrl(attachment.url);

}

function isMobile() {
  return window.innerWidth < 640;
}
function preventDefault(e) {
  e.preventDefault();
}

function getOffsetInCanvas(el, centerX) {
  const canvas = document.getElementById("canvas");
  const canvasContent = document.getElementById("canvas-content");
  if (!canvas) {
    return;
  }
  const rect = el.getBoundingClientRect();
  const canvasContentRect = canvasContent.getBoundingClientRect();
  let offsetX = rect.x - canvasContentRect.x;
  let offsetY = rect.y - canvasContentRect.y;
  // Center it based on canvas
  const canvasRect = canvas.getBoundingClientRect();
  offsetY -= (canvasRect.height - rect.height) / 2;
  if (centerX) {
    offsetX -= (canvasRect.width - rect.width) / 2;
  }
  return {x: offsetX, y: offsetY }

}

function IconReadCV() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><path fillRule="evenodd" clipRule="evenodd" d="M11.737 7.958a.75.75 0 10-.389 1.45l7.245 1.94A.75.75 0 1018.98 9.9l-7.244-1.94zM10.896 11.098a.75.75 0 00-.389 1.448l7.245 1.942a.75.75 0 00.388-1.45l-7.245-1.94zM9.136 14.767a.75.75 0 01.918-.53l4.83 1.294a.75.75 0 01-.388 1.449l-4.83-1.294a.75.75 0 01-.53-.919z" fill="currentcolor"></path><path fillRule="evenodd" clipRule="evenodd" d="M16.5 23.987L6.841 21.4a2.75 2.75 0 01-1.944-3.368L8.132 5.957A2.75 2.75 0 0111.5 4.013L21.16 6.6a2.75 2.75 0 011.944 3.368l-3.236 12.074a2.75 2.75 0 01-3.368 1.944zM6.345 18.42a1.25 1.25 0 00.884 1.531l9.66 2.588a1.25 1.25 0 001.53-.883L21.655 9.58a1.25 1.25 0 00-.884-1.531L11.11 5.46a1.25 1.25 0 00-1.53.884L6.345 18.42z" fill="currentcolor"></path></svg>
}

function IconList() {
  return <svg className="svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><path fill="currentcolor" fillOpacity="1" fillRule="nonzero" stroke="none" d="M16 13H2v1h14v-1zm0-5H2v1h14V8zm0-5H2v1h14V3z"></path></svg>
}

function IconBook() {
  return <svg className="svg" xmlns="http://www.w3.org/2000/svg" width="18" height="14" viewBox="0 0 18 14"><path fill="currentcolor" fillOpacity="1" fillRule="evenodd" stroke="none" d="M8.373 13h1.258c.28-.32.616-.597.995-.819 1.479-.862 4.005-.909 5.386.109H17.5v-9.2c0 0-.797-2.25-4.42-2.25-1.875 0-2.902.602-3.456 1.184-.389.407-.545.803-.6.976h-.049c-.054-.173-.21-.57-.599-.976C7.822 1.442 6.795.84 4.92.84 1.297.84.5 3.09.5 3.09v9.19h1.488c1.382-1.019 3.91-.97 5.388-.105.38.223.717.502.997.825zM9.5 3.289v8.457c.195-.158.403-.3.622-.428.927-.541 2.115-.796 3.241-.787 1.006.008 2.081.227 2.952.759h.185V3.317l-.03-.05c-.086-.138-.236-.339-.474-.545-.461-.397-1.33-.882-2.916-.882-1.586 0-2.34.484-2.694.835-.189.186-.296.367-.353.49-.03.061-.046.107-.053.131l-.005.017.001-.006.002-.008v-.005l.001-.002V3.29l-.005-.001H9.5zm-1 0h-.474l-.006.001v.002l.001.002.001.005.002.008.001.006c0 .001 0-.005-.005-.017-.007-.024-.024-.07-.053-.131-.057-.123-.164-.304-.353-.49-.354-.351-1.108-.835-2.694-.835-1.585 0-2.455.485-2.916.882-.238.206-.388.407-.474.545l-.03.05v7.963h.185c.872-.532 1.948-.752 2.954-.759 1.128-.008 2.316.249 3.243.792.217.127.424.27.618.426V3.29z"></path></svg>
}

function IconArtboard(props) {
  return (
    <svg className="sidebar-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><path fill="currentcolor" fillOpacity="1" fillRule="evenodd" stroke="none" d="M4 .5V3h4V.5h1V3h2.5v1H9v4h2.5v1H9v2.5H8V9H4v2.5H3V9H.5V8H3V4H.5V3H3V.5h1zM8 8V4H4v4h4z"></path></svg>
  );
}

function IconSection() {
  return <svg className="sidebar-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><path fill="currentcolor" fillOpacity=".9" fillRule="evenodd" stroke="none" d="M.5 0C.224 0 0 .224 0 .5v11c0 .276.224.5.5.5h11c.276 0 .5-.224.5-.5V.5c0-.276-.224-.5-.5-.5H.5zM6 1H1v3h5V1zM1 5h5.5c.276 0 .5-.224.5-.5V1h4v10H1V5z"></path></svg>
}

function IconImage() {
  return <svg className="sidebar-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="currentcolor" fillOpacity="1" fillRule="evenodd" stroke="none" d="M12 6c0 1.105-.895 2-2 2-1.105 0-2-.895-2-2 0-1.105.895-2 2-2 1.105 0 2 .895 2 2zm-1 0c0 .552-.448 1-1 1-.552 0-1-.448-1-1 0-.552.448-1 1-1 .552 0 1 .448 1 1zM3 2c-.552 0-1 .448-1 1v10c0 .552.448 1 1 1h10c.552 0 1-.448 1-1V3c0-.552-.448-1-1-1H3zm10 1H3v6.293l2.5-2.5L11.707 13H13V3zM3 13v-2.293l2.5-2.5L10.293 13H3z"></path></svg>
}

function IconCaret() {
  return <svg className="sidebar-icon details-rotate-open" xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 6 6"><path fill="currentcolor" fillOpacity="1" fillRule="nonzero" stroke="none" d="m3 5 3-4H0l3 4z"></path></svg>
}

function InspectorToggle() {
  return <button
           aria-label="Info"
           className="header-item"
           onClick={() => {
             if (isMobile()) {
               state.showInspector = !state.showInspector
             } else {
               state.hideInspector = !state.hideInspector
             }
           }}
           >
    <IconBook />
  </button>
}


function Inspector(props) {
  const {selectedItem, showInspector, locale} = useSnapshot(state);
  return (
    <AdjustableSidebar
      className={`sidebar inspector ${showInspector ? "shown" : ""}`}
      shown={showInspector}
      onClickBackdrop={() => state.showInspector = false}
      side="right">
       <SidebarSection>
        <SidebarTitle>{locale === "ru" ? "Информация" : "Inspector"}</SidebarTitle>
      </SidebarSection>
      <SidebarDivider />
      <SelectedItemSwitch item={selectedItem} />
    </AdjustableSidebar>
  );
}

function SelectedItemSwitch(props) {
  const {item} = props;
  switch(item?.type ?? "") {
    case "project":
    case "sideProject":
      return <ProjectInfo item={item} />;
    case "image":
    case "video":
      const project = [...cv.projects, ...cv.sideProjects].find(project =>
        project.attachments.find(attachment =>
          attachment.url === item.url
        ) !== undefined
      )
      if (project) {
        return <ProjectInfo item={project} />
      }
    default:
      return <Profile />;
  }
}

function Profile(props) {
  const {locale} = useSnapshot(state);
  const item = profileCopy[locale];
  return <>
    <SidebarSection large>
      <SidebarTitle>
        {item.name}
      </SidebarTitle>
      <RichText text={item.about} />
    </SidebarSection>
     <SidebarDivider />
    <SidebarSection>
      <SidebarFields>
      {item.profession && <SidebarField>
        <SidebarKey>{locale === "ru" ? "Профессия" : "Profession"}</SidebarKey>
        <SidebarValue>{item.profession}</SidebarValue>
      </SidebarField>}
      {item.contact && <SidebarField>
        <SidebarKey>{locale === "ru" ? "Контакты" : "Contact"}</SidebarKey>
        <SidebarValueLink href={item.contactUrl}>{item.contact}</SidebarValueLink>
      </SidebarField>}
        </SidebarFields>
    </SidebarSection>
  </>
}

function ProjectInfo({item}) {
  const {locale} = useSnapshot(state);
  const copy = localizeProject(item, locale);
  return <>
    <SidebarSection large>
      <SidebarTitle>
        {copy.title}
      </SidebarTitle>
      {copy.description && <RichText text={copy.description} />}
    </SidebarSection>
    <SidebarDivider />
    <SidebarSection>
      <SidebarFields>
      {item.year && <SidebarField>
        <SidebarKey>{locale === "ru" ? "Год" : "Year"}</SidebarKey>
        <SidebarValue>{item.year}</SidebarValue>
      </SidebarField>}
      {item.company && <SidebarField>
        <SidebarKey>Company</SidebarKey>
        <SidebarValue>{item.company}</SidebarValue>
      </SidebarField>}
      {item.url && <SidebarField>
        <SidebarKey>URL</SidebarKey>
        <SidebarValueLink href={item.url}>{item.url}</SidebarValueLink>
      </SidebarField>}
      {item.collaborators?.length > 0 && <SidebarField>
        <SidebarKey>Collaborators</SidebarKey>
        <SidebarValue>{item.collaborators.map(c => c.name).join(",")}</SidebarValue>
      </SidebarField>}
        </SidebarFields>
    </SidebarSection>
  </>
}

function LayersToggle() {
  return <button
           aria-label="Layers"
           className="header-item"
           onClick={() => {
             if (isMobile()) {
               state.showLayers = !state.showLayers
             } else {
               state.hideLayers = !state.hideLayers
             }
           }}
           >
    <IconList />
  </button>
}

function Layers(props) {
  const {showLayers, locale} = useSnapshot(state);
  return (
    <AdjustableSidebar
      className={`sidebar layers ${showLayers ? "shown" : ""}`}
      shown={showLayers}
      onClickBackdrop={() => state.showLayers = false}
      side="left">
      <SidebarSection>
        <SidebarTitle>{locale === "ru" ? "Слои" : "Layers"}</SidebarTitle>
      </SidebarSection>
      <SidebarDivider />
      {cv.projects && cv.projects.length > 0 && <Collection
        title={locale === "ru" ? "Проекты" : "Projects"}
        items={cv.projects}
        path="projects"
        Renderer={SectionItem}
        ItemRenderer={ProjectCollection}
      />}
      {cv.sideProjects && cv.sideProjects.length > 0 && <Collection
        title={locale === "ru" ? "Другие проекты" : "Side Projects"}
        path="sideProjects"
        items={cv.sideProjects}
        Renderer={SectionItem}
        ItemRenderer={ProjectCollection}
      /> }
      {!cv.projects || !cv.sideProjects || (cv.sideProjects.length + cv.projects.length === 0) && <SidebarItem>No projects yet</SidebarItem>}
    </AdjustableSidebar>
  );
}

const LOCAL_STORAGE_COLLECTION_OPEN_KEY = "open-collections"
function Collection(props) {
  const {title, path, items, Renderer, ItemRenderer, onClick, selected } = props;
  function getOpenCollections() {
    if (typeof window === "undefined") return {};
    return JSON.parse(
      window.localStorage.getItem(
        LOCAL_STORAGE_COLLECTION_OPEN_KEY
      ) ?? "{}"
    )
  }
  const [isOpen, setIsOpen] = React.useState(false);
  React.useEffect(() => {
    setIsOpen(Boolean(getOpenCollections()[path]));
  }, [path]);

  return <>
    <details
      open={isOpen}
      onToggle={(e) => {
        e.preventDefault();
        const open = e.currentTarget.open;
        setIsOpen(open);
        const nextOpens = getOpenCollections();
        nextOpens[path] = open;
        window.localStorage.setItem(
          LOCAL_STORAGE_COLLECTION_OPEN_KEY,
          JSON.stringify(nextOpens)
        )
      }}
    >
      <summary onClick={onClick}>
        <Renderer className={selected ? "selected" : ""}>
          {props.title}
        </Renderer>
      </summary>
      {items ? <Indent>
        {items.map((item, index) => (
          <ItemRenderer
            key={index}
            item={item}
            index={index}
            path={path} />
        ))}
      </Indent> : null}
    </details>
  </>;
}

function ProjectCollection(props) {
  const {selectedItem, locale} = useSnapshot(state);
  const { item, path, index } = props;
  const copy = localizeProject(item, locale);
  return <Collection
    title={copy.title}
    items={item.attachments}
    path={path + "/" + index}
    Renderer={ArtboardItem}
    ItemRenderer={AttachmentItem}
    selected={JSON.stringify(state.selectedItem) === JSON.stringify(item) ? "selected" : ""}
    onClick={() => {
      state.selectedItem = item;
      const el = document.getElementById(item.title)
      const offset = getOffsetInCanvas(el);
      state.scrollTo(-offset.x, -offset.y);
    }}
  />
}

function AttachmentItem(props) {
  const { item, index, path } = props;
  const attachmentPath = path + getAttachmentIdFromAttachmentUrl(item.url);
  const {selectedItem} = useSnapshot(state);

  return <ImageItem
    onClick={() => {
      state.selectedItem = item;
      const el = document.getElementById(item.url)
      const offset = getOffsetInCanvas(el, true);
      state.scrollTo(-offset.x, -offset.y);
    }}
    className={
    selectedItem && selectedItem.url === item.url ? "selected" : ""
    }
  >
    Image {index + 1}
  </ImageItem>
}


function SectionItem(props) {
  return <SidebarItem>
    <IconCaret />
    <IconSection />
    <h3 className="sidebar-title">{props.children}</h3>
  </SidebarItem>
}

function ArtboardItem(props) {
  const {children, ...rest} = props;
  return <SidebarItem {...rest}>
    <IconCaret />
    <IconArtboard />
    {props.children}
  </SidebarItem>
}

function ImageItem(props) {
  const {children, ...rest} = props;
  return <SidebarItem {...rest}>
    <IconImage />
    {children}
  </SidebarItem>
}

function Indent(props) {
  return <div className="sidebar-indent">{props.children}</div>
}

function SidebarSection(props) {
  return (
    <section className={`sidebar-section ${props.large ? "large" : ""}`}>{props.children}</section>
  );
}
function SidebarTitle(props) {
  return (
    <h2 className="sidebar-title">{props.children}</h2>
  );
}

function SidebarDivider(props) {
  return (
    <hr className="sidebar-divider"></hr>
  );
}

function SidebarItem({children, ...rest}) {
  return (
    <li {...rest}
      className={`sidebar-item ${rest.className}`}
      >{children}</li>
    )
}

function SidebarFields(props) {
  return <fieldset className="sidebar-fields">
    {props.children}
  </fieldset>
}

function SidebarField(props) {
  return <label className="sidebar-field">
    {props.children}
  </label>
}

function SidebarKey(props) {
  return <span className="sidebar-key">
    {props.children}
  </span>
}

function SidebarValue(props) {
  return <input className="sidebar-value" defaultValue={props.children} readOnly />
}

function SidebarValueLink(props) {
  return <a target="_blank" className="sidebar-value" {...props}/>
}

export default App;
