// Initialize Fabric.js canvas
const canvas = new fabric.Canvas("canvas");
let layers = [];
let layerCount = 0;
let currentLayer = null;
let lockedLayers = [];
let relationships = [];
let clickPoints = [];
let currentMode = null; // 'two-point' or 'multi-point'
let hoverSegmentationEnabled = false;
let currentMask = null;
let originalImage = null;
let segmentedImages = []; // Array to store segmented images
let blendMode = false;
let currentBlendMode = "normal";

document.addEventListener("DOMContentLoaded", () => {
	const container = document.getElementById("canvas-container");
	const canvasEl = document.getElementById("canvas");
	const fabricWrapper = canvasEl.parentElement;

	function resizeCanvas() {
		// Get the display size in pixels
		const width = container.clientWidth;
		const height = container.clientHeight;

		// Set the wrapper to fill the parent container
		fabricWrapper.style.width = "100%";
		fabricWrapper.style.height = "100%";

		// Set the canvas element's width/height attributes (device pixels)
		canvasEl.width = width;
		canvasEl.height = height;

		// Set the canvas element's style (CSS pixels)
		canvasEl.style.width = "100%";
		canvasEl.style.height = "100%";

		// Set the Fabric.js canvas size
		canvas.setWidth(width);
		canvas.setHeight(height);
		canvas.renderAll();
	}

	resizeCanvas();
	window.addEventListener("resize", resizeCanvas);

	// Initialize with one layer
	addLayer();

	// Setup slider event listeners
	const opacitySlider = document.getElementById("opacitySlider");
	const brightnessSlider = document.getElementById("brightnessSlider");
	const contrastSlider = document.getElementById("contrastSlider");
	const segment1Slider = document.getElementById("segment1Opacity");
	const segment2Slider = document.getElementById("segment2Opacity");
	const alphaSlider = document.getElementById("alphaSlider");

	if (opacitySlider) {
		opacitySlider.addEventListener("input", function () {
			document.getElementById("opacityValue").textContent = `${Math.round(
				this.value * 100
			)}%`;
			changeOpacity();
		});
	}

	if (brightnessSlider) {
		brightnessSlider.addEventListener("input", function () {
			document.getElementById("brightnessValue").textContent = `${this.value}%`;
			adjustBrightness();
		});
	}

	if (contrastSlider) {
		contrastSlider.addEventListener("input", function () {
			document.getElementById("contrastValue").textContent = `${this.value}%`;
			adjustContrast();
		});
	}

	if (segment1Slider) {
		segment1Slider.addEventListener("input", updateSegmentOpacities);
	}

	if (segment2Slider) {
		segment2Slider.addEventListener("input", updateSegmentOpacities);
	}

	if (alphaSlider) {
		alphaSlider.addEventListener("input", updateBlendEffect);
	}

	// Setup canvas drop event for generated images
	const canvasContainer = document.getElementById("canvas-container");
	if (canvasContainer) {
		canvasContainer.addEventListener("dragover", (e) => {
			e.preventDefault();
			canvasContainer.style.borderColor = "#28a745";
		});

		canvasContainer.addEventListener("dragleave", () => {
			canvasContainer.style.borderColor = "#007bff";
		});

		canvasContainer.addEventListener("drop", (e) => {
			e.preventDefault();
			canvasContainer.style.borderColor = "#007bff";
			const imageUrl = e.dataTransfer.getData("text/plain");
			fabric.Image.fromURL(imageUrl, (img) => {
				img.scale(0.5);
				img.set({
					left: e.offsetX - img.width / 2,
					top: e.offsetY - img.height / 2,
					hasControls: true,
					selectable: !isLayerLocked(),
					evented: !isLayerLocked(),
				});
				canvas.add(img);
				addObjectToLayer(img);
				canvas.renderAll();
			});
		});
	}

	// Setup panel collapsing
	const panels = document.querySelectorAll(".panel");
	panels.forEach((panel) => {
		const title = panel.querySelector(".panel-title");
		if (title) {
			title.addEventListener("click", () => {
				panel.classList.toggle("collapsed");
			});
		}
	});

	// Window resize handler
	window.addEventListener("resize", () => {
		fabricWrapper.style.width = "100%";
		fabricWrapper.style.height = "100%";
		canvas.setWidth(container.clientWidth);
		canvas.setHeight(container.clientHeight);
		canvasEl.style.width = "100%";
		canvasEl.style.height = "100%";
		canvas.renderAll();
	});
});

