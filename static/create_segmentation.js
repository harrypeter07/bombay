// Initialize Fabric.js canvas (assumes canvas is already defined in HTML)
const canvas = new fabric.Canvas("canvas");
let layers = [];
let layerCount = 0;
let currentLayer = null;
let lockedLayers = [];
let relationships = [];
let clickPoints = [];
let segmentationMode = false;

document.addEventListener("DOMContentLoaded", () => {


	
    // Initialize with one layer by default



    addLayer();
    
    // Add event listeners for sliders
    const opacitySlider = document.getElementById('opacitySlider');
    const brightnessSlider = document.getElementById('brightnessSlider');
    const contrastSlider = document.getElementById('contrastSlider');
    
    if (opacitySlider) {
        opacitySlider.addEventListener('input', function() {
            document.getElementById('opacityValue').textContent = `${Math.round(this.value * 100)}%`;
            changeOpacity();
        });
    }
    
    if (brightnessSlider) {
        brightnessSlider.addEventListener('input', function() {
            document.getElementById('brightnessValue').textContent = `${this.value}%`;
            adjustBrightness();
        });
    }
    
    if (contrastSlider) {
        contrastSlider.addEventListener('input', function() {
            document.getElementById('contrastValue').textContent = `${this.value}%`;
            adjustContrast();
        });
    }
    
    // Setup canvas drop event for generated images
    const canvasContainer = document.getElementById("canvas-container");
    if (canvasContainer) {
        canvasContainer.addEventListener("dragover", (e) => {
            e.preventDefault();
            canvasContainer.style.borderColor = "#28a745"; // Highlight the canvas when dragging
        });

        canvasContainer.addEventListener("dragleave", () => {
            canvasContainer.style.borderColor = "#007bff"; // Reset border color
        });

        canvasContainer.addEventListener("drop", (e) => {
            e.preventDefault();
            canvasContainer.style.borderColor = "#007bff";

            const imageUrl = e.dataTransfer.getData("text/plain"); // Get the image URL from drag

            // Add the image to the fabric.js canvas
            fabric.Image.fromURL(imageUrl, (img) => {
                img.scale(0.5); // Scale image
                img.set({
                    left: e.offsetX - img.width / 2, // Position the image on the drop point
                    top: e.offsetY - img.height / 2,
                    hasControls: true, // Enable resize and controls
                });
                canvas.add(img); // Add the image to the canvas
                addObjectToLayer(img); // Add the image to the current layer
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
});

// Canvas event listeners for segmentation
canvas.on('mouse:down', function (options) {
    if (segmentationMode) {
        const pointer = canvas.getPointer(options.e);
        clickPoints.push([pointer.x, pointer.y]);

        // Draw point marker
        const circle = new fabric.Circle({
            left: pointer.x - 5,
            top: pointer.y - 5,
            radius: 5,
            fill: 'red',
            selectable: false
        });
        canvas.add(circle);
    }
});

// Helper function to show popup messages
function showPopup(message) {
    const popup = document.getElementById("popup");
    if (popup) {
        popup.innerText = message;
        popup.style.display = "block";
        setTimeout(() => {
            popup.style.display = "none";
        }, 2000);
    } else {
        // Fallback if popup element doesn't exist
        const popupDiv = document.createElement("div");
        popupDiv.textContent = message;
        popupDiv.style.position = "fixed";
        popupDiv.style.top = "20px";
        popupDiv.style.left = "50%";
        popupDiv.style.transform = "translateX(-50%)";
        popupDiv.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        popupDiv.style.color = "white";
        popupDiv.style.padding = "10px 20px";
        popupDiv.style.borderRadius = "5px";
        popupDiv.style.zIndex = "1000";
        document.body.appendChild(popupDiv);
        setTimeout(() => {
            document.body.removeChild(popupDiv);
        }, 2000);
    }
}

// Update the layer list UI
function updateLayerList() {
    const layerList = document.getElementById("layer-list");
    const layerCountSpan = document.getElementById("layer-count");
    
    if (!layerList || !layerCountSpan) return;
    
    layerList.innerHTML = "";

    layers.forEach((layer, index) => {
        const layerItem = document.createElement("div");
        layerItem.className = "layer-item";
        layerItem.draggable = true;
        layerItem.dataset.index = index;

        // Apply locked style if layer is locked
        if (lockedLayers.includes(layer.name)) {
            layerItem.style.opacity = '0.5';
            layerItem.style.cursor = 'not-allowed';
        }

        // Placeholder image (blank square)
        const img = document.createElement("img");
        img.src =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        img.alt = layer.name;

        // Layer controls
        const controls = document.createElement("div");
        controls.className = "layer-controls";

        const visibilityBtn = document.createElement("button");
        visibilityBtn.innerHTML = layer.visible !== false ? "👁️" : "👁️‍🗨️";
        visibilityBtn.onclick = (e) => {
            e.stopPropagation();
            layer.visible = layer.visible !== false ? false : true;
            layer.objects.forEach((obj) => (obj.visible = layer.visible));
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

        // Layer name
        const span = document.createElement("span");
        span.textContent = layer.name;

        layerItem.appendChild(img);
        layerItem.appendChild(span);
        layerItem.appendChild(controls);
        layerList.appendChild(layerItem);

        // Drag and drop event listeners
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

            if (fromIndex !== toIndex && !lockedLayers.includes(layers[fromIndex].name)) {
                reorderLayers(fromIndex, toIndex);
            }
        });

        layerItem.addEventListener("click", () => {
            currentLayer = index;
            showPopup(`Selected ${layers[currentLayer].name}`);
        });
    });

    layerCountSpan.textContent = layers.length;
    updateObjectSelects();
}

// Reorder layers and sync with canvas
function reorderLayers(fromIndex, toIndex) {
    const [movedLayer] = layers.splice(fromIndex, 1);
    layers.splice(toIndex, 0, movedLayer);

    // Re-render all objects in correct z-order
    // Important: We need to add objects in REVERSE order of layers array
    // because in Fabric.js, later objects appear on top
    canvas.clear();
    
    // Start from the bottom layer (last in array) and work up
    for (let i = layers.length - 1; i >= 0; i--) {
        layers[i].objects.forEach(obj => canvas.add(obj));
    }
    
    canvas.renderAll();

    // Update layer selection
    if (currentLayer === fromIndex) {
        currentLayer = toIndex;
    } else if (currentLayer > fromIndex && currentLayer <= toIndex) {
        currentLayer--;
    } else if (currentLayer < fromIndex && currentLayer >= toIndex) {
        currentLayer++;
    }
    
    updateLayerList();
    showPopup(`Moved ${movedLayer.name} to position ${toIndex + 1}`);

    // Ensure locked layers remain locked
    layers.forEach((layer) => {
        if (lockedLayers.includes(layer.name)) {
            layer.objects.forEach((obj) => {
                obj.selectable = false;
                obj.evented = false;
            });
        }
    });
    
    canvas.renderAll();
}

// Layer Management Functions
function addLayer() {
    layerCount++;
    const layerName = `Layer ${layerCount}`;
    
    // Add new layer at the beginning (top) of the array
    layers.unshift({ 
        name: layerName, 
        objects: [],
        visible: true 
    });
    
    currentLayer = 0; // Set current layer to the new top layer
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

function renameLayer() {
    if (currentLayer !== null && layers[currentLayer]) {
        const newName = prompt("Enter new layer name:", layers[currentLayer].name);
        if (newName) {
            // Update in lockedLayers array if it was locked
            const oldName = layers[currentLayer].name;
            const lockedIndex = lockedLayers.indexOf(oldName);
            if (lockedIndex !== -1) {
                lockedLayers[lockedIndex] = newName;
            }
            
            layers[currentLayer].name = newName;
            updateLayerList();
            showPopup(`Layer renamed to ${newName}`);
        }
    }
}

function lockLayer(index = null) {
    const layerIndex = index !== null ? index : currentLayer;
    
    if (layerIndex !== null && layers[layerIndex]) {
        const layerName = layers[layerIndex].name;
        if (!lockedLayers.includes(layerName)) {
            lockedLayers.push(layerName);

            // Loop through objects in the layer and make them non-selectable
            layers[layerIndex].objects.forEach((obj) => {
                obj.selectable = false;
                obj.evented = false; // Prevent object interaction
            });

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

            // Loop through objects in the layer and make them selectable
            layers[layerIndex].objects.forEach((obj) => {
                obj.selectable = true;
                obj.evented = true; // Allow object interaction
            });

            canvas.renderAll();
            updateLayerList();
            showPopup(`${layerName} unlocked`);
        }
    }
}

// Check if the current layer is locked
function isLayerLocked() {
    return currentLayer === null || lockedLayers.includes(layers[currentLayer]?.name);
}

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

    const reader = new FileReader();
    reader.onload = (e) => {
        fabric.Image.fromURL(
            e.target.result,
            (img) => {
                if (!img) {
                    showPopup("Failed to load image");
                    return;
                }

                const maxWidth = canvas.width * 0.8;
                const maxHeight = canvas.height * 0.8;
                if (img.width > maxWidth || img.height > maxHeight) {
                    const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
                    img.scale(scale);
                }

                img.set({
                    left: (canvas.width - img.width * (img.scaleX || 1)) / 2,
                    top: (canvas.height - img.height * (img.scaleY || 1)) / 2,
                    selectable: !isLayerLocked(),
                    evented: !isLayerLocked(),
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
    reader.onerror = () => {
        showPopup("Error reading image file");
    };
    reader.readAsDataURL(file);
}

// Add object to current layer
function addObjectToLayer(object) {
    if (!isLayerLocked() && currentLayer !== null) {
        layers[currentLayer].objects.push(object);
        updateObjectSelects();
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
        updateObjectSelects();
        canvas.renderAll();
    }
}

// Z-index manipulation functions
function bringForward() {
    const selectedObject = canvas.getActiveObject();
    if (selectedObject) {
        // Find the object's current layer
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
        
        // Can only bring forward if not already in the topmost layer
        if (objectLayer > 0) { // Note: layers[0] is now the TOP layer in UI
            // Remove from current layer
            layers[objectLayer].objects.splice(objectIndex, 1);
            // Add to the layer above (which has lower index)
            layers[objectLayer - 1].objects.push(selectedObject);
            
            // Reapply the entire canvas to ensure correct z-ordering
            canvas.clear();
            for (let i = layers.length - 1; i >= 0; i--) {
                layers[i].objects.forEach(obj => canvas.add(obj));
            }
            
            canvas.renderAll();
            updateObjectSelects();
            showPopup("Brought object forward");
        }
    }
}

function sendBackward() {
    const selectedObject = canvas.getActiveObject();
    if (selectedObject) {
        // Find the object's current layer
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
        
        // Can only send backward if not already in the bottommost layer
        if (objectLayer < layers.length - 1) { // Note: last layer is BOTTOM in UI
            // Remove from current layer
            layers[objectLayer].objects.splice(objectIndex, 1);
            // Add to the layer below (which has higher index)
            layers[objectLayer + 1].objects.push(selectedObject);
            
            // Reapply the entire canvas to ensure correct z-ordering
            canvas.clear();
            for (let i = layers.length - 1; i >= 0; i--) {
                layers[i].objects.forEach(obj => canvas.add(obj));
            }
            
            canvas.renderAll();
            updateObjectSelects();
            showPopup("Sent object backward");
        }
    }
}

function bringToFront() {
    const selectedObject = canvas.getActiveObject();
    if (selectedObject) {
        // Find the object's current layer
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
        
        if (objectLayer > 0) { // Not already in top layer
            // Remove from current layer
            layers[objectLayer].objects.splice(objectIndex, 1);
            // Add to the topmost layer (index 0)
            layers[0].objects.push(selectedObject);
            
            // Reapply the entire canvas to ensure correct z-ordering
            canvas.clear();
            for (let i = layers.length - 1; i >= 0; i--) {
                layers[i].objects.forEach(obj => canvas.add(obj));
            }
            
            canvas.renderAll();
            updateObjectSelects();
            showPopup("Brought object to front");
        }
    }
}

function sendToBack() {
    const selectedObject = canvas.getActiveObject();
    if (selectedObject) {
        // Find the object's current layer
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
        
        if (objectLayer < layers.length - 1) { // Not already in bottom layer
            // Remove from current layer
            layers[objectLayer].objects.splice(objectIndex, 1);
            // Add to the bottommost layer (last index)
            layers[layers.length - 1].objects.push(selectedObject);
            
            // Reapply the entire canvas to ensure correct z-ordering
            canvas.clear();
            for (let i = layers.length - 1; i >= 0; i--) {
                layers[i].objects.forEach(obj => canvas.add(obj));
            }
            
            canvas.renderAll();
            updateObjectSelects();
            showPopup("Sent object to back");
        }
    }
}

function clearCanvas() {
    canvas.clear();
    layers = [];
    layerCount = 0;
    currentLayer = null;
    lockedLayers = [];
    clickPoints = [];
    addLayer();
    canvas.renderAll();
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
    
    const opacityValue = document.getElementById("opacityValue");
    if (opacityValue) {
        opacityValue.textContent = `${Math.round(opacity * 100)}%`;
    }
}

// Brightness and Contrast Adjustment
function adjustBrightness() {
    const brightnessSlider = document.getElementById("brightnessSlider");
    if (!brightnessSlider) return;
    
    const brightness = brightnessSlider.value;
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.filters) {
        // Initialize filters array if it doesn't exist
        if (!Array.isArray(activeObject.filters)) {
            activeObject.filters = [];
        }
        
        activeObject.filters[0] = new fabric.Image.filters.Brightness({
            brightness: brightness / 100,
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
        // Initialize filters array if it doesn't exist
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

// Update object select dropdown
function updateObjectSelects() {
    const object1Select = document.getElementById("object1");
    const object2Select = document.getElementById("object2");
    
    if (!object1Select || !object2Select) return;
    
    object1Select.innerHTML = "";
    object2Select.innerHTML = "";

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

// Generate JSON
function generateJSON() {
    const canvasJSON = canvas.toJSON();
    const jsonContainer = document.getElementById("jsonContainer");
    if (jsonContainer) {
        jsonContainer.innerText = JSON.stringify(canvasJSON, null, 2);
    }
}

// Segmentation functions
function toggleSegmentationMode() {
    segmentationMode = !segmentationMode;
    
    if (segmentationMode) {
        canvas.selection = false;
        canvas.forEachObject(function(obj) {
            obj.selectable = false;
            obj.evented = false;
        });
        showPopup("Segmentation mode activated. Click on the image to add points.");
    } else {
        canvas.selection = true;
        layers.forEach((layer) => {
            if (!lockedLayers.includes(layer.name)) {
                layer.objects.forEach((obj) => {
                    obj.selectable = true;
                    obj.evented = true;
                });
            }
        });
        
        // Clear any point markers
        const pointMarkers = canvas.getObjects().filter(obj => 
            obj.type === 'circle' && obj.radius === 5 && obj.fill === 'red' && !obj.selectable
        );
        
        pointMarkers.forEach(marker => canvas.remove(marker));
        clickPoints = [];
        
        canvas.renderAll();
        showPopup("Segmentation mode deactivated.");
    }
}

// Image segmentation function
async function sendImageForSegmentation(isMultiPoint = false) {
    const input = document.getElementById("imageUpload");
    if (!input || !input.files[0]) {
        showPopup("Please upload an image first");
        return;
    }

    // Show loading indicator
    showPopup("Processing segmentation...");
    
    try {
        let response;
        
        if (isMultiPoint) {
            if (clickPoints.length < 2) {
                showPopup("Please add at least 2 points for multi-point segmentation");
                return;
            }
            
            // Send points-based segmentation request
            response = await fetch('/segment-points', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    points: clickPoints,
                    image: canvas.toDataURL()
                })
            });
        } else {
            // Send standard segmentation request
            const formData = new FormData();
            formData.append("image", input.files[0]);
            
            response = await fetch('/segment', {
                method: 'POST',
                body: formData
            });
        }

        if (!response.ok) {
            throw new Error(`Segmentation failed with status: ${response.status}`);
        }

        const data = await response.json();
        if (data.segmented_image) {
            // Create a new layer for the segmented result
            layerCount++;
            const layerName = `Segmented Layer ${layerCount}`;
            const newLayer = {
                name: layerName,
                objects: [],
                visible: true
            };
            
            // Add at the top
            layers.unshift(newLayer);
            currentLayer = 0;
            
            // Create fabric image from the segmented result
            fabric.Image.fromURL(
                `data:image/png;base64,${data.segmented_image}`,
                (img) => {
                    canvas.add(img);
                    newLayer.objects.push(img);
                    canvas.renderAll();
                    
                    // Clear segmentation points
                    const pointMarkers = canvas.getObjects().filter(obj => 
                        obj.type === 'circle' && obj.radius === 5 && obj.fill === 'red' && !obj.selectable
                    );
                    
                    pointMarkers.forEach(marker => canvas.remove(marker));
                    clickPoints = [];
                    
                    // Update UI
                    updateLayerList();
                    showPopup("Segmentation completed successfully!");
                    
                    // Turn off segmentation mode
                    if (segmentationMode) {
                        toggleSegmentationMode();
                    }
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


// Image generation function
function generateImage() {
	const prompt = document.getElementById("imagePrompt").value;

	if (!prompt.trim()) {
		showPopup("Please enter a prompt for image generation.");
		return;
	}

	// Start timing the image generation process
	const startTime = performance.now();

	// Sending a POST request to the backend with the prompt
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
			console.log("Generated Image Data:", data);

			if (data && data.image_url) {
				const imageUrl = data.image_url;

				// Create a new draggable image element
				const imgElement = new Image();
				imgElement.src = imageUrl;
				imgElement.id = "generated-image";
				imgElement.draggable = true;
				imgElement.style = `
					width: 150px; 
					cursor: grab; 
					margin-top: 10px;
					border: 1px solid #ccc;
					border-radius: 5px;
				`;

				// Append the image to the sidebar or another container
				const sidebar = document.getElementById("sidebar");
				if (sidebar) {
					sidebar.appendChild(imgElement);
				}

				// Add dragstart event listener to pass the image URL
				imgElement.addEventListener("dragstart", (e) => {
					e.dataTransfer.setData("text/plain", imageUrl);
					showPopup("Drag the image to the canvas!");
				});
			} else {
				throw new Error("Image URL not returned from backend.");
			}

			// End timing and log the duration
			const endTime = performance.now();
			const duration = endTime - startTime;
			console.log(`Image generated in ${duration.toFixed(2)} ms.`);
		})
		.catch((error) => {
			console.error("Error generating image:", error);
			showPopup("Error generating image: " + error.message);

			// End timing and log the error duration
			const endTime = performance.now();
			const duration = endTime - startTime;
			console.log(`Image generation failed after ${duration.toFixed(2)} ms.`);
		});
}

// Image segmentation function
async function sendImageForSegmentation(isMultiPoint = false) {
	const input = document.getElementById("imageUpload");
	if (!input.files[0]) {
		showPopup("Please upload an image first");
		return;
	}

	const formData = new FormData();
	formData.append("image", input.files[0]);

	const endpoint = isMultiPoint ? '/segment-points' : '/segment';
	const body = isMultiPoint ? {
		points: clickPoints,
		image: canvas.toDataURL()
	} : formData;

	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			body: isMultiPoint ? JSON.stringify(body) : body,
			headers: isMultiPoint ? {
				'Content-Type': 'application/json'
			} : undefined
		});

		if (!response.ok) throw new Error('Segmentation failed');

		const data = await response.json();
		if (data.segmented_image) {
			const img = new Image();
			img.src = `data:image/png;base64,${data.segmented_image}`;
			img.onload = () => {
				const fabricImage = new fabric.Image(img);
				canvas.add(fabricImage);
				canvas.renderAll();
				clickPoints = [];  // Reset points after segmentation
			};
		}
	} catch (error) {
		console.error("Segmentation error:", error);
		showPopup("Error: " + error.message);
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

// Panel Collapsing
document.addEventListener("DOMContentLoaded", () => {
	const panels = document.querySelectorAll(".panel");
	panels.forEach((panel) => {
		const title = panel.querySelector(".panel-title");
		if (title) {
			title.addEventListener("click", () => {
				panel.classList.toggle("collapsed");
			});
		}
	});
	
	// Setup canvas drop event for generated images
	const canvasContainer = document.getElementById("canvas-container");
	if (canvasContainer) {
		canvasContainer.addEventListener("dragover", (e) => {
			e.preventDefault();
			canvasContainer.style.borderColor = "#28a745"; // Highlight the canvas when dragging
		});

		canvasContainer.addEventListener("dragleave", () => {
			canvasContainer.style.borderColor = "#007bff"; // Reset border color
		});

		canvasContainer.addEventListener("drop", (e) => {
			e.preventDefault();
			canvasContainer.style.borderColor = "#007bff";

			const imageUrl = e.dataTransfer.getData("text/plain"); // Get the image URL from drag

			// Add the image to the fabric.js canvas
			fabric.Image.fromURL(imageUrl, (img) => {
				img.scale(0.5); // Scale image
				img.set({
					left: e.offsetX - img.width / 2, // Position the image on the drop point
					top: e.offsetY - img.height / 2,
					hasControls: true, // Enable resize and controls
				});
				canvas.add(img); // Add the image to the canvas
				addObjectToLayer(img); // Add the image to the current layer
			});
		});
	}
});




// Add this to your create_segmentation.js file
document.addEventListener('DOMContentLoaded', function() {
	// Setup all range inputs
	const rangeInputs = document.querySelectorAll('input[type="range"]');
	
	rangeInputs.forEach(input => {
	  // Set initial value
	  updateRangeValue(input);
	  
	  // Update on input change
	  input.addEventListener('input', function() {
		updateRangeValue(this);
	  });
	});
	
	function updateRangeValue(input) {
	  // Calculate percentage based on min/max/value
	  const min = input.min ? parseFloat(input.min) : 0;
	  const max = input.max ? parseFloat(input.max) : 100;
	  const val = parseFloat(input.value);
	  const percentage = ((val - min) / (max - min)) * 100;
	  
	  // Set the CSS variable for this slider
	  input.style.setProperty('--value', `${percentage}%`);
	}
  });