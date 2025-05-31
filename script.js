// // Initialize Fabric.js canvas
// const canvas = new fabric.Canvas("canvas");
// let layers = [];
// let layerCount = 0;
// let currentLayer = null;
// let lockedLayers = [];
// let relationships = [];

// document.addEventListener("DOMContentLoaded", () => {
// 	addLayer(); // Initialize with one layer
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
// 	popup.style.zIndex = "1000";
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
// 		layerItem.className = `layer-item ${layer.locked ? "locked" : ""} ${
// 			layer.visible ? "" : "hidden"
// 		}`;
// 		layerItem.draggable = true;
// 		layerItem.dataset.index = index;

// 		const img = document.createElement("img");
// 		img.src =
// 			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABYSURBVFhH7dNBCgAgDADBtf//s7vswE4ME8EIeN2VZQYG8dOQJ7tG3iV2EjuJnWROcie5k9xJ7iR3kjuJneROcie5k9xJ7iR3kjuJneROcie5k9xJ7iR3kjvJneROcietlF7iFAAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyNC0xMC0yOVQwMjo1Mzo1NSswMDowMNWdKRsAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjQtMTAtMjlUMDI6NTM6NTUrMDA6MDDpfi5aAAAAAElFTkSuQmCC";
// 		img.alt = layer.name;

// 		const controls = document.createElement("div");
// 		controls.className = "layer-controls";

// 		const visibilityBtn = document.createElement("button");
// 		visibilityBtn.innerHTML = layer.visible ? "👁️" : "👁️‍🗨️";
// 		visibilityBtn.onclick = (e) => {
// 			e.stopPropagation();
// 			layer.visible = !layer.visible;
// 			layer.objects.forEach((obj) => (obj.visible = layer.visible));
// 			canvas.renderAll();
// 			updateLayerList();
// 		};

// 		const lockBtn = document.createElement("button");
// 		lockBtn.innerHTML = layer.locked ? "🔒" : "🔓";
// 		lockBtn.onclick = (e) => {
// 			e.stopPropagation();
// 			layer.locked = !layer.locked;
// 			layer.objects.forEach((obj) => {
// 				obj.selectable = !layer.locked;
// 				obj.evented = !layer.locked;
// 			});
// 			canvas.renderAll();
// 			updateLayerList();
// 		};

// 		controls.appendChild(visibilityBtn);
// 		controls.appendChild(lockBtn);

// 		const span = document.createElement("span");
// 		span.textContent = layer.name;

// 		layerItem.appendChild(img);
// 		layerItem.appendChild(span);
// 		layerItem.appendChild(controls);
// 		layerList.appendChild(layerItem);

// 		layerItem.addEventListener("dragstart", (e) => {
// 			if (layer.locked) {
// 				e.preventDefault();
// 				return;
// 			}
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
// 			if (fromIndex !== toIndex && !layers[fromIndex].locked) {
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

// 	const layerObjects = layers.map((layer) => layer.objects).flat();
// 	canvas.clear();
// 	layerObjects.forEach((obj) => canvas.add(obj));
// 	canvas.renderAll();

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

// function lockLayer() {
// 	if (currentLayer !== null && layers[currentLayer]) {
// 		const layerName = layers[currentLayer].name;
// 		if (!lockedLayers.includes(layerName)) {
// 			lockedLayers.push(layerName);
// 			layers[currentLayer].objects.forEach((obj) => {
// 				obj.selectable = false;
// 				obj.evented = false;
// 			});
// 			canvas.renderAll();
// 			showPopup(`${layerName} locked`);
// 		}
// 	}
// }

// function unlockLayer() {
// 	if (currentLayer !== null && layers[currentLayer]) {
// 		const layerName = layers[currentLayer].name;
// 		const index = lockedLayers.indexOf(layerName);
// 		if (index !== -1) {
// 			lockedLayers.splice(index, 1);
// 			layers[currentLayer].objects.forEach((obj) => {
// 				obj.selectable = true;
// 				obj.evented = true;
// 			});
// 			canvas.renderAll();
// 			showPopup(`${layerName} unlocked`);
// 		}
// 	}
// }

// // Add image to canvas
// function addImage() {
// 	const input = document.getElementById("imageUpload");
// 	const file = input.files[0];
// 	if (!file) {
// 		showPopup("Please select an image file first");
// 		return;
// 	}

// 	if (!file.type.startsWith("image/")) {
// 		showPopup("Please select a valid image file");
// 		return;
// 	}

// 	const reader = new FileReader();
// 	reader.onload = (e) => {
// 		fabric.Image.fromURL(
// 			e.target.result,
// 			(img) => {
// 				if (!img) {
// 					showPopup("Failed to load image");
// 					return;
// 				}

// 				const maxWidth = canvas.width * 0.8;
// 				const maxHeight = canvas.height * 0.8;
// 				if (img.width > maxWidth || img.height > maxHeight) {
// 					const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
// 					img.scale(scale);
// 				}