// Canvas event listeners for segmentation
canvas.on("mouse:down", function (options) {
	if (!currentMode || isLayerLocked()) return;

	const pointer = canvas.getPointer(options.e);
	const point = { x: pointer.x, y: pointer.y };
	const clickedObject = canvas.findTarget(options.e);

	if (clickedObject && clickedObject.name === "uploadedImage") {
		originalImage = clickedObject;
		const imagePoint = {
			x: (point.x - originalImage.left) / originalImage.scaleX,
			y: (point.y - originalImage.top) / originalImage.scaleY,
		};
		clickPoints.push(imagePoint);

		// Draw point marker
		const circle = new fabric.Circle({
			left: pointer.x - 5,
			top: pointer.y - 5,
			radius: 5,
			fill: "red",
			selectable: false,
		});
		canvas.add(circle);
		canvas.renderAll();

		if (currentMode === "two-point" && clickPoints.length === 2) {
			showPopup('Two points selected. Click "Segment Selection" to process.');
		} else if (currentMode === "multi-point") {
			showPopup(
				`Point ${clickPoints.length} added. Add more points or click "Segment Selection".`
			);
		}
	}
});

// Hover segmentation
canvas.on("mouse:move", function (e) {
	if (!hoverSegmentationEnabled || !originalImage) return;

	clearTimeout(hoverTimeout);
	hoverTimeout = setTimeout(() => {
		const pointer = canvas.getPointer(e.e);
		const point = { x: pointer.x, y: pointer.y };
		performHoverSegmentation(point);
	}, 200);
});

// Helper function to show popup messages
function showPopup(message, autoHide = true) {
	const popup = document.getElementById("popup");
	popup.innerText = message;
	popup.style.display = "block";
	if (autoHide) {
		setTimeout(() => {
			popup.style.display = "none";
		}, 2000);
	}
}

// Layer Management Functions
function addLayer() {
	layerCount++;
	const layerName = `Layer ${layerCount}`;
	layers.unshift({
		name: layerName,
		objects: [],
		visible: true,
	});
	currentLayer = 0;
	updateLayerList();
	showPopup(`${layerName} added`);
}

function removeLayer() {
	if (currentLayer !== null && layers[currentLayer]) {
		const removedLayer = layers.splice(currentLayer, 1)[0];
		removedLayer.objects.forEach((obj) => canvas.remove(obj));
		canvas.renderAll();
		currentLayer = layers.length > 0 ? 0 : null;
		updateLayerList();
		showPopup(`${removedLayer.name} removed`);
	}
}

function lockLayer(index = null) {
	const layerIndex = index !== null ? index : currentLayer;
	if (layerIndex !== null && layers[layerIndex]) {
		const layerName = layers[layerIndex].name;
		if (!lockedLayers.includes(layerName)) {
			lockedLayers.push(layerName);
			layers[layerIndex].objects.forEach((obj) => {
				obj.selectable = false;
				obj.evented = false;
				obj.hasControls = false;
			});
			canvas.discardActiveObject();
			canvas.renderAll();
			updateLayerList();
			showPopup(`${layerName} locked`);
		}
	}
}

function unlockLayer(index = null) {
	const layerIndex = index !== null ? index : currentLayer;
	if (layerIndex !== null && layers[layerIndex]) {
		const layerName = layers[layerIndex].name;
		const lockIndex = lockedLayers.indexOf(layerName);
		if (lockIndex !== -1) {
			lockedLayers.splice(lockIndex, 1);
			layers[layerIndex].objects.forEach((obj) => {
				obj.selectable = true;
				obj.evented = true;
				obj.hasControls = true;
			});
			canvas.renderAll();
			updateLayerList();
			showPopup(`${layerName} unlocked`);
		}
	}
}

function isLayerLocked() {
	return (
		currentLayer === null || lockedLayers.includes(layers[currentLayer]?.name)
	);
}

