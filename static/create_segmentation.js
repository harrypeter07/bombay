// // Initialize Fabric.js canvas (assumes canvas is already defined in HTML)
// const canvas = new fabric.Canvas("canvas");
// let layers = [];
// let layerCount = 0;
// let currentLayer = null;
// let lockedLayers = [];

// document.addEventListener("DOMContentLoaded", () => {
// 	// Initialize with one layer by default
// 	addLayer();
// });

// // Helper function to show popup messages
// function showPopup(message) {
// 	const popup = document.createElement("div");
// 	popup.textContent = message;
// 	popup.style.position = "fixed";
// 	popup.style.top = "20px";
// 	popup.style.left = "50%";
// 	popup.style.transform = "translateX(-50%)";
// 	popup.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
// 	popup.style.color = "white";
// 	popup.style.padding = "10px 20px";
// 	popup.style.borderRadius = "5px";
// 	document.body.appendChild(popup);
// 	setTimeout(() => {
// 		document.body.removeChild(popup);
// 	}, 2000);
// }

// // Update the layer list UI
// function updateLayerList() {
// 	const layerList = document.getElementById("layer-list");
// 	const layerCountSpan = document.getElementById("layer-count");
// 	layerList.innerHTML = "";

// 	layers.forEach((layer, index) => {
// 		const layerItem = document.createElement("div");
// 		layerItem.className = "layer-item";
// 		layerItem.draggable = true;
// 		layerItem.dataset.index = index;

// 		// Placeholder image (blank square)
// 		const img = document.createElement("img");
// 		img.src =
// 			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABYSURBVFhH7dNBCgAgDADBtf//s7vswE4ME8EIeN2VZQYG8dOQJ7tG3iV2EjuJnWROcie5k9xJ7iR3kjuJneROcie5k9xJ7iR3kjuJneROcie5k9xJ7iR3kjvJneROcietlF7iFAAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyNC0xMC0yOVQwMjo1Mzo1NSswMDowMNWdKRsAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjQtMTAtMjlUMDI6NTM6NTUrMDA6MDDpfi5aAAAAAElFTkSuQmCC"; // Base64 for a 40x40 gray square
// 		img.alt = layer.name;

// 		// Layer name
// 		const span = document.createElement("span");
// 		span.textContent = layer.name;

// 		layerItem.appendChild(img);
// 		layerItem.appendChild(span);
// 		layerList.appendChild(layerItem);

// 		// Drag and drop event listeners
// 		layerItem.addEventListener("dragstart", (e) => {
// 			e.dataTransfer.setData("text/plain", index);
// 		});

// 		layerItem.addEventListener("dragover", (e) => {
// 			e.preventDefault();
// 			layerList.classList.add("drag-over");
// 		});

// 		layerItem.addEventListener("dragleave", () => {
// 			layerList.classList.remove("drag-over");
// 		});

// 		layerItem.addEventListener("drop", (e) => {
// 			e.preventDefault();
// 			layerList.classList.remove("drag-over");
// 			const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
// 			const toIndex = parseInt(e.target.closest(".layer-item").dataset.index);

// 			if (fromIndex !== toIndex) {
// 				reorderLayers(fromIndex, toIndex);
// 			}
// 		});

// 		layerItem.addEventListener("click", () => {
// 			currentLayer = index;
// 			showPopup(`Selected ${layers[currentLayer].name}`);
// 		});
// 	});

// 	layerCountSpan.textContent = layers.length;
// }

// // Reorder layers and sync with canvas
// function reorderLayers(fromIndex, toIndex) {
// 	const [movedLayer] = layers.splice(fromIndex, 1);
// 	layers.splice(toIndex, 0, movedLayer);

// 	// Sync canvas object order
// 	const layerObjects = layers.map((layer) => layer.objects).flat();
// 	canvas.clear();
// 	layerObjects.forEach((obj) => canvas.add(obj));
// 	canvas.renderAll();

// 	// Update layer selection
// 	if (currentLayer === fromIndex) {
// 		currentLayer = toIndex;
// 	} else if (currentLayer === toIndex && fromIndex < toIndex) {
// 		currentLayer--;
// 	} else if (currentLayer === toIndex && fromIndex > toIndex) {
// 		currentLayer++;
// 	}
// 	updateLayerList();
// 	showPopup(`Moved ${movedLayer.name} to position ${toIndex + 1}`);

