/* global mermaid, svgPanZoom */

// Auto-reload on file changes
const evtSource = new EventSource("/events");
evtSource.onmessage = (event) => {
  if (event.data === "reload") {
    console.log("File changed, reloading...");
    window.location.reload();
  }
};

// Wait for DOM and libraries to be ready
window.addEventListener("load", async function () {
  console.log("Page loaded, initializing mermaid...");

  // Initialize Mermaid with optimized layout settings
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "default",
    // Flowchart spacing optimization
    flowchart: {
      nodeSpacing: 50, // Horizontal spacing between nodes
      rankSpacing: 50, // Vertical spacing between ranks
      curve: "basis", // Smoother curves
      padding: 15, // Padding around the diagram
      useMaxWidth: true, // Use container width
      htmlLabels: true,
    },
    // Sequence diagram optimization
    sequence: {
      diagramMarginX: 50,
      diagramMarginY: 10,
      actorMargin: 50,
      width: 150,
      height: 65,
      boxMargin: 10,
      boxTextMargin: 5,
      noteMargin: 10,
      messageMargin: 35,
      mirrorActors: true,
      useMaxWidth: true,
    },
    // Class diagram optimization
    class: {
      useMaxWidth: true,
    },
    // State diagram optimization
    state: {
      useMaxWidth: true,
    },
    // ER diagram optimization
    er: {
      useMaxWidth: true,
      layoutDirection: "TB",
    },
    // Gantt diagram optimization
    gantt: {
      useMaxWidth: true,
      leftPadding: 75,
      gridLineStartPadding: 35,
    },
  });

  const mermaidElements = document.querySelectorAll(".mermaid");
  console.log("Found mermaid elements:", mermaidElements.length);

  if (mermaidElements.length === 0) {
    console.log("No mermaid elements found");
    return;
  }

  try {
    // Run mermaid rendering on all elements
    console.log("Running mermaid.run()...");
    await mermaid.run({ nodes: Array.from(mermaidElements) });
    console.log("Mermaid rendering complete");

    // Apply pan/zoom to each rendered diagram with smart aspect ratio handling
    mermaidElements.forEach((element, index) => {
      const svg = element.querySelector("svg");
      console.log(`Element ${index}: SVG found =`, !!svg);
      if (!svg) return;

      // Get the bounding box before making any changes
      let bbox;
      try {
        bbox = svg.getBBox();
        console.log(`Diagram ${index} bbox:`, bbox);
      } catch (e) {
        console.warn(`Could not get bbox for diagram ${index}:`, e);
        return;
      }

      // Calculate proper viewBox with padding
      const padding = 20;
      const viewBoxX = Math.floor(bbox.x - padding);
      const viewBoxY = Math.floor(bbox.y - padding);
      const viewBoxWidth = Math.ceil(bbox.width + padding * 2);
      const viewBoxHeight = Math.ceil(bbox.height + padding * 2);

      // Set viewBox first
      svg.setAttribute(
        "viewBox",
        `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`,
      );
      console.log(
        `Set viewBox for diagram ${index}: ${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`,
      );

      // Set explicit width/height for svg-pan-zoom to work properly
      // Use container width and calculate proportional height
      const containerWidth = element.clientWidth - 32; // Account for padding
      const aspectRatio = viewBoxWidth / viewBoxHeight;
      const svgHeight = containerWidth / aspectRatio;

      svg.setAttribute("width", containerWidth.toString());
      svg.setAttribute("height", svgHeight.toString());

      console.log(
        `Diagram ${index}: ${viewBoxWidth}x${viewBoxHeight} (aspect: ${aspectRatio.toFixed(2)}), rendering at ${containerWidth}x${svgHeight.toFixed(0)}`,
      );

      // Apply pan & zoom
      const instance = window.svgPanZoom(svg, {
        controlIconsEnabled: true, // +/−/reset buttons
        zoomScaleSensitivity: 0.3, // wheel speed
        minZoom: 0.1,
        maxZoom: 10,
        fit: false, // Don't auto-fit, we sized it already
        center: false, // Don't auto-center
        contain: false,
      });

      console.log(`  → Applied pan/zoom`);

      // Keep it responsive
      const ro = new ResizeObserver(() => {
        const newContainerWidth = element.clientWidth - 32;
        const newSvgHeight = newContainerWidth / aspectRatio;
        svg.setAttribute("width", newContainerWidth.toString());
        svg.setAttribute("height", newSvgHeight.toString());
        instance.resize();
      });
      ro.observe(element);
    });
  } catch (err) {
    console.error("Error rendering mermaid:", err);
  }
});