function updateLayerList() {
	const layerList = document.getElementById("layer-list");
	const layerCountSpan = document.getElementById("layer-count");
	if (!layerList || !layerCountSpan) return;

	layerList.innerHTML = "";
	layers.forEach((layer, index) => {
		const layerItem = document.createElement("div");
		layerItem.className = "layer-item";
		if (index === currentLayer) {
			layerItem.classList.add("active");
		}
		layerItem.draggable = true;
		layerItem.dataset.index = index;

		if (lockedLayers.includes(layer.name)) {
			layerItem.classList.add("locked");
			layerItem.style.opacity = "0.5";
			layerItem.style.cursor = "not-allowed";
		}

		const img = document.createElement("img");
		img.src =
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
		img.alt = layer.name;

		const controls = document.createElement("div");
		controls.className = "layer-controls";

		const visibilityBtn = document.createElement("button");
		visibilityBtn.innerHTML = layer.visible !== false ? "👁️" : "👁️‍🗨️";
		visibilityBtn.onclick = (e) => {
			e.stopPropagation();
			layer.visible = layer.visible !== false ? false : true;
			layer.objects.forEach((obj) => {
				obj.visible = layer.visible;
			});
			canvas.renderAll();
			updateLayerList();
		};

		const lockBtn = document.createElement("button");
		lockBtn.innerHTML = lockedLayers.includes(layer.name) ? "🔒" : "🔓";
		lockBtn.onclick = (e) => {
			e.stopPropagation();
			if (lockedLayers.includes(layer.name)) {
				unlockLayer(index);
			} else {
				lockLayer(index);
			}
		};

		controls.appendChild(visibilityBtn);
		controls.appendChild(lockBtn);

		const span = document.createElement("span");
		span.textContent = layer.name;

		layerItem.appendChild(img);
		layerItem.appendChild(span);
		layerItem.appendChild(controls);

		layerItem.addEventListener("click", () => {
			currentLayer = index;
			updateLayerList();
			showPopup(`Selected ${layers[currentLayer].name}`);
		});

		layerItem.addEventListener("dragstart", (e) => {
			if (lockedLayers.includes(layer.name)) {
				e.preventDefault();
				return;
			}
			e.dataTransfer.setData("text/plain", index);
		});

		layerItem.addEventListener("dragover", (e) => {
			e.preventDefault();
			layerList.classList.add("drag-over");
		});

		layerItem.addEventListener("dragleave", () => {
			layerList.classList.remove("drag-over");
		});

		layerItem.addEventListener("drop", (e) => {
			e.preventDefault();
			layerList.classList.remove("drag-over");
			const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
			const toIndex = parseInt(e.target.closest(".layer-item").dataset.index);
			if (
				fromIndex !== toIndex &&
				!lockedLayers.includes(layers[fromIndex].name)
			) {
				reorderLayers(fromIndex, toIndex);
			}
		});

		layerList.appendChild(layerItem);
	});

	layerCountSpan.textContent = layers.length;
	updateObjectSelects();
}

function reorderLayers(fromIndex, toIndex) {
	const [movedLayer] = layers.splice(fromIndex, 1);
	layers.splice(toIndex, 0, movedLayer);

	// Clear canvas and re-add objects in correct order
	canvas.clear();
	for (let i = layers.length - 1; i >= 0; i--) {
		if (layers[i].visible !== false) {
			layers[i].objects.forEach((obj) => {
				canvas.add(obj);
				if (lockedLayers.includes(layers[i].name)) {
					obj.selectable = false;
					obj.evented = false;
					obj.hasControls = false;
				}
			});
		}
	}

	if (currentLayer === fromIndex) {
		currentLayer = toIndex;
	} else if (currentLayer > fromIndex && currentLayer <= toIndex) {
		currentLayer--;
	} else if (currentLayer < fromIndex && currentLayer >= toIndex) {
		currentLayer++;
	}

	canvas.renderAll();
	updateLayerList();
	showPopup(`Moved ${movedLayer.name} to position ${toIndex + 1}`);
}

// Add this function to handle object addition to layers
function addObjectToLayer(obj) {
	if (currentLayer !== null && layers[currentLayer]) {
		layers[currentLayer].objects.push(obj);
		if (lockedLayers.includes(layers[currentLayer].name)) {
			obj.selectable = false;
			obj.evented = false;
			obj.hasControls = false;
		}
		updateLayerList();
	}
}

// Image Upload
function addImages() {
	const input = document.getElementById("imageUpload");
	if (!input.files.length) {
		showPopup("Please select at least one image");
		return;
	}
	Array.from(input.files).forEach((file, index) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			fabric.Image.fromURL(
				e.target.result,
				(img) => {
					const scale = Math.min(
						(canvas.width * 0.8) / img.width,
						(canvas.height * 0.8) / img.height
					);
					img.scale(scale);
					img.set({
						left: 50 + index * 30,
						top: 50 + index * 30,
						selectable: !isLayerLocked(),
						evented: !isLayerLocked(),
						name: "uploadedImage",
						id: Date.now() + index,
					});
					if (currentLayer === null) {
						addLayer();
					}
					canvas.add(img);
					addObjectToLayer(img);
					canvas.renderAll();
					showPopup("Image added successfully");
				},
				{ crossOrigin: "anonymous" }
			);
		};
		reader.onerror = () => showPopup("Error reading image file");
		reader.readAsDataURL(file);
	});
}

// Basic Tools
function addRectangle() {
	const rect = new fabric.Rect({
		left: 100,
		top: 100,
		fill: "#ff0000",
		width: 100,
		height: 100,
		selectable: !isLayerLocked(),
		evented: !isLayerLocked(),
	});
	canvas.add(rect);
	addObjectToLayer(rect);
}

function addCircle() {
	const circle = new fabric.Circle({
		left: 200,
		top: 200,
		fill: "#00ff00",
		radius: 50,
		selectable: !isLayerLocked(),
		evented: !isLayerLocked(),
	});
	canvas.add(circle);
	addObjectToLayer(circle);
}

function addLine() {
	const line = new fabric.Line([50, 50, 200, 200], {
		left: 50,
		top: 50,
		stroke: "#000000",
		selectable: !isLayerLocked(),
		evented: !isLayerLocked(),
	});
	canvas.add(line);
	addObjectToLayer(line);
}