// 	// Ensure locked layers remain locked
// 	layers.forEach((layer, index) => {
// 		if (lockedLayers.includes(layer.name)) {
// 			layer.objects.forEach((obj) => {
// 				obj.selectable = false;
// 				obj.evented = false;
// 			});
// 		}
// 	});
// 	canvas.renderAll();

// 	// Update currentLayer if needed
// 	if (currentLayer === fromIndex) {
// 		currentLayer = toIndex;
// 	} else if (currentLayer === toIndex && fromIndex < toIndex) {
// 		currentLayer--;
// 	} else if (currentLayer === toIndex && fromIndex > toIndex) {
// 		currentLayer++;
// 	}

// 	updateLayerList();
// 	showPopup(`Moved ${movedLayer.name} to position ${toIndex + 1}`);
// }

// // Layer Management Functions
// function addLayer() {
// 	layerCount++;
// 	const layerName = `Layer ${layerCount}`;
// 	layers.push({ name: layerName, objects: [] });
// 	currentLayer = layers.length - 1;
// 	updateLayerList();
// 	showPopup(`${layerName} added`);
// }

// function removeLayer() {
// 	if (currentLayer !== null && layers[currentLayer]) {
// 		const removedLayer = layers.splice(currentLayer, 1)[0];
// 		removedLayer.objects.forEach((obj) => canvas.remove(obj));
// 		canvas.renderAll();
// 		currentLayer = layers.length > 0 ? layers.length - 1 : null;
// 		updateLayerList();
// 		showPopup(`${removedLayer.name} removed`);
// 	}
// }

// function renameLayer() {
// 	if (currentLayer !== null && layers[currentLayer]) {
// 		const newName = prompt("Enter new layer name:", layers[currentLayer].name);
// 		if (newName) {
// 			layers[currentLayer].name = newName;
// 			updateLayerList();
// 			showPopup(`Layer renamed to ${newName}`);
// 		}
// 	}
// }

function addImage() {
	const input = document.getElementById("imageUpload");
	const file = input.files[0];
	if (!file) {
		showPopup("Please select an image file first");
		return;
	}

	if (!file.type.startsWith("image/")) {
		showPopup("Please select a valid image file");
		return;
	}

	layerCount++;
	const layerName = `Image Layer ${layerCount}`;
	const newLayer = {
		name: layerName,
		objects: [],
		visible: true,
		locked: false,
	};
	layers.push(newLayer);
	currentLayer = layers.length - 1;

	const reader = new FileReader();
	reader.onload = (e) => {
		const img = new Image();
		img.onload = function () {
			const fabricImage = new fabric.Image(img, {
				left: 100,
				top: 100,
				selectable: !newLayer.locked,
				evented: !newLayer.locked,
			});

			if (img.width > canvas.width || img.height > canvas.height) {
				const scale = Math.min(
					(canvas.width * 0.8) / img.width,
					(canvas.height * 0.8) / img.height
				);
				fabricImage.scale(scale);
			}

			newLayer.objects.push(fabricImage);
			canvas.add(fabricImage);
			canvas.bringToFront(fabricImage);
			canvas.renderAll();

			// Update layer list UI
			const layerList = document.getElementById("layer-list");
			const layerItem = document.createElement("div");
			layerItem.className = `layer-item${newLayer.locked ? " locked" : ""}${
				!newLayer.visible ? " hidden" : ""
			}`;
			layerItem.draggable = true;
			layerItem.dataset.index = layers.length - 1;

			// Create thumbnail
			const thumbnail = document.createElement("img");
			thumbnail.src = e.target.result;
			thumbnail.alt = layerName;

			// Layer name
			const span = document.createElement("span");
			span.textContent = layerName;

			// Layer controls
			const controls = document.createElement("div");
			controls.className = "layer-controls";

			// Visibility toggle
			const visibilityBtn = document.createElement("button");
			visibilityBtn.innerHTML = newLayer.visible ? "👁️" : "👁️‍🗨️";
			visibilityBtn.title = "Toggle visibility";
			visibilityBtn.onclick = (e) => {
				e.stopPropagation();
				toggleLayerVisibility(layers.length - 1);
			};

			// Lock toggle
			const lockBtn = document.createElement("button");
			lockBtn.innerHTML = newLayer.locked ? "🔒" : "🔓";
			lockBtn.title = "Toggle lock";
			lockBtn.onclick = (e) => {
				e.stopPropagation();
				toggleLayerLock(layers.length - 1);
			};

			controls.appendChild(visibilityBtn);
			controls.appendChild(lockBtn);

			layerItem.appendChild(thumbnail);
			layerItem.appendChild(span);
			layerItem.appendChild(controls);

			// Add drag and drop functionality
			layerItem.addEventListener("dragstart", (e) => {
				e.dataTransfer.setData("text/plain", layers.length - 1);
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

				if (fromIndex !== toIndex) {
					reorderLayers(fromIndex, toIndex);
				}
			});

			layerItem.addEventListener("click", () => {
				currentLayer = layers.length - 1;
				showPopup(`Selected ${layerName}`);
			});

			layerList.insertBefore(layerItem, layerList.firstChild);
			const layerCountSpan = document.getElementById("layer-count");
			layerCountSpan.textContent = layers.length;

			showPopup(`Added ${layerName}`);
		};
		img.src = e.target.result;
	};
	reader.readAsDataURL(file);
}