// 				img.set({
// 					left: (canvas.width - img.width * (img.scaleX || 1)) / 2,
// 					top: (canvas.height - img.height * (img.scaleY || 1)) / 2,
// 					selectable: true,
// 					evented: true,
// 				});

// 				canvas.add(img);
// 				addObjectToLayer(img);
// 				canvas.renderAll();
// 				showPopup("Image added successfully");
// 			},
// 			{ crossOrigin: "anonymous" }
// 		);
// 	};
// 	reader.onerror = () => {
// 		showPopup("Error reading image file");
// 	};
// 	reader.readAsDataURL(file);
// }

// // Add object to current layer
// function addObjectToLayer(object) {
// 	if (
// 		currentLayer !== null &&
// 		!lockedLayers.includes(layers[currentLayer].name)
// 	) {
// 		layers[currentLayer].objects.push(object);
// 		updateLayerList();
// 	} else {
// 		showPopup("Cannot add object: Layer is locked or no active layer selected");
// 	}
// }

// // Basic Tools
// function addRectangle() {
// 	const rect = new fabric.Rect({
// 		left: 100,
// 		top: 100,
// 		fill: "#ff0000",
// 		width: 100,
// 		height: 100,
// 		selectable: true,
// 	});
// 	canvas.add(rect);
// 	addObjectToLayer(rect);
// }

// function addCircle() {
// 	const circle = new fabric.Circle({
// 		left: 200,
// 		top: 200,
// 		fill: "#00ff00",
// 		radius: 50,
// 		selectable: true,
// 	});
// 	canvas.add(circle);
// 	addObjectToLayer(circle);
// }

// function addLine() {
// 	const line = new fabric.Line([50, 50, 200, 200], {
// 		left: 50,
// 		top: 50,
// 		stroke: "#000000",
// 		selectable: true,
// 	});
// 	canvas.add(line);
// 	addObjectToLayer(line);
// }

// function removeSelectedObject() {
// 	const selectedObject = canvas.getActiveObject();
// 	if (selectedObject) {
// 		layers.forEach((layer) => {
// 			const objIndex = layer.objects.indexOf(selectedObject);
// 			if (objIndex > -1) {
// 				layer.objects.splice(objIndex, 1);
// 			}
// 		});
// 		canvas.remove(selectedObject);
// 		updateLayerList();
// 		canvas.renderAll();
// 	}
// }

// function clearCanvas() {
// 	canvas.clear();
// 	layers = [];
// 	layerCount = 0;
// 	currentLayer = null;
// 	lockedLayers = [];
// 	addLayer();
// 	canvas.renderAll();
// }

// // Adjustments
// function changeColor() {
// 	const color = document.getElementById("colorPicker").value;
// 	const activeObject = canvas.getActiveObject();
// 	if (activeObject) {
// 		activeObject.set({ fill: color });
// 		canvas.renderAll();
// 	}
// }

// function changeOpacity() {
// 	const opacity = document.getElementById("opacitySlider").value;
// 	const activeObject = canvas.getActiveObject();
// 	if (activeObject) {
// 		activeObject.set({ opacity: opacity });
// 		canvas.renderAll();
// 	}
// 	document.getElementById("opacityValue").textContent = `${Math.round(
// 		opacity * 100
// 	)}%`;
// }

// // Relationships
// function addRelationship() {
// 	const object1Index = document.getElementById("object1").value;
// 	const object2Index = document.getElementById("object2").value;
// 	const relationshipType = document.getElementById("relationshipType").value;

// 	if (object1Index && object2Index && currentLayer !== null) {
// 		const obj1 = layers[currentLayer].objects[object1Index];
// 		const obj2 = layers[currentLayer].objects[object2Index];
// 		relationships.push({ object1: obj1, object2: obj2, relationshipType });
// 		showPopup("Relationship added!");
// 	}
// }

// // Generate JSON
// function generateJSON() {
// 	const canvasJSON = canvas.toJSON();
// 	document.getElementById("jsonContainer").innerText = JSON.stringify(
// 		canvasJSON,
// 		null,
// 		2
// 	);
// }

// // Theme Toggle
// function toggleTheme() {
// 	const body = document.body;
// 	const themeToggle = document.querySelector(".theme-toggle");
// 	const icon = themeToggle.querySelector("i");
// 	const text = themeToggle.querySelector("span");

// 	if (body.getAttribute("data-theme") === "dark") {
// 		body.removeAttribute("data-theme");
// 		icon.classList.replace("fa-sun", "fa-moon");
// 		text.textContent = "Dark Mode";
// 	} else {
// 		body.setAttribute("data-theme", "dark");
// 		icon.classList.replace("fa-moon", "fa-sun");
// 		text.textContent = "Light Mode";
// 	}
// }

// // Panel Collapsing
// const panels = document.querySelectorAll(".panel");
// panels.forEach((panel) => {
// 	const title = panel.querySelector(".panel-title");
// 	title.addEventListener("click", () => {
// 		panel.classList.toggle("collapsed");
// 	});
// });