function removeSelectedObject() {
	const selectedObject = canvas.getActiveObject();
	if (selectedObject) {
		layers.forEach((layer) => {
			const objIndex = layer.objects.indexOf(selectedObject);
			if (objIndex > -1) {
				layer.objects.splice(objIndex, 1);
			}
		});
		const index = segmentedImages.indexOf(selectedObject);
		if (index > -1) {
			segmentedImages.splice(index, 1);
			if (segmentedImages.length < 2) {
				document.querySelector(".blend-controls").classList.remove("active");
				blendMode = false;
			}
		}
		canvas.remove(selectedObject);
		updateObjectSelects();
		canvas.renderAll();
	}
}

// Z-index Manipulation
function bringForward() {
	const selectedObject = canvas.getActiveObject();
	if (selectedObject && !isLayerLocked()) {
		let objectLayer = -1;
		let objectIndex = -1;
		for (let i = 0; i < layers.length; i++) {
			const index = layers[i].objects.indexOf(selectedObject);
			if (index !== -1) {
				objectLayer = i;
				objectIndex = index;
				break;
			}
		}
		if (objectLayer > 0) {
			// Remove object from current layer
			layers[objectLayer].objects.splice(objectIndex, 1);
			// Add object to new layer
			layers[objectLayer - 1].objects.push(selectedObject);

			// Update canvas while preserving visibility
			canvas.remove(selectedObject);
			if (layers[objectLayer - 1].visible !== false) {
				canvas.add(selectedObject);
			}
			canvas.renderAll();
			updateObjectSelects();
			showPopup("Brought object forward");
		}
	}
}

function sendBackward() {
	const selectedObject = canvas.getActiveObject();
	if (selectedObject && !isLayerLocked()) {
		let objectLayer = -1;
		let objectIndex = -1;
		for (let i = 0; i < layers.length; i++) {
			const index = layers[i].objects.indexOf(selectedObject);
			if (index !== -1) {
				objectLayer = i;
				objectIndex = index;
				break;
			}
		}
		if (objectLayer < layers.length - 1) {
			// Remove object from current layer
			layers[objectLayer].objects.splice(objectIndex, 1);
			// Add object to new layer
			layers[objectLayer + 1].objects.push(selectedObject);

			// Update canvas while preserving visibility
			canvas.remove(selectedObject);
			if (layers[objectLayer + 1].visible !== false) {
				canvas.add(selectedObject);
			}
			canvas.renderAll();
			updateObjectSelects();
			showPopup("Sent object backward");
		}
	}
}

function bringToFront() {
	const selectedObject = canvas.getActiveObject();
	if (selectedObject && !isLayerLocked()) {
		let objectLayer = -1;
		let objectIndex = -1;
		for (let i = 0; i < layers.length; i++) {
			const index = layers[i].objects.indexOf(selectedObject);
			if (index !== -1) {
				objectLayer = i;
				objectIndex = index;
				break;
			}
		}
		if (objectLayer > 0) {
			// Remove object from current layer
			layers[objectLayer].objects.splice(objectIndex, 1);
			// Add object to front layer
			layers[0].objects.push(selectedObject);

			// Update canvas while preserving visibility
			canvas.remove(selectedObject);
			if (layers[0].visible !== false) {
				canvas.add(selectedObject);
			}
			canvas.renderAll();
			updateObjectSelects();
			showPopup("Brought object to front");
		}
	}
}

function sendToBack() {
	const selectedObject = canvas.getActiveObject();
	if (selectedObject && !isLayerLocked()) {
		let objectLayer = -1;
		let objectIndex = -1;
		for (let i = 0; i < layers.length; i++) {
			const index = layers[i].objects.indexOf(selectedObject);
			if (index !== -1) {
				objectLayer = i;
				objectIndex = index;
				break;
			}
		}
		if (objectLayer < layers.length - 1) {
			// Remove object from current layer
			layers[objectLayer].objects.splice(objectIndex, 1);
			// Add object to back layer
			layers[layers.length - 1].objects.push(selectedObject);

			// Update canvas while preserving visibility
			canvas.remove(selectedObject);
			if (layers[layers.length - 1].visible !== false) {
				canvas.add(selectedObject);
			}
			canvas.renderAll();
			updateObjectSelects();
			showPopup("Sent object to back");
		}
	}
}

// Adjustments
function changeColor() {
	const colorPicker = document.getElementById("colorPicker");
	if (!colorPicker) return;
	const color = colorPicker.value;
	const activeObject = canvas.getActiveObject();
	if (activeObject) {
		activeObject.set({ fill: color });
		canvas.renderAll();
	}
}

function changeOpacity() {
	const opacitySlider = document.getElementById("opacitySlider");
	if (!opacitySlider) return;
	const opacity = opacitySlider.value;
	const activeObject = canvas.getActiveObject();
	if (activeObject) {
		activeObject.set({ opacity: opacity });
		canvas.renderAll();
	}
}