// Add object to current layer
function addObjectToLayer(object) {
	if (
		currentLayer !== null &&
		!lockedLayers.includes(layers[currentLayer].name)
	) {
		layers[currentLayer].objects.push(object);
		updateLayerList();
	} else {
		showPopup("Cannot add object: Layer is locked or no active layer selected");
	}
}

// Basic Tools
function addRectangle() {
	const rect = new fabric.Rect({
		left: 100,
		top: 100,
		fill: "#ff0000",
		width: 100,
		height: 100,
		selectable: true,
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
		selectable: true,
	});
	canvas.add(circle);
	addObjectToLayer(circle);
}

function addLine() {
	const line = new fabric.Line([50, 50, 200, 200], {
		left: 50,
		top: 50,
		stroke: "#000000",
		selectable: true,
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
		canvas.remove(selectedObject);
		updateLayerList();
		canvas.renderAll();
	}
}

function clearCanvas() {
	canvas.clear();
	layers = [];
	layerCount = 0;
	currentLayer = null;
	lockedLayers = [];
	addLayer();
	canvas.renderAll();
}

// Adjustments
function changeColor() {
	const color = document.getElementById("colorPicker").value;
	const activeObject = canvas.getActiveObject();
	if (activeObject) {
		activeObject.set({ fill: color });
		canvas.renderAll();
	}
}

function changeOpacity() {
	const opacity = document.getElementById("opacitySlider").value;
	const activeObject = canvas.getActiveObject();
	if (activeObject) {
		activeObject.set({ opacity: opacity });
		canvas.renderAll();
	}
	document.getElementById("opacityValue").textContent = `${Math.round(
		opacity * 100
	)}%`;
}

// Relationships
function addRelationship() {
	const object1Index = document.getElementById("object1").value;
	const object2Index = document.getElementById("object2").value;
	const relationshipType = document.getElementById("relationshipType").value;

	if (object1Index && object2Index && currentLayer !== null) {
		const obj1 = layers[currentLayer].objects[object1Index];
		const obj2 = layers[currentLayer].objects[object2Index];
		relationships.push({ object1: obj1, object2: obj2, relationshipType });
		showPopup("Relationship added!");
	}
}

// Generate JSON
function generateJSON() {
	const canvasJSON = canvas.toJSON();
	document.getElementById("jsonContainer").innerText = JSON.stringify(
		canvasJSON,
		null,
		2
	);
}

// Theme Toggle
function toggleTheme() {
	const body = document.body;
	const themeToggle = document.querySelector(".theme-toggle");
	const icon = themeToggle.querySelector("i");
	const text = themeToggle.querySelector("span");

	if (body.getAttribute("data-theme") === "dark") {
		body.removeAttribute("data-theme");
		icon.classList.replace("fa-sun", "fa-moon");
		text.textContent = "Dark Mode";
	} else {
		body.setAttribute("data-theme", "dark");
		icon.classList.replace("fa-moon", "fa-sun");
		text.textContent = "Light Mode";
	}
}

// Panel Collapsing
const panels = document.querySelectorAll(".panel");
panels.forEach((panel) => {
	const title = panel.querySelector(".panel-title");
	title.addEventListener("click", () => {
		panel.classList.toggle("collapsed");
	});
});