function adjustBrightness() {
	const brightnessSlider = document.getElementById("brightnessSlider");
	if (!brightnessSlider) return;
	const brightness = brightnessSlider.value;
	const activeObject = canvas.getActiveObject();
	if (activeObject && activeObject.filters) {
		if (!Array.isArray(activeObject.filters)) {
			activeObject.filters = [];
		}
		activeObject.filters[0] = new fabric.Image.filters.Brightness({
			brightness: (brightness - 100) / 100,
		});
		activeObject.applyFilters();
		canvas.renderAll();
	}
}

function adjustContrast() {
	const contrastSlider = document.getElementById("contrastSlider");
	if (!contrastSlider) return;
	const contrast = contrastSlider.value;
	const activeObject = canvas.getActiveObject();
	if (activeObject && activeObject.filters) {
		if (!Array.isArray(activeObject.filters)) {
			activeObject.filters = [];
		}
		activeObject.filters[1] = new fabric.Image.filters.Contrast({
			contrast: contrast / 100,
		});
		activeObject.applyFilters();
		canvas.renderAll();
	}
}

// Segmentation Functions
function startTwoPointMode() {
	currentMode = "two-point";
	resetPoints();
	canvas.selection = false;
	layers.forEach((layer) => {
		if (!lockedLayers.includes(layer.name)) {
			layer.objects.forEach((obj) => {
				obj.selectable = obj.name === "uploadedImage";
				obj.evented = obj.name === "uploadedImage";
			});
		}
	});
	canvas.renderAll();
	showPopup("Two-point mode activated. Click two points on the image.");
}

function startMultiPointMode() {
	currentMode = "multi-point";
	resetPoints();
	canvas.selection = false;
	layers.forEach((layer) => {
		if (!lockedLayers.includes(layer.name)) {
			layer.objects.forEach((obj) => {
				obj.selectable = obj.name === "uploadedImage";
				obj.evented = obj.name === "uploadedImage";
			});
		}
	});
	canvas.renderAll();
	showPopup("Multi-point mode activated. Click points on the image.");
}

function resetPoints() {
	clickPoints = [];
	const pointMarkers = canvas
		.getObjects()
		.filter(
			(obj) =>
				obj.type === "circle" &&
				obj.radius === 5 &&
				obj.fill === "red" &&
				!obj.selectable
		);
	pointMarkers.forEach((marker) => canvas.remove(marker));
	canvas.renderAll();
	currentMode = null;
	canvas.selection = true;
	layers.forEach((layer) => {
		if (!lockedLayers.includes(layer.name)) {
			layer.objects.forEach((obj) => {
				obj.selectable = true;
				obj.evented = true;
			});
		}
	});
	canvas.renderAll();
	showPopup("Points reset.");
}

function toggleHoverSegment() {
	hoverSegmentationEnabled = !hoverSegmentationEnabled;
	const toggleButton = document.getElementById("toggleHoverSegment");
	toggleButton.textContent = hoverSegmentationEnabled
		? "Disable Hover Segmentation"
		: "Enable Hover Segmentation";
	if (hoverSegmentationEnabled) {
		if (originalImage) {
			originalImage.set("selectable", false);
			canvas.renderAll();
		}
		showPopup("Hover segmentation enabled");
	} else {
		if (currentMask) {
			canvas.remove(currentMask);
			currentMask = null;
		}
		if (originalImage) {
			originalImage.set("selectable", true);
			canvas.renderAll();
		}
		showPopup("Hover segmentation disabled");
	}
}

let hoverTimeout;
function performHoverSegmentation(point) {
	const dataURL = canvas.toDataURL("image/png");
	fetch("/hover_segment", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			image: dataURL,
			point: point,
		}),
	})
		.then((response) => response.json())
		.then((data) => {
			if (data.segmented_image) {
				if (currentMask) {
					canvas.remove(currentMask);
				}
				fabric.Image.fromURL(
					"data:image/png;base64," + data.segmented_image,
					(img) => {
						const scale = Math.min(
							canvas.width / img.width,
							canvas.height / img.height
						);
						img.scale(scale);
						img.set({
							left: (canvas.width - img.width * scale) / 2,
							top: (canvas.height - img.height * scale) / 2,
							selectable: false,
							opacity: 0.7,
						});
						canvas.add(img);
						currentMask = img;
						canvas.bringToFront(currentMask);
						canvas.renderAll();
					}
				);
			}
		})
		.catch((error) => {
			console.error("Hover segmentation error:", error);
			showPopup("Error: " + error.message);
		});
}

async function segment() {
	if (
		!originalImage ||
		(currentMode === "two-point" && clickPoints.length !== 2) ||
		(currentMode === "multi-point" && clickPoints.length < 1)
	) {
		showPopup("Please select an image and mark the required points.");
		return;
	}
	showPopup("Processing...", false);
	try {
		const response = await fetch("/segment", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				image: canvas.toDataURL(),
				points: clickPoints,
				mode: currentMode,
			}),
		});
		if (!response.ok) {
			throw new Error(`Segmentation failed with status: ${response.status}`);
		}
		const data = await response.json();
		if (data.segmented_image) {
			layerCount++;
			const layerName = `Segmented Layer ${layerCount}`;
			const newLayer = {
				name: layerName,
				objects: [],
				visible: true,
			};
			layers.unshift(newLayer);
			currentLayer = 0;
			fabric.Image.fromURL(
				`data:image/png;base64,${data.segmented_image}`,
				(img) => {
					img.scale(originalImage.scaleX);
					img.set({
						left: originalImage.left,
						top: originalImage.top,
						selectable: true,
						name: "segmentedRegion",
					});
					const bgRect = new fabric.Rect({
						left: originalImage.left,
						top: originalImage.top,
						width: img.width * originalImage.scaleX,
						height: img.height * originalImage.scaleY,
						fill: createCheckerboardPattern(),
						selectable: false,
						evented: false,
					});
					const group = new fabric.Group([bgRect, img], {
						left: originalImage.left,
						top: originalImage.top,
						selectable: true,
						name: "segmentedGroup",
					});
					canvas.add(group);
					newLayer.objects.push(group);
					segmentedImages.push(group);
					if (segmentedImages.length === 2) {
						document.querySelector(".blend-controls").classList.add("active");
						updateBlendEffect();
					}
					resetPoints();
					originalImage = null;
					canvas.renderAll();
					updateLayerList();
					showPopup("Segmentation completed successfully!");
				}
			);
		} else {
			throw new Error("No segmented image returned from API");
		}
	} catch (error) {
		console.error("Segmentation error:", error);
		showPopup("Error: " + error.message);
	}
}

// Blend Functions
function updateBlendEffect() {
	if (segmentedImages.length !== 2) return;
	const alpha = parseInt(document.getElementById("alphaSlider").value) / 100;
	const opacity1 =
		parseInt(document.getElementById("segment1Opacity").value) / 100;
	const opacity2 =
		parseInt(document.getElementById("segment2Opacity").value) / 100;
	canvas.getObjects().forEach((obj) => {
		obj.set("globalCompositeOperation", "source-over");
	});
	switch (currentBlendMode) {
		case "multiply":
			segmentedImages[0].set({
				opacity: opacity1,
				globalCompositeOperation: "source-over",
			});
			segmentedImages[1].set({
				opacity: opacity2,
				globalCompositeOperation: "multiply",
			});
			break;
		case "screen":
			segmentedImages[0].set({
				opacity: opacity1,
				globalCompositeOperation: "source-over",
			});
			segmentedImages[1].set({
				opacity: opacity2,
				globalCompositeOperation: "screen",
			});
			break;
		case "overlay":
			segmentedImages[0].set({
				opacity: opacity1,
				globalCompositeOperation: "source-over",
			});
			segmentedImages[1].set({
				opacity: opacity2,
				globalCompositeOperation: "overlay",
			});
			break;
		default:
			segmentedImages[0].set({
				opacity: opacity1 * (1 - alpha),
				globalCompositeOperation: "source-over",
			});
			segmentedImages[1].set({
				opacity: opacity2 * alpha,
				globalCompositeOperation: "source-over",
			});
			break;
	}
	canvas.renderAll();
}

function updateSegmentOpacities() {
	if (segmentedImages.length !== 2) return;
	const opacity1 =
		parseInt(document.getElementById("segment1Opacity").value) / 100;
	const opacity2 =
		parseInt(document.getElementById("segment2Opacity").value) / 100;
	document.getElementById("segment1Value").textContent =
		Math.round(opacity1 * 100) + "%";
	document.getElementById("segment2Value").textContent =
		Math.round(opacity2 * 100) + "%";
	segmentedImages[0].set("opacity", opacity1);
	segmentedImages[1].set("opacity", opacity2);
	canvas.renderAll();
}

function setBlendMode(mode) {
	currentBlendMode = mode;
	document.querySelectorAll(".blend-mode-btn").forEach((btn) => {
		btn.classList.remove("active");
		if (btn.textContent.toLowerCase() === mode) {
			btn.classList.add("active");
		}
	});
	updateBlendEffect();
	showPopup(`Blend mode set to ${mode}`);
}

function saveBlend() {
	if (segmentedImages.length !== 2) {
		showPopup("Need two segmented images to save blend");
		return;
	}
	const opacity1 =
		parseInt(document.getElementById("segment1Opacity").value) / 100;
	const opacity2 =
		parseInt(document.getElementById("segment2Opacity").value) / 100;
	const alpha = parseInt(document.getElementById("alphaSlider").value) / 100;
	const bounds = {
		left: Math.min(segmentedImages[0].left, segmentedImages[1].left),
		top: Math.min(segmentedImages[0].top, segmentedImages[1].top),
		width: Math.max(
			segmentedImages[0].width * segmentedImages[0].scaleX,
			segmentedImages[1].width * segmentedImages[1].scaleX
		),
		height: Math.max(
			segmentedImages[0].height * segmentedImages[0].scaleY,
			segmentedImages[1].height * segmentedImages[1].scaleY
		),
	};
	const tempCanvas = document.createElement("canvas");
	tempCanvas.width = bounds.width;
	tempCanvas.height = bounds.height;
	const tempCtx = tempCanvas.getContext("2d");
	const currentState = canvas.toObject();
	const originalVisibility = canvas.getObjects().map((obj) => obj.visible);
	try {
		canvas.getObjects().forEach((obj) => {
			if (!segmentedImages.includes(obj)) {
				obj.set("visible", false);
			}
		});
		const originalPositions = segmentedImages.map((img) => ({
			left: img.left,
			top: img.top,
		}));
		segmentedImages.forEach((img) => {
			img.set({
				left: img.left - bounds.left,
				top: img.top - bounds.top,
			});
		});
		switch (currentBlendMode) {
			case "multiply":
				segmentedImages[0].set({
					opacity: opacity1,
					globalCompositeOperation: "source-over",
					visible: true,
				});
				canvas.renderAll();
				tempCtx.drawImage(canvas.getElement(), 0, 0);
				tempCtx.globalCompositeOperation = "multiply";
				segmentedImages[0].set("visible", false);
				segmentedImages[1].set({
					opacity: opacity2,
					globalCompositeOperation: "source-over",
					visible: true,
				});
				canvas.renderAll();
				tempCtx.drawImage(canvas.getElement(), 0, 0);
				break;
			case "screen":
				segmentedImages[0].set({
					opacity: opacity1,
					globalCompositeOperation: "source-over",
					visible: true,
				});
				canvas.renderAll();
				tempCtx.drawImage(canvas.getElement(), 0, 0);
				tempCtx.globalCompositeOperation = "screen";
				segmentedImages[0].set("visible", false);
				segmentedImages[1].set({
					opacity: opacity2,
					globalCompositeOperation: "source-over",
					visible: true,
				});
				canvas.renderAll();
				tempCtx.drawImage(canvas.getElement(), 0, 0);
				break;
			case "overlay":
				segmentedImages[0].set({
					opacity: opacity1,
					globalCompositeOperation: "source-over",
					visible: true,
				});
				canvas.renderAll();
				tempCtx.drawImage(canvas.getElement(), 0, 0);
				tempCtx.globalCompositeOperation = "overlay";
				segmentedImages[0].set("visible", false);
				segmentedImages[1].set({
					opacity: opacity2,
					globalCompositeOperation: "source-over",
					visible: true,
				});
				canvas.renderAll();
				tempCtx.drawImage(canvas.getElement(), 0, 0);
				break;
			default:
				segmentedImages[0].set({
					opacity: opacity1 * (1 - alpha),
					globalCompositeOperation: "source-over",
					visible: true,
				});
				canvas.renderAll();
				tempCtx.drawImage(canvas.getElement(), 0, 0);
				tempCtx.globalCompositeOperation = "source-over";
				segmentedImages[0].set("visible", false);
				segmentedImages[1].set({
					opacity: opacity2 * alpha,
					globalCompositeOperation: "source-over",
					visible: true,
				});
				canvas.renderAll();
				tempCtx.drawImage(canvas.getElement(), 0, 0);
				break;
		}
		const blendedImageData = tempCanvas.toDataURL("image/png");
		canvas.getObjects().forEach((obj, index) => {
			obj.set("visible", originalVisibility[index]);
		});
		segmentedImages.forEach((img, index) => {
			img.set({
				left: originalPositions[index].left,
				top: originalPositions[index].top,
				opacity: 1,
				globalCompositeOperation: "source-over",
			});
		});
		segmentedImages.forEach((img) => canvas.remove(img));
		fabric.Image.fromURL(blendedImageData, (blendedImg) => {
			blendedImg.set({
				left: bounds.left,
				top: bounds.top,
				selectable: true,
				name: "blendedImage",
			});
			canvas.add(blendedImg);
			if (currentLayer === null) {
				addLayer();
			}
			layers[currentLayer].objects.push(blendedImg);
			segmentedImages = [];
			document.querySelector(".blend-controls").classList.remove("active");
			blendMode = false;
			canvas.renderAll();
			updateLayerList();
			showPopup("Blend saved successfully!");
		});
	} catch (error) {
		console.error("Blend error:", error);
		canvas.getObjects().forEach((obj, index) => {
			obj.set("visible", originalVisibility[index]);
		});
		canvas.renderAll();
		showPopup("Error saving blend: " + error.message);
	}
}

function createCheckerboardPattern() {
	const patternCanvas = document.createElement("canvas");
	const size = 10;
	patternCanvas.width = size * 2;
	patternCanvas.height = size * 2;
	const ctx = patternCanvas.getContext("2d");
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, size * 2, size * 2);
	ctx.fillStyle = "#e0e0e0";
	ctx.fillRect(0, 0, size, size);
	ctx.fillRect(size, size, size, size);
	return new fabric.Pattern({
		source: patternCanvas,
		repeat: "repeat",
	});
}

// Relationships
function addRelationship() {
	const object1Select = document.getElementById("object1");
	const object2Select = document.getElementById("object2");
	const relationshipTypeSelect = document.getElementById("relationshipType");
	if (!object1Select || !object2Select || !relationshipTypeSelect) return;
	const object1Index = object1Select.value;
	const object2Index = object2Select.value;
	const relationshipType = relationshipTypeSelect.value;
	if (object1Index && object2Index && currentLayer !== null) {
		const obj1 = layers[currentLayer].objects[object1Index];
		const obj2 = layers[currentLayer].objects[object2Index];
		relationships.push({ object1: obj1, object2: obj2, relationshipType });
		showPopup("Relationship added!");
	}
}

function updateObjectSelects() {
	const object1Select = document.getElementById("object1");
	const object2Select = document.getElementById("object2");
	if (!object1Select || !object2Select) return;
	object1Select.innerHTML = "<option value=''>Select Object 1</option>";
	object2Select.innerHTML = "<option value=''>Select Object 2</option>";
	layers.forEach((layer) => {
		layer.objects.forEach((object, index) => {
			const option = document.createElement("option");
			option.value = index;
			option.textContent = `${layer.name} - ${object.type || "object"}`;
			const option2 = option.cloneNode(true);
			object1Select.appendChild(option);
			object2Select.appendChild(option2);
		});
	});
}

// Image Generation
document.getElementById("imageForm").addEventListener("submit", function (e) {
	e.preventDefault();
	const prompt = document.getElementById("imagePrompt").value;
	if (!prompt.trim()) {
		showPopup("Please enter a prompt for image generation.");
		return;
	}
	showPopup("Generating image...", false);
	fetch("/generate-image", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ prompt }),
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error("Failed to generate image.");
			}
			return response.json();
		})
		.then((data) => {
			if (data.image_url) {
				const imgElement = new Image();
				imgElement.src = data.image_url;
				imgElement.id = "generated-image";
				imgElement.draggable = true;
				imgElement.style = `
                width: 150px;
                cursor: grab;
                margin-top: 10px;
                border: 1px solid #ccc;
                border-radius: 5px;
            `;
				const sidebar = document.querySelector(
					".ai-generation-section .panel-content"
				);
				sidebar.appendChild(imgElement);
				imgElement.addEventListener("dragstart", (e) => {
					e.dataTransfer.setData("text/plain", data.image_url);
					showPopup("Drag the image to the canvas!");
				});
				showPopup("Image generated successfully!");
			} else {
				throw new Error("Image URL not returned from backend.");
			}
		})
		.catch((error) => {
			console.error("Error generating image:", error);
			showPopup("Error generating image: " + error.message);
		});
});

// JSON Generation
function generateJSON() {
	const canvasJSON = canvas.toJSON();
	const jsonContainer = document.getElementById("jsonContainer");
	if (jsonContainer) {
		jsonContainer.innerText = JSON.stringify(canvasJSON, null, 2);
	}
}

// Theme Toggle
function toggleTheme() {
	const body = document.body;
	const themeToggle = document.querySelector(".theme-toggle");
	if (!themeToggle) return;
	const icon = themeToggle.querySelector("i");
	const text = themeToggle.querySelector("span");
	if (body.getAttribute("data-theme") === "dark") {
		body.removeAttribute("data-theme");
		if (icon) icon.classList.replace("fa-sun", "fa-moon");
		if (text) text.textContent = "Dark Mode";
	} else {
		body.setAttribute("data-theme", "dark");
		if (icon) icon.classList.replace("fa-moon", "fa-sun");
		if (text) text.textContent = "Light Mode";
	}
}

// Range Input Styling
document.addEventListener("DOMContentLoaded", function () {
	const rangeInputs = document.querySelectorAll('input[type="range"]');
	rangeInputs.forEach((input) => {
		updateRangeValue(input);
		input.addEventListener("input", function () {
			updateRangeValue(this);
		});
	});
	function updateRangeValue(input) {
		const min = input.min ? parseFloat(input.min) : 0;
		const max = input.max ? parseFloat(input.max) : 100;
		const val = parseFloat(input.value);
		const percentage = ((val - min) / (max - min)) * 100;
		input.style.setProperty("--value", `${percentage}%`);
	}
});

function renameLayer() {
	if (currentLayer !== null && layers[currentLayer]) {
		const newName = prompt("Enter new layer name:", layers[currentLayer].name);
		if (newName && newName.trim() !== "") {
			layers[currentLayer].name = newName.trim();
			updateLayerList();
			showPopup(`Layer renamed to ${newName}`);
		}
	}
}
